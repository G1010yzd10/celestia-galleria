import * as THREE from "three";
import type { ProductSpec } from "./types";
import { ANGLES } from "./baker";
import { texGlow, texBeam } from "./textures";
import { trackedCanvasTexture } from "./memory";

// ─── Billboard sprite system — 9-frame Doom rotation + mirrored reflection ──

const SPRITE_VERT = /* glsl */ `
  uniform float uFrame;
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = vec2(uv.x / ${ANGLES}.0 + uFrame / ${ANGLES}.0, uv.y);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const SPRITE_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uReflect;
  uniform float uHolo;
  uniform float uTime;
  uniform vec3 uTint;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    vec4 c = texture2D(map, vUv);
    if (c.a < 0.28) discard;
    // vertical fade only for the mirrored reflection copy
    float fade = mix(1.0, 0.16, uReflect * vUv.y);
    // hologram scanline shimmer when hovered
    float scan = 0.92 + 0.08 * sin(vUv.y * 90.0 + uTime * 7.0);
    vec3 col = c.rgb * uTint * mix(1.0, scan, uHolo);
    float a = c.a * uOpacity * fade * mix(1.0, 0.85 + 0.15 * sin(uTime * 5.0), uHolo);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

const PLANE = new THREE.PlaneGeometry(1, 1);
// shared GPU textures — one upload for every ring / beam in the shop.
// Lazy: module-level document access would break SSR prerendering.
let _ringTexture: THREE.CanvasTexture | null = null;
let _beamTexture: THREE.CanvasTexture | null = null;
function ringTexture(): THREE.CanvasTexture {
  if (!_ringTexture) _ringTexture = trackedCanvasTexture(texGlow(), false);
  return _ringTexture;
}
function beamTexture(): THREE.CanvasTexture {
  if (!_beamTexture) _beamTexture = trackedCanvasTexture(texBeam(), false);
  return _beamTexture;
}

function spriteMaterial(map: THREE.Texture, reflect: boolean): THREE.ShaderMaterial {
  const m = new THREE.ShaderMaterial({
    vertexShader: SPRITE_VERT,
    fragmentShader: SPRITE_FRAG,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        map: { value: null },
        uFrame: { value: 0 },
        uOpacity: { value: reflect ? 0.42 : 1.0 },
        uReflect: { value: reflect ? 1 : 0 },
        uHolo: { value: 0 },
        uTime: { value: 0 },
        uTint: { value: new THREE.Color(0xffffff) },
      },
    ]),
    transparent: true,
    depthTest: !reflect,
    depthWrite: !reflect,
    side: THREE.DoubleSide,
    fog: true,
  });
  (m.uniforms as Record<string, { value: unknown }>).map.value = map;
  return m;
}

function makeTag(spec: ProductSpec, qty: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 56;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(8,12,14,0.78)";
  ctx.fillRect(0, 8, 160, 40);
  ctx.strokeStyle = `#${spec.accent.toString(16).padStart(6, "0")}`;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 9, 158, 38);
  ctx.font = "bold 17px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e8f6f3";
  ctx.fillText(spec.name.slice(0, 15), 80, 22);
  ctx.fillStyle = "#fbbf24";
  ctx.fillText(
    qty > 0 ? `CRED ${spec.price} [x${qty}]` : `CRED ${spec.price}`,
    80,
    40
  );
  return c;
}

export class ProductSprite {
  readonly mesh: THREE.Mesh;
  readonly reflection: THREE.Mesh;
  readonly ring: THREE.Mesh;
  readonly beam: THREE.Mesh;
  readonly tag: THREE.Sprite;
  readonly group = new THREE.Group();
  readonly spec: ProductSpec;

  private mat: THREE.ShaderMaterial;
  private rmat: THREE.ShaderMaterial;
  private tagCanvas: HTMLCanvasElement;
  private tagTex: THREE.CanvasTexture;
  private frame = 0;
  private hover = false;
  private bob = Math.random() * Math.PI * 2;
  private baseY: number;

