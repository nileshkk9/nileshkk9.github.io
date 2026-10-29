import * as THREE from "three";

type Token = [string, string];

const C = {
  key: "#C9A2FF",
  type: "#5CE1FF",
  str: "#FFC978",
  fn: "#8AB4FF",
  plain: "#C8CED8",
  dim: "#59606C",
};

const LINES: Token[][] = [
  [["import", C.key], [" { WorkOrder, Technician } ", C.plain], ["from", C.key], [' "@zinier/core"', C.str]],
  [],
  [["export const", C.key], [" assign", C.fn], [" = ", C.plain], ["flow", C.fn], ["(", C.plain], ["{", C.plain]],
  [["  trigger: ", C.plain], ['"order.created"', C.str], [",", C.plain]],
  [["  input: ", C.plain], ["WorkOrder", C.type], [",", C.plain]],
  [["  steps: ", C.plain], ["[", C.plain]],
  [["    ", C.plain], ["match", C.fn], ["(", C.plain], ["skills", C.plain], [", ", C.plain], ['"hvac"', C.str], ["),", C.plain]],
  [["    ", C.plain], ["nearest", C.fn], ["(", C.plain], ["techId", C.plain], [", { radiusKm: ", C.plain], ["25", C.str], [" }),", C.plain]],
  [["    ", C.plain], ["schedule", C.fn], ["(", C.plain], ["slot", C.plain], [", ", C.plain], ["sla", C.plain], [".hours", C.plain], ["),", C.plain]],
  [["    ", C.plain], ["notify", C.fn], ["(", C.plain], ['"technician"', C.str], ["),", C.plain]],
  [["  ],", C.plain]],
  [["})", C.plain]],
];

/** Lines and token indices that carry a diagnostic in the "before" editor. */
const BUGS: { line: number; token: number; msg: string }[] = [
  { line: 6, token: 4, msg: "Unknown skill 'hvac' — did you mean 'HVAC'?" },
  { line: 7, token: 3, msg: "Field 'techId' does not exist on WorkOrder" },
  { line: 8, token: 5, msg: "'sla' may be undefined" },
];

export function makeCodeTexture(kind: "before" | "after") {
  const W = 1024;
  const H = 640;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d")!;
  const after = kind === "after";

  g.fillStyle = "rgba(9,11,16,0.92)";
  roundRect(g, 0, 0, W, H, 28);
  g.fill();
  g.strokeStyle = after ? "rgba(92,225,255,0.55)" : "rgba(255,92,72,0.45)";
  g.lineWidth = 3;
  roundRect(g, 1.5, 1.5, W - 3, H - 3, 27);
  g.stroke();

  g.fillStyle = "rgba(255,255,255,0.04)";
  g.fillRect(0, 0, W, 64);
  ["#FF5C48", "#FFB547", "#7CF2C8"].forEach((c, i) => {
    g.fillStyle = c;
    g.beginPath();
    g.arc(36 + i * 26, 32, 7, 0, Math.PI * 2);
    g.fill();
  });
  g.font = "500 22px ui-monospace, Menlo, monospace";
  g.fillStyle = "#8b93a1";
  g.fillText("assign.flow.ts", 130, 40);
  const badge = after ? "WITH ZPILOT" : "BEFORE ZPILOT";
  g.font = "600 18px ui-monospace, Menlo, monospace";
  const bw = g.measureText(badge).width + 32;
  g.fillStyle = after ? "rgba(92,225,255,0.16)" : "rgba(255,92,72,0.16)";
  roundRect(g, W - bw - 24, 16, bw, 32, 16);
  g.fill();
  g.fillStyle = after ? "#5CE1FF" : "#FF7A66";
  g.fillText(badge, W - bw - 8, 39);

  g.font = "24px ui-monospace, Menlo, monospace";
  const top = 112;
  const lh = 38;
  LINES.forEach((tokens, li) => {
    const y = top + li * lh;
    g.fillStyle = C.dim;
    g.fillText(String(li + 1).padStart(2, " "), 28, y);
    let x = 90;
    tokens.forEach(([text, color], ti) => {
      let t = text;
      if (after && li === 6 && ti === 4) t = '"HVAC"';
      if (after && li === 7 && ti === 3) t = "assigneeId";
      if (after && li === 8 && ti === 5) t = "sla ?? DEFAULT_SLA";
      g.fillStyle = color;
      g.fillText(t, x, y);
      const w = g.measureText(t).width;
      const bug = BUGS.find((b) => b.line === li && b.token === ti);
      if (bug && !after) squiggle(g, x, y + 8, w);
      x += w;
    });
    const bug = BUGS.find((b) => b.line === li);
    if (bug) {
      g.font = "19px ui-monospace, Menlo, monospace";
      if (after) {
        g.fillStyle = "rgba(124,242,200,0.85)";
        g.fillText("✓ auto-fixed", x + 26, y);
      } else {
        g.fillStyle = "rgba(255,122,102,0.9)";
        g.fillText("● " + bug.msg, x + 26, y);
      }
      g.font = "24px ui-monospace, Menlo, monospace";
    }
  });

  g.fillStyle = "rgba(255,255,255,0.05)";
  g.fillRect(0, H - 56, W, 56);
  g.font = "19px ui-monospace, Menlo, monospace";
  g.fillStyle = after ? "#7CF2C8" : "#FF7A66";
  g.fillText(after ? "✓ 0 problems · ZPilot language server" : "✕ 3 problems · found at runtime", 28, H - 21);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function squiggle(g: CanvasRenderingContext2D, x: number, y: number, w: number) {
  g.strokeStyle = "#FF5C48";
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i <= w; i += 4) g.lineTo(x + i, y + (i % 8 === 0 ? 0 : 4));
  g.stroke();
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
