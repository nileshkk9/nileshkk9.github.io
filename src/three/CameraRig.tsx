"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useExperience } from "@/store/experience";
import { worldById } from "@/worlds/registry";

/** Shared camera state. The rig owns it during worlds; intro and warp sequences drive it directly. */
export const rig = {
  position: new THREE.Vector3(0, 0, 10),
  target: new THREE.Vector3(0, 0, 0),
  fov: 45,
  roll: 0,
  parallax: 1,
};

export function snapRigToShot(worldId: Parameters<typeof worldById>[0], shot: number) {
  const s = worldById(worldId).shots[shot];
  if (!s) return;
  rig.position.set(...s.position);
  rig.target.set(...s.target);
  rig.fov = s.fov ?? 45;
}

const REF_ASPECT = 1.1;
const MAX_FOV = 78;
const DEG = Math.PI / 180;

/** Shots are framed for landscape; in portrait keep the horizontal field of view instead of the vertical one. */
function fitFov(fov: number, aspect: number) {
  if (aspect >= REF_ASPECT) return fov;
  const v = 2 * Math.atan((Math.tan((fov * DEG) / 2) * REF_ASPECT) / aspect);
  return Math.min(v / DEG, Math.max(fov, MAX_FOV));
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const pointer = useRef(new THREE.Vector2());
  const smooth = useRef(new THREE.Vector2());
  const lookAt = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());

  const phase = useExperience((s) => s.phase);
  const activeWorld = useExperience((s) => s.activeWorld);
  const shot = useExperience((s) => s.shot);
  const warping = useExperience((s) => s.warping);
  const reducedMotion = useExperience((s) => s.reducedMotion);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    if (phase !== "world" || warping) return;
    const s = worldById(activeWorld).shots[shot];
    if (!s) return;
    const d = reducedMotion ? 0.6 : 2.4;
    const tl = gsap.timeline({ defaults: { duration: d, ease: "power3.inOut" } });
    tl.to(rig.position, { x: s.position[0], y: s.position[1], z: s.position[2] }, 0);
    tl.to(rig.target, { x: s.target[0], y: s.target[1], z: s.target[2] }, 0);
    tl.to(rig, { fov: s.fov ?? 45 }, 0);
    return () => {
      tl.kill();
    };
  }, [phase, activeWorld, shot, warping, reducedMotion]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-dt * 3);
    smooth.current.lerp(pointer.current, k);
    const t = state.clock.elapsedTime;
    const amp = reducedMotion ? 0 : rig.parallax;
    const dist = rig.position.distanceTo(rig.target);
    const p = dist * 0.035 * amp;

    const forward = lookAt.current.copy(rig.target).sub(rig.position).normalize();
    const right = offset.current.crossVectors(forward, camera.up).normalize();
    camera.position
      .copy(rig.position)
      .addScaledVector(right, smooth.current.x * p + Math.sin(t * 0.21) * p * 0.15)
      .addScaledVector(camera.up, -smooth.current.y * p * 0.6 + Math.sin(t * 0.17) * p * 0.1);
    camera.lookAt(rig.target);
    if (rig.roll) camera.rotateZ(rig.roll);
    const fov = fitFov(rig.fov, state.size.width / state.size.height);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
