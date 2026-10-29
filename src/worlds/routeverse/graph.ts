import * as THREE from "three";
import { mulberry32 } from "@/three/glsl";

export const PLANET_R = 30;
const EARTH_KM = 6371;

export type Graph = {
  nodes: THREE.Vector3[];
  edges: [number, number][];
  adj: { to: number; edge: number; w: number }[][];
};

/** Roughly uniform cities on a sphere (Fibonacci lattice + jitter), each wired to its nearest neighbours. */
export function buildGraph(count = 420, k = 3): Graph {
  const rand = mulberry32(73);
  const nodes: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i + (rand() - 0.5) * 0.25;
    const v = new THREE.Vector3(Math.cos(th) * r, y + (rand() - 0.5) * 0.03, Math.sin(th) * r).normalize();
    nodes.push(v.multiplyScalar(PLANET_R));
  }
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  const adj: Graph["adj"] = nodes.map(() => []);
  const add = (a: number, b: number) => {
    const kk = key(a, b);
    if (seen.has(kk)) return;
    seen.add(kk);
    const w = nodes[a].angleTo(nodes[b]);
    const e = edges.length;
    edges.push([a, b]);
    adj[a].push({ to: b, edge: e, w });
    adj[b].push({ to: a, edge: e, w });
  };
  nodes.forEach((p, i) => {
    const near = nodes
      .map((q, j) => ({ j, d: i === j ? Infinity : p.distanceToSquared(q) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k + (rand() < 0.3 ? 1 : 0));
    near.forEach(({ j }) => add(i, j));
  });
  return { nodes, edges, adj };
}

export type SearchResult = {
  /** Order in which each edge was relaxed during search, or -1 if never touched. */
  edgeVisit: Int32Array;
  pathEdges: number[];
  explored: number;
  ms: number;
  km: number;
};

/** A* over great-circle distance. Small binary heap keeps it allocation-light. */
export function astar(g: Graph, start: number, goal: number): SearchResult {
  const t0 = performance.now();
  const n = g.nodes.length;
  const gScore = new Float64Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const cameEdge = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const edgeVisit = new Int32Array(g.edges.length).fill(-1);
  const h = (i: number) => g.nodes[i].angleTo(g.nodes[goal]);

  const heap: [number, number][] = [];
  const push = (f: number, i: number) => {
    heap.push([f, i]);
    let c = heap.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (heap[p][0] <= heap[c][0]) break;
      [heap[p], heap[c]] = [heap[c], heap[p]];
      c = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let c = 0;
      for (;;) {
        const l = c * 2 + 1;
        const r = l + 1;
        let m = c;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === c) break;
        [heap[m], heap[c]] = [heap[c], heap[m]];
        c = m;
      }
    }
    return top;
  };

  gScore[start] = 0;
  push(h(start), start);
  let order = 0;
  let explored = 0;
  while (heap.length) {
    const [, u] = pop();
    if (closed[u]) continue;
    closed[u] = 1;
    explored++;
    if (u === goal) break;
    for (const { to, edge, w } of g.adj[u]) {
      if (closed[to]) continue;
      if (edgeVisit[edge] < 0) edgeVisit[edge] = order++;
      const ng = gScore[u] + w;
      if (ng < gScore[to]) {
        gScore[to] = ng;
        came[to] = u;
        cameEdge[to] = edge;
        push(ng + h(to), to);
      }
    }
  }
  const pathEdges: number[] = [];
  for (let c = goal; came[c] >= 0; c = came[c]) pathEdges.push(cameEdge[c]);
  pathEdges.reverse();
  const ms = performance.now() - t0;
  const max = Math.max(1, order);
  for (let i = 0; i < edgeVisit.length; i++) if (edgeVisit[i] >= 0) edgeVisit[i] = Math.round((edgeVisit[i] / max) * 1000);
  return { edgeVisit, pathEdges, explored, ms, km: gScore[goal] * EARTH_KM };
}
