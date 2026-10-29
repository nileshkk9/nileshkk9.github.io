"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";
import { isObjectiveDone, useExperience } from "@/store/experience";
import { hashGLSL, mulberry32, softPointFrag } from "@/three/glsl";
import { HoloLabel, useGridMaterial, useHoloMaterial, useHover } from "@/three/kit";
import { LOGISTICS_STATIONS, logisticsBus, optimizeStation } from "./stations";

const MINT = "#7CF2C8";
const ALERT = "#FF7A48";
const HUB = new THREE.Vector3(0, 0, 0);

const INBOUND_DOCKS = [-38, 0, 38].map((z) => new THREE.Vector3(-72, 0, z));
const OUTBOUND_DOCKS = [-38, 0, 38].map((z) => new THREE.Vector3(72, 0, z));
const CONVEYORS = [
  ...INBOUND_DOCKS.map((d) => ({ from: d.clone().add(new THREE.Vector3(9, 0, 0)), to: HUB.clone().add(new THREE.Vector3(-14, 0, d.z * 0.2)), station: 0 })),
  ...OUTBOUND_DOCKS.map((d) => ({ from: HUB.clone().add(new THREE.Vector3(14, 0, d.z * 0.2)), to: d.clone().add(new THREE.Vector3(-9, 0, 0)), station: 2 })),
];
const BELT_Y = 2.4;
const PER_BELT = 36;

/** jam[0..2] per station, 1 = jammed. Shared by belts, packages, drones and the hub. */
function useFlowUniforms() {
  return useMemo(
    () => ({
      uTime: { value: 0 },
      uJam: { value: [1, 1, 1] as number[] },
      uFrom: { value: CONVEYORS.map((c) => new THREE.Vector3(c.from.x, BELT_Y, c.from.z)) },
      uTo: { value: CONVEYORS.map((c) => new THREE.Vector3(c.to.x, BELT_Y, c.to.z)) },
      uStation: { value: CONVEYORS.map((c) => c.station) },
    }),
    [],
  );
}
type FlowUniforms = ReturnType<typeof useFlowUniforms>;

const flowGLSL = /* glsl */ `
uniform float uTime;
uniform float uJam[3];
uniform vec3 uFrom[6];
uniform vec3 uTo[6];
uniform float uStation[6];
float beltJam(int belt) {
  float s = uJam[int(uStation[belt] + 0.5)];
  return clamp(max(s, uJam[1] * 0.6), 0.0, 1.0);
}
`;

