// ─── THE SPRITE FORGE — pilgrim 2D art → 9-angle Doom atlas ────────────────
// Pure client-side canvas pipeline: slice (strip / 3×3 grid / 9 files),
// background removal (border flood-fill), scale-consistent trim & centering,
// strip-atlas composition. The output is EXACTLY what the engine's billboard
// shader eats — one horizontal ribbon of 9 square frames, 40° apart.

import { scanAtlasContent } from "./baker";

export const FORGE_ANGLES = 9;
/** output frame cell — "glory" tier (the baked relics use 224) */
export const CELL_GLORY = 320;
export const CELL_LEAN = 224;

export type InputMode = "frames" | "strip" | "grid";

export interface SizePreset {
  id: string;
  label: string;
  /** target world height, meters (width follows aspect unless given) */
  h: number;
  w?: number;
  hint: string;
}

/** the sofa-is-big / mug-is-small dial presets */
export const SIZE_PRESETS: SizePreset[] = [
  { id: "mug", label: "MUG", h: 0.13, hint: "jewel-scale relic" },
  { id: "headphones", label: "HEADPHONES", h: 0.28, hint: "shelf-scale" },
  { id: "camera", label: "CAMERA", h: 0.35, hint: "counter-scale" },
  { id: "console", label: "CONSOLE", h: 0.55, hint: "altar-scale" },
  { id: "chair", label: "CHAIR", h: 0.95, hint: "room-scale" },
  { id: "sofa", label: "SOFA", h: 0.85, w: 2.2, hint: "grand-scale" },
  { id: "car", label: "CAR", h: 1.5, w: 4.6, hint: "colossal-scale" },
];

/** the pilgrim silhouette the size preview stands next to (meters) */
export const HUMAN_H = 1.7;

// ── loading & slicing ───────────────────────────────────────────────────────

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image unreadable"));
    img.src = src;
  });
}

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`could not read ${file.name}`));
    };
    img.src = url;
  });
}

/** draw any source onto a fresh canvas */
export function toCanvas(img: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return c;
}

/** heuristic: does this image look like a 9-frame strip / 3×3 grid / neither */
export function detectLayout(img: HTMLImageElement): InputMode {
  const a = img.width / img.height;
  if (a > 4.5) return "strip";
  if (a > 0.75 && a < 1.35) return "grid";
  return "frames";
}

/** slice a horizontal 9-frame strip into 9 cell canvases */
export function sliceStrip(img: HTMLImageElement): HTMLCanvasElement[] {
  const w = Math.floor(img.width / FORGE_ANGLES);
  const h = img.height;
  const out: HTMLCanvasElement[] = [];
  for (let k = 0; k < FORGE_ANGLES; k++) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, k * w, 0, w, h, 0, 0, w, h);
    out.push(c);
  }
  return out;
}

/** slice a 3×3 grid (row-major) into 9 cell canvases */
export function sliceGrid(img: HTMLImageElement): HTMLCanvasElement[] {
  const w = Math.floor(img.width / 3);
  const h = Math.floor(img.height / 3);
  const out: HTMLCanvasElement[] = [];
  for (let k = 0; k < FORGE_ANGLES; k++) {
    const gx = k % 3;
    const gy = Math.floor(k / 3);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    c.getContext("2d")!.drawImage(img, gx * w, gy * h, w, h, 0, 0, w, h);
    out.push(c);
  }
  return out;
}

// ── background removal ─────────────────────────────────────────────────────

/**
 * Remove a uniform background (white sweep, chroma, any flat color) by
 * flood-filling from the four borders. Images that already have transparent
 * corners pass through untouched. tolerance 0–100.
 */
