"use client";

import { Suspense, lazy, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useExperience, type Quality } from "@/store/experience";
import { CameraRig, rig } from "@/three/CameraRig";
import { Nebula, Starfield } from "@/three/Backdrop";
import { WarpDirector, WarpStreaks } from "@/three/Warp";
import { Effects } from "@/three/Effects";
import { useHoloMaterial } from "@/three/kit";
import { IntroSequence } from "@/worlds/boot/IntroSequence";
import { nextReadyWorld, type WorldId } from "@/worlds/registry";
import { Hud } from "./hud/Hud";

const loaders = {
  origin: () => import("@/worlds/origin/OriginWorld").then((m) => ({ default: m.OriginWorld })),
  legacy: () => import("@/worlds/legacy/LegacyWorld").then((m) => ({ default: m.LegacyWorld })),
  logistics: () => import("@/worlds/logistics/LogisticsWorld").then((m) => ({ default: m.LogisticsWorld })),
  nexus: () => import("@/worlds/nexus/NexusWorld").then((m) => ({ default: m.NexusWorld })),
  routeverse: () => import("@/worlds/routeverse/RouteVerseWorld").then((m) => ({ default: m.RouteVerseWorld })),
  forge: () => import("@/worlds/forge/ForgeWorld").then((m) => ({ default: m.ForgeWorld })),
  archive: () => import("@/worlds/archive/ArchiveWorld").then((m) => ({ default: m.ArchiveWorld })),
  future: () => import("@/worlds/future/FutureWorld").then((m) => ({ default: m.FutureWorld })),
} satisfies Record<WorldId, () => Promise<{ default: React.ComponentType }>>;

const WORLD_COMPONENTS = Object.fromEntries(Object.entries(loaders).map(([id, load]) => [id, lazy(load)])) as Record<WorldId, React.LazyExoticComponent<React.ComponentType>>;

/** Fetch a world's code ahead of time so the warp never waits on the network. */
export function preloadWorld(id: WorldId) {
  void loaders[id]();
}

function usePreloadNext() {
  const phase = useExperience((s) => s.phase);
  const world = useExperience((s) => s.activeWorld);
  useEffect(() => {
    if (phase === "boot") return;
    const next = phase === "intro" ? "origin" : nextReadyWorld(world);
    if (!next) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1200));
    idle(() => preloadWorld(next));
  }, [phase, world]);
}

function SceneDirector() {
  const phase = useExperience((s) => s.phase);
  const world = useExperience((s) => s.activeWorld);
  if (phase === "boot") return null;
  if (phase === "intro") return <IntroSequence />;
  const World = WORLD_COMPONENTS[world];
  return (
    <Suspense fallback={null}>
      <World key={world} />
    </Suspense>
  );
}

/** The Architect's companion: a small hologram that drifts beside the camera and pulses when it speaks. */
function ArchitectOrb() {
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const mat = useHoloMaterial("#E8F1FF", { intensity: 1.2, opacity: 0.8 });
  const phase = useExperience((s) => s.phase);
  const tmp = useMemo(() => ({ fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(), p: new THREE.Vector3() }), []);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const { panel, aiIntent } = useExperience.getState();
    const speaking = panel === "ai" && !!aiIntent;
    camera.getWorldDirection(tmp.fwd);
    tmp.right.crossVectors(tmp.fwd, camera.up).normalize();
    tmp.up.crossVectors(tmp.right, tmp.fwd).normalize();
    const t = clock.elapsedTime;
    tmp.p
      .copy(camera.position)
      .addScaledVector(tmp.fwd, 9)
      .addScaledVector(tmp.right, speaking ? 2.2 : 3.6)
      .addScaledVector(tmp.up, -1.6 + Math.sin(t * 1.3) * 0.12);
    g.position.lerp(tmp.p, 1 - Math.exp(-dt * 6));
    g.rotation.y += dt * 0.8;
    g.children[1].rotation.x += dt * 1.1;
    const s = 0.2 * (1 + (speaking ? Math.sin(t * 9) * 0.08 + 0.15 : 0));
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, s, 6, dt));
    mat.uniforms.uIntensity.value = speaking ? 2 : 1.1;
  });

  if (phase !== "world") return null;
  return (
    <group ref={group} renderOrder={5}>
      <mesh material={mat}>
        <icosahedronGeometry args={[1, 3]} />
      </mesh>
      <mesh>
        <torusGeometry args={[1.7, 0.03, 8, 96]} />
        <meshBasicMaterial color="#5CE1FF" toneMapped={false} transparent opacity={0.8} depthTest={false} />
      </mesh>
    </group>
  );
}

function useInitialQuality() {
  const setQuality = useExperience((s) => s.setQuality);
  const setReducedMotion = useExperience((s) => s.setReducedMotion);
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = window.innerWidth < 820;
    const cores = navigator.hardwareConcurrency ?? 8;
    const q: Quality = coarse || small ? "low" : cores <= 4 ? "mid" : "high";
    setQuality(q);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setQuality, setReducedMotion]);
}

const DOWNGRADE: Record<Quality, Quality> = { high: "mid", mid: "low", low: "low" };

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __xp: typeof useExperience }).__xp = useExperience;
  (window as unknown as { __rig: typeof rig }).__rig = rig;
}

export default function Experience() {
  useInitialQuality();
  usePreloadNext();
  const quality = useExperience((s) => s.quality);
  const covered = useExperience((s) => s.panel === "log" || s.panel === "starmap" || s.panel === "transmit" || s.panel === "help");

  return (
    <>
      <div className="fixed inset-0">
        <Canvas
          flat
          frameloop={covered ? "never" : "always"}
          dpr={quality === "low" ? [1, 1.5] : [1, 2]}
          camera={{ position: [0, 0, 14], fov: 45, near: 0.1, far: 3000 }}
          gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor("#04050a");
            scene.background = new THREE.Color("#04050a");
          }}
        >
          <PerformanceMonitor
            flipflops={2}
            onDecline={() => {
              const s = useExperience.getState();
              s.setQuality(DOWNGRADE[s.quality]);
            }}
          />
          <AdaptiveDpr pixelated={false} />
          <Starfield count={quality === "low" ? 3000 : 7000} />
          <Nebula />
          <SceneDirector />
          <ArchitectOrb />
          <WarpStreaks count={quality === "low" ? 700 : 1600} />
          <CameraRig />
          <WarpDirector />
          <Effects />
        </Canvas>
      </div>
      <Hud />
    </>
  );
}
