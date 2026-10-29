"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Noise, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode, type ChromaticAberrationEffect } from "postprocessing";
import * as THREE from "three";
import { useExperience } from "@/store/experience";
import { warp } from "./Warp";

const caBase = new THREE.Vector2(0.0004, 0.0004);

function WarpAberration() {
  const ref = useRef<ChromaticAberrationEffect>(null);
  useFrame(() => {
    const e = ref.current;
    if (!e) return;
    const k = 0.0004 + warp.value * 0.006;
    e.offset.set(k, k * 0.6);
  });
  return <ChromaticAberration ref={ref} offset={caBase} radialModulation modulationOffset={0.25} />;
}

export function Effects() {
  const quality = useExperience((s) => s.quality);
  if (quality === "low") {
    return (
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.25} luminanceSmoothing={0.2} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.2} luminanceSmoothing={0.25} radius={0.75} />
      <WarpAberration />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />
      <Vignette eskil={false} offset={0.22} darkness={0.78} />
    </EffectComposer>
  );
}
