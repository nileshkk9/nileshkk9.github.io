"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import { chapters } from "@/content/archive";
import { useExperience, useObjective } from "@/store/experience";
import { hashGLSL, mulberry32, softPointFrag } from "@/three/glsl";
import { HoloLabel, useGridMaterial, useHoloMaterial, useHover } from "@/three/kit";
import { makeCodeTexture } from "./codeTexture";

const AMBER = "#FFB547";
const CYAN = "#5CE1FF";
const ALERT = "#FF5C48";
const LANES = 3;
const PER_LANE = 22;
const SPAN = 88;
const LANE_GAP = 2.6;

const DIAGNOSTICS = [
  "Field 'techId' does not exist on WorkOrder → renamed to assigneeId",
  "Unknown skill 'hvac' → corrected to 'HVAC'",
  "'sla' may be undefined → default SLA applied",
  "Unreachable step after return → removed",
  "Missing required trigger payload → schema added",
];

function useForgeUniforms() {
  return useMemo(
    () => ({
      uTime: { value: 0 },
      uCore: { value: 0 },
      uFix: { value: 0 },
      uSweep: { value: -1 },
    }),
    [],
  );
}
type ForgeUniforms = ReturnType<typeof useForgeUniforms>;

function CodeBlocks({ u }: { u: ForgeUniforms }) {
  const count = LANES * PER_LANE;
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(2.2, 0.35, 1.3);
    const rand = mulberry32(606);
    const lane = new Float32Array(count);
    const offset = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      lane[i] = i % LANES;
      offset[i] = Math.floor(i / LANES) / PER_LANE + (i % LANES) * 0.013 + rand() * 0.01;
      seed[i] = rand();
    }
    const ig = new THREE.InstancedBufferGeometry().copy(g as unknown as THREE.InstancedBufferGeometry);
    ig.instanceCount = count;
    ig.setAttribute("aLane", new THREE.InstancedBufferAttribute(lane, 1));
    ig.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offset, 1));
    ig.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seed, 1));
    return ig;
  }, [count]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          attribute float aLane; attribute float aOffset; attribute float aSeed;
          uniform float uTime; uniform float uCore; uniform float uFix; uniform float uSweep;
          varying vec3 vColor; varying vec3 vN; varying vec2 vTop; varying float vTopMask; varying float vSeed; varying float vRed;
          void main() {
            float t = fract(aOffset + uTime * 0.03);
            float x = -${(SPAN / 2).toFixed(1)} + t * ${SPAN.toFixed(1)};
            float bugRate = mix(0.45, 0.1, uFix);
            float isBug = step(aSeed, bugRate);
            float fixedNow = smoothstep(-0.6, 0.6, x) * uCore;
            float red = isBug * (1.0 - fixedNow);
            float scan = smoothstep(2.6, 0.0, abs(x)) * uCore;
            float sweepX = -${(SPAN / 2).toFixed(1)} + uSweep * ${(SPAN * 1.1).toFixed(1)};
            float sweep = smoothstep(5.0, 0.0, abs(x - sweepX)) * step(0.0, uSweep) * step(uSweep, 1.0);
            vec3 raw = vec3(0.62, 0.58, 0.52) * 0.45;
            vec3 clean = vec3(0.36, 0.88, 1.0) * 0.75;
            vec3 bug = vec3(1.0, 0.32, 0.22);
            vec3 col = mix(raw, clean, fixedNow);
            col = mix(col, bug, red);
            col += vec3(1.0, 0.82, 0.55) * scan * 0.9 + vec3(0.6, 0.95, 1.0) * sweep * 1.6;
            float jit = red * sin(uTime * 34.0 + aSeed * 100.0) * 0.05;
            float edge = smoothstep(${(SPAN / 2).toFixed(1)}, ${(SPAN / 2 - 4).toFixed(1)}, abs(x));
            vec3 p = position * edge;
            vec3 base = vec3(x + jit, 0.75 + jit, (aLane - 1.0) * ${LANE_GAP.toFixed(1)});
            gl_Position = projectionMatrix * modelViewMatrix * vec4(base + p, 1.0);
            vN = normal;
            vTopMask = step(0.5, normal.y);
            vTop = position.xz / vec2(2.2, 1.3) + 0.5;
            vSeed = aSeed;
            vRed = red;
            vColor = col;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying vec3 vN; varying vec2 vTop; varying float vTopMask; varying float vSeed; varying float vRed;
          ${hashGLSL}
          void main() {
            float l = 0.35 + 0.65 * max(dot(normalize(vN), normalize(vec3(0.3, 1.0, 0.5))), 0.0);
            vec3 col = vColor * l * 0.55;
            float row = floor(vTop.y * 4.0);
            float inRow = step(0.3, fract(vTop.y * 4.0)) * step(fract(vTop.y * 4.0), 0.7) * step(0.5, row) * step(row, 3.5);
            float indent = 0.08 + hash11(vSeed * 13.0 + row) * 0.18;
            float width = 0.25 + hash11(vSeed * 7.0 + row * 3.1) * 0.55;
            float line = inRow * step(indent, vTop.x) * step(vTop.x, indent + width);
            col += vColor * line * vTopMask * 1.4;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [u],
  );
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

function Belts({ u }: { u: ForgeUniforms }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          varying vec3 vW; varying vec3 vN;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz; vN = normal;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uCore;
          varying vec3 vW; varying vec3 vN;
          void main() {
            float top = step(0.5, vN.y);
            float chev = smoothstep(0.42, 0.5, fract((vW.x - abs(fract(vW.z / ${LANE_GAP.toFixed(1)} + 0.5) - 0.5) * 2.0) * 0.5 - uTime * 0.03 * ${SPAN.toFixed(1)} * 0.5));
            float side = smoothstep(0.82, 1.0, abs(fract(vW.z / ${LANE_GAP.toFixed(1)} + 0.5) - 0.5) * 2.0);
            vec3 warm = vec3(1.0, 0.62, 0.25);
            vec3 cool = vec3(0.36, 0.88, 1.0);
            vec3 tint = mix(warm, cool, smoothstep(-1.0, 1.0, vW.x) * uCore);
            vec3 col = vec3(0.02, 0.02, 0.03) + tint * (chev * 0.08 + side * 0.35) * top;
            float fade = smoothstep(${(SPAN / 2 + 2).toFixed(1)}, ${(SPAN / 2 - 6).toFixed(1)}, abs(vW.x));
            gl_FragColor = vec4(col * fade, 1.0);
          }`,
      }),
    [u],
  );
  return (
    <mesh material={mat} position={[0, 0.3, 0]}>
      <boxGeometry args={[SPAN + 4, 0.3, LANES * LANE_GAP]} />
    </mesh>
  );
}

function Sparks({ u, count = 420 }: { u: ForgeUniforms; count?: number }) {
  const geo = useMemo(() => {
    const rand = mulberry32(77);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([(rand() - 0.5) * 3, 0, (rand() - 0.5) * LANES * LANE_GAP], i * 3);
      seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime; uniform float uCore;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float life = fract(uTime * (0.35 + aSeed * 0.5) + aSeed * 7.0);
            vec3 p = position;
            p.y = 1.0 + life * (3.0 + aSeed * 6.0);
            p.x += sin(aSeed * 40.0 + life * 3.0) * life * 1.5;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.5 + aSeed * 2.5) * (300.0 / -mv.z) * 0.08;
            vColor = mix(vec3(1.0, 0.7, 0.3), vec3(0.5, 0.92, 1.0), uCore * aSeed);
            vAlpha = (1.0 - life) * (0.15 + uCore * 0.85);
          }`,
        fragmentShader: softPointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [u],
  );
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

function Scanner({ u }: { u: ForgeUniforms }) {
  const frame = useHoloMaterial(AMBER, { intensity: 0.7, opacity: 0.55 });
  const curtain = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uCore;
          varying vec2 vUv;
          void main() {
            float scan = smoothstep(0.03, 0.0, abs(fract(vUv.y - uTime * 0.6) - 0.5));
            float body = 0.08 + 0.1 * sin(vUv.y * 80.0 + uTime * 6.0) * 0.5;
            float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
            vec3 col = vec3(0.4, 0.9, 1.0) * (body + scan * 0.8) * edge;
            gl_FragColor = vec4(col * uCore, 1.0);
          }`,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [u],
  );
  const core = useObjective("forge", "core");
  useEffect(() => {
    (frame.uniforms.uColor.value as THREE.Color).set(core ? CYAN : AMBER);
  }, [core, frame]);
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 2.6, s * (LANES * LANE_GAP * 0.5 + 0.7)]} material={frame}>
          <boxGeometry args={[0.8, 5.2, 0.5]} />
        </mesh>
      ))}
      <mesh position={[0, 5.3, 0]} material={frame}>
        <boxGeometry args={[0.8, 0.5, LANES * LANE_GAP + 1.9]} />
      </mesh>
      <mesh material={curtain} position={[0, 2.7, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[LANES * LANE_GAP + 0.9, 4.8]} />
      </mesh>
    </group>
  );
}

function ZPilot() {
  const online = useObjective("forge", "core");
  const [hovered, bind] = useHover();
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const hands = useRef<THREE.Group>(null);
  const state = useRef({ power: online ? 1 : 0 });
  const chest = useHoloMaterial(AMBER, { intensity: 0.8, opacity: 0.8 });
  const eye = useMemo(() => new THREE.MeshBasicMaterial({ color: CYAN, toneMapped: false, transparent: true, opacity: 0.1 }), []);

  useEffect(() => {
    if (!online || state.current.power >= 1) return;
    const tw = gsap.to(state.current, { power: 1, duration: 2.2, ease: "power2.inOut" });
    const s = useExperience.getState();
    s.setCaption("ZPilot online — language server attached to every editor.");
    const t = setTimeout(() => useExperience.getState().setCaption(null), 3400);
    return () => {
      tw.kill();
      clearTimeout(t);
    };
  }, [online]);

  useFrame(({ clock }, dt) => {
    const p = state.current.power;
    const t = clock.elapsedTime;
    if (root.current) {
      root.current.position.y = 6.4 + p * 1.1 + Math.sin(t * 1.2) * 0.12 * p;
      const s = THREE.MathUtils.damp(root.current.scale.x, hovered && p < 1 ? 1.06 : 1, 8, dt);
      root.current.scale.setScalar(s);
    }
    if (head.current) {
      head.current.rotation.x = (1 - p) * 0.45 + Math.sin(t * 0.7) * 0.04 * p;
      head.current.rotation.y = Math.sin(t * 0.5) * 0.25 * p;
    }
    if (halo.current) halo.current.rotation.z += dt * (0.2 + p * 1.4);
    if (hands.current) hands.current.children.forEach((h, i) => (h.position.y = -1.2 + Math.sin(t * 2 + i * Math.PI) * 0.25 * p));
    eye.opacity = 0.08 + p * 0.92;
    (chest.uniforms.uColor.value as THREE.Color).lerpColors(new THREE.Color(AMBER), new THREE.Color(CYAN), p);
    chest.uniforms.uIntensity.value = 0.4 + p * 1.2;
  });

  const boot = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useExperience.getState().completeObjective("forge", "core");
  };

  return (
    <group ref={root} position={[0, 6.4, -3]} onClick={boot} {...bind}>
      <group ref={head} position={[0, 1.9, 0]}>
        <RoundedBox args={[2.8, 1.9, 2.1]} radius={0.45} smoothness={4}>
          <meshStandardMaterial color="#14161c" metalness={0.85} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.05, 1.06]}>
          <planeGeometry args={[2.2, 0.62]} />
          <meshBasicMaterial color="#020306" />
        </mesh>
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 0.05, 1.08]} material={eye}>
            <planeGeometry args={[0.55, 0.16]} />
          </mesh>
        ))}
        <mesh ref={halo} position={[0, 1.45, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[1.1, 0.04, 8, 64]} />
          <meshBasicMaterial color={online ? CYAN : AMBER} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.95, 1.1, 8, 16]} />
        <meshStandardMaterial color="#101217" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.35, 0.86]} material={chest}>
        <icosahedronGeometry args={[0.34, 1]} />
      </mesh>
      <mesh position={[0, -0.25, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.0, 0.05, 8, 48]} />
        <meshBasicMaterial color={online ? CYAN : "#6b5a3c"} toneMapped={false} />
      </mesh>
      <group ref={hands}>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 2.1, -1.2, 1.6]}>
            <mesh>
              <sphereGeometry args={[0.32, 16, 12]} />
              <meshStandardMaterial color="#181a20" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.5, 0.025, 6, 32]} />
              <meshBasicMaterial color={online ? CYAN : AMBER} toneMapped={false} transparent opacity={0.7} />
            </mesh>
          </group>
        ))}
      </group>
      <HoloLabel
        position={[0, 4.4, 0]}
        subtitle={online ? "Language server · online" : "Offline · click to boot"}
        title="ZPilot Core"
        accent={online ? CYAN : AMBER}
      />
    </group>
  );
}

function EditorPanels() {
  const before = useMemo(() => makeCodeTexture("before"), []);
  const after = useMemo(() => makeCodeTexture("after"), []);
  useEffect(
    () => () => {
      before.dispose();
      after.dispose();
    },
    [before, after],
  );
  return (
    <group>
      <mesh position={[-21, 11, -16]} rotation-y={0.32}>
        <planeGeometry args={[19.2, 12]} />
        <meshBasicMaterial map={before} transparent opacity={0.92} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[21, 11, -16]} rotation-y={-0.32}>
        <planeGeometry args={[19.2, 12]} />
        <meshBasicMaterial map={after} transparent opacity={0.92} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

function BugCatcher() {
  const [pops, setPops] = useState<{ id: number; p: THREE.Vector3; msg: string }[]>([]);
  const seq = useRef(0);
  const [, bind] = useHover();
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const s = useExperience.getState();
    if (!s.objectives.includes("forge:core")) {
      s.setCaption("ZPilot is offline — boot the core first so it can check this code.");
      setTimeout(() => useExperience.getState().setCaption(null), 2800);
      return;
    }
    s.completeObjective("forge", "validate");
    const id = ++seq.current;
    const msg = DIAGNOSTICS[id % DIAGNOSTICS.length];
    setPops((p) => [...p.slice(-2), { id, p: e.point.clone(), msg }]);
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 2800);
  };
  return (
    <group>
      <mesh position={[-SPAN / 4, 0.9, 0]} onClick={onClick} {...bind}>
        <boxGeometry args={[SPAN / 2, 1, LANES * LANE_GAP]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {pops.map((p) => (
        <Html key={p.id} position={[p.p.x, 2.2, p.p.z]} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
          <div className="glass animate-[fadeUp_2.8s_ease-out_forwards] rounded-lg px-3 py-1.5 whitespace-nowrap">
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#FF7A66] uppercase">Diagnostic · fixed</div>
            <div className="text-[11.5px] text-white/90">{p.msg}</div>
          </div>
        </Html>
      ))}
    </group>
  );
}

function Metrics() {
  const fixed = useObjective("forge", "autofix");
  const m = chapters.forge.metrics;
  return (
    <>
      {m.map((x, i) => (
        <Html key={x.label} position={[i === 0 ? -9.5 : 9.5, 12.5, -5]} center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
          <div className={`text-center transition-all duration-1000 ${fixed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
            <div className="text-[56px] leading-none font-light tracking-[-0.04em] text-white text-glow">{x.value}</div>
            <div className="eyebrow mt-2 text-[#FFB547]">{x.label}</div>
          </div>
        </Html>
      ))}
    </>
  );
}

