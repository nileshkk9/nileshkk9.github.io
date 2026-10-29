"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useExperience } from "@/store/experience";
import { rig } from "@/three/CameraRig";
import { mulberry32, softPointFrag } from "@/three/glsl";

const COUNTS = { high: 90000, mid: 45000, low: 18000 } as const;
const SPACING = 12;
const HALF = 11;

function buildGeometry(count: number) {
  const rand = mulberry32(2024);
  const stream = new Float32Array(count * 3);
  const road = new Float32Array(count * 3);
  const city = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const extent = HALF * SPACING;

  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2;
    const r = 1.2 + Math.pow(rand(), 0.7) * 16;
    stream.set([Math.cos(a) * r, Math.sin(a) * r, -rand() * 240 + 20], i * 3);

    const line = Math.floor(rand() * (HALF * 2 + 1)) - HALF;
    const along = (rand() * 2 - 1) * extent;
    const lane = (rand() - 0.5) * 0.8;
    const rx = rand() < 0.5;
    const rp: [number, number, number] = rx
      ? [along, 0, line * SPACING + lane]
      : [line * SPACING + lane, 0, along];
    road.set(rp, i * 3);

    if (rand() < 0.28) {
      city.set(rp, i * 3);
    } else {
      const cityHalf = 7;
      const cx = (Math.floor(rand() * cityHalf * 2) - cityHalf + 0.5) * SPACING;
      const cz = (Math.floor(rand() * cityHalf * 2) - cityHalf + 0.5) * SPACING;
      const centerFalloff = 1 - Math.min(1, Math.hypot(cx, cz) / (cityHalf * SPACING * 1.3));
      const hRand = mulberry32(Math.floor(cx * 31 + cz * 977))();
      const h = 3 + Math.pow(hRand, 2.2) * 46 * (0.25 + centerFalloff);
      const w = 3.2;
      const corner = Math.floor(rand() * 4);
      const sx = corner & 1 ? w : -w;
      const sz = corner & 2 ? w : -w;
      let p: [number, number, number];
      const kind = rand();
      if (kind < 0.45) {
        p = [cx + sx, rand() * h, cz + sz];
      } else if (kind < 0.75) {
        const t = rand() * 2 - 1;
        p = rand() < 0.5 ? [cx + t * w, h, cz + sz] : [cx + sx, h, cz + t * w];
      } else {
        const t = rand() * 2 - 1;
        const y = Math.floor(rand() * (h / 1.6)) * 1.6;
        p = rand() < 0.5 ? [cx + t * w, y, cz + sz] : [cx + sx, y, cz + t * w];
      }
      city.set(p, i * 3);
    }
    seed[i] = rand();
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(stream, 3));
  g.setAttribute("aRoad", new THREE.BufferAttribute(road, 3));
  g.setAttribute("aCity", new THREE.BufferAttribute(city, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  return g;
}

export function IntroSequence() {
  const quality = useExperience((s) => s.quality);
  const dpr = useThree((s) => s.viewport.dpr);
  const geo = useMemo(() => buildGeometry(COUNTS[quality]), [quality]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uFade: { value: 0 },
          uDpr: { value: dpr },
        },
        vertexShader: /* glsl */ `
          attribute vec3 aRoad; attribute vec3 aCity; attribute float aSeed;
          uniform float uTime; uniform float uMorph; uniform float uFade; uniform float uDpr;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vec3 s = position;
            s.z = mod(s.z + uTime * (26.0 + aSeed * 30.0), 240.0) - 220.0;
            float ang = s.z * 0.015 + uTime * 0.2;
            s.xy = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * s.xy;

            float m1 = smoothstep(0.0, 1.0, clamp(uMorph * 1.5 - aSeed * 0.5, 0.0, 1.0));
            float m2 = smoothstep(0.0, 1.0, clamp((uMorph - 1.0) * 1.5 - aSeed * 0.5, 0.0, 1.0));
            vec3 p = mix(s, aRoad, m1);
            p.y += sin(m1 * 3.14159) * (8.0 + aSeed * 20.0);
            p = mix(p, aCity, m2);
            p.y += sin(m2 * 3.14159) * aSeed * 6.0;

            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float size = mix(1.3, 2.2, aSeed);
            gl_PointSize = clamp(size * uDpr * (90.0 / -mv.z), 1.0, 6.0 * uDpr);

            vec3 cyan = vec3(0.36, 0.88, 1.0);
            vec3 white = vec3(0.9, 0.95, 1.0);
            vec3 amber = vec3(1.0, 0.71, 0.28);
            vec3 c = mix(cyan, white, step(0.82, aSeed));
            c = mix(c, mix(white, amber, step(0.93, aSeed)), m2 * step(0.5, aCity.y));
            vColor = c;
            float flow = 0.55 + 0.45 * sin(aSeed * 50.0 + uTime * 3.0);
            vAlpha = (0.35 + 0.65 * flow) * uFade * smoothstep(-220.0, -120.0, mix(s.z, -1.0, max(m1, m2)));
          }`,
        fragmentShader: softPointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [dpr],
  );

  useEffect(() => {
    const { setCaption, travel, reducedMotion } = useExperience.getState();
    const speed = reducedMotion ? 2.5 : 1;
    rig.position.set(0, 0, 14);
    rig.target.set(0, 0, -60);
    rig.fov = 70;
    rig.parallax = 0.4;
    mat.uniforms.uMorph.value = 0;

    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    tl.timeScale(speed);
    tl.to(mat.uniforms.uFade, { value: 1, duration: 1.2 }, 0);
    tl.call(() => setCaption("Data streams"), [], 0.3);
    tl.to(rig.position, { z: -10, duration: 3.2, ease: "none" }, 0);
    tl.call(() => setCaption("become roads"), [], 3.0);
    tl.to(mat.uniforms.uMorph, { value: 1, duration: 2.6 }, 2.9);
    tl.to(rig.position, { x: 0, y: 95, z: 110, duration: 3.0 }, 2.9);
    tl.to(rig.target, { x: 0, y: 0, z: 0, duration: 3.0 }, 2.9);
    tl.to(rig, { fov: 45, duration: 3.0 }, 2.9);
    tl.call(() => setCaption("roads become cities"), [], 5.6);
    tl.to(mat.uniforms.uMorph, { value: 2, duration: 2.6 }, 5.6);
    tl.to(rig.position, { x: 80, y: 55, z: 85, duration: 3.6 }, 5.6);
    tl.to(rig.target, { y: 8, duration: 3.6 }, 5.6);
    tl.call(() => setCaption("and a city becomes a world."), [], 8.4);
    tl.to(rig.position, { x: 40, y: 30, z: 40, duration: 2.2, ease: "power2.in" }, 8.6);
    tl.call(
      () => {
        setCaption(null);
        rig.parallax = 1;
        travel("origin", 0);
      },
      [],
      10.2,
    );

    const skip = () => {
      tl.kill();
      setCaption(null);
      rig.parallax = 1;
      travel("origin", 0);
    };
    window.addEventListener("intro:skip", skip);
    return () => {
      tl.kill();
      window.removeEventListener("intro:skip", skip);
      rig.parallax = 1;
      setCaption(null);
    };
  }, [mat]);

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
