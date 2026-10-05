import * as THREE from "three";
import { buildLevel, FLOOR_Y, type LevelRig } from "./level";
import { CATALOG, type ProductSpec } from "./products";
import { bakeProduct, sheetToAtlas, type BakedProduct } from "./baker";
import { ProductSprite } from "./sprites";
import { DoomAudio } from "./audio";
import { mem, trackedCanvasTexture } from "./memory";
import type { EngineStats } from "./types";

// ─── DOOM MART engine — one WebGL context, Doom-grade lightness ─────────────

export interface EngineCallbacks {
  onStats?: (s: EngineStats) => void;
  onPrompt?: (spec: ProductSpec | null) => void;
  onSelect?: (spec: ProductSpec) => void;
  onReady?: (vramMB: number) => void;
}

const EYE = 1.66;
const RADIUS = 0.34;
const WALK = 3.4;
const RUN = 5.7;

export class DoomEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private level!: LevelRig;
  private sprites: ProductSprite[] = [];
  private baked = new Map<string, BakedProduct>();
  readonly audio = new DoomAudio();

  private raf = 0;
  private clock = new THREE.Clock();
  private t = 0;
  private paused = false;
  private disposed = false;

  // input state
  private keys = new Set<string>();
  private moveInput = { x: 0, y: 0 }; // touch joystick
  private yaw = 0;
  private pitch = 0;
  private pos = new THREE.Vector3();
  private vel = new THREE.Vector3();
  private bobPhase = 0;
  private lastStepBob = 0;
  private locked = false;
  private dragging = false;
  private dragButton = false;
  private dragMoved = 0;
  private touchLook: { id: number; x: number; y: number } | null = null;

  // interaction
  private hovered: ProductSprite | null = null;
  private promptSpec: ProductSpec | null = null;
  private promptTimer = 0;

  // stats
  private frames = 0;
  private statAcc = 0;
  private lastStats: EngineStats = {
    fps: 0,
    vramMB: 0,
    drawCalls: 0,
    sprites: 0,
    px: 0,
    pz: 0,
    yaw: 0,
  };
  private cb: EngineCallbacks;

  // DOM handles
  private canvas: HTMLCanvasElement;
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseMove: (e: MouseEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: (e: MouseEvent) => void;
  private onLockChange: () => void;
  private onResize: () => void;
  private onTouchStart: (e: TouchEvent) => void;
  private onTouchMove: (e: TouchEvent) => void;
  private onTouchEnd: (e: TouchEvent) => void;

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks = {}) {
    this.canvas = canvas;
    this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(74, 1, 0.08, 60);
    this.camera.rotation.order = "YXZ";

    // ── world ──
    this.scene.fog = new THREE.FogExp2(0x05070a, 0.05);
    this.scene.background = new THREE.Color(0x05070a);
    this.level = buildLevel();
    this.scene.add(this.level.group);

    // ── bake all products to 9-angle sprite atlases (the Doom method) ──
    for (let i = 0; i < CATALOG.length && i < this.level.pedestals.length; i++) {
      const spec = CATALOG[i];
      const ped = this.level.pedestals[i];
      const baked = bakeProduct(this.renderer, spec.id);
      if (!baked) continue;
      this.baked.set(spec.id, baked);
      const sprite = new ProductSprite(
        spec,
        baked.texture,
        baked.content,
        ped.pos,
        ped.facing,
        FLOOR_Y,
        ped.top
      );
      sprite.setHover(false);
      this.scene.add(sprite.group);
      this.sprites.push(sprite);
    }

    // ── spawn ──
    this.pos.set(this.level.spawn.x, EYE, this.level.spawn.z);
    this.yaw = this.level.spawn.yaw;

    // ── listeners ──
    this.onKeyDown = (e) => {
      if (this.paused) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "e"].includes(k)) {
        e.preventDefault();
      }
      this.keys.add(k);
      if (k === "e") this.tryInteract();
    };
    this.onKeyUp = (e) => this.keys.delete(e.key.toLowerCase());
    this.onMouseMove = (e) => {
      if (this.paused) return;
      if (this.locked || this.dragging) {
        this.dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
        this.yaw -= e.movementX * 0.0021;
        this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - e.movementY * 0.0021));
      }
    };
    this.onMouseDown = (e) => {
      if (this.paused) return;
      if (e.button === 0) {
        this.dragMoved = 0;
        if (this.locked) {
          this.tryInteract();
        } else {
          this.dragging = true;
          this.dragButton = true;
          // pointer lock may be unavailable (iframe sandbox / no gesture) —
          // drag-look is the graceful fallback, so swallow rejections
          try {
            const p = this.canvas.requestPointerLock?.() as unknown as
              | Promise<void>
              | undefined;
            p?.catch?.(() => {});
          } catch {
            /* drag-look fallback active */
          }
        }
      }
    };
    this.onMouseUp = () => {
      // only treat as a CLICK (not a drag-look) for interaction
      if (this.dragButton && this.dragMoved < 6 && this.promptSpec) this.tryInteract();
      this.dragging = false;
      this.dragButton = false;
    };
    this.onLockChange = () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (!this.locked) this.dragging = false;
    };
    this.onResize = () => this.resize();
    this.onTouchStart = (e) => {
      if (this.paused) return;
      const t = e.changedTouches[0];
      if (t && !this.touchLook) {
        this.touchLook = { id: t.identifier, x: t.clientX, y: t.clientY };
      }
    };
    this.onTouchMove = (e) => {
      if (this.paused || !this.touchLook) return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.touchLook.id) {
          const dx = t.clientX - this.touchLook.x;
          const dy = t.clientY - this.touchLook.y;
          this.touchLook.x = t.clientX;
          this.touchLook.y = t.clientY;
          this.yaw -= dx * 0.005;
          this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - dy * 0.005));
          e.preventDefault();
        }
      }
    };
    this.onTouchEnd = (e) => {
      if (!this.touchLook) return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === this.touchLook.id) this.touchLook = null;
      }
    };

    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("resize", this.onResize);
    document.addEventListener("pointerlockchange", this.onLockChange);
    canvas.addEventListener("mousedown", this.onMouseDown);
    canvas.addEventListener("touchstart", this.onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", this.onTouchMove, { passive: false });
    canvas.addEventListener("touchend", this.onTouchEnd);

    this.resize();
    this.cb.onReady?.(mem.usedMB);

    // test/debug hook (harmless in prod, aids E2E verification)
    (window as unknown as { __doomDebug?: object }).__doomDebug = {
      pos: () => ({ x: +this.pos.x.toFixed(2), z: +this.pos.z.toFixed(2), yaw: +this.yaw.toFixed(3) }),
      paused: () => this.paused,
      frames: () =>
        this.sprites.map((s) => ({
          id: s.spec.id,
          frame: (s as unknown as { frame: number }).frame,
          reflY: +s.reflection.position.y.toFixed(2),
          meshY: +s.mesh.position.y.toFixed(2),
        })),
      prompt: () => this.promptSpec?.id ?? null,
    };
  }

  // ── public API ──
  setPaused(p: boolean) {
    this.paused = p;
    if (p && this.locked) document.exitPointerLock?.();
    if (!p) this.keys.clear();
  }

  setMoveInput(x: number, y: number) {
    this.moveInput.x = x;
    this.moveInput.y = y;
  }

  setSound(on: boolean) {
    this.audio.setEnabled(on);
  }

  /** public interact (mobile E button / dialog triggers) */
  interactNow() {
    this.tryInteract();
  }

  updateCartQty(productId: string, qty: number) {
    const s = this.sprites.find((x) => x.spec.id === productId);
    s?.updateTag(qty);
  }

  /** asset pipeline: replace a product's sprite atlas from an uploaded image */
  applySpriteSheet(productId: string, img: HTMLImageElement): boolean {
    const sprite = this.sprites.find((s) => s.spec.id === productId);
    if (!sprite) return false;
    const atlas = sheetToAtlas(img);
    const tex = trackedCanvasTexture(atlas, true);
    tex.colorSpace = THREE.SRGBColorSpace;
    sprite.swapTexture(tex);
    return true;
  }

  /** export the baked reference sheet for the asset pipeline */
  exportSheet(productId: string): string | null {
    const b = this.baked.get(productId);
    return b ? b.atlas.toDataURL("image/png") : null;
  }

  /** minimap data for the React automap */
  getMinimap() {
    return { grid: this.level.grid, pool: this.level.pool };
  }

  /** live player state for the automap (updated every frame) */
  getStats(): EngineStats {
    return this.lastStats;
  }

  start() {
    this.clock.start();
    const loop = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, this.clock.getDelta());
      this.t += dt;
      this.update(dt);
      this.renderer.render(this.scene, this.camera);
      this.frames++;
      this.statAcc += dt;
      if (this.statAcc >= 0.5) {
        this.emitStats();
        this.statAcc = 0;
        this.frames = 0;
      }
    };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("pointerlockchange", this.onLockChange);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("touchstart", this.onTouchStart);
    this.canvas.removeEventListener("touchmove", this.onTouchMove);
    this.canvas.removeEventListener("touchend", this.onTouchEnd);
    this.audio.dispose();
    for (const s of this.sprites) s.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
    this.renderer.dispose();
    mem.reset();
  }

  // ── internals ──
  private resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  private update(dt: number) {
    // movement input (keyboard + joystick)
    let ix = this.moveInput.x;
    let iz = this.moveInput.y;
    if (this.keys.has("w") || this.keys.has("arrowup")) iz += 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) iz -= 1;
    if (this.keys.has("a") || this.keys.has("arrowleft")) ix -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) ix += 1;
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
    }
    const speed = this.keys.has("shift") ? RUN : WALK;

    // forward = -Z at yaw 0 (three camera convention)
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    const targetVX = (fx * iz + rx * ix) * speed;
    const targetVZ = (fz * iz + rz * ix) * speed;
    const smooth = Math.min(1, dt * 10);
    this.vel.x += (targetVX - this.vel.x) * smooth;
    this.vel.z += (targetVZ - this.vel.z) * smooth;

    // axis-separated sliding collision
    const nx = this.pos.x + this.vel.x * dt;
    if (!this.collides(nx, this.pos.z)) this.pos.x = nx;
    else this.vel.x = 0;
    const nz = this.pos.z + this.vel.z * dt;
    if (!this.collides(this.pos.x, nz)) this.pos.z = nz;
    else this.vel.z = 0;

    // head bob + footsteps
    const moveSpeed = Math.hypot(this.vel.x, this.vel.z);
    this.bobPhase += dt * (4.4 + moveSpeed * 1.15);
    const bobAmp = Math.min(1, moveSpeed / WALK);
    this.camera.position.set(
      this.pos.x,
      EYE + Math.sin(this.bobPhase * 2) * 0.028 * bobAmp,
      this.pos.z
    );
    this.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bobPhase) * 0.006 * bobAmp);
    if (bobAmp > 0.35 && Math.floor(this.bobPhase / Math.PI) !== this.lastStepBob) {
      this.lastStepBob = Math.floor(this.bobPhase / Math.PI);
      this.audio.footstep();
    }

    // world
    this.level.update(this.t, dt);
    for (const s of this.sprites) s.update(this.camera.position, this.t, dt);

    // live stats for the automap
    this.lastStats.px = this.pos.x;
    this.lastStats.pz = this.pos.z;
    this.lastStats.yaw = this.yaw;

    // interaction prompt
    this.updatePrompt(dt);
  }

  private collides(x: number, z: number): boolean {
    const g = this.level.grid;
    const r = RADIUS;
    const minCX = Math.floor((x - r) / g.cell);
    const maxCX = Math.floor((x + r) / g.cell);
    const minCZ = Math.floor((z - r) / g.cell);
    const maxCZ = Math.floor((z + r) / g.cell);
    for (let cz = minCZ; cz <= maxCZ; cz++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        if (cx < 0 || cz < 0 || cx >= g.w || cz >= g.h) return true;
        if (g.cells[cz * g.w + cx] !== 0) return true;
      }
    }
    return false;
  }

  private updatePrompt(dt: number) {
    // nearest product within reach AND roughly in the crosshair
    let best: ProductSprite | null = null;
    let bestScore = -1;
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    for (const s of this.sprites) {
      const dx = s.group.position.x - this.camera.position.x;
      const dz = s.group.position.z - this.camera.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 3.1) continue;
      const dot = (dx / dist) * fwd.x + (dz / dist) * fwd.z;
      if (dot < 0.62) continue;
      const score = dot * 2 - dist * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    if (best !== this.hovered) {
      this.hovered?.setHover(false);
      this.hovered = best;
      best?.setHover(true);
      this.promptSpec = best ? best.spec : null;
      this.promptTimer = 0;
      this.cb.onPrompt?.(this.promptSpec);
      if (this.promptSpec) this.audio.hover();
    } else if (this.promptSpec) {
      this.promptTimer += dt;
    }
  }

  private tryInteract() {
    if (!this.promptSpec) {
      this.audio.deny();
      return;
    }
    this.audio.interact();
    this.cb.onSelect?.(this.promptSpec);
  }

  private emitStats() {
    this.lastStats = {
      fps: Math.round(this.frames / Math.max(0.001, this.statAcc)),
      vramMB: mem.usedMB,
      drawCalls: this.renderer.info.render.calls,
      sprites: this.sprites.length,
      px: this.pos.x,
      pz: this.pos.z,
      yaw: this.yaw,
    };
    this.cb.onStats?.(this.lastStats);
  }
}
