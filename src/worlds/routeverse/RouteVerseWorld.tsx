"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import { chapters } from "@/content/archive";
import { useExperience, useObjective } from "@/store/experience";
import { hashGLSL, mulberry32 } from "@/three/glsl";
import { HoloLabel, useHover } from "@/three/kit";
import { PLANET_R, astar, buildGraph, type Graph } from "./graph";

const BLUE = "#8AB4FF";
const AMBER = "#FFB547";
const ALERT = "#FF5C48";
const SEG = 10;
const MONOLITH = new THREE.Vector3(-64, 24, -34);
const TOWERS_AT = new THREE.Vector3(72, -14, 18);
const SPEND = [18, 21, 20, 24, 23, 26, 28];

function slerpOnSphere(a: THREE.Vector3, b: THREE.Vector3, t: number, r: number) {
  const an = a.clone().normalize();
  const bn = b.clone().normalize();
  const ang = an.angleTo(bn);
  if (ang < 1e-5) return an.multiplyScalar(r);
  const s = Math.sin(ang);
  return an
    .multiplyScalar(Math.sin((1 - t) * ang) / s)
    .add(bn.multiplyScalar(Math.sin(t * ang) / s))
    .multiplyScalar(r);
}

function useRoadUniforms() {
  return useMemo(
    () => ({
      uTime: { value: 0 },
      uEngine: { value: 0 },
      uSearch: { value: 0 },
      uPathT: { value: 0 },
      uSearchFade: { value: 1 },
    }),
    [],
  );
}
type RoadUniforms = ReturnType<typeof useRoadUniforms>;

