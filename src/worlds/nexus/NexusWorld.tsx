"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useExperience } from "@/store/experience";
import { mulberry32, noiseGLSL, hashGLSL } from "@/three/glsl";
import { HoloLabel, useHoloMaterial } from "@/three/kit";
import { BLOCK, ENGINE_POS, GRID_HALF, NEXUS_COUNTS, simGLSL } from "./simGLSL";

const CYAN = "#5CE1FF";
const AMBER = "#FFB547";

/** Shared uniforms so every layer of the simulation runs on the same clock and mode. */
function useSimUniforms(workers: number) {
  return useMemo(
    () => ({
      uTime: { value: 0 },
      uWorkers: { value: workers },
      uMode: { value: 0 },
      uBatchStart: { value: 0 },
      uSurge: { value: 0 },
      uCapacity: { value: 0 },
      uPulse: { value: 0 },
      uDpr: { value: 1 },
    }),
    [workers],
  );
}
type SimUniforms = ReturnType<typeof useSimUniforms>;

function Workers({ u, count }: { u: SimUniforms; count: number }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const id = new Float32Array(count);
    for (let i = 0; i < count; i++) id[i] = i;
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aId", new THREE.BufferAttribute(id, 1));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          attribute float aId;
          uniform float uDpr; uniform float uCapacity; uniform float uPulse;
          varying vec3 vColor; varying float vAlpha;
          ${simGLSL}
          void main() {
            vec3 p = workerPos(aId, uTime);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp(3.0 * uDpr * (120.0 / -mv.z), 1.8, 10.0 * uDpr);
            float util = hash11(aId * 0.37 + floor(uTime / 6.0 + hash11(aId)) * 3.1);
            vec3 base = vec3(0.36, 0.88, 1.0);
            vec3 cap = mix(vec3(0.36, 0.88, 1.0), vec3(1.0, 0.62, 0.2), smoothstep(0.45, 0.9, util));
            vColor = mix(base, cap, uCapacity) * (1.1 + uPulse * 1.5);
            vAlpha = 0.95;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = max(abs(c.x), abs(c.y));
            float a = smoothstep(0.5, 0.2, d) * vAlpha;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vColor * 1.4, a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [u],
  );
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

function Tasks({ u, count }: { u: SimUniforms; count: number }) {
  const geo = useMemo(() => {
    const rand = mulberry32(17);
    const g = new THREE.BufferGeometry();
    const id = new Float32Array(count);
    const seed = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      id[i] = i;
      seed[i * 2] = rand();
      seed[i * 2 + 1] = rand();
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("aId", new THREE.BufferAttribute(id, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 2));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          attribute float aId; attribute vec2 aSeed;
          uniform float uDpr;
          varying vec3 vColor; varying float vAlpha;
          ${simGLSL}
          void main() {
            Task t = evalTask(aId, aSeed.x);
            vec4 mv = modelViewMatrix * vec4(t.pos, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = clamp((1.4 + t.flight * 0.8) * uDpr * (110.0 / -mv.z), 1.0, 6.0 * uDpr);
            vec3 amber = vec3(1.0, 0.71, 0.28);
            vec3 white = vec3(0.92, 0.97, 1.0);
            vColor = mix(amber, white, t.flight) * (1.0 + uSurge * 0.8);
            vAlpha = t.alpha * taskVisible(aSeed.y) * (0.55 + t.flight * 0.45);
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * vAlpha;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vColor, a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [u],
  );
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/** Assignment beams: a subset of tasks draws a line to its worker while in flight, or to the engine while queued. */
function Beams({ u, count }: { u: SimUniforms; count: number }) {
  const geo = useMemo(() => {
    const rand = mulberry32(17);
    const g = new THREE.BufferGeometry();
    const id = new Float32Array(count * 2);
    const seed = new Float32Array(count * 4);
    const end = new Float32Array(count * 2);
    const stride = Math.max(1, Math.floor(100000 / count));
    for (let i = 0; i < count; i++) {
      const s1 = rand();
      const s2 = rand();
      for (let e = 0; e < 2; e++) {
        id[i * 2 + e] = i * stride;
        seed.set([s1, s2], (i * 2 + e) * 2);
        end[i * 2 + e] = e;
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    g.setAttribute("aId", new THREE.BufferAttribute(id, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 2));
    g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          attribute float aId; attribute vec2 aSeed; attribute float aEnd;
          varying vec3 vColor; varying float vAlpha;
          ${simGLSL}
          void main() {
            Task t = evalTask(aId, aSeed.x);
            vec3 engine = vec3(${ENGINE_POS.map((v) => v.toFixed(1)).join(",")});
            float queued = t.waiting * uMode;
            vec3 target = mix(t.worker, engine, queued);
            vec3 p = mix(t.pos, target, aEnd);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            vColor = mix(vec3(0.36, 0.88, 1.0), vec3(1.0, 0.71, 0.28), queued);
            float vis = max(t.flight, queued * 0.16);
            vAlpha = t.alpha * vis * taskVisible(aSeed.y) * mix(0.4, 0.04, aEnd) * (1.0 + uSurge);
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying float vAlpha;
          void main() { if (vAlpha < 0.005) discard; gl_FragColor = vec4(vColor * 1.3, vAlpha); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [u],
  );
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />;
}

function Buildings({ u }: { u: SimUniforms }) {
  const { geo, matrices } = useMemo(() => {
    const rand = mulberry32(404);
    const mats: THREE.Matrix4[] = [];
    const seeds: number[] = [];
    const o = new THREE.Object3D();
    const extent = GRID_HALF * BLOCK;
    for (let bx = -GRID_HALF; bx < GRID_HALF; bx++) {
      for (let bz = -GRID_HALF; bz < GRID_HALF; bz++) {
        const cx = (bx + 0.5) * BLOCK;
        const cz = (bz + 0.5) * BLOCK;
        const dist = Math.hypot(cx, cz);
        if (dist < BLOCK * 1.6) continue;
        const falloff = 1 - Math.min(1, dist / extent);
        const split = rand() < 0.55 ? 2 : 1;
        const sub = (BLOCK - 3) / split;
        for (let i = 0; i < split; i++) {
          for (let j = 0; j < split; j++) {
            if (rand() < 0.2) continue;
            const w = sub * (0.65 + rand() * 0.25);
            const d = sub * (0.65 + rand() * 0.25);
            const h = 1.5 + Math.pow(rand(), 2.8) * 30 * (0.15 + falloff * 1.1);
            o.position.set(cx - (BLOCK - 3) / 2 + sub * (i + 0.5), h / 2, cz - (BLOCK - 3) / 2 + sub * (j + 0.5));
            o.scale.set(w, h, d);
            o.updateMatrix();
            mats.push(o.matrix.clone());
            seeds.push(rand());
          }
        }
      }
    }
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.setAttribute("aBSeed", new THREE.InstancedBufferAttribute(new Float32Array(seeds), 1));
    return { geo: g, matrices: mats };
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          attribute float aBSeed;
          varying vec3 vLocal; varying vec3 vScale; varying float vSeed; varying vec3 vWorld; varying vec3 vNormal;
          void main() {
            vLocal = position;
            vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
            vSeed = aBSeed;
            vNormal = normal;
            vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
            vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uCapacity; uniform float uPulse;
          varying vec3 vLocal; varying vec3 vScale; varying float vSeed; varying vec3 vWorld; varying vec3 vNormal;
          ${hashGLSL}
          void main() {
            vec3 lp = vLocal * vScale;
            vec3 an = abs(vNormal);
            vec2 face = an.y > 0.5 ? lp.xz : (an.x > 0.5 ? lp.zy : lp.xy);
            vec2 halfSize = an.y > 0.5 ? vScale.xz * 0.5 : (an.x > 0.5 ? vScale.zy * 0.5 : vScale.xy * 0.5);
            vec2 e = halfSize - abs(face);
            float edge = 1.0 - smoothstep(0.0, 0.08, min(e.x, e.y));
            float h = vWorld.y / 50.0;
            vec3 base = mix(vec3(0.015, 0.025, 0.045), vec3(0.03, 0.06, 0.1), h);
            vec3 col = base;
            if (an.y < 0.5) {
              vec2 cell = floor(vec2(face.x / 0.9, vWorld.y / 1.2));
              vec2 f = fract(vec2(face.x / 0.9, vWorld.y / 1.2));
              float win = step(0.25, f.x) * step(f.x, 0.75) * step(0.3, f.y) * step(f.y, 0.7);
              float lit = step(0.78, hash21(cell + vSeed * 91.0 + floor(uTime * 0.15 + vSeed * 7.0)));
              vec3 wc = mix(vec3(0.36, 0.88, 1.0), vec3(1.0, 0.71, 0.28), step(0.7, hash21(cell * 1.7 + vSeed)));
              col += win * lit * wc * 0.55;
            }
            vec3 edgeCol = mix(vec3(0.36, 0.88, 1.0), vec3(1.0, 0.71, 0.28), uCapacity * step(0.6, vSeed));
            col += edge * edgeCol * (0.35 + h * 0.6 + uPulse * 0.6);
            float fog = smoothstep(260.0, 120.0, length(vWorld.xz - cameraPosition.xz) );
            gl_FragColor = vec4(col * mix(0.3, 1.0, fog), 1.0);
          }`,
      }),
    [u],
  );

  const setRef = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    matrices.forEach((mtx, i) => m.setMatrixAt(i, mtx));
    m.instanceMatrix.needsUpdate = true;
  };

  return <instancedMesh ref={setRef} args={[geo, mat, matrices.length]} frustumCulled={false} />;
}

function Ground({ u }: { u: SimUniforms }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          varying vec3 vW;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uCapacity;
          varying vec3 vW;
          ${noiseGLSL}
          ${hashGLSL}
          void main() {
            vec2 p = vW.xz / ${BLOCK.toFixed(1)};
            vec2 g = abs(fract(p - 0.5) - 0.5) * ${BLOCK.toFixed(1)};
            float road = 1.0 - smoothstep(1.0, 1.4, min(g.x, g.y));
            float lane = 1.0 - smoothstep(0.0, 0.08, min(g.x, g.y));
            float dash = step(0.5, fract((g.x < g.y ? vW.z : vW.x) * 0.25));
            float r = length(vW.xz);
            float fade = smoothstep(${(GRID_HALF * BLOCK * 1.25).toFixed(1)}, ${(GRID_HALF * BLOCK * 0.5).toFixed(1)}, r);
            vec3 col = vec3(0.01, 0.015, 0.03);
            col += road * vec3(0.02, 0.04, 0.07);
            col += lane * dash * vec3(0.36, 0.88, 1.0) * 0.35;

            vec2 block = floor(p);
            float demand = fbm(vec3(block * 0.18, uTime * 0.05)) * 0.5 + 0.5;
            float capacity = 0.35 + hash21(block) * 0.45;
            float load = demand / capacity;
            vec3 heat = mix(vec3(0.1, 0.5, 0.9), vec3(1.0, 0.6, 0.15), smoothstep(0.8, 1.4, load));
            heat = mix(heat, vec3(1.0, 0.3, 0.12), smoothstep(1.5, 2.0, load));
            float inner = 1.0 - road;
            col += heat * inner * uCapacity * 0.32;

            float ring = smoothstep(1.2, 0.0, abs(r - mod(uTime * 40.0, 300.0)));
            col += ring * vec3(0.36, 0.88, 1.0) * 0.2 * road;
            gl_FragColor = vec4(col * fade, 1.0);
          }`,
      }),
    [u],
  );
  return (
    <mesh rotation-x={-Math.PI / 2} material={mat}>
      <planeGeometry args={[GRID_HALF * BLOCK * 3, GRID_HALF * BLOCK * 3, 1, 1]} />
    </mesh>
  );
}

function Engine({ u }: { u: SimUniforms }) {
  const rings = useRef<THREE.Group>(null);
  const core = useHoloMaterial(CYAN, { intensity: 1.4 });
  const beam = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uPulse; varying vec2 vUv;
          void main(){
            float flow = fract(vUv.y * 6.0 - uTime * 1.5);
            float a = (1.0 - vUv.y) * (0.25 + 0.5 * smoothstep(0.7, 1.0, flow)) * (0.6 + uPulse);
            gl_FragColor = vec4(vec3(0.36, 0.88, 1.0) * 1.5, a * 0.5);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [u],
  );
  useFrame((_, dt) => {
    const g = rings.current;
    if (!g) return;
    g.children.forEach((c, i) => {
      c.rotation.x += dt * (0.2 + i * 0.15) * (1 + u.uPulse.value * 4);
      c.rotation.y += dt * (0.3 - i * 0.1);
    });
    core.uniforms.uIntensity.value = 1.2 + u.uPulse.value * 2 + u.uSurge.value;
  });
  return (
    <group>
      <mesh position-y={6}>
        <cylinderGeometry args={[1.2, 3.2, 12, 6, 1, true]} />
        <meshStandardMaterial color="#0a1422" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[ENGINE_POS[0], ENGINE_POS[1], ENGINE_POS[2]]} material={core}>
        <icosahedronGeometry args={[2.6, 2]} />
      </mesh>
      <group ref={rings} position={[ENGINE_POS[0], ENGINE_POS[1], ENGINE_POS[2]]}>
        {[4.2, 5.6, 7.2].map((r, i) => (
          <mesh key={r} rotation={[i, i * 0.7, 0]}>
            <torusGeometry args={[r, 0.05, 8, 160]} />
            <meshBasicMaterial color={i === 1 ? AMBER : CYAN} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh position-y={60} material={beam}>
        <cylinderGeometry args={[0.6, 0.6, 120, 16, 1, true]} />
      </mesh>
      <HoloLabel position={[0, ENGINE_POS[1] + 10, 0]} subtitle="Zinier · Core" title="Scheduling Engine" />
    </group>
  );
}

export function NexusWorld() {
  const quality = useExperience((s) => s.quality);
  const counts = NEXUS_COUNTS[quality];
  const dpr = useThree((s) => s.viewport.dpr);
  const u = useSimUniforms(counts.workers);

  useFrame((_, dt) => {
    const s = useExperience.getState();
    const now = performance.now() / 1000;
    u.uTime.value = now;
    u.uDpr.value = dpr;
    u.uMode.value = THREE.MathUtils.damp(u.uMode.value, s.nexusMode === "batch" ? 1 : 0, 2.5, dt);
    if (u.uMode.value > 0.995) u.uMode.value = 1;
    if (u.uMode.value < 0.005) u.uMode.value = 0;
    u.uBatchStart.value = s.batchAt;
    u.uCapacity.value = THREE.MathUtils.damp(u.uCapacity.value, s.nexusCapacity ? 1 : 0, 3, dt);
    const since = now - s.dispatchAt;
    u.uSurge.value = since < 0 ? 0 : Math.max(0, 1 - Math.max(0, since - 4) / 3) * Math.min(1, since * 3);
    const bp = ((now - s.batchAt) / 9) % 1;
    const pulse = s.nexusMode === "batch" ? Math.max(0, 1 - Math.abs(bp - 0.76) / 0.05) : 0;
    u.uPulse.value = THREE.MathUtils.damp(u.uPulse.value, pulse, 8, dt);
  });

  return (
    <group>
      <fog attach="fog" args={["#02050a", 120, 320]} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[40, 80, 20]} intensity={0.6} />
      <Ground u={u} />
      <Buildings u={u} />
      <Engine u={u} />
      <Workers u={u} count={counts.workers} />
      <Tasks u={u} count={counts.tasks} />
      <Beams u={u} count={counts.beams} />
    </group>
  );
}
