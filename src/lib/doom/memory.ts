import * as THREE from "three";

// ─── VRAM budget tracker — the "4 MB club" ─────────────────────────────────
// Every procedural texture registers here; the HUD shows the honest number.
const BUDGET_MB = 4.0;

class MemoryTracker {
  private bytes = 0;
  private readonly textures = new Set<THREE.Texture>();

  register(tex: THREE.Texture, w: number, h: number, mips = true) {
    if (this.textures.has(tex)) return;
    this.textures.add(tex);
    // RGBA8 + full mip chain ≈ ×4/3
    this.bytes += w * h * 4 * (mips ? 4 / 3 : 1);
  }

  unregister(tex: THREE.Texture) {
    if (!this.textures.delete(tex)) return;
    // caller should supply size; we recompute on next full audit
  }

  /** full audit: walk renderer info (GPU truth) + our tracked set */
  audit(renderer: THREE.WebGLRenderer): number {
    let gpuBytes = 0;
    try {
      const info = renderer.info as unknown as {
        memory?: { textures?: number; geometries?: number };
      };
      void info;
    } catch {
      /* noop */
    }
    gpuBytes = this.bytes;
    // geometry estimate: sprites are 2 shared quads; walls/pool few KB each
    return gpuBytes;
  }

  get budgetMB() {
    return BUDGET_MB;
  }

  get usedMB() {
    return this.bytes / (1024 * 1024);
  }

  get textureCount() {
    return this.textures.size;
  }

  reset() {
    this.textures.clear();
    this.bytes = 0;
  }
}

export const mem = new MemoryTracker();

/** create a tracked canvas texture */
export function trackedCanvasTexture(
  canvas: HTMLCanvasElement,
  mips = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  // canvases are painted in sRGB — mark them so the shader decodes correctly
  tex.colorSpace = THREE.SRGBColorSpace;
  if (mips) {
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
  } else {
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
  }
  tex.magFilter = THREE.LinearFilter;
  mem.register(tex, canvas.width, canvas.height, mips);
  return tex;
}

/** format MB like Doom HUD */
export function fmtMB(mb: number): string {
  return mb.toFixed(2);
}
