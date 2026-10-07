import * as THREE from "three";
import { PRODUCT_BUILDERS } from "./products";
import { mem } from "./memory";

// ─── 9-ANGLE SPRITE BAKER (the Doom imposter method) ────────────────────────
// A throwaway scene renders each product from 9 bearings (40° steps = 360°),
// reads the pixels back and composes ONE atlas canvas per product.
// The 3D geometry is disposed afterwards — the shop only ships sprites.
//
// CELESTIA GALLERIA — BUDGET BROKEN EDITION: frames went 96 → 224 px
// (2.3× the pixel detail, ~2.4 MB per atlas). The Doom method stays —
// we simply spend the bytes on glory instead of hoarding them.

export const ANGLES = 9;
export const FRAME = 224; // px per frame → atlas 2016×224 ≈ 2.4 MB RGBA+MIPS

export interface BakedProduct {
  atlas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  /** alpha content box, fractions: [y0, y1, x0, x1] (y from TOP) */
  content: [number, number, number, number];
  /** footprint that camera-distance should assume */
  radius: number;
}

/**
 * Bake one product id → sprite atlas.
 * Uses the live renderer with an offscreen render target; restores state after.
 */
export function bakeProduct(
  renderer: THREE.WebGLRenderer,
  id: string
): BakedProduct | null {
  const builder = PRODUCT_BUILDERS[id];
  if (!builder) return null;

  const group = builder();

  // ── throwaway scene ──
  const scene = new THREE.Scene();
  scene.add(group);

  // lights parented to the CAMERA so every bearing is lit identically —
  // celestial three-point: warm sun key, golden rim, pearl-sky fill, aqua bounce
  const key = new THREE.DirectionalLight(0xfff1d8, 2.6);
  const rim = new THREE.DirectionalLight(0xffd9a0, 1.5);
  const amb = new THREE.AmbientLight(0xd8e8ee, 1.05);
  const bounce = new THREE.DirectionalLight(0x9fd8d0, 0.55);
  bounce.position.set(0, -1, 0);
  scene.add(amb, key, rim, bounce);

  // ── fit camera to bounds ──
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const fov = (26 * Math.PI) / 180;
  const dist = (sphere.radius / Math.sin(fov / 2)) * 1.06;

  const cam = new THREE.PerspectiveCamera(26, 1, 0.05, dist * 4);
  key.position.set(0.6, 1.2, 1); // relative to cam below
  rim.position.set(-0.8, 0.5, -1);

  const rt = new THREE.WebGLRenderTarget(FRAME, FRAME, {
    samples: 4,
    format: THREE.RGBAFormat,
  });

  const atlas = document.createElement("canvas");
  atlas.width = FRAME * ANGLES;
  atlas.height = FRAME;
  const actx = atlas.getContext("2d")!;

  const buf = new Uint8Array(FRAME * FRAME * 4);
  const flip = document.createElement("canvas");
  flip.width = FRAME;
  flip.height = FRAME;
  const fctx = flip.getContext("2d")!;

  const prevRT = renderer.getRenderTarget();
  const prevClr = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();

  try {
    for (let k = 0; k < ANGLES; k++) {
      const a = (k * 40 * Math.PI) / 180; // bearing
      cam.position.set(
        center.x + Math.sin(a) * dist,
        center.y + dist * 0.34,
        center.z + Math.cos(a) * dist
      );
      cam.lookAt(center);
      // move lights with camera (billboard-consistent shading)
      key.position.copy(cam.position).add(new THREE.Vector3(0.5, 0.8, 0));
      key.target.position.copy(center);
      key.target.updateMatrixWorld();
      rim.position.copy(cam.position).add(new THREE.Vector3(-1, 0.3, -0.6));

      renderer.setRenderTarget(rt);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(scene, cam);
      renderer.readRenderTargetPixels(rt, 0, 0, FRAME, FRAME, buf);

      // WebGL origin is bottom-left → vertical flip
      const img = fctx.createImageData(FRAME, FRAME);
      for (let y = 0; y < FRAME; y++) {
        const src = (y * FRAME) * 4;
        const dst = ((FRAME - 1 - y) * FRAME) * 4;
        img.data.set(buf.subarray(src, src + FRAME * 4), dst);
      }
      fctx.putImageData(img, 0, 0);
      actx.drawImage(flip, k * FRAME, 0);
    }
  } finally {
    renderer.setRenderTarget(prevRT);
    renderer.setClearColor(prevClr, prevAlpha);
    rt.dispose();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
  }

  const texture = new THREE.CanvasTexture(atlas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  mem.register(texture, atlas.width, atlas.height, true);

  // alpha content box across all 9 frames (for pixel-perfect grounding)
  const data = actx.getImageData(0, 0, atlas.width, atlas.height).data;
  let minY = FRAME, maxY = -1, minX = atlas.width, maxX = -1;
  for (let y = 0; y < FRAME; y++) {
    for (let x = 0; x < atlas.width; x++) {
      if (data[(y * atlas.width + x) * 4 + 3] > 24) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxY < 0) { minY = 0; maxY = FRAME - 1; minX = 0; maxX = atlas.width - 1; }
  const content: [number, number, number, number] = [
    minY / FRAME,
    (maxY + 1) / FRAME,
    minX / atlas.width,
    (maxX + 1) / atlas.width,
  ];

  return { atlas, texture, content, radius: sphere.radius };
}

/** export current atlas as PNG data-url (asset pipeline reference sheet) */
export function atlasToDataURL(atlas: HTMLCanvasElement): string {
  return atlas.toDataURL("image/png");
}

/** slice an uploaded 9-frame sheet (horizontal strip) into an atlas canvas */
export function sheetToAtlas(
  img: HTMLImageElement,
  frameW = FRAME,
  frameH = FRAME
): HTMLCanvasElement {
  const atlas = document.createElement("canvas");
  atlas.width = frameW * ANGLES;
  atlas.height = frameH;
  const ctx = atlas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  const w = img.width / ANGLES;
  const h = img.height;
  const side = Math.min(w, h); // centered square crop per cell
  for (let k = 0; k < ANGLES; k++) {
    ctx.drawImage(
      img,
      k * w + (w - side) / 2,
      (h - side) / 2,
      side,
      side,
      k * frameW,
      0,
      frameW,
      frameH
    );
  }
  return atlas;
}