export function removeBackground(src: HTMLCanvasElement, tolerance = 32): HTMLCanvasElement {
  const ctx = src.getContext("2d")!;
  const W = src.width;
  const H = src.height;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;

  // seed color = average of the four corner pixels
  const corners = [0, W - 1, (H - 1) * W, H * W - 1];
  let sa = 0;
  for (const p of corners) sa += d[p * 4 + 3];
  if (sa / 4 < 24) return src; // already transparent — nothing to remove

  let r = 0, g = 0, b = 0;
  for (const p of corners) {
    r += d[p * 4];
    g += d[p * 4 + 1];
    b += d[p * 4 + 2];
  }
  r /= 4; g /= 4; b /= 4;
  const tol = tolerance * 6.6; // summed-channel budget

  const visited = new Uint8Array(W * H);
  const stack: number[] = [];
  for (let x = 0; x < W; x++) {
    stack.push(x, (H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    stack.push(y * W, y * W + W - 1);
  }

  while (stack.length) {
    const p = stack.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    const diff =
      Math.abs(d[i] - r) + Math.abs(d[i + 1] - g) + Math.abs(d[i + 2] - b);
    if (diff > tol) continue;
    d[i + 3] = 0;
    const x = p % W;
    const y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }
  ctx.putImageData(img, 0, 0);
  return src;
}

// ── trim, center, compose ──────────────────────────────────────────────────

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function contentBox(c: HTMLCanvasElement): Box | null {
  const ctx = c.getContext("2d")!;
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

/** normalize differing frame sizes to the first frame's dims (stretch-safe) */
function uniformSize(frames: HTMLCanvasElement[]): HTMLCanvasElement[] {
  const W = frames[0].width;
  const H = frames[0].height;
  return frames.map((f) => {
    if (f.width === W && f.height === H) return f;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    c.getContext("2d")!.drawImage(f, 0, 0, W, H);
    return c;
  });
}

export interface ComposedAtlas {
  atlas: HTMLCanvasElement;
  content: [number, number, number, number];
  cell: number;
  /** px content extents inside ONE cell (shared scale) for the preview */
  contentAspect: number;
}

/**
 * Compose 9 processed frames into the engine's strip atlas.
 * All frames share ONE scale (union content box), each centered by its own
 * content box — so the rotation pivot holds still, Doom-style.
 */
export function composeAtlas(
  rawFrames: HTMLCanvasElement[],
  cell = CELL_GLORY
): ComposedAtlas | null {
  if (rawFrames.length !== FORGE_ANGLES) return null;
  const frames = uniformSize(rawFrames);
  const boxes = frames.map(contentBox);
  if (boxes.every((b) => !b)) return null; // nothing visible anywhere

  // union content box across all frames (in shared frame-local px)
  let uMinX = Infinity, uMinY = Infinity, uMaxX = -Infinity, uMaxY = -Infinity;
  for (const b of boxes) {
    if (!b) continue;
    uMinX = Math.min(uMinX, b.minX);
    uMinY = Math.min(uMinY, b.minY);
    uMaxX = Math.max(uMaxX, b.maxX);
    uMaxY = Math.max(uMaxY, b.maxY);
  }
  const uW = Math.max(1, uMaxX - uMinX + 1);
  const uH = Math.max(1, uMaxY - uMinY + 1);
  const margin = Math.round(0.07 * Math.max(uW, uH));
  const vW = uW + margin * 2;
  const vH = uH + margin * 2;
  const s = Math.min(cell / vW, cell / vH);
  // centering offset of the virtual canvas inside the cell
  const offX = (cell - vW * s) / 2;
  const offY = (cell - vH * s) / 2;

  const atlas = document.createElement("canvas");
  atlas.width = cell * FORGE_ANGLES;
  atlas.height = cell;
  const actx = atlas.getContext("2d")!;
  actx.imageSmoothingEnabled = true;
  actx.imageSmoothingQuality = "high";

  for (let k = 0; k < FORGE_ANGLES; k++) {
    const f = frames[k];
    const b = boxes[k];
    if (!b) continue; // empty frame — leave the cell blank
    // virtual-space origin of this frame's pixels
    const dx = offX + (margin + (b.minX - uMinX) - b.minX) * s;
    const dy = offY + (margin + (b.minY - uMinY) - b.minY) * s;
    // clip to this cell — opaque backgrounds must never bleed sideways
    actx.save();
    actx.beginPath();
    actx.rect(k * cell, 0, cell, cell);
    actx.clip();
    actx.drawImage(f, 0, 0, f.width, f.height, k * cell + dx, dy, f.width * s, f.height * s);
    actx.restore();
  }

  const content = scanAtlasContent(atlas);
  return { atlas, content, cell, contentAspect: uW / uH };
}

// ── previews ────────────────────────────────────────────────────────────────

/** draw atlas frame k fitted into a preview canvas (checkerboard behind) */
export function drawFrame(
  target: HTMLCanvasElement,
  atlas: HTMLCanvasElement,
  k: number
) {
  const ctx = target.getContext("2d")!;
  const cell = atlas.height;
  ctx.clearRect(0, 0, target.width, target.height);
  const s = Math.min(target.width / cell, target.height / cell) * 0.94;
  const w = cell * s;
  const h = cell * s;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    atlas,
    k * cell,
    0,
    cell,
    cell,
    (target.width - w) / 2,
    (target.height - h) / 2,
    w,
    h
  );
}

/** natural-order sort for multi-file drops (mug_00 … mug_08) */
export function naturalFiles(files: File[]): File[] {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
  );
}
