import * as THREE from "three";
import type { QualityMode } from "./types";

// ─── SETTINGS — v2.0 the pilgrim's control over the light itself ────────────
// Quality tiers (glory / balanced / lite), six SCREEN SHADER grades — from
// Pearly neutral to a full RETRO DOOM posterize+dither homage — plus FOV,
// sensitivity, bloom, head-bob, dust, god rays and volume. Persisted to
// localStorage, applied live through the engine.

export type ShaderGrade = "pearl" | "golden" | "moonlit" | "scriptorium" | "retro" | "vivid";

export interface Settings {
  quality: QualityMode;
  grade: ShaderGrade;
  bloom: number; // 0 .. 1.4 (strength multiplier)
  fov: number; // 60 .. 100
  sensitivity: number; // 0.4 .. 2
  invertY: boolean;
  headBob: boolean;
  dust: number; // 0 .. 2 (density multiplier)
  godRays: boolean;
  volume: number; // 0 .. 1
  showFps: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  quality: "glory",
  grade: "pearl",
  bloom: 1,
  fov: 74,
  sensitivity: 1,
  invertY: false,
  headBob: true,
  dust: 1,
  godRays: true,
  volume: 0.9,
  showFps: true,
};

const KEY = "celestia-settings-v2";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sandboxed storage — settings stay in memory */
  }
}

// ── quality tiers ──
export const QUALITY_TIERS: Record<
  QualityMode,
  { label: string; pixelRatio: number; mirror: boolean; bloom: boolean; desc: string }
> = {
  glory: {
    label: "GLORY",
    pixelRatio: 2,
    mirror: true,
    bloom: true,
    desc: "Everything on. Mirror marble, bloom, full pixels.",
  },
  balanced: {
    label: "BALANCED",
    pixelRatio: 1.5,
    mirror: true,
    bloom: true,
    desc: "Mirror stays, softer pixels, gentler bloom.",
  },
  lite: {
    label: "LITE",
    pixelRatio: 1,
    mirror: false,
    bloom: false,
    desc: "SwiftShader-friendly. Analytic marble, no post.",
  },
};

// ── screen shader grades ──
export interface GradeParams {
  label: string;
  desc: string;
  tintShadow: [number, number, number];
  tintHigh: [number, number, number];
  saturation: number;
  contrast: number;
  gain: number;
  vignette: number;
  grain: number;
  scan: number;
  posterize: number; // 0 = off, else levels
  dither: number;
}

export const GRADES: Record<ShaderGrade, GradeParams> = {
  pearl: {
    label: "PEARL",
    desc: "The temple as built — neutral, luminous, honest.",
    tintShadow: [1.0, 1.0, 1.0],
    tintHigh: [1.0, 1.0, 1.0],
    saturation: 1.0,
    contrast: 1.0,
    gain: 1.0,
    vignette: 0.16,
    grain: 0.015,
    scan: 0.0,
    posterize: 0,
    dither: 0,
  },
  golden: {
    label: "GOLDEN HOUR",
    desc: "Warm gilded highlights, honeyed shadows. Rome at 6 pm.",
    tintShadow: [1.05, 0.95, 0.82],
    tintHigh: [1.14, 1.02, 0.86],
    saturation: 1.12,
    contrast: 1.04,
    gain: 1.04,
    vignette: 0.26,
    grain: 0.02,
    scan: 0.0,
    posterize: 0,
    dither: 0,
  },
  moonlit: {
    label: "MOONLIT",
    desc: "Cool aquamarine night — the lagoon owns the mall.",
    tintShadow: [0.82, 0.94, 0.98],
    tintHigh: [0.94, 1.0, 1.04],
    saturation: 0.9,
    contrast: 1.1,
    gain: 0.94,
    vignette: 0.3,
    grain: 0.028,
    scan: 0.0,
    posterize: 0,
    dither: 0,
  },
  scriptorium: {
    label: "SCRIPTORIUM",
    desc: "Aged vellum and candle-wax. The Academy's own grade.",
    tintShadow: [0.86, 0.8, 0.68],
    tintHigh: [1.08, 1.0, 0.84],
    saturation: 0.55,
    contrast: 1.05,
    gain: 0.98,
    vignette: 0.4,
    grain: 0.07,
    scan: 0.0,
    posterize: 0,
    dither: 0,
  },
  retro: {
    label: "RETRO DOOM",
    desc: "1993 calls: crushed palette, Bayer dither, scanlines.",
    tintShadow: [0.92, 0.88, 0.86],
    tintHigh: [1.05, 1.0, 0.95],
    saturation: 1.3,
    contrast: 1.18,
    gain: 1.06,
    vignette: 0.3,
    grain: 0.04,
    scan: 0.35,
    posterize: 12,
    dither: 0.55,
  },
  vivid: {
    label: "VIVID",
    desc: "Punchy showroom gloss — gold like lacquer, teal like glass.",
    tintShadow: [0.96, 0.97, 1.0],
    tintHigh: [1.06, 1.03, 0.99],
    saturation: 1.38,
    contrast: 1.14,
    gain: 1.08,
    vignette: 0.18,
    grain: 0.012,
    scan: 0.0,
    posterize: 0,
    dither: 0,
  },
};

