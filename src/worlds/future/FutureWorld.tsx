"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { futurePaths } from "@/content/archive";
import { useExperience } from "@/store/experience";
import { hashGLSL, mulberry32, noiseGLSL, softPointFrag } from "@/three/glsl";
import { HoloLabel, useHoloMaterial, useHover } from "@/three/kit";
import { PATH_COLORS } from "./colors";


const TUNNEL_R = 16;
const TUNNEL_NEAR = 44;
const TUNNEL_FAR = -134;
const PORTAL_Z = -112;
const PORTAL_R = 10;

function Tunnel({ time }: { time: { value: number } }) {
  const len = TUNNEL_NEAR - TUNNEL_FAR;
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: time },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vUv;
          ${hashGLSL}
          ${noiseGLSL}
          void main() {
            float along = vUv.y;
            float ang = fract(vUv.x + along * 0.35);
            float lanes = 120.0;
            float id = floor(ang * lanes);
            float h = hash11(id + 3.0);
            float f = fract(along * (2.0 + h * 5.0) - uTime * (0.05 + h * 0.08) + h * 9.0);
            float streak = smoothstep(0.0, 0.015, f) * smoothstep(0.22, 0.015, f) * step(0.45, h);
            float lane = smoothstep(0.5, 0.38, abs(fract(ang * lanes) - 0.5));
            float n = fbm(vec3(ang * 10.0, along * 8.0 - uTime * 0.12, 0.0)) * 0.5 + 0.5;
            vec3 tint = mix(vec3(0.36, 0.88, 1.0), mix(vec3(1.0, 0.72, 0.4), vec3(0.73, 0.65, 1.0), step(0.75, h)), step(0.62, h));
            vec3 col = tint * streak * lane * 0.8 + vec3(0.32, 0.4, 0.8) * pow(n, 3.0) * 0.12;
            float fade = smoothstep(0.0, 0.2, along) * smoothstep(1.0, 0.72, along);
            gl_FragColor = vec4(col * fade, 1.0);
          }`,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [time],
  );
  return (
    <mesh material={mat} rotation-x={Math.PI / 2} position-z={(TUNNEL_NEAR + TUNNEL_FAR) / 2}>
      <cylinderGeometry args={[TUNNEL_R, TUNNEL_R * 0.72, len, 96, 1, true]} />
    </mesh>
  );
}

function Drift({ time, count = 1800 }: { time: { value: number }; count?: number }) {
  const geo = useMemo(() => {
    const rand = mulberry32(88);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = 2 + Math.sqrt(rand()) * (TUNNEL_R - 3);
      pos.set([Math.cos(a) * r, Math.sin(a) * r, rand()], i * 3);
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
        uniforms: { uTime: time },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            float t = fract(position.z - uTime * (0.02 + aSeed * 0.03));
            vec3 p = vec3(position.xy * mix(0.75, 1.0, t), mix(${TUNNEL_FAR.toFixed(1)}, ${TUNNEL_NEAR.toFixed(1)}, t));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.0 + aSeed * 2.0) * (300.0 / -mv.z) * 0.12;
            vColor = mix(vec3(0.8, 0.9, 1.0), vec3(0.36, 0.88, 1.0), aSeed);
            vAlpha = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.85, t) * 0.8;
          }`,
        fragmentShader: softPointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [time],
  );
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

function Singularity({ time }: { time: { value: number } }) {
  const disc = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: time },
        vertexShader: /* glsl */ `
          varying vec2 vP;
          void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vP;
          ${hashGLSL}
          ${noiseGLSL}
          void main() {
            float r = length(vP);
            float a = atan(vP.y, vP.x);
            float swirl = fbm(vec3(cos(a + r * 0.5 - uTime * 0.4) * 2.0, sin(a + r * 0.5 - uTime * 0.4) * 2.0, r * 0.4)) * 0.5 + 0.5;
            float band = smoothstep(3.0, 4.2, r) * smoothstep(13.0, 5.0, r);
            vec3 col = mix(vec3(1.0, 0.8, 0.55), vec3(0.45, 0.8, 1.0), smoothstep(4.0, 11.0, r)) * band * pow(swirl, 2.0) * 1.3;
            gl_FragColor = vec4(col, 1.0);
          }`,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [time],
  );
  const glow = useHoloMaterial("#E8F1FF", { intensity: 1.6, opacity: 1 });
  return (
    <group position={[0, 0, TUNNEL_FAR + 8]}>
      <mesh material={glow}>
        <sphereGeometry args={[2.6, 48, 32]} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.2, 32, 24]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh material={disc} rotation-x={-0.25}>
        <ringGeometry args={[2.8, 13, 128, 1]} />
      </mesh>
    </group>
  );
}

