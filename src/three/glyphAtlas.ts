import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

/** Square atlas of glyphs laid out on a `cols x cols` grid, white on transparent. */
export function glyphAtlas(chars: string[], cell = 96) {
  const key = chars.join("");
  const cols = Math.ceil(Math.sqrt(chars.length));
  if (!cache.has(key)) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = cols * cell;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `300 ${Math.floor(cell * 0.7)}px ui-monospace, "SF Mono", Menlo, monospace`;
    chars.forEach((ch, i) => {
      const x = (i % cols) * cell + cell / 2;
      const y = Math.floor(i / cols) * cell + cell / 2;
      ctx.fillText(ch, x, y + cell * 0.04);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    tex.anisotropy = 4;
    cache.set(key, tex);
  }
  return { texture: cache.get(key)!, cols, count: chars.length };
}

export const glyphFrag = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uCols;
varying vec3 vColor;
varying float vAlpha;
varying float vGlyph;
void main() {
  vec2 cell = vec2(mod(vGlyph, uCols), floor(vGlyph / uCols));
  vec2 st = (cell + gl_PointCoord) / uCols;
  st.y = 1.0 - st.y;
  float a = texture2D(uAtlas, st).a * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}
`;
