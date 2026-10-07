import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { buildLevel, FLOOR_Y, PLINTH_H, type LevelRig, type BenchInfo } from "./level";
import { CATALOG } from "./products";
import { bakeProduct, sheetToAtlas, scanAtlasContent, type BakedProduct } from "./baker";
import { ProductSprite } from "./sprites";
import { DoomAudio } from "./audio";
import { mem, trackedCanvasTexture } from "./memory";
import { HandsView, type HandPoseName } from "./hands";
import {
  DEFAULT_SETTINGS,
  GRADES,
  QUALITY_TIERS,
  GradeShader,
  gradeParamsToUniforms,
  loadSettings,
  saveSettings,
  type Settings,
} from "./settings";
import type { Collider, EngineStats, ProductSpec, PromptInfo, QualityMode } from "./types";

// ─── CELESTIA GALLERIA ✦ :: v2.0 engine — THE LIVING TEMPLE ─────────────────
// One WebGL context, mall-scale. The Doom methods stayed (billboard sprite
// relics, honest VRAM budget) but the temple now answers back: you can touch
// the walls, sit on the sofas, raise the camera to your eye and shoot the
// mall, carry your relics anywhere, and change the light itself.

export interface EngineCallbacks {
  onStats?: (s: EngineStats) => void;
  onPrompt?: (p: PromptInfo | null) => void;
  /** INSPECT dialog requested (shop relic) */
  onSelect?: (spec: ProductSpec) => void;
  onReady?: (vramMB: number) => void;
  /** E pressed at the Acquisition Altar with a loaded cart */
  onAltarRite?: () => void;
  onPhotoMode?: (on: boolean) => void;
  /** a PNG frame was captured by the VOIDCAM */
  onPhoto?: (dataUrl: string) => void;
  /** SERAPH BOOK codex overlay (null = close) */
  onRead?: (spec: ProductSpec | null) => void;
  /** toast lines from use-verbs */
  onUseToast?: (text: string) => void;
  /** zone banner */
  onZone?: (zone: string) => void;
}

const EYE = 1.66;
const ASCEND_EYE = 3.1;
const RADIUS = 0.3; // honest body radius — you can touch the marble now
const WALK = 4.2;
const RUN = 7.2;
const PHOTO_FOV = 34;
const REACH = 3.1;
const BENCH_REACH = 2.5;
const ALTAR_REACH = 3.4;

/** a purchased relic, alive in the Sanctum */
interface OwnedProp {
  spec: ProductSpec;
  sprite: ProductSprite;
  plinth: THREE.Mesh;
  /** sanctum slot index, or -1 when freely placed */
  slot: number;
  collider: Collider;
}

interface SitState {
  phase: "in" | "hold" | "out";
  k: number;
  from: { x: number; z: number; eye: number; yaw: number; pitch: number };
  to: { x: number; z: number; eye: number; yaw: number };
}

export class DoomEngine {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grade: ShaderPass;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private level!: LevelRig;
  private sprites: ProductSprite[] = [];
  private baked = new Map<string, BakedProduct>();
  /** shrine occupancy: product id → pedestal index (Forge slot tracking) */
  private usedPedestals = new Map<string, number>();
  /** owned relics living in the Sanctum */
  private owned = new Map<string, OwnedProp>();
  private usedSlots = new Set<number>();
  /** dynamic AABBs for placed owned relics */
  private ownedColliders = new Map<string, Collider>();
  readonly audio = new DoomAudio();
  readonly hands: HandsView;

  private raf = 0;
  private clock = new THREE.Clock();
  private t = 0;
  private paused = false;
  private disposed = false;

  // adaptive quality — auto-degrades glory → balanced → lite after warmup
  private quality: QualityMode = "glory";
  private mirrorOn = true;
  private lowFpsStreak = 0;
  private qualityWarmup = 3.0;
  private realT = 0;
  private qualityLocked = false;
  private celebrateT = 0;

  // settings (persisted)
  private settings: Settings = { ...DEFAULT_SETTINGS };

  // input state
  private keys = new Set<string>();
  private moveInput = { x: 0, y: 0 };
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
  private lookVel = { x: 0, y: 0 };

  // interaction
  private hovered: ProductSprite | null = null;
  private hoveredOwned: OwnedProp | null = null;
  private hoveredBench: BenchInfo | null = null;
  private altarNear = false;
  private prompt: PromptInfo | null = null;
  private promptTimer = 0;
  private cartCount = 0;