export function ForgeWorld() {
  const u = useForgeUniforms();
  const online = useObjective("forge", "core");
  const autofixAt = useExperience((s) => s.forgeAutofixAt);
  const grid = useGridMaterial({ color: AMBER, spacing: 4, radius: 80, opacity: 0.22 });

  useMemo(() => {
    const o = useExperience.getState().objectives;
    u.uCore.value = o.includes("forge:core") ? 1 : 0;
    u.uFix.value = o.includes("forge:autofix") ? 1 : 0;
  }, [u]);

  useEffect(() => {
    if (!online || u.uCore.value >= 1) return;
    const tw = gsap.to(u.uCore, { value: 1, duration: 2, delay: 0.6, ease: "power2.inOut" });
    return () => void tw.kill();
  }, [online, u]);

  useEffect(() => {
    if (autofixAt < 0 || performance.now() / 1000 - autofixAt > 2) return;
    const tl = gsap
      .timeline()
      .fromTo(u.uSweep, { value: 0 }, { value: 1.05, duration: 2.4, ease: "power1.inOut" })
      .to(u.uFix, { value: 1, duration: 2.4, ease: "power2.out" }, 0.4)
      .set(u.uSweep, { value: -1 });
    useExperience.getState().setCaption("Auto-fix sweep: every flow in the workspace validated and repaired.");
    const t = setTimeout(() => useExperience.getState().setCaption(null), 3400);
    return () => {
      tl.kill();
      clearTimeout(t);
    };
  }, [autofixAt, u]);

  useFrame((_, dt) => {
    u.uTime.value += dt;
    grid.uniforms.uTime.value += dt;
  });

  return (
    <group>
      <fog attach="fog" args={["#0a0604", 50, 150]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[20, 30, 25]} intensity={1.1} color="#ffe2c0" />
      <pointLight position={[0, 6, 4]} intensity={online ? 120 : 60} distance={30} color={online ? CYAN : AMBER} />
      <mesh rotation-x={-Math.PI / 2} material={grid} position-y={0.01}>
        <circleGeometry args={[80, 64]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial color="#07060a" metalness={0.5} roughness={0.6} />
      </mesh>
      <Belts u={u} />
      <CodeBlocks u={u} />
      <BugCatcher />
      <Scanner u={u} />
      <Sparks u={u} />
      <ZPilot />
      <EditorPanels />
      <Metrics />
      <HoloLabel position={[-34, 3.2, 0]} subtitle="Input" title="Developer code" accent={ALERT} />
      <HoloLabel position={[34, 3.2, 0]} subtitle="Output" title="Validated & fixed" accent={CYAN} />
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[9, 9.25, 96]} />
        <meshBasicMaterial color={AMBER} toneMapped={false} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}
