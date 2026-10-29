"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32, noiseGLSL, softPointFrag } from "./glsl";
import { useExperience } from "@/store/experience";
import { worldById } from "@/worlds/registry";

export function Starfield({ count = 6000 }: { count?: number }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const geo = useMemo(() => {
    const rand = mulberry32(7);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = rand() * 2 - 1;
      const t = rand() * Math.PI * 2;
      const r = 700 + rand() * 300;
      const s = Math.sqrt(1 - u * u);
      pos.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3);
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
        uniforms: { uTime: { value: 0 }, uDpr: { value: dpr } },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime; uniform float uDpr;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 2.0) + aSeed * 40.0);
            float big = step(0.985, aSeed);
            gl_PointSize = (1.2 + aSeed * 1.6 + big * 3.0) * uDpr;
            vAlpha = (0.25 + 0.75 * aSeed) * tw;
            vColor = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.85, 0.6), step(0.9, fract(aSeed * 13.0)));
          }`,
        fragmentShader: softPointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [dpr],
  );

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={-2} />;
}

export function Nebula() {
  const ref = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uA: { value: new THREE.Color("#5CE1FF") },
          uB: { value: new THREE.Color("#3a4c9a") },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uA; uniform vec3 uB;
          varying vec3 vDir;
          ${noiseGLSL}
          void main() {
            vec3 d = normalize(vDir);
            float band = exp(-pow(d.y * 2.6 + 0.15, 2.0));
            float n = fbm(d * 2.2 + vec3(0.0, 0.0, uTime * 0.01));
            float m = fbm(d * 5.0 - vec3(uTime * 0.006));
            float cloud = pow(smoothstep(-0.1, 0.9, n), 1.6) * band;
            float wisps = smoothstep(0.2, 0.7, fbm(d * 9.0 + n)) * cloud;
            vec3 col = mix(uB, uA, smoothstep(-0.2, 0.7, m)) * (cloud * 0.07 + wisps * 0.06);
            col += vec3(0.012, 0.018, 0.04) * band;
            gl_FragColor = vec4(col, 1.0);
          }`,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  const activeWorld = useExperience((s) => s.activeWorld);
  const target = useMemo(() => new THREE.Color(worldById(activeWorld).accent), [activeWorld]);

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
    (mat.uniforms.uA.value as THREE.Color).lerp(target, Math.min(1, dt * 1.5));
    ref.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={ref} material={mat} renderOrder={-3} frustumCulled={false}>
      <sphereGeometry args={[1200, 48, 24]} />
    </mesh>
  );
}
