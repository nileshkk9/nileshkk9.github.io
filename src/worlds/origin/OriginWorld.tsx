"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Float } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import { originArtifacts } from "@/content/archive";
import { useExperience } from "@/store/experience";
import { nextReadyWorld } from "@/worlds/registry";
import { mulberry32 } from "@/three/glsl";
import { GlyphField, HoloLabel, useGridMaterial, useHoloMaterial, useHover } from "@/three/kit";

const CYAN = "#5CE1FF";
const AMBER = "#FFB547";
const ISLAND_R = 11;

function valueNoise(seed: number) {
  const rand = mulberry32(seed);
  const perm = Array.from({ length: 512 }, () => rand());
  const h = (x: number, y: number, z: number) => perm[(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 512];
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    const l = (a: number, b: number, t: number) => a + (b - a) * t;
    return l(
      l(l(h(xi, yi, zi), h(xi + 1, yi, zi), xf), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), xf), yf),
      l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), xf), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), xf), yf),
      zf,
    );
  };
}

function useIslandGeometry() {
  return useMemo(() => {
    const g = new THREE.IcosahedronGeometry(ISLAND_R, 24);
    const n = valueNoise(11);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const d = v.clone().normalize();
      const nn = n(d.x * 3 + 10, d.y * 3 + 10, d.z * 3 + 10);
      const fine = n(d.x * 9 + 3, d.y * 9 + 3, d.z * 9 + 3);
      if (d.y > -0.04) {
        const rim = 1 + (nn - 0.5) * 0.12;
        v.set(d.x * ISLAND_R * rim, -0.06 - fine * 0.12, d.z * ISLAND_R * rim);
      } else {
        const depth = Math.pow(-d.y, 0.8);
        const spike = 1 + (nn - 0.5) * 0.7 + (fine - 0.5) * 0.3;
        const horiz = Math.hypot(d.x, d.z) || 1e-4;
        const r = ISLAND_R * horiz * (1 - depth * 0.35) * (0.88 + fine * 0.24);
        v.set((d.x / horiz) * r, -depth * ISLAND_R * 1.9 * spike, (d.z / horiz) * r);
      }
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
}

function useRockMaterial(instanced = false) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vW;
          void main() {
            vec4 local = vec4(position, 1.0);
            ${instanced ? "local = instanceMatrix * local;" : ""}
            vec4 w = modelMatrix * local;
            vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vW;
          void main() {
            vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
            vec3 v = normalize(cameraPosition - vW);
            float key = max(dot(n, normalize(vec3(0.4, 0.8, 0.3))), 0.0);
            float under = max(dot(n, vec3(0.0, -1.0, 0.0)), 0.0);
            float rim = pow(1.0 - abs(dot(n, v)), 3.0);
            vec3 col = vec3(0.035, 0.05, 0.08) + key * vec3(0.09, 0.12, 0.17);
            col += under * vec3(0.02, 0.09, 0.12) * 1.4;
            col += rim * vec3(0.36, 0.88, 1.0) * 0.35;
            ${
              instanced
                ? ""
                : `float strata = smoothstep(0.94, 1.0, sin(vW.y * 2.6 + sin(vW.x * 0.4) * 1.5));
            col *= 0.6;
            col += strata * vec3(0.36, 0.88, 1.0) * 0.12 * smoothstep(-20.0, -1.0, vW.y);
            float side = 1.0 - smoothstep(0.6, 0.9, n.y);
            col += exp(min(vW.y, 0.0) * 1.4) * side * vec3(0.36, 0.88, 1.0) * 0.3;
            col = mix(col, vec3(0.02, 0.03, 0.05), smoothstep(0.85, 0.95, n.y));
            col *= mix(0.35, 1.0, smoothstep(-22.0, -4.0, vW.y));`
            }
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [instanced],
  );
}

function Island() {
  const geo = useIslandGeometry();
  const rock = useRockMaterial();
  const grid = useGridMaterial({ color: CYAN, spacing: 1, radius: ISLAND_R * 0.98, opacity: 0.55 });
  useFrame((_, dt) => {
    grid.uniforms.uTime.value += dt;
  });
  return (
    <group>
      <mesh geometry={geo} material={rock} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.06} material={grid}>
        <circleGeometry args={[ISLAND_R * 1.02, 96]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[ISLAND_R * 1.0, ISLAND_R * 1.035, 128]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Debris({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const rock = useRockMaterial(true);
  const data = useMemo(() => {
    const rand = mulberry32(5);
    return Array.from({ length: count }, () => {
      const a = rand() * Math.PI * 2;
      const r = 13 + rand() * 22;
      return {
        p: new THREE.Vector3(Math.cos(a) * r, -24 + rand() * 24, Math.sin(a) * r),
        s: 0.12 + Math.pow(rand(), 3) * 0.9,
        rot: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6),
        speed: 0.05 + rand() * 0.15,
        phase: rand() * 10,
      };
    });
  }, [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    data.forEach((d, i) => {
      dummy.position.set(d.p.x, d.p.y + Math.sin(t * d.speed * 4 + d.phase) * 0.5, d.p.z);
      dummy.rotation.set(d.rot.x + t * d.speed, d.rot.y + t * d.speed * 0.7, d.rot.z);
      dummy.scale.setScalar(d.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, rock, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
    </instancedMesh>
  );
}

function Building({
  position,
  size,
  color = CYAN,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={[position[0], position[1] + size[1] / 2, position[2]]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#0a111d" roughness={0.3} metalness={0.6} transparent opacity={0.92} />
      <Edges color={color} threshold={15} />
    </mesh>
  );
}

function Campus() {
  return (
    <group position={[-3.5, 0, 0.5]}>
      <Building position={[0, 0, 0]} size={[4.2, 2.2, 2.6]} />
      <Building position={[0, 2.2, 0]} size={[1.4, 2.6, 1.4]} />
      <Building position={[-3.4, 0, 1.2]} size={[1.8, 1.4, 3.2]} />
      <Building position={[2.9, 0, 1.6]} size={[1.4, 1.1, 1.4]} />
      <Building position={[-1.2, 0, -3.2]} size={[3, 0.9, 1.6]} />
      <mesh position={[0, 5.3, 0]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshBasicMaterial color={AMBER} toneMapped={false} />
      </mesh>
      <HoloLabel position={[0, 6.4, 0]} subtitle="Kolkata · 2016" title="NSEC Campus" />
    </group>
  );
}

function ResearchLab() {
  const ring = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const core = useHoloMaterial(AMBER, { intensity: 1.4 });
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.6;
    if (ring2.current) ring2.current.rotation.x += dt * 0.4;
  });
  return (
    <group position={[5, 0, -4]}>
      <mesh>
        <sphereGeometry args={[2.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.22} />
      </mesh>
      <mesh position-y={1.2} material={core}>
        <icosahedronGeometry args={[0.55, 1]} />
      </mesh>
      <mesh ref={ring} position-y={1.2} rotation-x={Math.PI / 2.4}>
        <torusGeometry args={[1.2, 0.015, 8, 96]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
      <mesh ref={ring2} position-y={1.2}>
        <torusGeometry args={[1.5, 0.01, 8, 96]} />
        <meshBasicMaterial color={AMBER} toneMapped={false} />
      </mesh>
      <HoloLabel position={[0, 3.6, 0]} subtitle="Research" title="Evolutionary Systems Lab" accent={AMBER} />
    </group>
  );
}

const crystalAnchors = (() => {
  const rand = mulberry32(99);
  return originArtifacts.map((a, i) => {
    const ang = (i / originArtifacts.length) * Math.PI * 2 + Math.PI / 2 + Math.PI / originArtifacts.length;
    const r = 13.5 + rand() * 2;
    return { id: a.id, position: [Math.cos(ang) * r, 2.5 + rand() * 3, Math.sin(ang) * r] as [number, number, number] };
  });
})();

function Crystal({ id, position, index }: { id: string; position: [number, number, number]; index: number }) {
  const artifact = originArtifacts.find((a) => a.id === id)!;
  const collected = useExperience((s) => s.collected.includes(id));
  const active = useExperience((s) => s.activeArtifact === id);
  const collect = useExperience((s) => s.collect);
  const [hovered, bind] = useHover();
  const mat = useHoloMaterial(collected ? AMBER : CYAN, { intensity: 1 });
  const group = useRef<THREE.Group>(null);
  const burst = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += dt * (hovered || active ? 1.4 : 0.4);
    const s = THREE.MathUtils.damp(g.scale.x, hovered || active ? 1.25 : 1, 6, dt);
    g.scale.setScalar(s);
    mat.uniforms.uIntensity.value = THREE.MathUtils.damp(
      mat.uniforms.uIntensity.value,
      (collected ? 1.6 : 0.8) + (hovered ? 0.8 : 0),
      5,
      dt,
    );
  });

  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const first = !useExperience.getState().collected.includes(id);
    collect(id);
    if (first && burst.current) {
      const b = burst.current;
      const m = b.material as THREE.MeshBasicMaterial;
      gsap.fromTo(b.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 5, y: 5, z: 5, duration: 1.2, ease: "expo.out" });
      gsap.fromTo(m, { opacity: 1 }, { opacity: 0, duration: 1.2, ease: "power2.out" });
    }
  };

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.8} floatingRange={[-0.3, 0.3]}>
      <group position={position}>
        <group ref={group}>
          <mesh material={mat} onClick={onClick} {...bind} scale={[0.7, 1.6, 0.7]}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
          <mesh scale={[0.32, 0.75, 0.32]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={collected ? AMBER : "#bfefff"} toneMapped={false} />
          </mesh>
        </group>
        <mesh ref={burst} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.9, 1, 64]} />
          <meshBasicMaterial color={AMBER} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh position-y={-2.6} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.6, 0.66, 48]} />
          <meshBasicMaterial color={collected ? AMBER : CYAN} transparent opacity={0.5} toneMapped={false} />
        </mesh>
        <HoloLabel
          position={[0, 2.4, 0]}
          visible={hovered || collected}
          subtitle={collected ? artifact.kind : `Artifact ${String(index + 1).padStart(2, "0")}`}
          title={collected ? artifact.name : "Unidentified signal"}
          accent={collected ? AMBER : CYAN}
        />
      </group>
    </Float>
  );
}

function Constellation() {
  const collected = useExperience((s) => s.collected);
  const geo = useMemo(() => {
    const pts = crystalAnchors.filter((c) => collected.includes(c.id)).map((c) => new THREE.Vector3(...c.position));
    const seg: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (pts.length > 1 && !(pts.length === 2 && i === 1)) seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    return g;
  }, [collected]);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={AMBER} transparent opacity={0.35} toneMapped={false} />
    </lineSegments>
  );
}

