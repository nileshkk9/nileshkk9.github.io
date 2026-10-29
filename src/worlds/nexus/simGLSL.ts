import { hashGLSL } from "@/three/glsl";
import type { Quality } from "@/store/experience";

export const NEXUS_COUNTS: Record<Quality, { workers: number; tasks: number; beams: number }> = {
  high: { workers: 10000, tasks: 100000, beams: 6000 },
  mid: { workers: 5000, tasks: 40000, beams: 3000 },
  low: { workers: 2000, tasks: 15000, beams: 1200 },
};

export const BLOCK = 12;
export const GRID_HALF = 10;
export const ENGINE_POS = [0, 16, 0] as const;

/**
 * Deterministic city simulation evaluated entirely on the GPU.
 * Workers drive rectangular loops on the road grid; tasks spawn at buildings and are
 * assigned to a worker either continuously or in synchronized batch windows.
 */
export const simGLSL = /* glsl */ `
${hashGLSL}
#define BLOCK ${BLOCK.toFixed(1)}
uniform float uTime;
uniform float uWorkers;
uniform float uMode;
uniform float uBatchStart;
uniform float uSurge;

vec3 workerPos(float id, float t) {
  float h1 = hash11(id * 1.31 + 0.1);
  float h2 = hash11(id * 7.77 + 3.0);
  float h3 = hash11(id * 3.37 + 9.0);
  float h4 = hash11(id * 5.13 + 1.7);
  float x0 = (floor(h1 * 17.0) - 9.0) * BLOCK;
  float z0 = (floor(h2 * 17.0) - 9.0) * BLOCK;
  float w = (1.0 + floor(h3 * 3.0)) * BLOCK;
  float d = (1.0 + floor(h4 * 3.0)) * BLOCK;
  float per = 2.0 * (w + d);
  float speed = 5.0 + h3 * 9.0;
  float s = mod(t * speed + h1 * per, per);
  if (h4 > 0.5) s = per - s;
  vec2 p;
  if (s < w) p = vec2(x0 + s, z0);
  else if (s < w + d) p = vec2(x0 + w, z0 + s - w);
  else if (s < 2.0 * w + d) p = vec2(x0 + w - (s - w - d), z0 + d);
  else p = vec2(x0, z0 + d - (s - 2.0 * w - d));
  p += (vec2(h2, h1) - 0.5) * 1.4;
  return vec3(p.x, 0.45, p.y);
}

vec2 workerHome(float id) {
  float h1 = hash11(id * 1.31 + 0.1);
  float h2 = hash11(id * 7.77 + 3.0);
  float h3 = hash11(id * 3.37 + 9.0);
  float h4 = hash11(id * 5.13 + 1.7);
  float x0 = (floor(h1 * 17.0) - 9.0) * BLOCK;
  float z0 = (floor(h2 * 17.0) - 9.0) * BLOCK;
  return vec2(x0 + (1.0 + floor(h3 * 3.0)) * BLOCK * 0.5, z0 + (1.0 + floor(h4 * 3.0)) * BLOCK * 0.5);
}

/** Tasks are requested from buildings near their assigned worker's territory: dispatch is local. */
vec3 taskOrigin(float k, float wid) {
  float a = hash11(k * 1.7 + 0.3);
  float b = hash11(k * 2.9 + 5.1);
  float c = hash11(k * 4.3 + 2.2);
  float d = hash11(k * 6.1 + 7.4);
  vec2 home = workerHome(wid);
  vec2 blockC = (floor(home / BLOCK + (vec2(a, b) - 0.5) * 3.0) + 0.5) * BLOCK;
  vec2 p = blockC + (vec2(c, d) - 0.5) * BLOCK * 0.55;
  return vec3(p.x, 1.0 + c * 5.0, p.y);
}

struct Task { vec3 pos; vec3 worker; float alpha; float flight; float waiting; };

Task evalContinuous(float id, float seed) {
  const float P = 7.0;
  float tt = uTime + seed * P;
  float cycle = floor(tt / P);
  float ph = fract(tt / P);
  float k = id + cycle * 131.7;
  float wid = floor(hash11(k * 9.13) * uWorkers);
  vec3 o = taskOrigin(k, wid);
  vec3 w = workerPos(wid, uTime);
  Task r;
  r.worker = w;
  float appear = smoothstep(0.0, 0.08, ph);
  float fl = smoothstep(0.18, 0.52, ph);
  r.pos = mix(o + vec3(0.0, appear * 1.5, 0.0), w, fl);
  r.pos.y += sin(fl * 3.14159) * (6.0 + seed * 10.0);
  r.alpha = appear * (1.0 - smoothstep(0.52, 0.6, ph));
  r.flight = step(0.18, ph) * (1.0 - step(0.55, ph));
  r.waiting = 1.0 - smoothstep(0.15, 0.2, ph);
  return r;
}

Task evalBatch(float id, float seed) {
  const float P = 9.0;
  float tt = max(uTime - uBatchStart, 0.0);
  float cycle = floor(tt / P);
  float ph = fract(tt / P);
  float k = id + cycle * 97.3 + 7.0;
  float wid = floor(hash11(k * 9.13) * uWorkers);
  vec3 o = taskOrigin(k, wid);
  vec3 w = workerPos(wid, uTime);
  float spawn = seed * 0.68;
  float rel = 0.72 + seed * 0.04;
  float appear = smoothstep(spawn, spawn + 0.03, ph);
  float fl = smoothstep(rel, rel + 0.14, ph);
  Task r;
  r.worker = w;
  float bob = sin(uTime * 3.0 + seed * 30.0) * 0.3;
  r.pos = mix(o + vec3(0.0, 1.5 + bob, 0.0), w, fl);
  r.pos.y += sin(fl * 3.14159) * (10.0 + seed * 14.0);
  r.alpha = appear * (1.0 - smoothstep(rel + 0.14, rel + 0.18, ph));
  r.flight = step(rel, ph) * (1.0 - step(rel + 0.15, ph));
  r.waiting = appear * (1.0 - step(rel, ph));
  return r;
}

Task evalTask(float id, float seed) {
  Task c = evalContinuous(id, seed);
  if (uMode < 0.001) return c;
  Task b = evalBatch(id, seed);
  if (uMode > 0.999) return b;
  Task r;
  r.pos = mix(c.pos, b.pos, uMode);
  r.worker = mix(c.worker, b.worker, uMode);
  r.alpha = mix(c.alpha, b.alpha, uMode);
  r.flight = mix(c.flight, b.flight, uMode);
  r.waiting = mix(c.waiting, b.waiting, uMode);
  return r;
}

float taskVisible(float seed2) {
  return step(seed2, 0.62 + 0.38 * uSurge);
}
`;