  // living temple state
  private sitState: SitState | null = null;
  private carrying: OwnedProp | null = null;
  private photoMode = false;
  private photoFovK = 0;
  private captureFlag = false;
  private flashT = 0;
  private tempPose: { name: HandPoseName; until: number } | null = null;
  private blessedUntil = -1;
  private equipped = false;
  private lampOn = false;
  private ascendUntil = -1;
  private ascendK = 0;
  private cinemaUntil = -1;
  private dawnUntil = -1;
  private personalLight!: THREE.PointLight;
  private zone = "";

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
    zone: "",
    buffs: [],
  };
  private cb: EngineCallbacks;

  // DOM handles
  private canvas: HTMLCanvasElement;
  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseMove: (e: MouseEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: () => void;
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.info.autoReset = false;

    this.camera = new THREE.PerspectiveCamera(74, 1, 0.08, 90);
    this.camera.rotation.order = "YXZ";

    // ── world ──
    this.scene.fog = new THREE.FogExp2(0xe9eef0, 0.014);
    this.scene.background = new THREE.Color(0xdcedf0);
    this.level = buildLevel(this.renderer);
    this.scene.add(this.level.group);
    this.scene.environment = this.level.envTexture;

    // personal halo (AURORA LAMP) — follows the pilgrim
    this.personalLight = new THREE.PointLight(0xffe8c0, 0, 7, 1.8);
    this.scene.add(this.personalLight);

    // ── bake all catalog relics to 9-angle sprite atlases (the Doom method) ──
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
      this.usedPedestals.set(spec.id, i);
    }

    // ── post pipeline: render → bloom → filmic output → SCREEN SHADER grade ──
    const bufSize = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const frameRT = new THREE.WebGLRenderTarget(bufSize.x, bufSize.y, {
      samples: 4,
      type: THREE.HalfFloatType,
    });
    this.composer = new EffectComposer(this.renderer, frameRT);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(512, 512),
      0.5,
      0.6,
      0.85
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);

    // ── THE HANDS — viewmodel seraph hands over everything ──
    this.hands = new HandsView(this.level.envTexture);

    // ── spawn (the Sanctum's south end, facing the altar) ──
    this.pos.set(this.level.spawn.x, EYE, this.level.spawn.z);
    this.yaw = this.level.spawn.yaw;

    // ── settings (persisted) ──
    this.settings = loadSettings();
    this.applySettings(this.settings, true);

    // ── listeners ──
    this.onKeyDown = (e) => {
      if (this.paused) return;
      const k = e.key.toLowerCase();
      if (
        ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift", "e", "r", "q"].includes(k)
      ) {
        e.preventDefault();
      }
      if (k === "e") {
        if (this.photoMode) this.shoot();
        else this.tryInteract();
      } else if (k === "r") {
        this.toggleCarry();
      } else if (k === "q") {
        if (this.photoMode) this.exitPhotoMode();
        else if (this.sitState) this.standUp();
      } else {
        this.keys.add(k);
        if (this.sitState && ["w", "a", "s", "d", " "].includes(k)) this.standUp();
      }
    };
    this.onKeyUp = (e) => this.keys.delete(e.key.toLowerCase());
    this.onMouseMove = (e) => {
      if (this.paused) return;
      if (this.locked || this.dragging) {
        this.dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
        const s = 0.0021 * this.settings.sensitivity;
        this.yaw -= e.movementX * s;
        const dy = e.movementY * s * (this.settings.invertY ? -1 : 1);
        this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - dy));
        this.lookVel.x = this.lookVel.x * 0.6 + e.movementX * 0.02;
        this.lookVel.y = this.lookVel.y * 0.6 + e.movementY * 0.02;
      }
    };
    this.onMouseDown = (e) => {
      if (this.paused) return;
      if (e.button === 0) {
        this.dragMoved = 0;
        if (this.locked) {
          if (this.photoMode) this.shoot();
          else this.tryInteract();
        } else {
          this.dragging = true;
          this.dragButton = true;
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
      if (this.dragButton && this.dragMoved < 6) {
        if (this.photoMode) this.shoot();
        else if (this.prompt) this.tryInteract();
      }
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
      const tl = this.touchLook;
      if (!tl) return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === tl.id) this.touchLook = null;
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
      tp: (x: number, z: number, yaw?: number) => {
        this.pos.set(x, EYE, z);
        if (typeof yaw === "number") this.yaw = yaw;
        this.vel.set(0, 0, 0);
        return { x, z, yaw: +this.yaw.toFixed(3) };
      },
      paused: () => this.paused,
      frames: () =>
        this.sprites.map((s) => ({
          id: s.spec.id,
          frame: (s as unknown as { frame: number }).frame,
          reflY: +s.reflection.position.y.toFixed(2),
          meshY: +s.mesh.position.y.toFixed(2),
        })),
      prompt: () => this.prompt,
      vram: () => +mem.usedMB.toFixed(3),
      quality: () => this.quality,
      setQuality: (q: string) => {
        this.qualityLocked = true;
        this.setQuality(q as QualityMode);
        return this.quality;
      },
      settings: () => ({ ...this.settings }),
      setGrade: (g: string) => {
        this.settings.grade = g as Settings["grade"];
        this.applySettings(this.settings);
        return this.settings.grade;
      },
      lockQuality: () => {
        this.qualityLocked = true;
        return this.quality;
      },
      shrines: () => ({ free: this.freeShrines(), total: this.level.pedestals.length }),
      sprites: () => this.sprites.map((s) => s.spec.id),
      owned: () => [...this.owned.keys()],
      carrying: () => (this.carrying ? this.carrying.spec.id : null),
      own: (id: string) => this.spawnOwned(this.specById(id)),
      photo: (on: boolean) => (on ? this.enterPhotoMode() : this.exitPhotoMode()),
      sit: () => this.standUp(),
      zone: () => this.currentZone(),
      collides: (x: number, z: number) => this.collides(x, z),
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  setPaused(p: boolean) {
    this.paused = p;
    if (p && this.locked) document.exitPointerLock?.();
    if (!p) this.keys.clear();
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  /** apply + persist the pilgrim's control over the light itself */
  applySettings(s: Settings, silent = false) {
    this.settings = { ...s };
    saveSettings(this.settings);
    // quality tier
    const tier = QUALITY_TIERS[this.settings.quality];
    this.quality = this.settings.quality;
    this.mirrorOn = tier.mirror;
    this.level.setMirror(tier.mirror);
    this.bloom.enabled = tier.bloom && this.settings.bloom > 0.01;
    const pr = Math.min(window.devicePixelRatio, tier.pixelRatio);
    this.renderer.setPixelRatio(pr);
    this.composer.setPixelRatio(pr);
    // screen shader grade
    const gu = this.grade.uniforms as Record<string, { value: unknown }>;
    gradeParamsToUniforms(GRADES[this.settings.grade], gu);
    (gu.uRes.value as THREE.Vector2).set(
      this.renderer.domElement.width || 1,
      this.renderer.domElement.height || 1
    );
    // fov (photo mode overrides live)
    if (!this.photoMode) {
      this.camera.fov = this.settings.fov;
      this.camera.updateProjectionMatrix();
    }
    // world dials
    this.level.setDust(this.settings.dust);
    this.level.setShafts(this.settings.godRays);
    this.audio.setVolume(this.settings.volume);
    this.resize();
    if (!silent) this.emitStats();
  }

  /** force a quality tier (auto-governor + settings both land here) */
  setQuality(q: QualityMode) {
    if (q === this.quality) return;
    this.settings.quality = q;
    this.applySettings(this.settings, true);
  }

  getQuality() {
    return this.quality;
  }

  setMoveInput(x: number, y: number) {
    this.moveInput.x = x;
    this.moveInput.y = y;
  }

  setSound(on: boolean) {
    this.audio.setEnabled(on);
  }

  /** the cart feeds the Acquisition Altar's rite availability */
  setCartCount(n: number) {
    this.cartCount = n;
  }

  /** checkout blessing — bloom + exposure swell through the temple */
  celebrate() {
    this.celebrateT = 2.2;
  }

  /** full purchase rite: light column + thumbs + choir */
  ceremony() {
    this.celebrateT = 2.2;
    this.level.riteBurst(this.pos.x, this.pos.z);
    this.tempPose = { name: "thumbs", until: this.t + 2.6 };
    this.audio.checkout();
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
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    const content = scanAtlasContent(atlas);
    sprite.swapTexture(tex, content);
    const b = this.baked.get(productId);
    if (b) {
      b.atlas = atlas;
      b.texture = tex;
      b.content = content;
    }
    return true;
  }

  // ── THE SPRITE FORGE — pilgrim-uploaded relics take their shrines ──

  freeShrines(): number {
    return Math.max(0, this.level.pedestals.length - this.sprites.length);
  }

  addCustomProduct(spec: ProductSpec, atlas: HTMLCanvasElement): boolean {
    if (this.sprites.find((s) => s.spec.id === spec.id)) return true; // idempotent
    const taken = new Set(this.usedPedestals.values());
    let freeIdx = -1;
    for (let i = 0; i < this.level.pedestals.length; i++) {
      if (!taken.has(i)) {
        freeIdx = i;
        break;
      }
    }
    if (freeIdx < 0) return false;
    const ped = this.level.pedestals[freeIdx];
    const tex = trackedCanvasTexture(atlas, true);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    const content = scanAtlasContent(atlas);
    const sprite = new ProductSprite(
      spec,
      tex,
      content,
      ped.pos,
      ped.facing,
      FLOOR_Y,
      ped.top
    );
    sprite.setHover(false);
    this.scene.add(sprite.group);
    this.sprites.push(sprite);
    this.usedPedestals.set(spec.id, freeIdx);
    this.baked.set(spec.id, {
      atlas,
      texture: tex,
      content,
      radius: Math.max(spec.spriteW, spec.spriteH) * 0.5,
    });
    return true;
  }

  /** live world-size control — sofa big, mug small, mid-walk */
  resizeProduct(productId: string, w: number, h: number): boolean {
    const sprite = this.sprites.find((s) => s.spec.id === productId);
    if (!sprite) return false;
    sprite.applySize(
      Math.max(0.08, Math.min(6, w)),
      Math.max(0.08, Math.min(6, h))
    );
    return true;
  }

  /** retire a custom relic — frees its shrine and VRAM */
  removeProduct(productId: string): boolean {
    const idx = this.sprites.findIndex((s) => s.spec.id === productId);
    if (idx < 0) return false;
    const sprite = this.sprites[idx];
    this.scene.remove(sprite.group);
    sprite.dispose();
    this.sprites.splice(idx, 1);
    this.usedPedestals.delete(productId);
    this.baked.delete(productId);
    return true;
  }

  /** export the baked reference sheet for the asset pipeline */
  exportSheet(productId: string): string | null {
    const b = this.baked.get(productId);
    return b ? b.atlas.toDataURL("image/png") : null;
  }

  // ══════════════════════════════════════════════════════════════════════
  // THE SANCTUM — owned relics take flesh, then serve you
  // ══════════════════════════════════════════════════════════════════════

  specById(id: string): ProductSpec | null {
    const cat = CATALOG.find((c) => c.id === id);
    if (cat) return cat;
    const own = this.owned.get(id);
    return own ? own.spec : null;
  }

  /** does this relic already stand in the Sanctum? */
  hasOwned(id: string): boolean {
    return this.owned.has(id);
  }

  /** place a purchased relic on a free Sanctum plinth (atlas optional for
   *  custom Forge relics — catalog relics reuse their baked texture) */
  spawnOwned(spec: ProductSpec | null, atlas?: HTMLCanvasElement): boolean {
    if (!spec) return false;
    if (this.owned.has(spec.id)) return true; // idempotent
    let slot = -1;
    for (let i = 0; i < this.level.sanctumSlots.length; i++) {
      if (!this.usedSlots.has(i)) {
        slot = i;
        break;
      }
    }
    if (slot < 0) return false; // the Sanctum is full
    let tex: THREE.Texture;
    let content: [number, number, number, number];
    const b = this.baked.get(spec.id);
    if (atlas) {
      tex = trackedCanvasTexture(atlas, true);
      (tex as THREE.CanvasTexture).wrapS = THREE.ClampToEdgeWrapping;
      (tex as THREE.CanvasTexture).wrapT = THREE.ClampToEdgeWrapping;
      content = scanAtlasContent(atlas);
      this.baked.set(spec.id, {
        atlas,
        texture: tex as THREE.CanvasTexture,
        content,
        radius: Math.max(spec.spriteW, spec.spriteH) * 0.5,
      });
    } else if (b) {
      tex = b.texture;
      content = b.content;
    } else {
      return false; // unknown relic with no atlas
    }
    const slotPos = this.level.sanctumSlots[slot];
    const facing = Math.atan2(this.level.spawn.x - slotPos.x, this.level.spawn.z - slotPos.z);
    const sprite = new ProductSprite(spec, tex, content, slotPos, facing, FLOOR_Y, PLINTH_H);
    sprite.setHover(false);
    sprite.setOwned(true);
    // slim gold plinth the relic stands on (travels when carried)
    const pw = Math.max(0.28, Math.min(1.1, spec.spriteW * 0.42 + 0.14));
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(pw, PLINTH_H, pw),
      new THREE.MeshStandardMaterial({
        color: 0xc9962e,
        roughness: 0.28,
        metalness: 1.0,
        emissive: 0x2a1c05,
        emissiveIntensity: 0.55,
        envMapIntensity: 1.2,
      })
    );
    plinth.position.y = PLINTH_H / 2;
    sprite.group.add(plinth);
    this.scene.add(sprite.group);
    const collider = this.footprintOf(spec, slotPos.x, slotPos.z);
    const prop: OwnedProp = { spec, sprite, plinth, slot, collider };
    this.owned.set(spec.id, prop);
    this.usedSlots.add(slot);
    this.ownedColliders.set(spec.id, collider);
    return true;
  }

  private footprintOf(spec: ProductSpec, x: number, z: number): Collider {
    const hw = Math.max(0.16, Math.min(1.4, spec.spriteW * 0.42));
    return { x0: x - hw, x1: x + hw, z0: z - hw * 0.8, z1: z + hw * 0.8 };
  }

  /** restore freely-placed relic positions from localStorage */
  applySavedLayout() {
    try {
      const raw = localStorage.getItem("celestia-layout-v2");
      if (!raw) return;
      const entries = JSON.parse(raw) as { id: string; x: number; z: number; f?: number }[];
      for (const e of entries) {
        const prop = this.owned.get(e.id);
        if (!prop || !Number.isFinite(e.x) || !Number.isFinite(e.z)) continue;
        if (this.collides(e.x, e.z)) continue; // world changed — keep the plinth
        const oldSlot = prop.slot;
        if (oldSlot >= 0) {
          this.usedSlots.delete(oldSlot);
          prop.slot = -1;
        }
        prop.sprite.group.position.set(e.x, 0, e.z);
        if (typeof e.f === "number") prop.sprite.group.rotation.y = e.f;
        prop.collider = this.footprintOf(prop.spec, e.x, e.z);
        this.ownedColliders.set(e.id, prop.collider);
      }
    } catch {
      /* corrupted layout — the plinths stand where they stood */
    }
  }

  private saveLayout() {
    try {
      const entries: { id: string; x: number; z: number; f: number }[] = [];
      for (const prop of this.owned.values()) {
        if (prop.slot === -1) {
          entries.push({
            id: prop.spec.id,
            x: +prop.sprite.group.position.x.toFixed(2),
            z: +prop.sprite.group.position.z.toFixed(2),
            f: +prop.sprite.group.rotation.y.toFixed(3),
          });
        }
      }
      localStorage.setItem("celestia-layout-v2", JSON.stringify(entries));
    } catch {
      /* sandboxed storage */
    }
  }

  /** R — pick up an owned relic you're aiming at (or place the one you hold) */
  toggleCarry() {
    if (this.paused) return;
    if (this.sitState) {
      this.standUp();
      return;
    }
    if (this.carrying) {
      this.placeCarried();
      return;
    }
    const prop = this.hoveredOwned;
    if (!prop) {
      this.audio.deny();
      return;
    }
    if (this.photoMode) this.exitPhotoMode();
    this.carrying = prop;
    this.ownedColliders.delete(prop.spec.id);
    const oldSlot = prop.slot;
    if (oldSlot >= 0) {
      this.usedSlots.delete(oldSlot);
      prop.slot = -1;
    }
    this.audio.lift();
    this.setPrompt({ kind: "place", verb: `PLACE ${prop.spec.name}`, spec: null });
    this.cb.onUseToast?.(`${prop.spec.name} — CARRIED · [E] TO PLACE`);
  }

  private placeCarried() {
    const prop = this.carrying;
    if (!prop) return;
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const x = this.pos.x + fwd.x * 1.35;
    const z = this.pos.z + fwd.z * 1.35;
    if (this.collides(x, z)) {
      this.audio.deny();
      this.cb.onUseToast?.("NO ROOM HERE — THE MARBLE IS TAKEN");
      return;
    }
    prop.sprite.group.position.set(x, 0, z);
    prop.sprite.group.rotation.y = this.yaw;
    prop.collider = this.footprintOf(prop.spec, x, z);
    this.ownedColliders.set(prop.spec.id, prop.collider);
    this.carrying = null;
    this.audio.interact();
    this.saveLayout();
    this.cb.onUseToast?.(`${prop.spec.name} — PLACED WHERE YOU STAND`);
  }

  // ── SITTING — sofas, benches, the good life ──

  private sitAt(x: number, z: number, yaw: number, eye: number) {
    this.sitState = {
      phase: "in",
      k: 0,
      from: { x: this.pos.x, z: this.pos.z, eye: this.camera.position.y, yaw: this.yaw, pitch: this.pitch },
      to: { x, z, eye, yaw },
    };
    this.moveInput.x = 0;
    this.moveInput.y = 0;
    this.vel.set(0, 0, 0);
    this.audio.sitThud();
    this.setPrompt({ kind: "stand", verb: "STAND", spec: null });
  }

  standUp() {
    if (!this.sitState) return;
    const s = this.sitState;
    // find open floor in front of the seat
    const fx = -Math.sin(s.to.yaw);
    const fz = -Math.cos(s.to.yaw);
    let standX = s.to.x + fx * 0.85;
    let standZ = s.to.z + fz * 0.85;
    if (this.collides(standX, standZ)) {
      standX = s.to.x - fx * 0.85;
      standZ = s.to.z - fz * 0.85;
    }
    if (this.collides(standX, standZ)) {
      standX = s.from.x;
      standZ = s.from.z;
    }
    this.pos.set(standX, EYE, standZ);
    this.sitState = null;
    this.keys.clear();
  }

  // ── PHOTO MODE — the VOIDCAM becomes a real camera ──

  enterPhotoMode() {
    if (this.photoMode) return;
    if (this.sitState) this.standUp();
    if (this.carrying) this.placeCarried();
    this.photoMode = true;
    this.tempPose = { name: "camera", until: Infinity };
    this.cb.onPhotoMode?.(true);
    this.audio.interact();
  }

  exitPhotoMode() {
    if (!this.photoMode) return;
    this.photoMode = false;
    this.photoFovK = 0;
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();
    if (this.tempPose && this.tempPose.until === Infinity) this.tempPose = null;
    this.cb.onPhotoMode?.(false);
  }

  shoot() {
    if (!this.photoMode) return;
    this.captureFlag = true;
    this.flashT = 0.28;
    this.audio.shutter();
  }

  isPhotoMode() {
    return this.photoMode;
  }

  // ══════════════════════════════════════════════════════════════════════
  // USE VERBS — every owned relic does something
  // ══════════════════════════════════════════════════════════════════════

  private useOwned(prop: OwnedProp) {
    const verb = prop.spec.use ?? "revere";
    switch (verb) {
      case "sit": {
        const eye = Math.max(0.95, Math.min(1.4, PLINTH_H + prop.spec.spriteH * 0.42 + 0.55));
        this.sitAt(
          prop.sprite.group.position.x,
          prop.sprite.group.position.z,
          prop.sprite.group.rotation.y,
          eye
        );
        break;
      }
      case "photo":
        this.enterPhotoMode();
        break;
      case "sip":
        this.blessedUntil = this.t + 45;
        this.tempPose = { name: "mug", until: this.t + 2.4 };
        this.level.sparkleBurst(this.pos.x, this.pos.z);
        this.audio.bell();
        this.cb.onUseToast?.("BLESSED — +18% SWIFTNESS FOR 45 SECONDS");
        break;
      case "wear":
        this.equipped = !this.equipped;
        this.tempPose = { name: "press", until: this.t + 0.9 };
        this.audio.interact();
        this.cb.onUseToast?.(this.equipped ? "CLOUDSTEP EQUIPPED — +25% SPEED" : "CLOUDSTEP STORED — SPEED RETURNED");
        break;
      case "read":
        this.tempPose = { name: "press", until: this.t + 1.2 };
        this.cb.onRead?.(prop.spec);
        break;
      case "light":
        this.lampOn = !this.lampOn;
        this.audio.interact();
        this.cb.onUseToast?.(this.lampOn ? "AURORA LAMP LIT — A HALO FOLLOWS YOU" : "AURORA LAMP DIMMED");
        break;
      case "cinema":
        this.cinemaUntil = this.t + 10;
        this.level.setMood("cinema");
        this.audio.interact();
        this.cb.onUseToast?.("MOVIE NIGHT — THE TEMPLE DIMS FOR TEN SECONDS");
        break;
      case "bloom":
        this.level.sparkleBurst(this.pos.x, this.pos.z);
        this.tempPose = { name: "revere", until: this.t + 1.6 };
        this.audio.pickup();
        this.cb.onUseToast?.("THE FERN SHEDS ITS ANGEL DUST OVER YOU");
        break;
      case "stars":
        this.level.starBoost(1.0);
        this.tempPose = { name: "revere", until: this.t + 1.8 };
        this.audio.pickup();
        this.cb.onUseToast?.("THE CHART BLOOMS — TWELVE STARS TWINKLE THROUGH THE OCULUS");
        break;
      case "dawn":
        this.dawnUntil = this.t + 6;
        this.level.setMood("dawn");
        this.level.starBoost(0.4);
        this.audio.bell();
        this.cb.onUseToast?.("A SUNRISE PASSES THROUGH THE MALL");
        break;
      case "ascend":
        this.ascendUntil = this.t + 12;
        this.tempPose = { name: "revere", until: this.t + 2.2 };
        this.level.sparkleBurst(this.pos.x, this.pos.z);
        this.audio.pickup();
        this.cb.onUseToast?.("SERAPH WINGS — TWELVE SECONDS ABOVE THE TEMPLE");
        break;
      case "harmony":
        this.level.orbBoost(5);
        this.audio.swell();
        this.tempPose = { name: "revere", until: this.t + 2.0 };
        this.cb.onUseToast?.("THE TEMPLE SINGS IN A-MAJOR ADD9");
        break;
      case "chime": {
        const now = new Date();
        const hh = now.getHours();
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ampm = hh >= 12 ? "PM" : "AM";
        const h12 = hh % 12 === 0 ? 12 : hh % 12;
        this.audio.bell();
        this.tempPose = { name: "press", until: this.t + 1.0 };
        this.cb.onUseToast?.(`THE TEMPLE READS THE HOUR — ${h12}:${mm} ${ampm}`);
        break;
      }
      default:
        // revere — the default reverence
        this.tempPose = { name: "revere", until: this.t + 1.8 };
        prop.sprite.setHover(true);
        setTimeout(() => prop.sprite.setHover(false), 1800);
        this.audio.pickup();
        this.cb.onUseToast?.(`YOU REVERE THE ${prop.spec.name}`);
        break;
    }
  }

  // ── stats / minimap ──

  getMinimap() {
    return {
      grid: this.level.grid,
      pool: this.level.pool,
      owned: [...this.owned.values()].map((p) => ({
        x: p.sprite.group.position.x,
        z: p.sprite.group.position.z,
      })),
    };
  }

  getStats(): EngineStats {
    return this.lastStats;
  }

  currentZone(): string {
    for (const z of this.level.zones) {
      if (this.pos.x >= z.x0 && this.pos.x <= z.x1 && this.pos.z >= z.z0 && this.pos.z <= z.z1) {
        return z.name;
      }
    }
    return "";
  }

  start() {
    this.clock.start();
    const loop = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(loop);
      const realDt = this.clock.getDelta();
      const dt = Math.min(0.05, realDt);
      this.t += dt;
      this.realT += realDt;
      this.update(dt);
      this.renderer.info.reset();
      // 1) floor mirror pass (the lagoon drinks the same target)
      if (this.mirrorOn) {
        this.level.renderReflection(
          this.renderer,
          this.scene,
          this.camera,
          this.sprites
            .concat([...this.owned.values()].map((o) => o.sprite))
            .map((s) => s.reflection) // hide fake pedestal mirrors
        );
      }
      // 2) main pass: scene → bloom → filmic output → screen shader grade
      (this.grade.uniforms as Record<string, { value: unknown }>).uTime.value = this.t;
      this.composer.render();
      // 3) THE HANDS — depth-cleared overlay pass above the post chain
      this.hands.render(this.renderer);
      // 4) VOIDCAM capture — same frame, same task, before the browser composites
      if (this.captureFlag) {
        this.captureFlag = false;
        try {
          this.cb.onPhoto?.(this.renderer.domElement.toDataURL("image/png"));
        } catch {
          /* canvas readback blocked — skip the shot */
        }
      }
      this.frames++;
      this.statAcc += realDt;
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
    this.hands.dispose();
    for (const s of this.sprites) s.dispose();
    for (const o of this.owned.values()) {
      o.sprite.dispose();
      o.plinth.geometry.dispose();
      (o.plinth.material as THREE.Material).dispose();
    }
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
    this.bloom.dispose();
    this.composer.dispose();
    this.grade.dispose();
    this.level.envRT.dispose();
    this.renderer.dispose();
    mem.reset();
  }

  // ══════════════════════════════════════════════════════════════════════
  // INTERNALS
  // ══════════════════════════════════════════════════════════════════════

  private resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.composer.setSize(w, h);
    this.hands.resize(w, h);
    const gu = this.grade.uniforms as Record<string, { value: unknown }>;
    (gu.uRes.value as THREE.Vector2).set(
      this.renderer.domElement.width || 1,
      this.renderer.domElement.height || 1
    );
  }

  private update(dt: number) {
    // ── buffs & timed moods decay ──
    if (this.cinemaUntil > 0 && this.t > this.cinemaUntil) {
      this.cinemaUntil = -1;
      this.level.setMood(null);
    }
    if (this.dawnUntil > 0 && this.t > this.dawnUntil) {
      this.dawnUntil = -1;
      this.level.setMood(null);
    }
    if (this.ascendUntil > 0 && this.t > this.ascendUntil) this.ascendUntil = -1;
    if (this.tempPose && this.t > this.tempPose.until) this.tempPose = null;
    if (this.blessedUntil > 0 && this.t > this.blessedUntil) this.blessedUntil = -1;
    // personal halo lamp
    const lampTarget = this.lampOn ? 2.4 : 0;
    this.personalLight.intensity += (lampTarget - this.personalLight.intensity) * Math.min(1, dt * 5);
    this.personalLight.position.set(this.pos.x, this.camera.position.y + 0.5, this.pos.z);

    // ── seated: camera rides the sit lerp, no walking ──
    if (this.sitState) {
      const s = this.sitState;
      if (s.phase === "in") {
        s.k = Math.min(1, s.k + dt * 2.8);
        if (s.k >= 1) s.phase = "hold";
      }
      const e = s.k * s.k * (3 - 2 * s.k); // smoothstep
      const x = s.from.x + (s.to.x - s.from.x) * e;
      const z = s.from.z + (s.to.z - s.from.z) * e;
      const eye = s.from.eye + (s.to.eye - s.from.eye) * e;
      let dy = s.to.yaw - s.from.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      const yaw = s.from.yaw + dy * e;
      this.camera.position.set(x, eye + Math.sin(this.t * 1.1) * 0.012, z);
      this.camera.rotation.set(this.pitch, yaw, 0);
      this.pos.set(s.to.x, EYE, s.to.z);
      this.lastStats.yaw = yaw;
      this.updateWorld(dt);
      this.updateHands(dt);
      return;
    }

    // ── movement input (keyboard + joystick) ──
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
    let speed = this.keys.has("shift") ? RUN : WALK;
    if (this.equipped) speed *= 1.25;
    if (this.blessedUntil > this.t) speed *= 1.18;
    if (this.ascendK > 0.4) speed *= 1.15;

    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    const targetVX = (fx * iz + rx * ix) * speed;
    const targetVZ = (fz * iz + rz * ix) * speed;
    const smooth = Math.min(1, dt * 10);
    this.vel.x += (targetVX - this.vel.x) * smooth;
    this.vel.z += (targetVZ - this.vel.z) * smooth;

    // axis-separated sliding collision (walls + water + tight AABBs).
    // stuck-guard: if already inside geometry (bad teleport, closing door of
    // a placed relic), let the pilgrim walk free instead of trapping them.
    const stuck = this.collides(this.pos.x, this.pos.z);
    const nx = this.pos.x + this.vel.x * dt;
    if (stuck || !this.collides(nx, this.pos.z)) this.pos.x = nx;
    else this.vel.x = 0;
    const nz = this.pos.z + this.vel.z * dt;
    if (stuck || !this.collides(this.pos.x, nz)) this.pos.z = nz;
    else this.vel.z = 0;

    // ── ascension (SERAPH WINGS) ──
    const ascendTarget = this.ascendUntil > this.t ? 1 : 0;
    this.ascendK += (ascendTarget - this.ascendK) * Math.min(1, dt * 1.6);
    const eyeY = EYE + (ASCEND_EYE - EYE) * this.ascendK;

    // head bob + footsteps
    const moveSpeed = Math.hypot(this.vel.x, this.vel.z);
    this.bobPhase += dt * (4.4 + moveSpeed * 1.15);
    const bobAmp = this.settings.headBob ? Math.min(1, moveSpeed / WALK) : 0;
    this.camera.position.set(
      this.pos.x,
      eyeY + Math.sin(this.bobPhase * 2) * 0.028 * bobAmp + (this.ascendK > 0 ? Math.sin(this.t * 2.2) * 0.02 * this.ascendK : 0),
      this.pos.z
    );
    this.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bobPhase) * 0.006 * bobAmp);
    if (bobAmp > 0.35 && Math.floor(this.bobPhase / Math.PI) !== this.lastStepBob) {
      this.lastStepBob = Math.floor(this.bobPhase / Math.PI);
      this.audio.footstep();
    }

    // ── photo mode fov lerp ──
    if (this.photoMode || this.photoFovK > 0.001) {
      const target = this.photoMode ? 1 : 0;
      this.photoFovK += (target - this.photoFovK) * Math.min(1, dt * 6);
      const fov = this.settings.fov + (PHOTO_FOV - this.settings.fov) * this.photoFovK;
      if (Math.abs(this.camera.fov - fov) > 0.05) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }
    }

    // ── carrying: the relic rides ahead of the camera ──
    if (this.carrying) {
      const prop = this.carrying;
      const tx = this.pos.x + fx * 1.35;
      const tz = this.pos.z + fz * 1.35;
      const g = prop.sprite.group.position;
      g.x += (tx - g.x) * Math.min(1, dt * 8);
      g.z += (tz - g.z) * Math.min(1, dt * 8);
      g.y = 0.32 + Math.sin(this.t * 2.6) * 0.05 + this.ascendK * 0.6;
      prop.sprite.group.rotation.y = this.yaw;
    }

    this.updateWorld(dt);
    this.updateHands(dt);
    this.updatePrompt(dt);
  }

  /** world animation shared by walk + seated states */
  private updateWorld(dt: number) {
    this.level.update(this.t, dt);
    for (const s of this.sprites) s.update(this.camera.position, this.t, dt);
    for (const o of this.owned.values()) o.sprite.update(this.camera.position, this.t, dt);

    // checkout blessing: bloom & exposure swell, then settle back
    if (this.celebrateT > 0) {
      this.celebrateT = Math.max(0, this.celebrateT - dt);
      const k = this.celebrateT / 2.2;
      if (this.bloom.enabled) {
        this.bloom.strength = 0.5 * this.settings.bloom + Math.sin((2.2 - this.celebrateT) * 9) * 0.3 * k;
      }
      this.renderer.toneMappingExposure = 1.04 + 0.12 * k;
    } else {
      if (this.bloom.enabled) this.bloom.strength = 0.5 * this.settings.bloom;
      let exposure = 1.04;
      if (this.dawnUntil > this.t) exposure += 0.18 * Math.min(1, (this.dawnUntil - this.t) / 2);
      if (this.flashT > 0) {
        this.flashT = Math.max(0, this.flashT - dt);
        exposure += this.flashT * 0.9;
      }
      this.renderer.toneMappingExposure = exposure;
    }

    // live stats for the automap
    this.lastStats.px = this.pos.x;
    this.lastStats.pz = this.pos.z;
    this.lastStats.yaw = this.yaw;
  }

  /** hands pose selection + sway update */
  private updateHands(dt: number) {
    if (this.tempPose) {
      this.hands.setPose(this.tempPose.name);
    } else if (this.photoMode) {
      this.hands.setPose("camera");
    } else if (this.carrying) {
      this.hands.setPose("carry");
    } else if (this.sitState) {
      this.hands.setPose("rest");
    } else if (this.prompt && (this.prompt.kind === "inspect" || this.prompt.kind === "use")) {
      this.hands.setPose("reach");
    } else {
      this.hands.setPose("idle");
    }
    this.hands.update(
      dt,
      this.t,
      { vx: this.lookVel.x, vy: this.lookVel.y },
      { phase: this.bobPhase, amp: this.settings.headBob ? Math.min(1, Math.hypot(this.vel.x, this.vel.z) / WALK) : 0 }
    );
    this.lookVel.x *= 0.86;
    this.lookVel.y *= 0.86;
  }

  /** HONEST collision: grid walls + water + tight AABB colliders */
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
        const v = g.cells[cz * g.w + cx];
        if (v === 1 || v === 2) return true; // walls & water block; pedestals/altar use AABBs
      }
    }
    // tight AABBs — level furniture + placed relics
    for (const c of this.level.colliders) {
      if (this.circleHitsAABB(x, z, r, c)) return true;
    }
    for (const c of this.ownedColliders.values()) {
      if (this.circleHitsAABB(x, z, r, c)) return true;
    }
    return false;
  }

  private circleHitsAABB(x: number, z: number, r: number, c: Collider): boolean {
    const cx = Math.max(c.x0, Math.min(x, c.x1));
    const cz = Math.max(c.z0, Math.min(z, c.z1));
    const dx = x - cx;
    const dz = z - cz;
    return dx * dx + dz * dz < r * r;
  }

  // ── prompt system: altar → owned → bench → shop ──
  private updatePrompt(dt: number) {
    if (this.sitState || this.carrying || this.photoMode) return; // static prompts already set
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);

    // altar rite — the creative checkout
    const ax = this.level.altar.pos.x - this.pos.x;
    const az = this.level.altar.pos.z - this.pos.z;
    const altarDist = Math.hypot(ax, az);
    const newAltarNear = altarDist < ALTAR_REACH && this.cartCount > 0;
    if (newAltarNear !== this.altarNear) {
      this.altarNear = newAltarNear;
      this.setPrompt(
        newAltarNear
          ? { kind: "altar", verb: "RITE OF ACQUISITION", spec: null }
          : null
      );
      if (newAltarNear) this.audio.hover();
    }
    if (this.altarNear) {
      this.updateHover(null, null, null);
      return;
    }

    // owned relics in reach & crosshair
    let bestOwned: OwnedProp | null = null;
    let bestOwnedScore = -1;
    for (const o of this.owned.values()) {
      if (o === this.carrying) continue;
      const dx = o.sprite.group.position.x - this.camera.position.x;
      const dz = o.sprite.group.position.z - this.camera.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > REACH) continue;
      const dot = (dx / dist) * fwd.x + (dz / dist) * fwd.z;
      if (dot < 0.6) continue;
      const score = dot * 2 - dist * 0.3;
      if (score > bestOwnedScore) {
        bestOwnedScore = score;
        bestOwned = o;
      }
    }
    // promenade benches
    let bestBench: BenchInfo | null = null;
    let bestBenchScore = -1;
    for (const b of this.level.benches) {
      const dx = b.pos.x - this.camera.position.x;
      const dz = b.pos.z - this.camera.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > BENCH_REACH) continue;
      const dot = (dx / dist) * fwd.x + (dz / dist) * fwd.z;
      if (dot < 0.55) continue;
      const score = dot * 2 - dist * 0.3;
      if (score > bestBenchScore) {
        bestBenchScore = score;
        bestBench = b;
      }
    }
    // shop sprites
    let best: ProductSprite | null = null;
    let bestScore = -1;
    for (const s of this.sprites) {
      const dx = s.group.position.x - this.camera.position.x;
      const dz = s.group.position.z - this.camera.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > REACH) continue;
      const dot = (dx / dist) * fwd.x + (dz / dist) * fwd.z;
      if (dot < 0.62) continue;
      const score = dot * 2 - dist * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }

    const hoverOwned = bestOwned;
    const hoverBench = bestBench;
    if (hoverOwned) {
      this.updateHover(null, hoverOwned, null);
      this.setPrompt({ kind: "use", verb: `USE ${hoverOwned.spec.name}`, spec: hoverOwned.spec });
    } else if (hoverBench) {
      this.updateHover(null, null, hoverBench);
      this.setPrompt({ kind: "sit", verb: "SIT AWHILE", spec: null });
    } else if (best !== this.hovered) {
      this.updateHover(best, null, null);
      this.setPrompt(best ? { kind: "inspect", verb: `INSPECT ${best.spec.name}`, spec: best.spec } : null);
    } else if (this.prompt) {
      this.promptTimer += dt;
    }
  }

  private updateHover(shop: ProductSprite | null, ownedProp: OwnedProp | null, bench: BenchInfo | null) {
    if (shop !== this.hovered) {
      this.hovered?.setHover(false);
      this.hovered = shop;
      shop?.setHover(true);
      if (shop) this.audio.hover();
    }
    this.hoveredOwned = ownedProp;
    this.hoveredBench = bench;
  }

  private setPrompt(p: PromptInfo | null) {
    const changed =
      (p === null) !== (this.prompt === null) ||
      (p && this.prompt && (p.kind !== this.prompt.kind || p.verb !== this.prompt.verb));
    this.prompt = p;
    if (changed) {
      this.cb.onPrompt?.(p);
    }
  }

  private tryInteract() {
    if (this.sitState) {
      this.standUp();
      return;
    }
    if (this.carrying) {
      this.placeCarried();
      return;
    }
    if (this.altarNear) {
      this.audio.interact();
      this.cb.onAltarRite?.();
      return;
    }
    if (this.hoveredOwned) {
      this.audio.interact();
      this.useOwned(this.hoveredOwned);
      return;
    }
    if (this.hoveredBench) {
      const b = this.hoveredBench;
      this.sitAt(b.pos.x, b.pos.z, b.yaw, b.seatY + 0.62);
      return;
    }
    if (!this.prompt?.spec) {
      this.audio.deny();
      return;
    }
    this.audio.interact();
    this.cb.onSelect?.(this.prompt.spec);
  }

  private emitStats() {
    const fps = Math.round(this.frames / Math.max(0.001, this.statAcc));
    const buffs: { label: string; sec: number }[] = [];
    if (this.equipped) buffs.push({ label: "CLOUDSTEP +25%", sec: -1 });
    if (this.blessedUntil > this.t) buffs.push({ label: "BLESSED +18%", sec: this.blessedUntil - this.t });
    if (this.lampOn) buffs.push({ label: "AURORA HALO", sec: -1 });
    if (this.ascendUntil > this.t) buffs.push({ label: "ASCENDING", sec: this.ascendUntil - this.t });
    const zone = this.currentZone();
    if (zone !== this.zone) {
      this.zone = zone;
      this.cb.onZone?.(zone);
    }
    this.lastStats = {
      fps,
      vramMB: mem.usedMB,
      drawCalls: this.renderer.info.render.calls,
      sprites: this.sprites.length + this.owned.size,
      px: this.pos.x,
      pz: this.pos.z,
      yaw: this.yaw,
      zone,
      buffs,
    };
    // adaptive quality governor: glory → balanced → lite
    if (this.realT > this.qualityWarmup && !this.qualityLocked) {
      if (fps < 26 && this.quality === "glory") {
        this.lowFpsStreak++;
        if (this.lowFpsStreak >= 4) {
          this.setQuality("balanced");
          this.lowFpsStreak = 0;
        }
      } else if (fps < 22 && this.quality === "balanced") {
        this.lowFpsStreak++;
        if (this.lowFpsStreak >= 6) {
          this.setQuality("lite");
          this.lowFpsStreak = 0;
        }
      } else {
        this.lowFpsStreak = 0;
      }
    }
    this.cb.onStats?.(this.lastStats);
  }
}