// ── the grade pass shader (runs after the filmic output, in sRGB space) ──
export const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTintShadow: { value: new THREE.Vector3(1, 1, 1) },
    uTintHigh: { value: new THREE.Vector3(1, 1, 1) },
    uSaturation: { value: 1.0 },
    uContrast: { value: 1.0 },
    uGain: { value: 1.0 },
    uVignette: { value: 0.16 },
    uGrain: { value: 0.015 },
    uScan: { value: 0.0 },
    uPosterize: { value: 0.0 },
    uDither: { value: 0.0 },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec3 uTintShadow;
    uniform vec3 uTintHigh;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uGain;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uScan;
    uniform float uPosterize;
    uniform float uDither;
    uniform float uTime;
    uniform vec2 uRes;
    varying vec2 vUv;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    float bayer4(vec2 p) {
      vec2 q = floor(mod(p, 4.0));
      float b[16];
      b[0]=0.0;  b[1]=8.0;  b[2]=2.0;  b[3]=10.0;
      b[4]=12.0; b[5]=4.0;  b[6]=14.0; b[7]=6.0;
      b[8]=3.0;  b[9]=11.0; b[10]=1.0; b[11]=9.0;
      b[12]=15.0;b[13]=7.0; b[14]=13.0;b[15]=5.0;
      int i = int(q.y * 4.0 + q.x);
      float v = 0.0;
      for (int j = 0; j < 16; j++) { if (j == i) v = b[j]; }
      return v / 16.0;
    }

    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;

      // gain + dual-tone tint (shadows vs highlights)
      col *= uGain;
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      vec3 shadowTint = mix(vec3(1.0), uTintShadow, smoothstep(0.5, 0.0, luma));
      vec3 highTint = mix(vec3(1.0), uTintHigh, smoothstep(0.4, 1.0, luma));
      col *= shadowTint * highTint;

      // saturation
      luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, uSaturation);

      // contrast around mid grey
      col = (col - 0.5) * uContrast + 0.5;

      // vignette (feeds the posterizer so RETRO stays hard-crushed)
      vec2 d = vUv - 0.5;
      float v = 1.0 - uVignette * smoothstep(0.35, 0.85, length(d) * 1.35);
      col *= v;

      // film grain (feeds INTO the posterizer so retro stays crushed)
      float g = hash(vUv * uRes + fract(uTime) * 100.0) - 0.5;
      col += g * uGrain;

      // scanlines — brightness modulation, Doom-monitor style (pre-posterize
      // so RETRO's crushed palette stays mathematically crushed)
      if (uScan > 0.001) {
        float sc = sin(vUv.y * uRes.y * 3.14159);
        col *= 1.0 - uScan * 0.5 * (0.5 + 0.5 * sc);
      }

      // RETRO DOOM: posterize + ordered dither (the final word on color)
      if (uPosterize > 0.5) {
        float levels = uPosterize;
        float dith = (bayer4(gl_FragCoord.xy) - 0.5) * uDither * (1.0 / levels);
        col = floor((col + dith) * levels + 0.5) / levels;
      }

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};

export function gradeParamsToUniforms(p: GradeParams, u: Record<string, { value: unknown }>) {
  (u.uTintShadow.value as THREE.Vector3).set(...p.tintShadow);
  (u.uTintHigh.value as THREE.Vector3).set(...p.tintHigh);
  u.uSaturation.value = p.saturation;
  u.uContrast.value = p.contrast;
  u.uGain.value = p.gain;
  u.uVignette.value = p.vignette;
  u.uGrain.value = p.grain;
  u.uScan.value = p.scan;
  u.uPosterize.value = p.posterize;
  u.uDither.value = p.dither;
}