function useRoadGeometry(g: Graph) {
  return useMemo(() => {
    const verts = g.edges.length * SEG * 2;
    const pos = new Float32Array(verts * 3);
    const edge = new Float32Array(verts);
    const t = new Float32Array(verts);
    let k = 0;
    g.edges.forEach(([a, b], e) => {
      const pa = g.nodes[a];
      const pb = g.nodes[b];
      for (let s = 0; s < SEG; s++) {
        for (const tt of [s / SEG, (s + 1) / SEG]) {
          const lift = 1.006 + Math.sin(tt * Math.PI) * 0.012;
          const p = slerpOnSphere(pa, pb, tt, PLANET_R * lift);
          pos.set([p.x, p.y, p.z], k * 3);
          edge[k] = e;
          t[k] = tt;
          k++;
        }
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aEdge", new THREE.BufferAttribute(edge, 1));
    geo.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    geo.setAttribute("aVisit", new THREE.BufferAttribute(new Float32Array(verts).fill(-1), 1));
    geo.setAttribute("aPathPos", new THREE.BufferAttribute(new Float32Array(verts).fill(-1), 1));
    return geo;
  }, [g]);
}

function Roads({ geo, u }: { geo: THREE.BufferGeometry; u: RoadUniforms }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          attribute float aEdge; attribute float aT; attribute float aVisit; attribute float aPathPos;
          uniform float uTime; uniform float uEngine; uniform float uSearch; uniform float uPathT; uniform float uSearchFade;
          varying vec3 vColor; varying float vAlpha;
          ${hashGLSL}
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            float h = hash11(aEdge * 0.731);
            float pulse = smoothstep(0.9, 1.0, fract(aT * (h > 0.5 ? 1.0 : -1.0) - uTime * (0.25 + h * 0.4) + h * 5.0));
            vec3 dead = vec3(0.3, 0.32, 0.38);
            vec3 alive = vec3(0.54, 0.71, 1.0) * (0.3 + pulse * 1.4);
            vec3 col = mix(dead * 0.35, alive, uEngine);
            float a = mix(0.2, 0.4, uEngine);
            float focus = clamp(uPathT, 0.0, 1.0) * (1.0 - step(0.0, aPathPos));
            col *= 1.0 - focus * 0.55;

            if (aVisit >= 0.0) {
              float v = aVisit / 1000.0;
              float on = step(v, uSearch);
              float front = smoothstep(0.08, 0.0, abs(uSearch - v)) * step(uSearch, 1.02);
              col += on * vec3(0.7, 0.82, 1.0) * 0.8 * (1.0 - uSearchFade);
              col += front * vec3(1.0) * 1.8;
              a = max(a, on * (1.0 - uSearchFade) * 0.9 + front);
            }
            if (aPathPos >= 0.0) {
              float shown = step(aPathPos, uPathT);
              float head = smoothstep(0.06, 0.0, abs(uPathT - aPathPos));
              float flow = 0.6 + 0.4 * sin(aPathPos * 80.0 - uTime * 10.0);
              col = mix(col, vec3(1.0, 0.71, 0.28) * (2.2 * flow + head * 3.0), shown);
              a = mix(a, 1.0, shown);
            }
            vColor = col;
            vAlpha = a;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying float vAlpha;
          void main() { gl_FragColor = vec4(vColor, vAlpha); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [u],
  );
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />;
}

function RouteTube({ geo, u }: { geo: THREE.TubeGeometry | null; u: RoadUniforms }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          varying float vS;
          void main() {
            vS = uv.x;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uPathT; uniform float uTime;
          varying float vS;
          void main() {
            float shown = step(vS, uPathT);
            float head = smoothstep(0.05, 0.0, abs(uPathT - vS)) * step(uPathT, 1.0);
            float flow = smoothstep(0.75, 1.0, fract(vS * 9.0 - uTime * 1.6));
            vec3 col = vec3(1.0, 0.71, 0.28) * (0.9 + flow * 1.6) + vec3(1.0) * head * 2.0;
            gl_FragColor = vec4(col, shown * (0.55 + flow * 0.45));
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [u],
  );
  useEffect(() => () => geo?.dispose(), [geo]);
  if (!geo) return null;
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

function buildRouteTube(g: Graph, start: number, pathEdges: number[]) {
  if (!pathEdges.length) return null;
  const pts: THREE.Vector3[] = [];
  let cur = start;
  pathEdges.forEach((e, i) => {
    const [x, y] = g.edges[e];
    const next = x === cur ? y : x;
    for (let s = i === 0 ? 0 : 1; s <= 6; s++) {
      const tt = s / 6;
      pts.push(slerpOnSphere(g.nodes[cur], g.nodes[next], tt, PLANET_R * (1.012 + Math.sin(tt * Math.PI) * 0.012)));
    }
    cur = next;
  });
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, Math.max(24, pts.length * 3), 0.16, 6, false);
}

function Planet({ u }: { u: RoadUniforms }) {
  const surface = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vP; varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal); vP = position; vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uEngine; uniform float uTime;
          varying vec3 vN; varying vec3 vP; varying vec3 vV;
          void main() {
            vec3 d = normalize(vP);
            float lat = asin(d.y); float lon = atan(d.z, d.x);
            float gl = max(1.0 - smoothstep(0.0, 0.015, abs(fract(lat * 6.0 / 3.14159) - 0.5) * 2.0 - 0.97),
                           1.0 - smoothstep(0.0, 0.015, abs(fract(lon * 12.0 / 6.28318) - 0.5) * 2.0 - 0.97));
            float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
            vec3 base = vec3(0.012, 0.016, 0.03);
            vec3 tint = mix(vec3(0.25, 0.25, 0.3), vec3(0.54, 0.71, 1.0), uEngine);
            vec3 col = base + tint * f * 0.35 + tint * gl * 0.04;
            float core = pow(max(dot(normalize(vN), normalize(vV)), 0.0), 6.0) * uEngine;
            col += vec3(0.54, 0.71, 1.0) * core * 0.05 * (0.8 + 0.2 * sin(uTime * 2.0));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [u],
  );
  const halo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uEngine;
          varying vec3 vN; varying vec3 vV;
          void main() {
            float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 4.0);
            vec3 tint = mix(vec3(0.3, 0.3, 0.36), vec3(0.54, 0.71, 1.0), uEngine);
            gl_FragColor = vec4(tint * f * (0.35 + uEngine * 0.4), f);
          }`,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [u],
  );
  return (
    <group>
      <mesh material={surface}>
        <sphereGeometry args={[PLANET_R * 0.995, 96, 64]} />
      </mesh>
      <mesh material={halo} scale={1.12}>
        <sphereGeometry args={[PLANET_R, 64, 48]} />
      </mesh>
    </group>
  );
}

function Cities({ g, onPick }: { g: Graph; onPick: (i: number) => void }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const routeStart = useExperience((s) => s.routeStart);
  const stats = useExperience((s) => s.routeStats);
  const [, bind] = useHover();

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    g.nodes.forEach((p, i) => {
      o.position.copy(p).multiplyScalar(1.008);
      o.scale.setScalar(1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [g]);

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const base = new THREE.Color(BLUE).multiplyScalar(0.45);
    const hot = new THREE.Color(AMBER).multiplyScalar(2.6);
    g.nodes.forEach((_, i) => m.setColorAt(i, base));
    if (routeStart !== null) m.setColorAt(routeStart, hot);
    const ep = routeEndpoints.current;
    if (ep && stats) ep.forEach((i) => m.setColorAt(i, hot));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [g, routeStart, stats]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, g.nodes.length]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) onPick(e.instanceId);
      }}
      {...bind}
    >
      <sphereGeometry args={[0.32, 10, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

const routeEndpoints = { current: null as [number, number] | null };

function Chains({ broken, onBreak }: { broken: boolean; onBreak: () => void }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const [hovered, bind] = useHover();
  const brokeAt = useRef<number | null>(broken ? -100 : null);
  const links = useMemo(() => {
    const rand = mulberry32(12);
    const out: { pos: THREE.Vector3; quat: THREE.Quaternion; vel: THREE.Vector3; spin: THREE.Vector3 }[] = [];
    const dirs = [new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, -0.25, 0.3), new THREE.Vector3(0.1, -0.1, -0.35)];
    dirs.forEach((off, c) => {
      const anchor = MONOLITH.clone().normalize().add(off).normalize().multiplyScalar(PLANET_R * 1.01);
      const start = MONOLITH.clone().add(new THREE.Vector3(6, (c - 1) * 5, 0));
      const dir = new THREE.Vector3().subVectors(anchor, start);
      const len = dir.length();
      dir.normalize();
      const n = Math.floor(len / 2.1);
      const base = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      for (let i = 0; i < n; i++) {
        const sag = Math.sin((i / n) * Math.PI) * 2.5;
        const pos = start.clone().addScaledVector(dir, i * 2.1).add(new THREE.Vector3(0, -sag, 0));
        const twist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (i % 2) * (Math.PI / 2));
        out.push({
          pos,
          quat: base.clone().multiply(twist),
          vel: new THREE.Vector3(rand() - 0.5, rand() - 0.3, rand() - 0.5).multiplyScalar(14),
          spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(6),
        });
      }
    });
    return out;
  }, []);

  const o = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (broken && brokeAt.current === null) brokeAt.current = performance.now() / 1000;
  }, [broken]);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const now = performance.now() / 1000;
    const t = brokeAt.current === null ? 0 : now - brokeAt.current;
    if (t > 4) {
      m.visible = false;
      return;
    }
    links.forEach((l, i) => {
      o.position.copy(l.pos).addScaledVector(l.vel, t);
      o.quaternion.copy(l.quat);
      if (t > 0) o.rotateOnAxis(l.spin.clone().normalize(), l.spin.length() * t);
      const tension = brokeAt.current === null ? 1 + Math.sin(clock.elapsedTime * 3 + i * 0.4) * 0.03 : 1;
      o.scale.set(1.5 * tension, 1, 1).multiplyScalar(Math.max(0, 1 - t / 3));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, links.length]}
      frustumCulled={false}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onBreak();
      }}
      {...bind}
    >
      <torusGeometry args={[1, 0.26, 8, 20]} />
      <meshStandardMaterial
        color="#3a2c22"
        metalness={0.9}
        roughness={0.35}
        emissive={hovered ? AMBER : ALERT}
        emissiveIntensity={hovered ? 0.6 : 0.18}
      />
    </instancedMesh>
  );
}

function Monolith({ broken, onBreak }: { broken: boolean; onBreak: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const [, bind] = useHover();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = broken ? 0.55 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 1.5, dt));
    if (broken) g.position.lerp(new THREE.Vector3(MONOLITH.x * 1.25, MONOLITH.y + 10, MONOLITH.z * 1.25), 1 - Math.exp(-dt * 0.4));
  });
  return (
    <group ref={ref} position={MONOLITH}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onBreak();
        }}
        {...bind}
      >
        <boxGeometry args={[7, 26, 2.4]} />
        <meshStandardMaterial color="#07070a" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position-z={1.25}>
        <planeGeometry args={[0.15, 24]} />
        <meshBasicMaterial color={broken ? "#555" : ALERT} toneMapped={false} />
      </mesh>
      <HoloLabel
        position={[0, 17, 0]}
        subtitle={broken ? "Disconnected" : "External dependency · click to sever"}
        title="Third-party Maps API"
        accent={broken ? "#8892a0" : ALERT}
      />
    </group>
  );
}

function CostTowers({ broken }: { broken: boolean }) {
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const metric = chapters.routeverse.metrics[0];
  useEffect(() => {
    const ctx = gsap.context(() => {
      bars.current.forEach((b, i) => {
        if (!b) return;
        const h = SPEND[i] * (broken ? 0.32 : 1);
        gsap.to(b.scale, { y: h, duration: broken ? 2.2 : 0, delay: broken ? 1.2 + i * 0.15 : 0, ease: "power3.inOut" });
        gsap.to(b.position, { y: h / 2, duration: broken ? 2.2 : 0, delay: broken ? 1.2 + i * 0.15 : 0, ease: "power3.inOut" });
        const m = mats.current[i];
        if (m) {
          const c = new THREE.Color(broken ? BLUE : AMBER);
          gsap.to(m.emissive, { r: c.r, g: c.g, b: c.b, duration: broken ? 1.5 : 0, delay: broken ? 1.2 + i * 0.15 : 0 });
        }
      });
    });
    return () => ctx.revert();
  }, [broken]);
  return (
    <group position={TOWERS_AT}>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[17, 64]} />
        <meshStandardMaterial color="#07080e" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[16.6, 17, 96]} />
        <meshBasicMaterial color={broken ? BLUE : AMBER} toneMapped={false} />
      </mesh>
      {SPEND.map((h, i) => (
        <mesh key={i} ref={(m) => void (bars.current[i] = m)} position={[(i - 3) * 3.6, h / 2, 0]} scale={[1, h, 1]}>
          <boxGeometry args={[2.4, 1, 2.4]} />
          <meshStandardMaterial
            ref={(m) => void (mats.current[i] = m)}
            color="#06070c"
            emissive={AMBER}
            emissiveIntensity={0.16}
            metalness={0.5}
            roughness={0.4}
          />
          <Edges color={broken ? BLUE : AMBER} />
        </mesh>
      ))}
      <HoloLabel
        position={[0, 34, 0]}
        subtitle={broken ? "In-house engine" : "Monthly map API spend"}
        title={broken ? `${metric.value} ${metric.label}` : "Third-party routing costs"}
        accent={broken ? BLUE : AMBER}
      />
    </group>
  );
}

export function RouteVerseWorld() {
  const g = useMemo(() => buildGraph(), []);
  const geo = useRoadGeometry(g);
  const u = useRoadUniforms();
  const broken = useObjective("routeverse", "chains");
  const shot = useExperience((s) => s.shot);
  const lastManual = useRef(-100);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [tube, setTube] = useState<THREE.TubeGeometry | null>(null);

  useMemo(() => {
    u.uEngine.value = useExperience.getState().objectives.includes("routeverse:chains") ? 1 : 0;
  }, [u]);

  useEffect(() => {
    if (!broken || u.uEngine.value >= 1) return;
    const tw = gsap.to(u.uEngine, { value: 1, duration: 3, delay: 0.8, ease: "power2.inOut" });
    useExperience.getState().setCaption("Dependency severed. In-house routing engine online.");
    const t = setTimeout(() => useExperience.getState().setCaption(null), 3600);
    return () => {
      tw.kill();
      clearTimeout(t);
    };
  }, [broken, u]);

  useEffect(() => {
    if (broken && shot === 3) {
      const t = setTimeout(() => useExperience.getState().completeObjective("routeverse", "costs"), 2500);
      return () => clearTimeout(t);
    }
  }, [broken, shot]);

  const runRoute = (a: number, b: number, manual: boolean) => {
    const res = astar(g, a, b);
    const visit = geo.getAttribute("aVisit") as THREE.BufferAttribute;
    const path = geo.getAttribute("aPathPos") as THREE.BufferAttribute;
    const per = SEG * 2;
    const order = new Map<number, number>();
    res.pathEdges.forEach((e, i) => order.set(e, i));
    const flip = new Map<number, boolean>();
    let cur = a;
    res.pathEdges.forEach((e) => {
      const [x, y] = g.edges[e];
      flip.set(e, x !== cur);
      cur = x === cur ? y : x;
    });
    const nPath = Math.max(1, res.pathEdges.length);
    for (let e = 0; e < g.edges.length; e++) {
      const v = res.edgeVisit[e];
      const pi = order.get(e);
      for (let k = 0; k < per; k++) {
        const idx = e * per + k;
        visit.setX(idx, v);
        if (pi === undefined) path.setX(idx, -1);
        else {
          const tt = (geo.getAttribute("aT") as THREE.BufferAttribute).getX(idx);
          path.setX(idx, (pi + (flip.get(e) ? 1 - tt : tt)) / nPath);
        }
      }
    }
    visit.needsUpdate = true;
    path.needsUpdate = true;
    routeEndpoints.current = [a, b];
    setTube(buildRouteTube(g, a, res.pathEdges));
    useExperience.getState().setRouteStats({ explored: res.explored, hops: res.pathEdges.length, ms: res.ms, km: res.km, manual });

    tl.current?.kill();
    u.uSearch.value = 0;
    u.uPathT.value = 0;
    u.uSearchFade.value = 0;
    tl.current = gsap
      .timeline()
      .to(u.uSearch, { value: 1.05, duration: 1.4, ease: "power1.inOut" })
      .to(u.uPathT, { value: 1.02, duration: 1.1, ease: "power2.out" }, "-=0.1")
      .to(u.uSearchFade, { value: 1, duration: 1.4 }, "-=0.6");
  };

  const onPick = (i: number) => {
    const s = useExperience.getState();
    if (!isBroken()) {
      s.setCaption("Routing is locked to a third-party API. Break the chains first.");
      setTimeout(() => useExperience.getState().setCaption(null), 2800);
      return;
    }
    lastManual.current = performance.now() / 1000;
    if (s.routeStart === null || s.routeStart === i) {
      s.setRouteStart(i);
      return;
    }
    runRoute(s.routeStart, i, true);
    s.setRouteStart(null);
    s.completeObjective("routeverse", "route");
  };

  const isBroken = () => useExperience.getState().objectives.includes("routeverse:chains");

  const onBreak = () => {
    if (!isBroken()) useExperience.getState().completeObjective("routeverse", "chains");
  };

  useEffect(() => {
    if (!broken) return;
    const rand = mulberry32(5);
    const demo = () => {
      if (performance.now() / 1000 - lastManual.current < 12) return;
      if (useExperience.getState().routeStart !== null) return;
      let a = 0;
      let b = 0;
      do {
        a = Math.floor(rand() * g.nodes.length);
        b = Math.floor(rand() * g.nodes.length);
      } while (g.nodes[a].angleTo(g.nodes[b]) < 1.4);
      runRoute(a, b, false);
    };
    const first = setTimeout(demo, 3500);
    const id = setInterval(demo, 7000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broken, g]);

  useEffect(
    () => () => {
      tl.current?.kill();
      useExperience.getState().setRouteStart(null);
      useExperience.getState().setRouteStats(null);
      routeEndpoints.current = null;
    },
    [],
  );

  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    u.uTime.value += dt;
    if (spin.current && broken) spin.current.rotation.y += dt * 0.02;
  });

  return (
    <group>
      <fog attach="fog" args={["#03040c", 140, 380]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[60, 60, 80]} intensity={1} color="#d8e4ff" />
      <pointLight position={[MONOLITH.x + 10, MONOLITH.y, MONOLITH.z + 10]} intensity={300} distance={60} color={ALERT} />
      <group ref={spin}>
        <Planet u={u} />
        <Roads geo={geo} u={u} />
        <RouteTube geo={tube} u={u} />
        <Cities g={g} onPick={onPick} />
      </group>
      <Chains broken={broken} onBreak={onBreak} />
      <Monolith broken={broken} onBreak={onBreak} />
      <CostTowers broken={broken} />
    </group>
  );
}
