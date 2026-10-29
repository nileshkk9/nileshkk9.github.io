"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { isObjectiveDone, useExperience } from "@/store/experience";
import { worldById } from "@/worlds/registry";
import { hashGLSL, mulberry32, softPointFrag } from "@/three/glsl";
import { HoloLabel, useGridMaterial, useHoloMaterial, useHover } from "@/three/kit";
import { LEGACY_SYSTEMS } from "./systems";

const AMBER = "#FFB547";
const CYAN = "#5CE1FF";
const ALERT = "#FF5C48";
const SPACING = 10;
const CITY_R = 100;

const DISTRICTS = LEGACY_SYSTEMS.map((s, i) => {
  const a = (i / LEGACY_SYSTEMS.length) * Math.PI * 2 + Math.PI / 10;
  return { ...s, center: new THREE.Vector2(Math.cos(a) * 52, Math.sin(a) * 52) };
});

/** Per-district repair progress (0 broken, 1 repaired); index 5 is the city-wide average. */
function useRepairUniform() {
  return useMemo(() => ({ value: new Array(6).fill(0) as number[] }), []);
}

function Buildings({ repair, time }: { repair: { value: number[] }; time: { value: number } }) {
  const { geo, matrices } = useMemo(() => {
    const rand = mulberry32(1987);
    const mats: THREE.Matrix4[] = [];
    const district: number[] = [];
    const seeds: number[] = [];
    const o = new THREE.Object3D();
    const n = Math.floor(CITY_R / SPACING);
    for (let ix = -n; ix <= n; ix++) {
      for (let iz = -n; iz <= n; iz++) {
        const cx = ix * SPACING + (rand() - 0.5) * 2;
        const cz = iz * SPACING + (rand() - 0.5) * 2;
        const r = Math.hypot(cx, cz);
        if (r > CITY_R || r < 16 || rand() < 0.15) continue;
        if (iz === 0 && ix < 0) continue;
        let d = 5;
        let best = 26;
        DISTRICTS.forEach((dist, i) => {
          const dd = Math.hypot(cx - dist.center.x, cz - dist.center.y);
          if (dd < best) {
            best = dd;
            d = i;
          }
        });
        const fall = 1 - r / CITY_R;
        const h = 4 + Math.pow(rand(), 1.8) * 40 * (0.3 + fall) + (d < 5 ? 6 : 0);
        const w = 4 + rand() * 4;
        const dep = 4 + rand() * 4;
        o.position.set(cx, h / 2, cz);
        o.scale.set(w, h, dep);
        o.rotation.y = 0;
        o.updateMatrix();
        mats.push(o.matrix.clone());
        district.push(d);
        seeds.push(rand());
      }
    }
    o.position.set(0, 34, 0);
    o.scale.set(9, 68, 9);
    o.updateMatrix();
    mats.push(o.matrix.clone());
    district.push(5);
    seeds.push(0.99);

    const g = new THREE.BoxGeometry(1, 1, 1);
    g.setAttribute("aDistrict", new THREE.InstancedBufferAttribute(new Float32Array(district), 1));
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1));
    return { geo: g, matrices: mats };
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uRepair: repair, uTime: time },
        vertexShader: /* glsl */ `
          attribute float aDistrict; attribute float aSeed;
          uniform float uRepair[6];
          varying vec3 vLocal; varying vec3 vScale; varying float vSeed; varying vec3 vWorld; varying vec3 vNormal; varying float vRepair;
          void main() {
            vLocal = position;
            vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
            vSeed = aSeed;
            vNormal = normal;
            vRepair = uRepair[int(aDistrict + 0.5)];
            vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
            vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying vec3 vLocal; varying vec3 vScale; varying float vSeed; varying vec3 vWorld; varying vec3 vNormal; varying float vRepair;
          ${hashGLSL}
          void main() {
            vec3 lp = vLocal * vScale;
            vec3 an = abs(vNormal);
            vec2 face = an.y > 0.5 ? lp.xz : (an.x > 0.5 ? lp.zy : lp.xy);
            vec2 halfSize = an.y > 0.5 ? vScale.xz * 0.5 : (an.x > 0.5 ? vScale.zy * 0.5 : vScale.xy * 0.5);
            vec2 e = halfSize - abs(face);
            float edge = 1.0 - smoothstep(0.0, 0.1, min(e.x, e.y));
            float shade = 0.55 + 0.45 * dot(vNormal, normalize(vec3(0.4, 0.8, 0.3)));

            float sweep = smoothstep(vRepair * 90.0 - 8.0, vRepair * 90.0, vWorld.y);
            float fixedMask = 1.0 - sweep;
            if (vRepair < 0.001) fixedMask = 0.0;

            vec3 concrete = vec3(0.05, 0.045, 0.042) * shade;
            vec3 modern = mix(vec3(0.015, 0.025, 0.045), vec3(0.03, 0.06, 0.1), vWorld.y / 60.0);
            vec3 col = mix(concrete, modern, fixedMask);

            if (an.y < 0.5) {
              vec2 cell = floor(vec2(face.x / 1.1, vWorld.y / 1.5));
              vec2 f = fract(vec2(face.x / 1.1, vWorld.y / 1.5));
              float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.28, f.y) * step(f.y, 0.72);
              float h = hash21(cell + vSeed * 77.0);
              float flicker = step(0.5, hash21(cell + floor(uTime * (6.0 + h * 10.0))));
              float oldLit = step(0.86, h) * mix(1.0, flicker, step(0.6, h));
              vec3 oldCol = vec3(1.0, 0.55, 0.2) * 0.35;
              float newLit = step(0.68, hash21(cell * 1.3 + vSeed + floor(uTime * 0.12 + vSeed * 9.0)));
              vec3 newCol = mix(vec3(0.36, 0.88, 1.0), vec3(1.0, 0.85, 0.6), step(0.75, h)) * 0.7;
              col += win * mix(oldLit * oldCol, newLit * newCol, fixedMask);
            }

            float glitch = step(0.985, hash21(vec2(floor(vWorld.y * 0.5), floor(uTime * 12.0) + vSeed * 13.0)));
            col += glitch * vec3(1.0, 0.3, 0.2) * 0.6 * (1.0 - fixedMask);
            float scan = smoothstep(1.5, 0.0, abs(vWorld.y - vRepair * 90.0)) * step(0.001, vRepair) * step(vRepair, 0.999);
            col += scan * vec3(0.36, 0.88, 1.0) * 1.5;
            col += edge * mix(vec3(0.25, 0.14, 0.08) * 0.5, vec3(0.36, 0.88, 1.0) * (0.4 + vWorld.y / 120.0), fixedMask);

            float dist = length(vWorld.xz - cameraPosition.xz);
            col *= mix(0.35, 1.0, smoothstep(300.0, 120.0, dist));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [repair, time],
  );

  const setRef = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    matrices.forEach((mtx, i) => m.setMatrixAt(i, mtx));
    m.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh ref={setRef} args={[geo, mat, matrices.length]} frustumCulled={false} />;
}

/** Leaking pipes: rusted conduits between towers with droplets falling until the district is repaired. */
function Pipes({ repair, time }: { repair: { value: number[] }; time: { value: number } }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { pipes, drips } = useMemo(() => {
    const rand = mulberry32(31);
    const pipes: { pos: THREE.Vector3; len: number; axis: "x" | "z"; d: number }[] = [];
    DISTRICTS.forEach((dist, d) => {
      for (let i = 0; i < 9; i++) {
        pipes.push({
          pos: new THREE.Vector3(dist.center.x + (rand() - 0.5) * 34, 6 + rand() * 22, dist.center.y + (rand() - 0.5) * 34),
          len: 10 + rand() * 16,
          axis: rand() < 0.5 ? "x" : "z",
          d,
        });
      }
    });
    const count = pipes.length * 40;
    const pos = new Float32Array(count * 3);
    const district = new Float32Array(count);
    const seed = new Float32Array(count);
    let k = 0;
    pipes.forEach((p) => {
      for (let i = 0; i < 40; i++) {
        const t = (rand() - 0.5) * p.len;
        pos.set([p.pos.x + (p.axis === "x" ? t : 0), p.pos.y, p.pos.z + (p.axis === "z" ? t : 0)], k * 3);
        district[k] = p.d;
        seed[k] = rand();
        k++;
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aDistrict", new THREE.BufferAttribute(district, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return { pipes, drips: g };
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uRepair: repair, uTime: time, uDpr: { value: dpr } },
        vertexShader: /* glsl */ `
          attribute float aDistrict; attribute float aSeed;
          uniform float uRepair[6]; uniform float uTime; uniform float uDpr;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float r = uRepair[int(aDistrict + 0.5)];
            float cycle = fract(uTime * (0.25 + aSeed * 0.35) + aSeed * 7.0);
            vec3 p = position;
            float fall = cycle * cycle * (position.y + 2.0);
            p.y -= fall;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp(1.8 * uDpr * (90.0 / -mv.z), 1.0, 5.0 * uDpr);
            vColor = mix(vec3(1.0, 0.45, 0.2), vec3(1.0, 0.75, 0.3), aSeed);
            vAlpha = (1.0 - r) * smoothstep(0.0, 0.05, cycle) * (1.0 - smoothstep(0.85, 1.0, cycle)) * 0.8;
          }`,
        fragmentShader: softPointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [repair, time, dpr],
  );

  return (
    <group>
      {pipes.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={p.axis === "x" ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, p.len, 8]} />
          <meshStandardMaterial color="#2a1d14" metalness={0.7} roughness={0.55} />
        </mesh>
      ))}
      <points geometry={drips} material={mat} frustumCulled={false} />
    </group>
  );
}

function ErrorNode({ index, repair }: { index: number; repair: { value: number[] } }) {
  const sys = DISTRICTS[index];
  const done = useExperience((s) => isObjectiveDone(s.objectives, "legacy", sys.id));
  const [hovered, bind] = useHover();
  const core = useHoloMaterial(done ? CYAN : ALERT, { intensity: 1.3 });
  const group = useRef<THREE.Group>(null);
  const shock = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y += dt * (done ? 0.4 : 1.6);
    const pulse = done ? 1 : 1 + Math.sin(t * 6 + index) * 0.08;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, (hovered ? 1.3 : 1) * pulse * (done ? 0.7 : 1), 8, dt));
  });

  const repairNow = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (!done) useExperience.getState().completeObjective("legacy", sys.id);
  };

  useEffect(() => {
    if (!done || repair.value[index] >= 1) return;
    const proxy = { v: repair.value[index] };
    gsap.to(proxy, {
      v: 1,
      duration: 3.2,
      ease: "power2.inOut",
      onUpdate: () => {
        repair.value[index] = proxy.v;
      },
    });
    if (shock.current) {
      const m = shock.current.material as THREE.MeshBasicMaterial;
      gsap.fromTo(shock.current.scale, { x: 1, y: 1, z: 1 }, { x: 40, y: 40, z: 40, duration: 1.8, ease: "expo.out" });
      gsap.fromTo(m, { opacity: 0.9 }, { opacity: 0, duration: 1.8, ease: "power2.out" });
    }
  }, [done, index, repair]);

  const y = 46;
  return (
    <group position={[sys.center.x, 0, sys.center.y]}>
      <group position-y={y} ref={group}>
        <mesh material={core} onClick={repairNow} {...bind}>
          <octahedronGeometry args={[2.2, 0]} />
        </mesh>
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[3.6, 0.06, 8, 96]} />
          <meshBasicMaterial color={done ? CYAN : ALERT} toneMapped={false} />
        </mesh>
      </group>
      <mesh position-y={y / 2}>
        <cylinderGeometry args={[0.12, 0.12, y, 6, 1, true]} />
        <meshBasicMaterial color={done ? CYAN : ALERT} transparent opacity={done ? 0.2 : 0.45} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={shock} position-y={1} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.9, 1, 64]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <HoloLabel
        position={[0, y + 6, 0]}
        subtitle={done ? sys.fixed : `${sys.severity} · click to repair`}
        title={sys.error}
        accent={done ? CYAN : ALERT}
      />
    </group>
  );
}

export function LegacyWorld() {
  const repair = useRepairUniform();
  const time = useMemo(() => ({ value: 0 }), []);
  const objectives = useExperience((s) => s.objectives);
  const grid = useGridMaterial({ color: AMBER, spacing: SPACING, radius: CITY_R * 1.3, opacity: 0.25 });
  const coreMat = useHoloMaterial(AMBER, { intensity: 1 });
  const doneCount = LEGACY_SYSTEMS.filter((s) => isObjectiveDone(objectives, "legacy", s.id)).length;

  useMemo(() => {
    const objs = useExperience.getState().objectives;
    LEGACY_SYSTEMS.forEach((s, i) => {
      if (isObjectiveDone(objs, "legacy", s.id)) repair.value[i] = 1;
    });
  }, [repair]);

  useEffect(() => {
    if (doneCount < LEGACY_SYSTEMS.length) return;
    const t = setTimeout(() => {
      const s = useExperience.getState();
      if (s.completed.includes("legacy")) return;
      s.setCaption("Transformation complete. The city runs on modern systems.");
      setTimeout(() => useExperience.getState().setCaption(null), 3800);
    }, 2400);
    return () => clearTimeout(t);
  }, [doneCount]);

  useFrame((_, dt) => {
    time.value += dt;
    grid.uniforms.uTime.value += dt;
    const avg = repair.value.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    repair.value[5] = avg;
    (coreMat.uniforms.uColor.value as THREE.Color).lerpColors(new THREE.Color(AMBER), new THREE.Color(CYAN), avg);
    coreMat.uniforms.uIntensity.value = 0.8 + avg * 1.4;
  });

  const accent = worldById("legacy").fog;
  return (
    <group>
      <fog attach="fog" args={[accent, 110, 330]} />
      <ambientLight intensity={0.25} color="#ffd9b0" />
      <directionalLight position={[60, 90, 30]} intensity={0.7} color="#ffcf99" />
      <mesh rotation-x={-Math.PI / 2} position-y={0}>
        <circleGeometry args={[CITY_R * 1.4, 64]} />
        <meshStandardMaterial color="#0b0907" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.05} material={grid}>
        <circleGeometry args={[CITY_R * 1.4, 64]} />
      </mesh>
      <Buildings repair={repair} time={time} />
      <Pipes repair={repair} time={time} />
      {DISTRICTS.map((_, i) => (
        <ErrorNode key={i} index={i} repair={repair} />
      ))}
      <mesh position-y={74} material={coreMat}>
        <icosahedronGeometry args={[3.2, 1]} />
      </mesh>
      <HoloLabel
        position={[0, 82, 0]}
        subtitle={`Citibank · ${doneCount}/${LEGACY_SYSTEMS.length} systems`}
        title="Advice Generation System"
        accent={doneCount === LEGACY_SYSTEMS.length ? CYAN : AMBER}
      />
    </group>
  );
}
