"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { glyphAtlas, glyphFrag } from "./glyphAtlas";
import { mulberry32 } from "./glsl";
import { cn } from "@/lib/utils";
import { audio } from "@/audio/engine";

export function useHover() {
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    if (hovered) audio.hover();
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);
  const bind = useMemo(
    () => ({
      onPointerOver: (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        setHovered(true);
      },
      onPointerOut: () => setHovered(false),
    }),
    [],
  );
  return [hovered, bind] as const;
}

export function HoloLabel({
  position,
  title,
  subtitle,
  visible = true,
  accent = "#5CE1FF",
  className,
  maxDistance = Infinity,
}: {
  position: [number, number, number];
  title: string;
  subtitle?: string;
  visible?: boolean;
  accent?: string;
  className?: string;
  /** Hide the label when the camera is farther than this, so distant labels don't pile up. */
  maxDistance?: number;
}) {
  const anchor = useRef<THREE.Group>(null);
  const box = useRef<HTMLDivElement>(null);
  useFrame(({ camera }) => {
    if (!anchor.current || !box.current) return;
    anchor.current.getWorldPosition(_labelP);
    const near = _labelP.distanceTo(camera.position) < maxDistance;
    _labelP.project(camera);
    const onScreen = near && _labelP.z < 1 && Math.abs(_labelP.x) < 0.9 && Math.abs(_labelP.y) < 0.88;
    box.current.style.visibility = onScreen ? "visible" : "hidden";
  });
  return (
    <group ref={anchor} position={position}>
    <Html center zIndexRange={[15, 0]} style={{ pointerEvents: "none" }}>
      <div
        ref={box}
        className={cn(
          "flex flex-col items-center gap-1 whitespace-nowrap transition-all duration-500",
          visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
          className,
        )}
      >
        <div className="h-4 w-px md:h-6" style={{ background: `linear-gradient(to top, ${accent}, transparent)` }} />
        <div className="glass rounded-md px-2 py-0.5 text-center md:px-2.5 md:py-1">
          <div className="hidden font-mono text-[9px] tracking-[0.25em] uppercase md:block" style={{ color: accent }}>
            {subtitle}
          </div>
          <div className="text-[10.5px] font-medium tracking-tight text-white/90 md:text-[12px]">{title}</div>
        </div>
      </div>
    </Html>
    </group>
  );
}

const _labelP = new THREE.Vector3();

type GlyphFieldProps = {
  count: number;
  chars: string[];
  color: string;
  size: number;
  build: (rand: () => number, i: number) => { position: [number, number, number]; speed: number };
  mode: "rain" | "orbit";
  height?: number;
  opacity?: number;
};