function Packages({ u }: { u: FlowUniforms }) {
  const count = CONVEYORS.length * PER_BELT;
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(1.4, 1.1, 1.4);
    const belt = new Float32Array(count);
    const offset = new Float32Array(count);
    const rand = mulberry32(8);
    for (let i = 0; i < count; i++) {
      belt[i] = Math.floor(i / PER_BELT);
      offset[i] = (i % PER_BELT) / PER_BELT + rand() * 0.004;
    }
    g.setAttribute("aBelt", new THREE.InstancedBufferAttribute(belt, 1));
    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offset, 1));
    return g;
  }, [count]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          attribute float aBelt; attribute float aOffset;
          varying vec3 vColor; varying vec3 vN;
          ${flowGLSL}
          void main() {
            int b = int(aBelt + 0.5);
            float jam = beltJam(b);
            float speed = mix(0.07, 0.012, jam);
            float f = fract(aOffset + uTime * speed);
            float bunched = 1.0 - pow(1.0 - f, 4.0);
            f = mix(f, bunched, jam * 0.85);
            vec3 base = mix(uFrom[b], uTo[b], f);
            float pileUp = jam * smoothstep(0.85, 1.0, f);
            base.y += 0.6 + pileUp * fract(aOffset * 37.0) * 3.0;
            base.x += pileUp * (fract(aOffset * 91.0) - 0.5) * 3.0;
            vec3 p = position * (0.9 + fract(aOffset * 13.0) * 0.3);
            vec4 w = modelMatrix * vec4(base + p, 1.0);
            vN = normal;
            vColor = mix(vec3(0.49, 0.95, 0.78), vec3(1.0, 0.48, 0.28), jam * smoothstep(0.55, 1.0, f));
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying vec3 vN;
          void main() {
            float l = 0.35 + 0.65 * max(dot(normalize(vN), normalize(vec3(0.3, 1.0, 0.4))), 0.0);
            gl_FragColor = vec4(vColor * l * 0.6, 1.0);
          }`,
      }),
    [u],
  );
  return <instancedMesh args={[geo, mat, count]} frustumCulled={false} />;
}

function Belts({ u }: { u: FlowUniforms }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { ...u, uBelt: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uBelt;
          varying vec2 vUv;
          ${flowGLSL}
          void main() {
            float jam = beltJam(int(uBelt + 0.5));
            float speed = mix(4.0, 0.6, jam);
            float chevron = step(0.6, fract(vUv.x * 30.0 - uTime * speed + abs(vUv.y - 0.5) * 1.5));
            float rail = step(0.42, abs(vUv.y - 0.5));
            vec3 good = vec3(0.49, 0.95, 0.78);
            vec3 bad = vec3(1.0, 0.48, 0.28);
            vec3 c = mix(good, bad, jam);
            vec3 col = vec3(0.02, 0.03, 0.035) + c * (chevron * 0.25 + rail * 0.9);
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [u],
  );
  const materials = useMemo(
    () =>
      CONVEYORS.map((_, i) => {
        const m = mat.clone();
        m.uniforms = { ...u, uBelt: { value: i } };
        return m;
      }),
    [mat, u],
  );
  return (
    <group>
      {CONVEYORS.map((c, i) => {
        const dir = new THREE.Vector3().subVectors(c.to, c.from);
        const len = dir.length();
        const mid = new THREE.Vector3().addVectors(c.from, c.to).multiplyScalar(0.5);
        const ang = Math.atan2(dir.z, dir.x);
        return (
          <group key={i} position={[mid.x, BELT_Y, mid.z]} rotation-y={-ang}>
            <mesh rotation-x={-Math.PI / 2} material={materials[i]}>
              <planeGeometry args={[len, 3.2]} />
            </mesh>
            <mesh position-y={-1.2}>
              <boxGeometry args={[len, 2.2, 2.6]} />
              <meshStandardMaterial color="#0a1210" metalness={0.6} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Drones({ u, count = 260 }: { u: FlowUniforms; count?: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const id = new Float32Array(count);
    for (let i = 0; i < count; i++) id[i] = i;
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aId", new THREE.BufferAttribute(id, 1));
    return g;
  }, [count]);
  const anchors = useMemo(() => [...INBOUND_DOCKS, HUB, ...OUTBOUND_DOCKS].map((v) => new THREE.Vector3(v.x, 14, v.z)), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { ...u, uAnchors: { value: anchors }, uDpr: { value: dpr } },
        vertexShader: /* glsl */ `
          attribute float aId;
          uniform vec3 uAnchors[7]; uniform float uDpr;
          varying vec3 vColor; varying float vAlpha;
          ${hashGLSL}
          ${flowGLSL}
          void main() {
            float jam = (uJam[0] + uJam[1] + uJam[2]) / 3.0;
            float speed = mix(0.12, 0.04, jam) * (0.6 + hash11(aId) * 0.8);
            float tt = uTime * speed + hash11(aId * 3.1);
            float cycle = floor(tt);
            float f = fract(tt);
            int a = int(floor(hash11(aId + cycle * 7.3) * 7.0));
            int b = int(floor(hash11(aId * 1.7 + cycle * 3.1) * 7.0));
            if (a == b) b = (b + 3) % 7;
            vec3 pa = uAnchors[a] + vec3(hash11(aId * 9.1) - 0.5, 0.0, hash11(aId * 4.7) - 0.5) * 16.0;
            vec3 pb = uAnchors[b] + vec3(hash11(aId * 2.3) - 0.5, 0.0, hash11(aId * 6.1) - 0.5) * 16.0;
            float e = smoothstep(0.0, 1.0, f);
            vec3 p = mix(pa, pb, e);
            p.y += sin(e * 3.14159) * (12.0 + hash11(aId * 5.5) * 18.0);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float blink = step(0.8, fract(uTime * 1.5 + hash11(aId) * 4.0));
            gl_PointSize = clamp((2.6 + blink * 2.0) * uDpr * (110.0 / -mv.z), 1.5, 9.0 * uDpr);
            vColor = mix(vec3(0.49, 0.95, 0.78), vec3(1.0), blink);
            vAlpha = smoothstep(0.0, 0.05, f) * (1.0 - smoothstep(0.95, 1.0, f));
          }`,
        fragmentShader: softPointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [u, anchors, dpr],
  );
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

function Warehouse({ position, size }: { position: THREE.Vector3; size: [number, number, number] }) {
  return (
    <mesh position={[position.x, size[1] / 2, position.z]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#08110f" metalness={0.4} roughness={0.6} transparent opacity={0.9} />
      <Edges color={MINT} threshold={15} />
    </mesh>
  );
}

function Racks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const o = new THREE.Object3D();
    const rand = mulberry32(3);
    for (const side of [-1, 1]) {
      for (let x = 0; x < 9; x++) {
        for (let z = 0; z < 14; z++) {
          o.position.set(side * (100 + x * 3.2), 0, -46 + z * 7);
          const h = 3 + Math.floor(rand() * 4) * 1.5;
          o.position.y = h / 2;
          o.scale.set(2, h, 5.5);
          o.updateMatrix();
          out.push(o.matrix.clone());
        }
      }
    }
    return out;
  }, []);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    items.forEach((mtx, i) => m.setMatrixAt(i, mtx));
    m.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0c1a16" emissive="#123a2e" emissiveIntensity={0.4} metalness={0.3} roughness={0.7} />
    </instancedMesh>
  );
}

function Hub({ u }: { u: FlowUniforms }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (rotor.current) rotor.current.rotation.y += dt * THREE.MathUtils.lerp(1.2, 0.15, u.uJam.value[1]);
  });
  return (
    <group>
      <mesh position-y={4}>
        <cylinderGeometry args={[14, 15, 8, 48, 1, true]} />
        <meshStandardMaterial color="#08110f" metalness={0.5} roughness={0.5} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh position-y={8.05} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[13.6, 14.2, 96]} />
        <meshBasicMaterial color={MINT} toneMapped={false} />
      </mesh>
      <group ref={rotor} position-y={3}>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} rotation-y={(i / 8) * Math.PI * 2} position={[0, 0, 0]}>
            <boxGeometry args={[24, 0.4, 1.2]} />
            <meshStandardMaterial color="#10241e" emissive={MINT} emissiveIntensity={0.25} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function StationBeacon({ index }: { index: number }) {
  const st = LOGISTICS_STATIONS[index];
  const done = useExperience((s) => isObjectiveDone(s.objectives, "logistics", st.id));
  const [hovered, bind] = useHover();
  const mat = useHoloMaterial(done ? MINT : ALERT, { intensity: 1.3 });
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    g.current.rotation.y += dt * (done ? 0.5 : 1.5);
    g.current.position.y = 26 + Math.sin(clock.elapsedTime * 1.4 + index) * 0.6;
    g.current.scale.setScalar(THREE.MathUtils.damp(g.current.scale.x, hovered ? 1.25 : 1, 8, dt));
  });
  const optimize = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    optimizeStation(index);
  };
  return (
    <group position={[st.x, 0, 0]}>
      <group ref={g} position-y={26}>
        <mesh material={mat} onClick={optimize} {...bind}>
          <icosahedronGeometry args={[2.2, 0]} />
        </mesh>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[3.4, 0.06, 8, 96]} />
          <meshBasicMaterial color={done ? MINT : ALERT} toneMapped={false} />
        </mesh>
      </group>
      <HoloLabel
        position={[0, 33, 0]}
        subtitle={done ? st.fix : `${st.jam} · click to optimize`}
        title={st.title}
        accent={done ? MINT : ALERT}
      />
    </group>
  );
}

export function LogisticsWorld() {
  const u = useFlowUniforms();
  const grid = useGridMaterial({ color: MINT, spacing: 6, radius: 170, opacity: 0.3 });

  useEffect(() => {
    logisticsBus.jam = u.uJam;
    const objs = useExperience.getState().objectives;
    LOGISTICS_STATIONS.forEach((st, i) => {
      if (isObjectiveDone(objs, "logistics", st.id)) u.uJam.value[i] = 0;
    });
    return () => {
      logisticsBus.jam = null;
    };
  }, [u]);

  useFrame((_, dt) => {
    u.uTime.value += dt;
    grid.uniforms.uTime.value += dt;
  });

  return (
    <group>
      <fog attach="fog" args={["#030a08", 120, 360]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[50, 90, 40]} intensity={0.8} color="#dffaf0" />
      <mesh position-y={-3}>
        <boxGeometry args={[260, 6, 150]} />
        <meshStandardMaterial color="#050b09" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.05} material={grid}>
        <planeGeometry args={[260, 150]} />
      </mesh>
      {INBOUND_DOCKS.map((d, i) => (
        <Warehouse key={`in${i}`} position={d} size={[18, 9, 22]} />
      ))}
      {OUTBOUND_DOCKS.map((d, i) => (
        <Warehouse key={`out${i}`} position={d} size={[18, 9, 22]} />
      ))}
      <Racks />
      <Hub u={u} />
      <Belts u={u} />
      <Packages u={u} />
      <Drones u={u} />
      {LOGISTICS_STATIONS.map((_, i) => (
        <StationBeacon key={i} index={i} />
      ))}
      <HoloLabel position={[-72, 12, -54]} subtitle="Udaan · Inbound" title="Receiving docks" accent={MINT} />
      <HoloLabel position={[72, 12, -54]} subtitle="Udaan · Outbound" title="Dispatch docks" accent={MINT} />
    </group>
  );
}