  constructor(
    spec: ProductSpec,
    texture: THREE.Texture,
    /** alpha content box of the atlas, fractions [y0, y1, x0, x1] (y from TOP) */
    content: [number, number, number, number],
    pos: THREE.Vector3,
    facing: number,
    floorY: number,
    pedestalTop: number
  ) {
    this.spec = spec;
    this.mat = spriteMaterial(texture, false);
    this.rmat = spriteMaterial(texture, true);

    // plane sized so the *content* (not the frame) matches spec.sprite size,
    // grounded so content-bottom rests on the pedestal top.
    const [y0, y1, x0, x1] = content;
    const ch = Math.max(0.2, y1 - y0);
    const cw = Math.max(0.2, x1 - x0);
    const planeH = spec.spriteH / ch;
    const planeW = spec.spriteW / cw;
    this.baseY = pedestalTop + 0.01 + (y1 - 0.5) * planeH;

    this.mesh = new THREE.Mesh(PLANE, this.mat);
    this.mesh.scale.set(planeW, planeH, 1);
    this.mesh.position.set(0, this.baseY, 0);
    this.mesh.renderOrder = 3;

    // mirrored copy across the pedestal-top plane (fake mirror, zero cost)
    const refH = planeH;
    this.reflection = new THREE.Mesh(PLANE, this.rmat);
    this.reflection.scale.set(planeW, -refH, 1);
    this.reflection.position.set(0, 2 * pedestalTop - this.baseY, 0);
    this.reflection.renderOrder = 2;

    // glow ring on the pedestal
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTexture(),
      color: spec.accent,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
      fog: true,
    });
    this.ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.set(0, pedestalTop + 0.012, 0);
    this.ring.scale.set(1.15, 1.15, 1);
    this.ring.renderOrder = 4;

    // hologram beam behind the product
    const beamMat = new THREE.MeshBasicMaterial({
      map: beamTexture(),
      color: spec.accent,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.16,
      side: THREE.DoubleSide,
      fog: true,
    });
    this.beam = new THREE.Mesh(PLANE, beamMat);
    this.beam.scale.set(spec.spriteW * 1.5, pedestalTop - floorY + spec.spriteH * 1.6, 1);
    this.beam.position.set(0, (pedestalTop + floorY + spec.spriteH) * 0.5 - 0.2, -0.28);
    this.beam.renderOrder = 1;

    // floating price tag
    this.tagCanvas = makeTag(spec, 0);
    this.tagTex = trackedCanvasTexture(this.tagCanvas, false);
    this.tag = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.tagTex,
        transparent: true,
        depthTest: true,
        fog: true,
      })
    );
    this.tag.scale.set(0.92, 0.32, 1);
    this.tag.position.set(0, this.baseY + planeH * 0.5 + 0.28, 0);
    this.tag.renderOrder = 5;

    this.group.position.copy(pos);
    this.group.rotation.y = facing;
    this.group.add(this.mesh, this.reflection, this.ring, this.beam, this.tag);
  }

  setHover(h: boolean) {
    this.hover = h;
  }

  updateTag(qty: number) {
    const c = makeTag(this.spec, qty);
    this.tagCanvas.width = c.width;
    this.tagCanvas.height = c.height;
    this.tagCanvas.getContext("2d")!.drawImage(c, 0, 0);
    this.tagTex.needsUpdate = true;
  }

  /** swap in a freshly baked/uploaded atlas texture (asset pipeline) */
  swapTexture(texture: THREE.Texture, content?: [number, number, number, number]) {
    this.mat.uniforms.map.value = texture;
    this.rmat.uniforms.map.value = texture;
    void content;
  }

  update(camPos: THREE.Vector3, t: number, dt: number) {
    const facing = this.group.rotation.y;
    // bearing from sprite to camera (0 = +Z)
    const g = Math.atan2(camPos.x - this.group.position.x, camPos.z - this.group.position.z);
    // billboard: compensate for the group's facing so world yaw = bearing
    this.mesh.rotation.y = g - facing;
    this.reflection.rotation.y = g - facing;
    // 9-frame rotation: relative bearing vs the sprite's facing
    const rel = (((g - facing) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const frame = Math.round(rel / ((Math.PI * 2) / ANGLES)) % ANGLES;
    if (frame !== this.frame) {
      this.frame = frame;
      this.mat.uniforms.uFrame.value = frame;
      this.rmat.uniforms.uFrame.value = frame;
    }

    this.mat.uniforms.uTime.value = t;
    this.rmat.uniforms.uTime.value = t;

    // hover holo pulse + gentle idle bob
    const targetHolo = this.hover ? 1 : 0;
    const u = this.mat.uniforms.uHolo as { value: number };
    u.value += (targetHolo - u.value) * Math.min(1, dt * 8);

    this.bob += dt * (this.hover ? 3.4 : 1.1);
    const bobY = Math.sin(this.bob) * (this.hover ? 0.045 : 0.014);
    this.mesh.position.y = this.baseY + bobY;
    this.tag.position.y = this.baseY + this.mesh.scale.y * 0.5 + 0.3 + Math.sin(this.bob * 0.8) * 0.03;

    const ringMat = this.ring.material as THREE.MeshBasicMaterial;
    const pulse = this.hover ? 0.75 + 0.25 * Math.sin(t * 6) : 0.42;
    ringMat.opacity += (pulse - ringMat.opacity) * Math.min(1, dt * 8);
    const rs = this.hover ? 1.32 + 0.06 * Math.sin(t * 5) : 1.15;
    this.ring.scale.set(rs, rs, 1);

    const beamMat = this.beam.material as THREE.MeshBasicMaterial;
    beamMat.opacity = this.hover ? 0.3 + 0.1 * Math.sin(t * 4) : 0.14;
  }

  dispose() {
    this.mat.dispose();
    this.rmat.dispose();
    (this.ring.material as THREE.Material).dispose();
    (this.beam.material as THREE.Material).dispose();
    (this.tag.material as THREE.Material).dispose();
    this.tagTex.dispose();
    this.ring.geometry.dispose();
  }
}
