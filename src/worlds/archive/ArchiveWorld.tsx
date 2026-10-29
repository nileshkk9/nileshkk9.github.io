"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useExperience } from "@/store/experience";
import { mulberry32, softPointFrag } from "@/three/glsl";
import { HoloLabel, useHoloMaterial, useHover } from "@/three/kit";
import { ARCHIVE_QUERIES, ARCHIVE_STACK, PIPELINE, QUERY_TIMING, archiveBus } from "./data";

const LAVENDER = "#B9A6FF";
const WARM = "#FFD9A0";
const RING_R = 15;
const CLUSTERS = 8;
const HITS = 12;
const ENTRY = new THREE.Vector3(0, 5, 36);
const DOC_COUNT = { high: 6500, mid: 4000, low: 2200 } as const;

const nodePos = (i: number) => {
  const a = (i / ARCHIVE_STACK.length) * Math.PI * 2 + Math.PI / 2;
  return new THREE.Vector3(Math.cos(a) * RING_R, 0.6, Math.sin(a) * RING_R);
};

function useDocs(count: number) {
  return useMemo(() => {
    const rand = mulberry32(2718);
    const centres: THREE.Vector3[] = [];
    for (let c = 0; c < CLUSTERS; c++) {
      const y = 1 - ((c + 0.5) / CLUSTERS) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = c * 2.399963;
      centres.push(new THREE.Vector3(Math.cos(th) * r, y * 0.55, Math.sin(th) * r).multiplyScalar(36 + rand() * 14));
    }
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const cluster = new Int16Array(count);
    const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
    for (let i = 0; i < count; i++) {
      const stray = rand() < 0.15;
      const c = Math.floor(rand() * CLUSTERS);
      cluster[i] = stray ? -1 : c;
      const p = stray
        ? new THREE.Vector3(rand() - 0.5, (rand() - 0.5) * 0.6, rand() - 0.5).multiplyScalar(130)
        : centres[c].clone().add(new THREE.Vector3(gauss(), gauss() * 0.6, gauss()).multiplyScalar(7));
      pos.set([p.x, p.y, p.z], i * 3);
      seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aHit", new THREE.BufferAttribute(new Float32Array(count), 1));
    return { geo: g, centres, cluster, pos };
  }, [count]);
}

export function ArchiveWorld() {
  const quality = useExperience((s) => s.quality);
  const count = DOC_COUNT[quality];
  const { geo, centres, cluster, pos } = useDocs(count);
  const askedAt = useExperience((s) => s.archiveAt);
  const queryId = useExperience((s) => s.archiveQuery);
  const anim = useRef({ travel: 0, beams: 0, converge: 0, flash: 0 });
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uHit: { value: 0 } }), []);
  archiveBus.docs = count;

  const docMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          attribute float aSeed; attribute float aHit;
          uniform float uTime; uniform float uHit;
          varying vec3 vColor; varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float tw = 0.6 + 0.4 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 30.0);
            float hit = aHit * uHit;
            gl_PointSize = (0.9 + aSeed * 1.4 + hit * 3.5) * (300.0 / -mv.z) * 0.32;
            vColor = mix(mix(vec3(0.62, 0.55, 1.0), vec3(0.9, 0.92, 1.0), aSeed * 0.5), vec3(1.0, 0.82, 0.55) * 2.2, hit);
            vAlpha = (0.25 + 0.5 * tw) * (1.0 - uHit * 0.45 * (1.0 - aHit));
          }`,
        fragmentShader: softPointFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  const pathCurve = useMemo(() => new THREE.CatmullRomCurve3([ENTRY, ...PIPELINE.map((id) => nodePos(ARCHIVE_STACK.findIndex((n) => n.id === id)))]), []);
  const pathGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(pathCurve.getPoints(160)), [pathCurve]);
  const beamGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(HITS * 2 * 3), 3));
    return g;
  }, []);
  const convergeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(HITS * 2 * 3), 3));
    return g;
  }, []);
  const lineMat = (color: string) => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const mats = useMemo(() => ({ path: lineMat(WARM), beams: lineMat(WARM), converge: lineMat(LAVENDER) }), []);
  const pathLine = useMemo(() => {
    const l = new THREE.Line(pathGeo, mats.path);
    l.frustumCulled = false;
    return l;
  }, [pathGeo, mats]);
  const packet = useRef<THREE.Mesh>(null);
  const core = useHoloMaterial(LAVENDER, { intensity: 1.1, opacity: 0.85 });
  const rings = useRef<THREE.Group>(null);

  useEffect(() => {
    if (askedAt < 0 || !queryId || performance.now() / 1000 - askedAt > 2) return;
    const q = ARCHIVE_QUERIES.find((x) => x.id === queryId);
    if (!q) return;
    const centre = centres[q.cluster];
    const members: number[] = [];
    for (let i = 0; i < cluster.length; i++) if (cluster[i] === q.cluster) members.push(i);
    const dist = (i: number) => Math.hypot(pos[i * 3] - centre.x, pos[i * 3 + 1] - centre.y, pos[i * 3 + 2] - centre.z);
    const hits = members.sort((a, b) => dist(a) - dist(b)).slice(0, HITS * 4).filter((_, k) => k % 4 === 0);
    const hitAttr = geo.getAttribute("aHit") as THREE.BufferAttribute;
    (hitAttr.array as Float32Array).fill(0);
    hits.forEach((i) => hitAttr.setX(i, 1));
    hitAttr.needsUpdate = true;

    const search = nodePos(ARCHIVE_STACK.findIndex((n) => n.id === "opensearch"));
    const b = beamGeo.getAttribute("position") as THREE.BufferAttribute;
    const c = convergeGeo.getAttribute("position") as THREE.BufferAttribute;
    hits.forEach((i, k) => {
      b.setXYZ(k * 2, search.x, search.y, search.z);
      b.setXYZ(k * 2 + 1, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      c.setXYZ(k * 2, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      c.setXYZ(k * 2 + 1, 0, 0, 0);
    });
    b.needsUpdate = true;
    c.needsUpdate = true;

    const a = anim.current;
    const T = QUERY_TIMING;
    const tl = gsap
      .timeline()
      .set(a, { travel: 0, beams: 0, converge: 0, flash: 0 })
      .set(uniforms.uHit, { value: 0 })
      .to(a, { travel: 1, duration: T.toSearch, ease: "power1.inOut" })
      .to(a, { beams: 1, duration: 0.5 }, ">")
      .to(uniforms.uHit, { value: 1, duration: 0.6 }, "<")
      .to(a, { converge: 1, duration: T.converge, ease: "power2.in" }, `>+${T.retrieve - 0.5}`)
      .to(a, { flash: 1, duration: 0.25 }, ">")
      .to(a, { flash: 0.15, beams: 0, duration: 1.6 }, ">")
      .to(a, { travel: 0, converge: 0, duration: 1.2 }, "<+0.4")
      .to(uniforms.uHit, { value: 0.35, duration: 2 }, "<");
    return () => void tl.kill();
  }, [askedAt, queryId, centres, cluster, pos, geo, beamGeo, convergeGeo, uniforms]);

  useFrame(({ clock }, dt) => {
    uniforms.uTime.value += dt;
    const a = anim.current;
    pathGeo.setDrawRange(0, Math.floor(161 * Math.min(1, a.travel)));
    mats.path.opacity = a.travel > 0 ? 0.9 * (1 - a.converge * 0.7) : 0;
    mats.beams.opacity = a.beams * 0.55;
    mats.converge.opacity = a.converge * (1 - a.flash * 0.5) * 0.6;
    if (packet.current) {
      const moving = a.travel > 0 && a.travel < 1;
      packet.current.visible = moving || (a.converge > 0 && a.converge < 1);
      if (moving) packet.current.position.copy(pathCurve.getPointAt(a.travel));
      else if (a.converge > 0) packet.current.position.copy(pathCurve.getPointAt(1)).lerp(new THREE.Vector3(), a.converge);
    }
    core.uniforms.uIntensity.value = 1 + a.flash * 2.4;
    if (rings.current) {
      rings.current.children.forEach((r, i) => {
        r.rotation.x += dt * (0.2 + i * 0.15) * (1 + a.flash * 6);
        r.rotation.y += dt * (0.13 + i * 0.1);
      });
      rings.current.scale.setScalar(1 + a.flash * 0.25 + Math.sin(clock.elapsedTime * 1.3) * 0.02);
    }
  });

  return (
    <group>
      <fog attach="fog" args={["#05030c", 90, 260]} />
      <ambientLight intensity={0.3} />
      <points geometry={geo} material={docMat} frustumCulled={false} />
      <primitive object={pathLine} />
      <lineSegments geometry={beamGeo} material={mats.beams} frustumCulled={false} />
      <lineSegments geometry={convergeGeo} material={mats.converge} frustumCulled={false} />
      <mesh ref={packet} visible={false}>
        <sphereGeometry args={[0.38, 16, 12]} />
        <meshBasicMaterial color={WARM} toneMapped={false} />
      </mesh>

      <mesh material={core}>
        <icosahedronGeometry args={[2.4, 2]} />
      </mesh>
      <group ref={rings}>
        {[3.4, 4.2, 5.1].map((r) => (
          <mesh key={r}>
            <torusGeometry args={[r, 0.03, 8, 128]} />
            <meshBasicMaterial color={LAVENDER} toneMapped={false} transparent opacity={0.6} />
          </mesh>
        ))}
      </group>
      <HoloLabel position={[0, 5.6, 0]} subtitle="LLM · answers with sources" title="Answer core" accent={LAVENDER} />
      <HoloLabel position={[ENTRY.x, ENTRY.y + 1.5, ENTRY.z]} subtitle="Field technician" title="A question comes in" accent={WARM} maxDistance={70} />

      <StackRing />
    </group>
  );
}

function StackRing() {
  const ring = useMemo(() => {
    const pts = Array.from({ length: 129 }, (_, i) => {
      const a = (i / 128) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * RING_R, 0.6, Math.sin(a) * RING_R);
    });
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: LAVENDER, transparent: true, opacity: 0.25 }));
  }, []);
  return (
    <group>
      <primitive object={ring} />
      {ARCHIVE_STACK.map((n, i) => (
        <StackNode key={n.id} index={i} />
      ))}
    </group>
  );
}

function StackNode({ index }: { index: number }) {
  const n = ARCHIVE_STACK[index];
  const p = useMemo(() => nodePos(index), [index]);
  const mat = useHoloMaterial(LAVENDER, { intensity: 1, opacity: 0.85 });
  const [hovered, bind] = useHover();
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.8;
    ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, hovered ? 1.35 : 1, 8, dt));
  });
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const s = useExperience.getState();
    s.completeObjective("archive", "stack");
    s.setCaption(`${n.name} — ${n.detail}`);
    setTimeout(() => {
      if (useExperience.getState().caption?.startsWith(n.name)) useExperience.getState().setCaption(null);
    }, 4200);
  };
  return (
    <group position={p}>
      <mesh ref={ref} material={mat} onClick={onClick} {...bind}>
        <octahedronGeometry args={[0.9, 0]} />
      </mesh>
      <HoloLabel position={[0, 1.8, 0]} subtitle={n.role} title={n.name} accent={LAVENDER} maxDistance={70} />
    </group>
  );
}
