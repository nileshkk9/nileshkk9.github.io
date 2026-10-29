"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useExperience } from "@/store/experience";
import { worldById } from "@/worlds/registry";
import { rig, snapRigToShot } from "./CameraRig";
import { mulberry32 } from "./glsl";

export const warp = { value: 0, flash: 0 };

export function WarpDirector() {
  const request = useExperience((s) => s.travelRequest);
  const reducedMotion = useExperience((s) => s.reducedMotion);

  useEffect(() => {
    if (!request) return;
    const { arrive, setWarping } = useExperience.getState();
    const meta = worldById(request.world);
    if (!meta.ready) return;
    setWarping(true);

    const dir = new THREE.Vector3().subVectors(rig.target, rig.position).normalize();
    const tl = gsap.timeline();
    let tlIn: gsap.core.Timeline | null = null;
    const outDur = reducedMotion ? 0.3 : 1.1;
    const inDur = reducedMotion ? 0.4 : 1.6;

    tl.to(warp, { value: 1, duration: outDur, ease: "power2.in" }, 0);
    tl.to(rig, { fov: reducedMotion ? rig.fov : 100, duration: outDur, ease: "power2.in" }, 0);
    tl.to(
      rig.position,
      {
        x: `+=${dir.x * 30}`,
        y: `+=${dir.y * 30}`,
        z: `+=${dir.z * 30}`,
        duration: outDur,
        ease: "power2.in",
      },
      0,
    );
    tl.to(warp, { flash: 1, duration: 0.12 }, outDur - 0.1);
    tl.call(() => {
      arrive(request.world, request.shot);
      snapRigToShot(request.world, request.shot);
      const shot = meta.shots[request.shot];
      const back = new THREE.Vector3(...shot.position).sub(new THREE.Vector3(...shot.target)).normalize();
      rig.position.addScaledVector(back, 60);
      rig.fov = reducedMotion ? shot.fov ?? 45 : 95;
      tlIn = gsap.timeline({ onComplete: () => setWarping(false) });
      tlIn.to(rig.position, { x: shot.position[0], y: shot.position[1], z: shot.position[2], duration: inDur, ease: "expo.out" }, 0);
      tlIn.to(rig, { fov: shot.fov ?? 45, duration: inDur, ease: "expo.out" }, 0);
      tlIn.to(warp, { value: 0, duration: inDur * 0.8, ease: "power3.out" }, 0);
      tlIn.to(warp, { flash: 0, duration: 0.5, ease: "power2.out" }, 0);
    }, [], outDur + 0.05);

    return () => {
      tl.kill();
      tlIn?.kill();
      warp.value = 0;
      warp.flash = 0;
      useExperience.getState().setWarping(false);
    };
  }, [request, reducedMotion]);

  return null;
}

export function WarpStreaks({ count = 1400 }: { count?: number }) {
  const camera = useThree((s) => s.camera);
  const ref = useRef<THREE.LineSegments>(null);
  const geo = useMemo(() => {
    const rand = mulberry32(42);
    const pos = new Float32Array(count * 2 * 3);
    const end = new Float32Array(count * 2);
    const seed = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = 2.5 + Math.pow(rand(), 0.6) * 28;
      const z = -rand() * 220;
      const s = rand();
      for (let e = 0; e < 2; e++) {
        pos.set([Math.cos(a) * r, Math.sin(a) * r, z], (i * 2 + e) * 3);
        end[i * 2 + e] = e;
        seed[i * 2 + e] = s;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uWarp: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color("#cfefff") } },
        vertexShader: /* glsl */ `
          attribute float aEnd; attribute float aSeed;
          uniform float uWarp; uniform float uTime;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            p.z = mod(p.z + uTime * (180.0 + aSeed * 120.0), 220.0) - 220.0;
            p.z -= aEnd * (2.0 + uWarp * uWarp * 70.0) * (0.5 + aSeed);
            vAlpha = uWarp * (0.25 + 0.75 * aSeed) * (1.0 - aEnd * 0.9) * smoothstep(-220.0, -150.0, p.z);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; varying float vAlpha;
          void main() { gl_FragColor = vec4(uColor * 1.6, vAlpha); }`,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  );

  useFrame((_, dt) => {
    mat.uniforms.uWarp.value = warp.value;
    mat.uniforms.uTime.value += dt;
    const m = ref.current;
    if (!m) return;
    m.visible = warp.value > 0.001;
    m.position.copy(camera.position);
    m.quaternion.copy(camera.quaternion);
  });

  return <lineSegments ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={10} />;
}