/** Point-sprite glyph field: falling binary rain or a slowly orbiting ring of symbols. */
export function GlyphField({ count, chars, color, size, build, mode, height = 50, opacity = 1 }: GlyphFieldProps) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { texture, cols } = useMemo(() => glyphAtlas(chars), [chars]);
  const geo = useMemo(() => {
    const rand = mulberry32(count * 13 + chars.length);
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    const glyph = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const b = build(rand, i);
      pos.set(b.position, i * 3);
      speed[i] = b.speed;
      glyph[i] = Math.floor(rand() * chars.length);
      seed[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aGlyph", new THREE.BufferAttribute(glyph, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count, chars, build]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAtlas: { value: texture },
          uCols: { value: cols },
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uSize: { value: size },
          uDpr: { value: dpr },
          uHeight: { value: height },
          uOpacity: { value: opacity },
          uMode: { value: mode === "rain" ? 0 : 1 },
          uCount: { value: chars.length },
        },
        vertexShader: /* glsl */ `
          attribute float aSpeed; attribute float aGlyph; attribute float aSeed;
          uniform float uTime; uniform float uSize; uniform float uDpr; uniform float uHeight;
          uniform float uMode; uniform vec3 uColor; uniform float uOpacity; uniform float uCount;
          varying vec3 vColor; varying float vAlpha; varying float vGlyph;
          void main() {
            vec3 p = position;
            float a = 1.0;
            if (uMode < 0.5) {
              float y = mod(p.y - uTime * aSpeed, uHeight);
              p.y = y - uHeight * 0.4;
              a = smoothstep(0.0, 6.0, y) * smoothstep(uHeight, uHeight - 10.0, y);
              float flick = step(0.5, fract(sin(floor(uTime * (2.0 + aSeed * 6.0)) + aSeed * 91.0) * 43758.5));
              vGlyph = mod(aGlyph + flick, uCount);
            } else {
              float ang = uTime * aSpeed;
              p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz;
              p.y += sin(uTime * 0.6 + aSeed * 10.0) * 0.4;
              vGlyph = aGlyph;
            }
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * uDpr * (300.0 / -mv.z) * (0.7 + aSeed * 0.6);
            vColor = uColor * (0.8 + aSeed * 0.8);
            vAlpha = a * uOpacity * (0.35 + 0.65 * aSeed);
          }`,
        fragmentShader: glyphFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [texture, cols, color, size, dpr, height, opacity, mode, chars.length],
  );

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/** Fresnel hologram material for crystals, cores and other energy objects. */
export function useHoloMaterial(color: string, opts: { intensity?: number; opacity?: number } = {}) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uTime: { value: 0 },
          uIntensity: { value: opts.intensity ?? 1 },
          uOpacity: { value: opts.opacity ?? 0.9 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV; varying vec3 vP;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            vP = position;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uTime; uniform float uIntensity; uniform float uOpacity;
          varying vec3 vN; varying vec3 vV; varying vec3 vP;
          void main() {
            float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
            float bands = smoothstep(0.85, 1.0, sin(vP.y * 9.0 - uTime * 2.5) * 0.5 + 0.5);
            float facet = 0.25 + 0.35 * abs(dot(normalize(vN), normalize(vec3(0.3, 0.8, 0.5))));
            vec3 col = uColor * (facet * 0.6 + f * 2.2 + bands * 0.6) * uIntensity;
            gl_FragColor = vec4(col, clamp(uOpacity * (0.45 + f), 0.0, 1.0));
          }`,
        transparent: true,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    (mat.uniforms.uColor.value as THREE.Color).set(color);
  }, [color, mat]);
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt;
  });
  return mat;
}

export function useStableCallback<T extends (...a: never[]) => unknown>(fn: T) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...a: Parameters<T>) => ref.current(...a), []) as T;
}

/** Glowing grid disc / plane used as world floors. */
export function useGridMaterial({
  color,
  spacing,
  radius,
  opacity = 1,
}: {
  color: string;
  spacing: number;
  radius: number;
  opacity?: number;
}) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uSpacing: { value: spacing },
          uRadius: { value: radius },
          uOpacity: { value: opacity },
          uTime: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vW;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uSpacing; uniform float uRadius; uniform float uOpacity; uniform float uTime;
          varying vec3 vW;
          float gridLine(vec2 p, float s, float w) {
            vec2 g = abs(fract(p / s - 0.5) - 0.5) / fwidth(p / s);
            return 1.0 - min(min(g.x, g.y) / w, 1.0);
          }
          void main() {
            float r = length(vW.xz);
            float fade = smoothstep(uRadius, uRadius * 0.55, r);
            float minor = gridLine(vW.xz, uSpacing, 1.0) * 0.35;
            float major = gridLine(vW.xz, uSpacing * 5.0, 1.4);
            float pulse = smoothstep(2.0, 0.0, abs(r - mod(uTime * 6.0, uRadius * 1.4)));
            float a = (minor + major + pulse * 0.4 * major) * fade * uOpacity;
            gl_FragColor = vec4(uColor * (1.0 + pulse), a);
          }`,
        transparent: true,
        depthWrite: false,
      }),
    [color, spacing, radius, opacity],
  );
}