function Gate() {
  const collected = useExperience((s) => s.collected.length);
  const open = collected >= originArtifacts.length;
  const [hovered, bind] = useHover();
  const portal = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uOpen: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uOpen; varying vec2 vUv;
          void main(){
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);
            float a = atan(p.y, p.x);
            float swirl = sin(a * 6.0 + r * 18.0 - uTime * 4.0) * 0.5 + 0.5;
            float core = smoothstep(1.0, 0.0, r);
            vec3 col = mix(vec3(0.36,0.88,1.0), vec3(1.0,0.71,0.28), swirl * r) * (0.4 + swirl * 0.8) * core;
            gl_FragColor = vec4(col * 1.8, core * uOpen * 0.9);
          }`,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  useFrame((_, dt) => {
    portal.uniforms.uTime.value += dt;
    portal.uniforms.uOpen.value = THREE.MathUtils.damp(portal.uniforms.uOpen.value, open ? 1 : 0, 2, dt);
  });

  const onClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const s = useExperience.getState();
    if (!open) {
      s.setCaption("The gate is sealed. Recover every artifact first.");
      setTimeout(() => useExperience.getState().setCaption(null), 2600);
      return;
    }
    s.completeObjective("origin", "gate");
    s.completeWorld("origin");
    const next = nextReadyWorld("origin");
    if (next) s.travel(next, 0);
  };

  return (
    <group position={[0, 0, 9.2]}>
      <mesh position-y={3.2} onClick={onClick} {...bind}>
        <torusGeometry args={[2.4, 0.08, 16, 128]} />
        <meshBasicMaterial color={open ? AMBER : "#2a3a4f"} toneMapped={false} />
      </mesh>
      <mesh position-y={3.2} material={portal}>
        <circleGeometry args={[2.35, 64]} />
      </mesh>
      <HoloLabel
        position={[0, 6.4, 0]}
        subtitle={open ? "Gate online" : `${collected}/${originArtifacts.length} artifacts`}
        title={open ? "Enter the next sector" : "Sealed gate"}
        accent={open ? AMBER : CYAN}
        visible={hovered || open}
      />
    </group>
  );
}

export function OriginWorld() {
  const collected = useExperience((s) => s.collected.length);
  const completeObjective = useExperience((s) => s.completeObjective);
  useEffect(() => {
    if (collected >= originArtifacts.length) completeObjective("origin", "collect");
  }, [collected, completeObjective]);

  const rainBuild = useMemo(
    () => (rand: () => number) => {
      const a = rand() * Math.PI * 2;
      const r = 5 + Math.pow(rand(), 0.5) * 30;
      return { position: [Math.cos(a) * r, rand() * 60, Math.sin(a) * r] as [number, number, number], speed: 1.5 + rand() * 4 };
    },
    [],
  );
  const orbitBuild = useMemo(
    () => (rand: () => number) => {
      const a = rand() * Math.PI * 2;
      const r = 19 + rand() * 6;
      return { position: [Math.cos(a) * r, 7 + (rand() - 0.5) * 5, Math.sin(a) * r] as [number, number, number], speed: 0.03 + rand() * 0.04 };
    },
    [],
  );

  return (
    <group>
      <fog attach="fog" args={["#03060c", 30, 120]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[20, 30, 10]} intensity={0.8} color="#cfe6ff" />
      <pointLight position={[0, -12, 0]} intensity={60} distance={40} color={CYAN} />
      <pointLight position={[-14, 6, -10]} intensity={40} distance={40} color={AMBER} />

      <Island />
      <Campus />
      <ResearchLab />
      <Debris />
      {crystalAnchors.map((c, i) => (
        <Crystal key={c.id} id={c.id} position={c.position} index={i} />
      ))}
      <Constellation />
      <Gate />

      <GlyphField mode="rain" count={2600} chars={["0", "1"]} color={CYAN} size={0.35} build={rainBuild} height={60} opacity={0.7} />
      <GlyphField
        mode="orbit"
        count={90}
        chars={["∑", "∫", "π", "∞", "λ", "∂", "√", "Δ", "θ", "≈", "∇", "O(n)"]}
        color="#E8F1FF"
        size={1.1}
        build={orbitBuild}
        opacity={0.55}
      />
    </group>
  );
}