function Portal({ index }: { index: number }) {
  const p = futurePaths[index];
  const color = PATH_COLORS[p.id] ?? "#E8F1FF";
  const selected = useExperience((s) => s.futurePath === p.id);
  const [hovered, bind] = useHover();
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const a = (index / futurePaths.length) * Math.PI * 2 + Math.PI / 2;
  const pos: [number, number, number] = [Math.cos(a) * PORTAL_R, Math.sin(a) * PORTAL_R * 0.78, PORTAL_Z];
  const surface = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uOn: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vP;
          void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uColor; uniform float uOn;
          varying vec2 vP;
          void main() {
            float r = length(vP) / 1.6;
            float a = atan(vP.y, vP.x);
            float spiral = sin(a * 3.0 + r * 10.0 - uTime * (2.0 + uOn * 3.0)) * 0.5 + 0.5;
            float core = smoothstep(1.0, 0.0, r);
            vec3 col = uColor * (spiral * 0.5 + 0.25) * core * (0.55 + uOn * 0.9) + vec3(1.0) * pow(core, 6.0) * 0.6;
            gl_FragColor = vec4(col, 1.0);
          }`,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [color],
  );
  useFrame((_, dt) => {
    surface.uniforms.uTime.value += dt;
    surface.uniforms.uOn.value = THREE.MathUtils.damp(surface.uniforms.uOn.value, selected || hovered ? 1 : 0, 6, dt);
    if (ref.current) ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, hovered ? 1.15 : selected ? 1.08 : 1, 8, dt));
    if (ring.current) ring.current.rotation.z += dt * (selected ? 1.4 : 0.3);
  });
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useExperience.getState().setFuturePath(p.id);
  };
  return (
    <group ref={ref} position={pos}>
      <mesh material={surface} onClick={onClick} {...bind}>
        <circleGeometry args={[1.6, 48]} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[1.75, 0.06, 8, 96, Math.PI * 1.7]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <HoloLabel position={[0, 2.8, 0]} subtitle={selected ? "Selected" : "Future path"} title={p.label} accent={color} maxDistance={75} />
    </group>
  );
}

function Beacon() {
  const mat = useHoloMaterial("#E8F1FF", { intensity: 1.3, opacity: 0.9 });
  const [hovered, bind] = useHover();
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.9;
    const s = (hovered ? 1.2 : 1) * (1 + Math.sin(clock.elapsedTime * 2.4) * 0.06);
    ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, s, 8, dt));
  });
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const s = useExperience.getState();
    s.completeObjective("future", "transmit");
    s.setPanel("transmit");
  };
  return (
    <group position={[0, 0, PORTAL_Z - 2]}>
      <mesh ref={ref} material={mat} onClick={onClick} {...bind}>
        <octahedronGeometry args={[1.5, 0]} />
      </mesh>
      <mesh position-y={-12}>
        <cylinderGeometry args={[0.04, 0.04, 20, 8, 1, true]} />
        <meshBasicMaterial color="#5CE1FF" toneMapped={false} transparent opacity={0.6} />
      </mesh>
      <HoloLabel position={[0, 2.7, 0]} subtitle="Open a transmission" title="Get in touch" accent="#5CE1FF" maxDistance={75} />
    </group>
  );
}

export function FutureWorld() {
  const time = useMemo(() => ({ value: 0 }), []);
  const quality = useExperience((s) => s.quality);
  useFrame((_, dt) => {
    time.value += dt;
  });
  return (
    <group>
      <fog attach="fog" args={["#020205", 70, 220]} />
      <Tunnel time={time} />
      <Drift time={time} count={quality === "low" ? 700 : 1800} />
      <Singularity time={time} />
      {futurePaths.map((p, i) => (
        <Portal key={p.id} index={i} />
      ))}
      <Beacon />
    </group>
  );
}
