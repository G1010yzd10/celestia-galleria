(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/doom/types.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ─── CELESTIA GALLERIA ✦ :: shared types ────────────────────────────────────
__turbopack_context__.s([
    "CELL",
    ()=>CELL,
    "MAP_ART",
    ()=>MAP_ART,
    "parseMap",
    ()=>parseMap
]);
const CELL = 1.2;
const MAP_ART = [
    "################",
    "#..............#",
    "#..P........P..#",
    "#..............#",
    "#...~~~~~~~~...#",
    "#...~~~~~~~~...#",
    "#...~~~~~~~~...#",
    "#..P.~~~~~~~.P.#",
    "#..............#",
    "#..P.......P...#",
    "#..............#",
    "#..P........P..#",
    "#......^.......#",
    "################"
];
function parseMap() {
    const h = MAP_ART.length;
    const w = MAP_ART[0].length;
    const cells = new Uint8Array(w * h);
    for(let z = 0; z < h; z++){
        for(let x = 0; x < w; x++){
            const c = MAP_ART[z][x];
            cells[z * w + x] = c === "#" ? 1 : c === "~" ? 2 : c === "P" ? 3 : 0;
        }
    }
    return {
        cells,
        w,
        h,
        cell: CELL
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/textures.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "texBeam",
    ()=>texBeam,
    "texCeil",
    ()=>texCeil,
    "texFloor",
    ()=>texFloor,
    "texGlow",
    ()=>texGlow,
    "texPedestal",
    ()=>texPedestal,
    "texSign",
    ()=>texSign,
    "texWall",
    ()=>texWall
]);
// ─── Procedural texture forge — CELESTIAL EDITION ───────────────────────────
// Ivory marble, gold inlay, mother-of-pearl. Every texture is still painted on
// a tiny canvas: zero downloaded assets, VRAM stays inside the 4 MB club.
const S = 128;
function makeCanvas(w = S, h = S) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
}
function noise(ctx, w, h, n = 900, alpha = 0.05) {
    for(let i = 0; i < n; i++){
        const x = Math.random() * w;
        const y = Math.random() * h;
        const v = Math.random() > 0.5 ? 255 : 0;
        ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
        ctx.fillRect(x, y, 1, 1);
    }
}
/** flowing marble vein — the signature of divine stone */ function vein(ctx, w, h, color, width, alpha, seed = 0) {
    let x = (Math.sin(seed * 12.9) * 0.5 + 0.5) * w;
    let y = -10;
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    while(y < h + 10){
        y += 8 + Math.sin(seed * 7.7) * 5;
        x += Math.sin(y * 0.09 + seed * 31.7) * 14;
        x = Math.max(-8, Math.min(w + 8, x));
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
}
/** gold dot inlay */ function goldRivet(ctx, x, y, r = 3) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r);
    g.addColorStop(0, "rgba(255,232,170,0.95)");
    g.addColorStop(0.6, "rgba(201,150,46,0.9)");
    g.addColorStop(1, "rgba(90,62,18,0.9)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}
function texWall() {
    const c = makeCanvas();
    const ctx = c.getContext("2d");
    // ivory marble base
    const base = ctx.createLinearGradient(0, 0, S, S);
    base.addColorStop(0, "#f6efdd");
    base.addColorStop(0.5, "#efe5cd");
    base.addColorStop(1, "#e7dabf");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    // marble veins (soft grey-gold)
    for(let i = 0; i < 5; i++)vein(ctx, S, S, i % 2 ? "rgba(150,132,96,1)" : "rgba(120,128,120,1)", 1.6, 0.16, i * 3.1 + 0.7);
    vein(ctx, S, S, "rgba(201,150,46,1)", 1.2, 0.28, 9.4);
    vein(ctx, S, S, "rgba(201,150,46,1)", 0.8, 0.2, 2.2);
    // raised panels — pearl slabs
    const plates = [
        [
            4,
            4,
            120,
            58
        ],
        [
            4,
            68,
            58,
            56
        ],
        [
            66,
            68,
            58,
            56
        ]
    ];
    for (const [x, y, w, h] of plates){
        const g = ctx.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, "rgba(255,252,244,0.92)");
        g.addColorStop(0.5, "rgba(244,236,218,0.9)");
        g.addColorStop(1, "rgba(226,214,188,0.92)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
        // gold inlay border
        ctx.strokeStyle = "rgba(176,128,40,0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        ctx.strokeStyle = "rgba(255,230,160,0.9)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    }
    // celestial aqua glow slit (breathing sanctum light)
    ctx.fillStyle = "rgba(64,222,208,0.5)";
    for(let i = 0; i < 5; i++)ctx.fillRect(74, 78 + i * 9, 42, 3);
    ctx.fillStyle = "rgba(64,222,208,0.10)";
    for(let i = 0; i < 5; i++)ctx.fillRect(72, 77 + i * 9, 46, 5);
    goldRivet(ctx, 10, 10);
    goldRivet(ctx, S - 10, 10);
    goldRivet(ctx, 10, S - 10);
    goldRivet(ctx, S - 10, S - 10);
    goldRivet(ctx, 64, 10);
    goldRivet(ctx, 64, S - 10);
    noise(ctx, S, S, 700, 0.03);
    return c;
}
function texFloor() {
    const c = makeCanvas();
    const ctx = c.getContext("2d");
    // pearl base with faint opal hue shifts
    const base = ctx.createLinearGradient(0, 0, S, S);
    base.addColorStop(0, "#eef2ee");
    base.addColorStop(0.35, "#e9f0f0");
    base.addColorStop(0.65, "#f0ece4");
    base.addColorStop(1, "#e8eee9");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    // opal iridescent washes
    const washes = [
        [
            "rgba(180,235,225,0.5)",
            0.35
        ],
        [
            "rgba(235,215,245,0.4)",
            0.55
        ],
        [
            "rgba(250,230,190,0.45)",
            0.75
        ]
    ];
    for (const [col, y0] of washes){
        const g = ctx.createRadialGradient(S * 0.5, S * y0, 4, S * 0.5, S * y0, S * 0.6);
        g.addColorStop(0, col);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, S, S);
    }
    // gold veins
    for(let i = 0; i < 4; i++)vein(ctx, S, S, "rgba(198,146,52,1)", 1.3, 0.30, i * 4.3 + 1.3);
    vein(ctx, S, S, "rgba(255,224,150,1)", 0.9, 0.35, 6.1);
    // 2×2 slab seams
    ctx.strokeStyle = "rgba(176,166,140,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, S);
    ctx.moveTo(0, 64);
    ctx.lineTo(S, 64);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(65, 0);
    ctx.lineTo(65, S);
    ctx.moveTo(0, 65);
    ctx.lineTo(S, 65);
    ctx.stroke();
    noise(ctx, S, S, 900, 0.025);
    return c;
}
function texCeil() {
    const c = makeCanvas();
    const ctx = c.getContext("2d");
    // deep bronze base (dark ceiling = contrast for mirror reflections + oculus)
    const base = ctx.createLinearGradient(0, 0, S, S);
    base.addColorStop(0, "#241a0e");
    base.addColorStop(0.5, "#2e2214");
    base.addColorStop(1, "#1e150b");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, S, S);
    // coffer trays — rich umber with warm inner glow
    for(let y = 0; y < 4; y++)for(let x = 0; x < 4; x++){
        const px = x * 32, py = y * 32;
        const g = ctx.createLinearGradient(px, py, px + 32, py + 32);
        g.addColorStop(0, "#4a3517");
        g.addColorStop(0.5, "#3a2a11");
        g.addColorStop(1, "#2a1e0c");
        ctx.fillStyle = g;
        ctx.fillRect(px + 4, py + 4, 24, 24);
        // glowing sanctum tile at tray center
        ctx.fillStyle = "rgba(255,220,150,0.85)";
        ctx.fillRect(px + 11, py + 11, 10, 10);
        ctx.fillStyle = "rgba(255,246,220,0.95)";
        ctx.fillRect(px + 13, py + 13, 6, 6);
    }
    // gold ribs
    ctx.strokeStyle = "rgba(212,158,58,0.9)";
    ctx.lineWidth = 3;
    for(let i = 0; i <= 4; i++){
        ctx.beginPath();
        ctx.moveTo(i * 32, 0);
        ctx.lineTo(i * 32, S);
        ctx.moveTo(0, i * 32);
        ctx.lineTo(S, i * 32);
        ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,230,170,0.5)";
    ctx.lineWidth = 1;
    for(let i = 0; i <= 4; i++){
        ctx.beginPath();
        ctx.moveTo(i * 32 + 1, 0);
        ctx.lineTo(i * 32 + 1, S);
        ctx.moveTo(0, i * 32 + 1);
        ctx.lineTo(S, i * 32 + 1);
        ctx.stroke();
    }
    noise(ctx, S, S, 500, 0.05);
    return c;
}
function texPedestal() {
    const c = makeCanvas(64, 128);
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, "#e9e0c8");
    g.addColorStop(0.5, "#f4eeda");
    g.addColorStop(1, "#ddd2b4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 128);
    // marble veins
    for(let i = 0; i < 3; i++)vein(ctx, 64, 128, "rgba(140,125,95,1)", 1.1, 0.18, i * 5.3 + 0.4);
    // gold laurel band
    ctx.fillStyle = "rgba(201,150,46,0.16)";
    ctx.fillRect(0, 6, 64, 22);
    ctx.strokeStyle = "rgba(186,134,44,0.95)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 7, 62, 20);
    ctx.strokeStyle = "rgba(255,224,150,0.9)";
    ctx.lineWidth = 1;
    // laurel leaves
    for(let x = 6; x < 60; x += 8){
        ctx.beginPath();
        ctx.ellipse(x + 3, 17, 3, 5, 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(x + 3, 17, 3, 5, -0.5, 0, Math.PI * 2);
        ctx.stroke();
    }
    // aqua glow seam at top
    ctx.fillStyle = "rgba(64,222,208,0.9)";
    ctx.fillRect(0, 0, 64, 2);
    ctx.fillStyle = "rgba(64,222,208,0.22)";
    ctx.fillRect(0, 2, 64, 4);
    noise(ctx, 64, 128, 350, 0.03);
    return c;
}
function texGlow() {
    const c = makeCanvas(64, 64);
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return c;
}
function texBeam() {
    const c = makeCanvas(32, 128);
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(0.7, "rgba(255,255,255,0.10)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 128);
    const g2 = ctx.createLinearGradient(0, 0, 32, 0);
    g2.addColorStop(0, "rgba(0,0,0,1)");
    g2.addColorStop(0.5, "rgba(0,0,0,0)");
    g2.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, 32, 128);
    return c;
}
function texSign(text, accent = "#c9962e") {
    const c = makeCanvas(256, 64);
    const ctx = c.getContext("2d");
    const bg = ctx.createLinearGradient(0, 0, 0, 64);
    bg.addColorStop(0, "rgba(26,22,14,0.94)");
    bg.addColorStop(1, "rgba(14,12,8,0.94)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = "rgba(255,224,150,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 3, 250, 58);
    ctx.font = "bold 34px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 16;
    ctx.fillStyle = accent;
    ctx.fillText(text, 128, 34);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,248,230,0.92)";
    ctx.fillText(text, 128, 34);
    return c;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/memory.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fmtMB",
    ()=>fmtMB,
    "mem",
    ()=>mem,
    "trackedCanvasTexture",
    ()=>trackedCanvasTexture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript)");
;
// ─── VRAM budget tracker — honest accounting for the broken budget ─────────
// The 4 MB Doom club was deliberately left behind (224px sprite atlases,
// 896×448 mirror, PMREM sky probe, 4×MSAA post chain). The tracker stayed
// honest: every procedural texture registers here, the HUD shows the number.
const BUDGET_MB = 32;
class MemoryTracker {
    bytes = 0;
    textures = new Set();
    register(tex, w, h, mips = true) {
        if (this.textures.has(tex)) return;
        this.textures.add(tex);
        // RGBA8 + full mip chain ≈ ×4/3
        this.bytes += w * h * 4 * (mips ? 4 / 3 : 1);
    }
    unregister(tex) {
        if (!this.textures.delete(tex)) return;
    // caller should supply size; we recompute on next full audit
    }
    /** full audit: walk renderer info (GPU truth) + our tracked set */ audit(renderer) {
        let gpuBytes = 0;
        try {
            const info = renderer.info;
            void info;
        } catch  {
        /* noop */ }
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
const mem = new MemoryTracker();
function trackedCanvasTexture(canvas, mips = true) {
    const tex = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasTexture"](canvas);
    tex.wrapS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RepeatWrapping"];
    tex.wrapT = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RepeatWrapping"];
    // canvases are painted in sRGB — mark them so the shader decodes correctly
    tex.colorSpace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SRGBColorSpace"];
    if (mips) {
        tex.minFilter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LinearMipmapLinearFilter"];
        tex.generateMipmaps = true;
    } else {
        tex.minFilter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LinearFilter"];
        tex.generateMipmaps = false;
    }
    tex.magFilter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LinearFilter"];
    mem.register(tex, canvas.width, canvas.height, mips);
    return tex;
}
function fmtMB(mb) {
    return mb.toFixed(2);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/water.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildWater",
    ()=>buildWater
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript)");
;
// ─── Celestial lagoon — BUDGET BROKEN EDITION ────────────────────────────────
// The lagoon now drinks from the SAME real-time planar mirror as the marble
// floor: the reflected temple (pillars, god rays, halos, ceiling) is sampled
// through the ripple-warped normal field. Layered under it: pearl-sky fresnel,
// golden sun speculars, iridescent thin-film sheen, edge foam, divine sparkle.
// The pool floor still gets additive aqua-and-gold caustics. Pure math + one
// shared render target: zero texture bytes of its own.
const WATER_VERT = /* glsl */ `
  uniform float uTime;
  uniform mat4 uTexMat;
  varying vec3 vWorld;
  varying vec4 vMirror;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    // gentle swell (local +z is world +y after the -90deg X rotation)
    float w = sin(wp.x * 1.6 + uTime * 1.1) * 0.5 + sin(wp.z * 2.2 - uTime * 0.8) * 0.5;
    wp.y += w * 0.028;
    vWorld = wp.xyz;
    vMirror = uTexMat * wp;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const WATER_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uMirror;      // 0 = analytic pearl only (LITE tier), 1 = full glory
  uniform sampler2D tDiffuse; // shared planar-mirror render target
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;
  uniform vec3 uSun;
  uniform vec3 uAqua;
  uniform vec2 uHalf; // pool half extents for edge foam
  varying vec3 vWorld;
  varying vec4 vMirror;

  float h(vec2 p) {
    float t = uTime;
    return sin(p.x * 2.1 + t * 1.3) * 0.5
         + sin(p.y * 2.7 - t * 1.1) * 0.5
         + sin((p.x + p.y) * 3.4 + t * 1.9) * 0.3
         + sin(dot(p, vec2(5.2, -4.1)) + t * 2.4) * 0.25
         + sin(dot(p, vec2(-8.0, 6.5)) + t * 3.1) * 0.15;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 p = vWorld.xz;
    // ---- animated normal (3 octaves, analytic gradient) ----
    float e = 0.14;
    float hx = h(p) - h(p + vec2(e, 0.0));
    float hz = h(p) - h(p + vec2(0.0, e));
    vec3 n = normalize(vec3(hx * 2.6, 0.62, hz * 2.6));

    vec3 V = normalize(cameraPosition - vWorld);
    vec3 R = reflect(-V, n);

    // ---- fresnel ----
    float fr = pow(1.0 - clamp(dot(V, n), 0.0, 1.0), 2.6);

    // ---- pearl-sky environment reflection (base layer) ----
    float up = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(uDeep, uSky, up * up);

    // ---- TRUE planar reflection, warped by the living ripples ----
    // projective mirror coords, offset in the normal's XZ before the w-divide
    vec4 m = vMirror;
    m.xy += vec2(n.x, n.z) * m.w * 0.062;
    vec3 temple = texture2DProj(tDiffuse, m).rgb;

    // ---- golden sun + aqua strip speculars (analytic glints) ----
    vec3 L1 = normalize(vec3(0.12, 0.92, -0.18)); // sun through the oculus
    vec3 L2 = normalize(vec3(-0.45, 0.75, 0.35));
    float sp1 = pow(max(dot(R, L1), 0.0), 90.0) * 4.2;
    float sp2 = pow(max(dot(R, L2), 0.0), 190.0) * 1.8;

    // ---- body: pearl base, then the reflected temple laid over it ----
    vec3 col = mix(uShallow, env, 0.30 + 0.70 * fr);
    col = mix(col, temple * vec3(1.05, 1.01, 0.99), (0.40 + 0.52 * fr) * uMirror);
    col += uSun * sp1 + uAqua * sp2;

    // ---- iridescent thin-film sheen at grazing angles ----
    vec3 iri =
        vec3(0.95, 0.55, 0.72) * pow(fr, 4.0) * 0.09
      + vec3(0.55, 0.75, 0.95) * pow(fr, 6.0) * 0.07;
    col += iri;

    // ---- divine sparkle: gold-white glints ----
    vec2 cell = floor(p * 7.0) + floor(uTime * 4.0) * 0.37;
    float sp = hash(cell);
    float spark = step(0.985, sp) * clamp(fr * 1.8, 0.0, 1.0);
    col += mix(vec3(1.0, 0.9, 0.65), vec3(0.85, 1.0, 0.96), hash(cell + 3.1)) * spark * 0.55;

    // ---- edge foam ----
    vec2 dEdge = abs(uHalf - abs(p));
    float edge = min(dEdge.x, dEdge.y);
    float foam = (1.0 - smoothstep(0.0, 0.42, edge)) * (0.55 + 0.45 * sin(uTime * 2.0 + h(p * 3.0) * 6.0));
    col = mix(col, vec3(0.92, 0.99, 0.96), foam * 0.32);

    gl_FragColor = vec4(col, 0.93);
    #include <colorspace_fragment>
  }
`;
const CAUSTIC_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const CAUSTIC_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uGold;
  varying vec3 vWorld;
  void main() {
    vec2 p = vWorld.xz * 1.4;
    float t = uTime * 0.9;
    float a = sin(p.x * 2.6 + t) + sin(p.y * 3.1 - t * 1.3);
    float b = sin((p.x + p.y) * 2.0 + t * 0.7) + sin((p.x - p.y) * 2.8 - t);
    float c = pow(max(0.0, (a + b) * 0.25), 3.0);
    // second lattice rotated for richness
    float a2 = sin(p.x * -3.3 + t * 1.2) + sin(p.y * 2.4 + t);
    float c2 = pow(max(0.0, (a2 + b) * 0.25), 3.0);
    float v = c * 0.75 + c2 * 0.45;
    // aqua caustics with a warm gold undertone (sun through the oculus)
    vec3 col = uColor * v + uGold * v * 0.42;
    gl_FragColor = vec4(col, v * 0.85);
  }
`;
function buildWater(cx, cz, w, d, waterY, poolFloorY, /** shared mirror render target (owned by the level) */ mirrorTex, /** shared mirror projection matrix — updated in place every frame */ texMat) {
    const waterMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
        vertexShader: WATER_VERT,
        fragmentShader: WATER_FRAG,
        uniforms: {
            uTime: {
                value: 0
            },
            uMirror: {
                value: 1
            },
            tDiffuse: {
                value: mirrorTex
            },
            uTexMat: {
                value: texMat
            },
            uDeep: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0x0a3244)
            },
            uShallow: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0x27b8ac)
            },
            uSky: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xaadbe6)
            },
            uSun: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xffd98c)
            },
            uAqua: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0x8ff5e8)
            },
            uHalf: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"](w / 2, d / 2)
            }
        },
        transparent: true
    });
    // budget-broken tessellation: 96×48 segments so the swell rolls like silk
    const water = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](w, d, 96, 48), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(cx, waterY, cz);
    const causticMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
        vertexShader: CAUSTIC_VERT,
        fragmentShader: CAUSTIC_FRAG,
        uniforms: {
            uTime: {
                value: 0
            },
            uColor: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0x5fe8d2)
            },
            uGold: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xffe3a0)
            }
        },
        transparent: true,
        blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
        depthWrite: false
    });
    const caustics = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](w, d), causticMat);
    caustics.rotation.x = -Math.PI / 2;
    caustics.position.set(cx, poolFloorY + 0.02, cz);
    return {
        water,
        caustics,
        update (t) {
            waterMat.uniforms.uTime.value = t;
            causticMat.uniforms.uTime.value = t;
        },
        setMirror (on) {
            waterMat.uniforms.uMirror.value = on ? 1 : 0;
        }
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/level.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FLOOR_Y",
    ()=>FLOOR_Y,
    "PED_SIZE",
    ()=>PED_SIZE,
    "PED_TOP",
    ()=>PED_TOP,
    "POOL_FLOOR_Y",
    ()=>POOL_FLOOR_Y,
    "WALL_H",
    ()=>WALL_H,
    "WATER_Y",
    ()=>WATER_Y,
    "buildLevel",
    ()=>buildLevel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/textures.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/memory.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$water$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/water.ts [app-client] (ecmascript)");
;
;
;
;
;
const WALL_H = 4.2;
const PED_SIZE = 0.9;
const PED_TOP = 0.96;
const FLOOR_Y = 0;
const WATER_Y = -0.32;
const POOL_FLOOR_Y = -1.1;
// ── sky dome: animated pearl heavens, zero texture bytes ──
const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;
const SKY_FRAG = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunCol;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -0.15, 1.0);
    vec3 col = mix(uHorizon, uZenith, pow(max(h, 0.0), 0.6));

    // sun + divine glare (restrained so bloom doesn't white-out)
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSunCol * (pow(s, 400.0) * 1.6 + pow(s, 32.0) * 0.35 + pow(s, 7.0) * 0.10);

    // slow drifting pearl clouds
    vec2 cuv = vec2(atan(d.z, d.x) * 0.85, d.y * 2.6);
    float cl = fbm(cuv * 1.6 + vec2(uTime * 0.008, uTime * 0.0022));
    cl = smoothstep(0.48, 0.82, cl) * smoothstep(0.02, 0.30, d.y);
    col = mix(col, vec3(1.0, 0.985, 0.95), cl * 0.6);

    // faint golden shimmer band near horizon
    col += vec3(0.30, 0.22, 0.08) * pow(1.0 - abs(d.y), 9.0) * 0.5;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
// ── god-ray shafts: fake volumetric light cylinders ──
const SHAFT_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const SHAFT_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 N = normalize(vNormalW);
    float facing = abs(dot(N, V));          // fade at silhouette edges
    float body = pow(facing, 1.7);
    float vert = mix(0.30, 1.05, vUv.y);    // brighter toward heaven (top)
    float shimmer = 0.55 + 0.45 * vnoise(vec2(vUv.x * 9.0, vUv.y * 4.0 - uTime * 0.22));
    float a = body * vert * shimmer * uIntensity;
    gl_FragColor = vec4(uColor, a);
  }
`;
// ── mirror marble floor: PROCEDURAL pearl marble + true planar reflection ──
const FLOOR_VERT = /* glsl */ `
  uniform mat4 uTexMat;
  varying vec3 vWorld;
  varying vec4 vMirror;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vMirror = uTexMat * wp;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const FLOOR_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uMirror;
  uniform vec3 uPoolCenter;
  uniform vec2 uPoolHalf;
  varying vec3 vWorld;
  varying vec4 vMirror;
  #include <fog_pars_fragment>

  float fhash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float fnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(fhash(i), fhash(i + vec2(1.0, 0.0)), u.x),
      mix(fhash(i + vec2(0.0, 1.0)), fhash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float ffbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * fnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 mw = vWorld.xz;
    // ---- procedural pearl marble (infinite detail, zero VRAM) ----
    vec3 base = vec3(0.83, 0.85, 0.835);
    float n1 = ffbm(mw * 0.9);
    float n2 = ffbm(mw * 0.9 + 4.7);
    base += vec3(0.0, 0.035, 0.03) * smoothstep(0.4, 0.75, n1);        // opal aqua wash
    base += vec3(0.045, 0.02, 0.05) * smoothstep(0.45, 0.8, n2);       // opal rose wash
    base += vec3(0.07, 0.05, 0.0) * smoothstep(0.5, 0.82, ffbm(mw * 0.35 + 9.2)); // gold mist
    // flowing gold veins: warped ridge lines of fbm (wide enough to read)
    float vein1 = abs(sin((ffbm(mw * 1.35 + 2.2) * 7.0 + mw.x * 0.4) * 3.14159));
    float vein2 = abs(sin((ffbm(mw * 1.05 + 7.7) * 8.0 - mw.y * 0.35) * 3.14159));
    float goldV = pow(1.0 - vein1, 8.0) * 0.9 + pow(1.0 - vein2, 14.0) * 0.7;
    base += vec3(0.85, 0.58, 0.16) * goldV;
    // dark marbling for contrast against the gold
    base = mix(base, vec3(0.52, 0.50, 0.44), pow(1.0 - vein2, 22.0) * 0.5);
    // subtle slab seams every 2.4 m
    vec2 seam = abs(fract(mw / 2.4) - 0.5);
    base = mix(base, vec3(0.62, 0.60, 0.54), smoothstep(0.475, 0.5, max(seam.x, seam.y)) * 0.4);

    // golden sun cast from the oculus: wide warm pool + tight hot core
    vec2 dp = abs(vWorld.xz - uPoolCenter.xz) - uPoolHalf;
    float dpool = length(max(dp, vec2(0.0)));
    base += vec3(0.26, 0.18, 0.06) * exp(-dpool * 0.95) * (0.8 + 0.2 * sin(uTime * 0.9));
    base += vec3(0.32, 0.24, 0.09) * exp(-dpool * 2.4);
    base += vec3(0.05, 0.20, 0.18) * exp(-dpool * 1.5) * (0.75 + 0.25 * sin(uTime * 1.7));

    // true mirror reflection, fresnel-weighted (grazing angles go glassy)
    vec3 refl = texture2DProj(tDiffuse, vMirror).rgb;
    vec3 V = normalize(cameraPosition - vWorld);
    float fr = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
    vec3 col = mix(base, refl, (0.26 + 0.74 * fr) * uMirror);

    // halo-light strip streaks
    float streakN = exp(-abs(vWorld.z - 0.12) * 1.35);
    float streakE = exp(-abs(vWorld.x - 19.08) * 1.35);
    col += vec3(0.06, 0.30, 0.27) * streakN * fr;
    col += vec3(0.30, 0.20, 0.05) * streakE * fr;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;
function scaleUV(geo, sx, sy) {
    const uv = geo.attributes.uv;
    for(let i = 0; i < uv.count; i++){
        uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
    }
    uv.needsUpdate = true;
}
function wallPlane(w, tilesX, mat, pos, rotY) {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](w, WALL_H);
    scaleUV(g, tilesX, WALL_H / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"]);
    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](g, mat);
    m.position.set(...pos);
    m.rotation.y = rotY;
    return m;
}
function neonStrip(len, color, pos, rotY, haloTex) {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const strip = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](len, 0.07, 0.05), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        color
    }));
    strip.position.set(0, 0, 0.03);
    g.add(strip);
    const halo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](len, 0.46), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        map: haloTex,
        color,
        transparent: true,
        blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
        depthWrite: false,
        opacity: 0.55,
        side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DoubleSide"],
        fog: true
    }));
    halo.rotation.z = Math.PI / 2;
    halo.position.set(0, 0, 0.015);
    g.add(halo);
    g.position.set(...pos);
    g.rotation.y = rotY;
    return g;
}
function sign(text, w, pos, rotY, accent) {
    const canvas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["texSign"])(text, accent);
    const tex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])(canvas, true);
    tex.wrapS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClampToEdgeWrapping"];
    tex.wrapT = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClampToEdgeWrapping"];
    const h = w * canvas.height / canvas.width;
    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](w, h), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        map: tex,
        transparent: true,
        fog: true,
        color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](1.25, 1.25, 1.25)
    }));
    m.position.set(...pos);
    m.rotation.y = rotY;
    return m;
}
const GOLD = 0xc9962e;
const GOLD_BRIGHT = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xffd98c).multiplyScalar(2.0);
const AQUA_BRIGHT = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0x3fd8c8).multiplyScalar(2.0);
function buildLevel(renderer) {
    const group = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const grid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseMap"])();
    const W = grid.w * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"]; // 19.2
    const D = grid.h * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"]; // 16.8
    const cx = W / 2;
    const cz = D / 2;
    // ── textures (shared) ──
    const wallTex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["texWall"])());
    const ceilTex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["texCeil"])());
    const pedTex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["texPedestal"])());
    const beamTex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["texBeam"])(), false);
    beamTex.wrapS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClampToEdgeWrapping"];
    const glowTex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["texGlow"])(), false);
    glowTex.wrapS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClampToEdgeWrapping"];
    glowTex.wrapT = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClampToEdgeWrapping"];
    const wallMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        map: wallTex,
        roughness: 0.38,
        metalness: 0.12
    });
    const goldMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: GOLD,
        roughness: 0.22,
        metalness: 1.0,
        emissive: 0x2a1c05,
        emissiveIntensity: 0.6
    });
    // ── sky dome (seen through the oculus) ──
    const skyMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        uniforms: {
            uZenith: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0x86c8ea)
            },
            uHorizon: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xfff3da)
            },
            uSunDir: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0.1, 1.0, 0.05).normalize()
            },
            uSunCol: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](1.0, 0.93, 0.78)
            },
            uTime: {
                value: 0
            }
        },
        side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BackSide"],
        depthWrite: false
    });
    const sky = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SphereGeometry"](30, 32, 18), skyMat);
    sky.position.set(cx, 1.5, cz);
    sky.renderOrder = -10;
    group.add(sky);
    // ── environment probe: bake the pearl heavens into a PMREM cubemap so ──
    // every gold surface (cornices, capitals, reliquaries, halos) reflects the
    // sky. THE budget-broken glow-up: ~1.4 MB once, infinite divinity.
    const envScene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scene"]();
    const envSky = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SphereGeometry"](30, 24, 14), skyMat);
    envScene.add(envSky);
    const pmrem = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PMREMGenerator"](renderer);
    const envRT = pmrem.fromScene(envScene, 0.07);
    pmrem.dispose();
    envSky.geometry.dispose();
    const envTexture = envRT.texture;
    // cubemap ≈ 6 faces + mips — registered so the HUD stays honest
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mem"].register(envTexture, 256, 256 * 6, true);
    // ── heaven reflections: every PBR surface now drinks the sky probe ──
    wallMat.envMapIntensity = 0.4;
    goldMat.envMapIntensity = 1.35;
    // ── perimeter walls ──
    group.add(wallPlane(W, W / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"], wallMat, [
        cx,
        WALL_H / 2,
        0
    ], 0));
    group.add(wallPlane(W, W / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"], wallMat, [
        cx,
        WALL_H / 2,
        D
    ], Math.PI));
    group.add(wallPlane(D, D / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"], wallMat, [
        W,
        WALL_H / 2,
        cz
    ], -Math.PI / 2));
    group.add(wallPlane(D, D / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"], wallMat, [
        0,
        WALL_H / 2,
        cz
    ], Math.PI / 2));
    // ── gilded cornice + base rails ──
    const trim = (len, pos, rotY)=>{
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](len, 0.07, 0.07), goldMat);
        m.position.set(...pos);
        m.rotation.y = rotY;
        group.add(m);
    };
    trim(W - 0.3, [
        cx,
        WALL_H - 0.14,
        0.08
    ], 0);
    trim(W - 0.3, [
        cx,
        WALL_H - 0.14,
        D - 0.08
    ], 0);
    trim(D - 0.3, [
        W - 0.08,
        WALL_H - 0.14,
        cz
    ], Math.PI / 2);
    trim(D - 0.3, [
        0.08,
        WALL_H - 0.14,
        cz
    ], Math.PI / 2);
    trim(W - 0.3, [
        cx,
        0.16,
        0.08
    ], 0);
    trim(W - 0.3, [
        cx,
        0.16,
        D - 0.08
    ], 0);
    trim(D - 0.3, [
        W - 0.08,
        0.16,
        cz
    ], Math.PI / 2);
    trim(D - 0.3, [
        0.08,
        0.16,
        cz
    ], Math.PI / 2);
    // ── pool rectangle (from map art rows 4..7, cols 4..11) ──
    const poolX0 = 4 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"], poolX1 = 12 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"], poolZ0 = 4 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"], poolZ1 = 8 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"];
    const pool = {
        cx: (poolX0 + poolX1) / 2,
        cz: (poolZ0 + poolZ1) / 2,
        w: poolX1 - poolX0,
        d: poolZ1 - poolZ0
    };
    // ── mirror marble floor (4 segments around the pool hole) ──
    // reflection render target — 896×448 RGBA, honestly tracked. The 4 MB club
    // is gone; the mirror got 4× the pixels so the reflections read like glass.
    const MIRROR_W = 896;
    const MIRROR_H = 448;
    const mirrorRT = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebGLRenderTarget"](MIRROR_W, MIRROR_H);
    mirrorRT.texture.minFilter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LinearFilter"];
    mirrorRT.texture.magFilter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LinearFilter"];
    mirrorRT.texture.generateMipmaps = false;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mem"].register(mirrorRT.texture, MIRROR_W, MIRROR_H, false);
    // shared mirror projection matrix — the floor AND the lagoon water sample
    // through this exact object (updated in place every frame)
    const texMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix4"]();
    const floorMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
        vertexShader: FLOOR_VERT,
        fragmentShader: FLOOR_FRAG,
        uniforms: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UniformsUtils"].merge([
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UniformsLib"].fog,
            {
                tDiffuse: {
                    value: null
                },
                uTexMat: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix4"]()
                },
                uTime: {
                    value: 0
                },
                uMirror: {
                    value: 1
                },
                uPoolCenter: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](pool.cx, 0, pool.cz)
                },
                uPoolHalf: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"](pool.w / 2, pool.d / 2)
                }
            }
        ]),
        fog: true
    });
    const fu = floorMat.uniforms;
    // re-bind the live render-target AFTER merge — mergeUniforms clones texture
    // values, which would sever the mirror sampling. Same for the shared matrix.
    fu.tDiffuse.value = mirrorRT.texture;
    fu.uTexMat.value = texMat;
    const floorSegs = [];
    const segs = [
        [
            cx,
            poolZ0 / 2,
            W,
            poolZ0
        ],
        [
            cx,
            (poolZ1 + D) / 2,
            W,
            D - poolZ1
        ],
        [
            poolX0 / 2,
            (poolZ0 + poolZ1) / 2,
            poolX0,
            poolZ1 - poolZ0
        ],
        [
            (poolX1 + W) / 2,
            (poolZ0 + poolZ1) / 2,
            W - poolX1,
            poolZ1 - poolZ0
        ]
    ];
    for (const [px, pz, pw, pd] of segs){
        const f = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](pw, pd), floorMat);
        f.rotation.x = -Math.PI / 2;
        f.position.set(px, FLOOR_Y, pz);
        group.add(f);
        floorSegs.push(f);
    }
    // ── mirror camera rig (planar reflection across y = FLOOR_Y) ──
    const virtualCam = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"]();
    const _camPos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    const _camDir = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    const _camUp = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    const _mPos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    const _mTarget = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    const _q = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector4"]();
    const _plane = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Plane"]();
    const BIAS = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Matrix4"]().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    function renderReflection(renderer, scene, camera, hidden) {
        camera.getWorldPosition(_camPos);
        camera.getWorldDirection(_camDir);
        _camUp.set(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Quaternion"]()));
        // mirror camera across the y = FLOOR_Y plane
        _mPos.set(_camPos.x, 2 * FLOOR_Y - _camPos.y, _camPos.z);
        const mDir = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](_camDir.x, -_camDir.y, _camDir.z);
        const mUp = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](_camUp.x, -_camUp.y, _camUp.z);
        _mTarget.copy(_mPos).add(mDir);
        virtualCam.up.copy(mUp);
        virtualCam.position.copy(_mPos);
        virtualCam.lookAt(_mTarget);
        virtualCam.near = camera.near;
        virtualCam.far = camera.far;
        virtualCam.projectionMatrix.copy(camera.projectionMatrix);
        virtualCam.updateMatrixWorld();
        // projective sampling matrix (world → mirror-clip → [0,1]) — shared object,
        // the water shader samples the same live matrix
        texMat.copy(BIAS).multiply(virtualCam.projectionMatrix).multiply(virtualCam.matrixWorldInverse);
        // oblique near-plane clipping so nothing below the floor leaks in
        _plane.setFromNormalAndCoplanarPoint(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, 1, 0), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0, FLOOR_Y, 0));
        _plane.applyMatrix4(virtualCam.matrixWorldInverse);
        const clip = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector4"](_plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant);
        const pm = virtualCam.projectionMatrix;
        _q.x = (Math.sign(clip.x) + pm.elements[8]) / pm.elements[0];
        _q.y = (Math.sign(clip.y) + pm.elements[9]) / pm.elements[5];
        _q.z = -1.0;
        _q.w = (1.0 + pm.elements[10]) / pm.elements[14];
        clip.multiplyScalar(2.0 / clip.dot(_q));
        pm.elements[2] = clip.x;
        pm.elements[6] = clip.y;
        pm.elements[10] = clip.z + 1.0;
        pm.elements[14] = clip.w;
        virtualCam.projectionMatrixInverse.copy(pm).invert();
        // render the reflected world (self + caller-hidden objects removed)
        for (const f of floorSegs)f.visible = false;
        for (const h of hidden)h.visible = false;
        const prevRT = renderer.getRenderTarget();
        try {
            renderer.setRenderTarget(mirrorRT);
            renderer.render(scene, virtualCam);
        } finally{
            renderer.setRenderTarget(prevRT);
            for (const f of floorSegs)f.visible = true;
            for (const h of hidden)h.visible = true;
        }
    }
    function setMirror(on) {
        fu.uMirror.value = on ? 1 : 0;
        water.setMirror(on);
    }
    // ── pool cavity ──
    const cavityMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: 0x0c2a33,
        roughness: 0.85,
        metalness: 0.15
    });
    const cavityH = FLOOR_Y - POOL_FLOOR_Y;
    const cw = [
        [
            pool.cx,
            POOL_FLOOR_Y + cavityH / 2,
            poolZ0,
            0
        ],
        [
            pool.cx,
            POOL_FLOOR_Y + cavityH / 2,
            poolZ1,
            Math.PI
        ],
        [
            poolX0,
            POOL_FLOOR_Y + cavityH / 2,
            pool.cz,
            Math.PI / 2
        ],
        [
            poolX1,
            POOL_FLOOR_Y + cavityH / 2,
            pool.cz,
            -Math.PI / 2
        ]
    ];
    for (const [px, py, pz, ry] of cw){
        const wMesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](ry === 0 || ry === Math.PI ? pool.w : pool.d, cavityH), cavityMat);
        wMesh.position.set(px, py, pz);
        wMesh.rotation.y = ry;
        group.add(wMesh);
    }
    const poolFloor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](pool.w, pool.d), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: 0x083038,
        roughness: 1,
        metalness: 0
    }));
    poolFloor.rotation.x = -Math.PI / 2;
    poolFloor.position.set(pool.cx, POOL_FLOOR_Y, pool.cz);
    group.add(poolFloor);
    // water rig (celestial lagoon — drinks from the shared planar mirror)
    const water = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$water$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildWater"])(pool.cx, pool.cz, pool.w - 0.06, pool.d - 0.06, WATER_Y, POOL_FLOOR_Y, mirrorRT.texture, texMat);
    group.add(water.water, water.caustics);
    // ── pool curb: gold with aqua underglow ──
    const curbMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: GOLD,
        roughness: 0.28,
        metalness: 1.0
    });
    const glowMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        color: AQUA_BRIGHT
    });
    const curbH = 0.1;
    const curbs = [
        [
            pool.cx,
            FLOOR_Y + curbH / 2,
            poolZ0 - 0.07,
            pool.w + 0.28
        ],
        [
            pool.cx,
            FLOOR_Y + curbH / 2,
            poolZ1 + 0.07,
            pool.w + 0.28
        ],
        [
            poolX0 - 0.07,
            FLOOR_Y + curbH / 2,
            pool.cz,
            pool.d + 0.28
        ],
        [
            poolX1 + 0.07,
            FLOOR_Y + curbH / 2,
            pool.cz,
            pool.d + 0.28
        ]
    ];
    for (const [px, py, pz, len] of curbs){
        const horiz = pz < pool.cz - 2 || pz > pool.cz + 2;
        const b = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](horiz ? len : 0.14, curbH, horiz ? 0.14 : len), curbMat);
        b.position.set(px, py, pz);
        group.add(b);
        const gl = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](horiz ? len - 0.1 : 0.05, 0.025, horiz ? 0.05 : len - 0.1), glowMat);
        const inZ = pz < cz ? 1 : -1;
        const inX = px < cx ? 1 : -1;
        gl.position.set(px + (horiz ? 0 : inX * 0.06), FLOOR_Y + 0.035, pz + (horiz ? inZ * 0.06 : 0));
        group.add(gl);
    }
    // ── gilded coffered ceiling with open elliptical oculus ──
    const ocRx = Math.min(pool.w, pool.d) * 0.42; // ~2.0
    const ocRy = Math.min(pool.w, pool.d) * 0.34;
    const ceilShape = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Shape"]();
    ceilShape.moveTo(-W / 2, -D / 2);
    ceilShape.lineTo(W / 2, -D / 2);
    ceilShape.lineTo(W / 2, D / 2);
    ceilShape.lineTo(-W / 2, D / 2);
    ceilShape.closePath();
    const hole = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Path"]();
    hole.absellipse(pool.cx - cx, pool.cz - cz, ocRx, ocRy, 0, Math.PI * 2, true, 0);
    ceilShape.holes.push(hole);
    const ceilGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShapeGeometry"](ceilShape, 48);
    ceilGeo.rotateX(Math.PI / 2); // face down
    scaleUV(ceilGeo, 1 / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"], 1 / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"]);
    const ceil = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](ceilGeo, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        map: ceilTex,
        roughness: 0.5,
        metalness: 0.35
    }));
    ceil.position.set(cx, WALL_H, cz);
    group.add(ceil);
    // oculus gold rim (ellipse approximated by segments)
    const RIM_SEG = 40;
    for(let i = 0; i < RIM_SEG; i++){
        const a0 = i / RIM_SEG * Math.PI * 2;
        const a1 = (i + 1) / RIM_SEG * Math.PI * 2;
        const x0 = pool.cx + Math.cos(a0) * ocRx;
        const z0 = pool.cz + Math.sin(a0) * ocRy;
        const x1 = pool.cx + Math.cos(a1) * ocRx;
        const z1 = pool.cz + Math.sin(a1) * ocRy;
        const len = Math.hypot(x1 - x0, z1 - z0) + 0.02;
        const seg = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](len, 0.14, 0.16), goldMat);
        seg.position.set((x0 + x1) / 2, WALL_H - 0.02, (z0 + z1) / 2);
        seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
        group.add(seg);
    }
    // sun glare disc just under the oculus (bloom feeder)
    const glare = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CircleGeometry"](1, 32), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        map: glowTex,
        color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](1.9, 1.7, 1.35),
        transparent: true,
        blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
        depthWrite: false,
        fog: false
    }));
    glare.rotation.x = Math.PI / 2; // face down
    glare.scale.set(ocRx * 0.72, ocRy * 0.72, 1);
    glare.position.set(pool.cx, WALL_H - 0.1, pool.cz);
    glare.renderOrder = 6;
    group.add(glare);
    // ── god-ray shafts: fake volumetric light cylinders ──
    // four nested cones down the oculus onto the lagoon, plus four slim
    // columns of sanctum light over the pedestal shrines
    const shafts = [];
    const shaftSpecs = [
        // [x, z, radius, intensity, tiltZ, tiltX] — first 4 = oculus, then pedestals
        [
            pool.cx,
            pool.cz,
            0.42,
            0.5,
            0.02,
            0.015
        ],
        [
            pool.cx,
            pool.cz,
            0.85,
            0.34,
            -0.03,
            0.02
        ],
        [
            pool.cx,
            pool.cz,
            1.35,
            0.22,
            0.05,
            -0.03
        ],
        [
            pool.cx,
            pool.cz,
            1.9,
            0.12,
            -0.06,
            0.04
        ],
        [
            4.2,
            3.0,
            0.5,
            0.15,
            0.03,
            -0.02
        ],
        [
            15.0,
            3.0,
            0.5,
            0.15,
            -0.03,
            0.02
        ],
        [
            4.2,
            13.8,
            0.55,
            0.12,
            0.02,
            0.03
        ],
        [
            15.0,
            13.8,
            0.55,
            0.12,
            -0.02,
            -0.03
        ]
    ];
    for(let i = 0; i < shaftSpecs.length; i++){
        const [sx, sz, r, inten, tz, tx] = shaftSpecs[i];
        const bottom = i < 4 ? WATER_Y : FLOOR_Y; // oculus shafts fall into the lagoon
        const shaftHeight = WALL_H - bottom;
        const mat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
            vertexShader: SHAFT_VERT,
            fragmentShader: SHAFT_FRAG,
            uniforms: {
                uTime: {
                    value: 0
                },
                uColor: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](1.0, 0.93, 0.78)
                },
                uIntensity: {
                    value: inten
                }
            },
            transparent: true,
            blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
            depthWrite: false,
            side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DoubleSide"]
        });
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CylinderGeometry"](r, r * 0.82, shaftHeight, 24, 1, true), mat);
        m.position.set(sx, (WALL_H + bottom) / 2, sz);
        m.rotation.z = tz;
        m.rotation.x = tx;
        m.renderOrder = 7;
        group.add(m);
        shafts.push(m);
    }
    // ── pillars: marble with gilded capitals ──
    const pillarCells = [
        [
            2,
            5
        ],
        [
            13,
            5
        ],
        [
            2,
            8
        ],
        [
            13,
            8
        ]
    ];
    for (const [col, row] of pillarCells){
        grid.cells[row * grid.w + col] = 1;
        const px = col * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] / 2;
        const pz = row * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] / 2;
        const p = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](1.1, WALL_H, 1.1), wallMat);
        p.position.set(px, WALL_H / 2, pz);
        group.add(p);
        // gilded capital + base
        for (const y of [
            WALL_H - 0.09,
            0.09
        ]){
            const cap = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](1.26, 0.18, 1.26), goldMat);
            cap.position.set(px, y, pz);
            group.add(cap);
        }
        // aqua light strip facing the lagoon
        const dir = Math.atan2(pool.cx - px, pool.cz - pz);
        const strip = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](0.08, WALL_H - 0.7, 0.08), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            color: AQUA_BRIGHT
        }));
        strip.position.set(px + Math.sin(dir) * 0.58, WALL_H / 2, pz + Math.cos(dir) * 0.58);
        group.add(strip);
    }
    // ── pedestals ──
    const pedMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        map: pedTex,
        roughness: 0.3,
        metalness: 0.25,
        envMapIntensity: 0.5
    });
    const capMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: 0xf5efdd,
        roughness: 0.12,
        metalness: 0.85,
        emissive: 0x40300e,
        emissiveIntensity: 0.7,
        envMapIntensity: 1.25
    });
    const spawn = {
        x: 7 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] / 2,
        z: 12 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] / 2,
        yaw: 0
    };
    const pedestals = [];
    for(let row = 0; row < grid.h; row++){
        for(let col = 0; col < grid.w; col++){
            if (grid.cells[row * grid.w + col] !== 3) continue;
            const px = col * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] / 2;
            const pz = row * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] / 2;
            const ped = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](PED_SIZE, PED_TOP - 0.02, PED_SIZE), pedMat);
            ped.position.set(px, (PED_TOP - 0.02) / 2, pz);
            group.add(ped);
            const cap = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](PED_SIZE + 0.05, 0.025, PED_SIZE + 0.05), capMat);
            cap.position.set(px, PED_TOP - 0.012, pz);
            group.add(cap);
            const facing = Math.atan2(spawn.x - px, spawn.z - pz);
            pedestals.push({
                col,
                row,
                pos: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](px, 0, pz),
                facing,
                top: PED_TOP
            });
        }
    }
    // ── gilded reliquaries — the Doom crates, promoted to heaven ──
    // Mirror marble under them, pearl sky painted on their gold: the boxes
    // the original request dreamed of, drinking both reflections at once.
    const crateMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshPhysicalMaterial"]({
        color: GOLD,
        metalness: 1.0,
        roughness: 0.16,
        clearcoat: 1.0,
        clearcoatRoughness: 0.14,
        envMapIntensity: 1.6,
        emissive: 0x241804,
        emissiveIntensity: 0.45
    });
    const crateTrimMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshPhysicalMaterial"]({
        color: 0x8f6a1e,
        metalness: 1.0,
        roughness: 0.3,
        envMapIntensity: 1.2
    });
    function reliquary(x, z, s, rotY) {
        const rg = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
        const body = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](s, s * 0.62, s), crateMat);
        body.position.y = s * 0.31;
        rg.add(body);
        const belt = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](s * 1.03, s * 0.07, s * 1.03), crateTrimMat);
        belt.position.y = s * 0.42;
        rg.add(belt);
        const lid = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](s * 1.05, s * 0.18, s * 1.05), crateMat);
        lid.position.y = s * 0.62 + s * 0.09;
        rg.add(lid);
        // relic gem — a sliver of the aqua lagoon, glowing through the gold
        const gem = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](s * 0.22, s * 0.15, s * 0.22), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
            color: 0x67e8d8,
            emissive: 0x2dd4bf,
            emissiveIntensity: 2.6,
            roughness: 0.2,
            metalness: 0.1
        }));
        gem.position.y = s * 0.8 + s * 0.14;
        rg.add(gem);
        rg.position.set(x, FLOOR_Y, z);
        rg.rotation.y = rotY;
        group.add(rg);
        // block the cell so pilgrims orbit, not clip
        const col = Math.floor(x / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"]);
        const row = Math.floor(z / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"]);
        if (col >= 0 && col < grid.w && row >= 0 && row < grid.h) {
            grid.cells[row * grid.w + col] = 1;
        }
    }
    reliquary(2.55, 2.55, 0.86, 0.4);
    reliquary(17.0, 8.9, 0.78, -0.7);
    reliquary(14.6, 15.3, 0.9, 0.25);
    reliquary(4.6, 15.0, 0.5, 0.9); // small offering box by the south pedestals
    // ── halo light strips ──
    group.add(neonStrip(W - 1.2, AQUA_BRIGHT, [
        cx,
        3.35,
        0.06
    ], 0, beamTex)); // N aqua
    group.add(neonStrip(D - 1.2, AQUA_BRIGHT, [
        W - 0.06,
        3.35,
        cz
    ], Math.PI / 2, beamTex)); // E aqua
    group.add(neonStrip(D - 1.2, GOLD_BRIGHT, [
        0.06,
        3.35,
        cz
    ], -Math.PI / 2, beamTex)); // W gold
    group.add(neonStrip(6.5, GOLD_BRIGHT, [
        cx - 5.6,
        3.1,
        D - 0.06
    ], Math.PI, beamTex)); // S gold L
    group.add(neonStrip(6.5, GOLD_BRIGHT, [
        cx + 5.6,
        3.1,
        D - 0.06
    ], Math.PI, beamTex)); // S gold R
    group.add(sign("CELESTIA GALLERIA", 5.2, [
        cx,
        2.55,
        0.03
    ], 0, "#ffd98c"));
    group.add(sign("EXIT", 1.5, [
        cx,
        2.2,
        D - 0.03
    ], Math.PI, "#9de8b8"));
    group.add(sign("OPTICS", 1.9, [
        3 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + 0.6,
        1.9,
        0.03
    ], 0, "#3fd8c8"));
    group.add(sign("GAMING", 1.9, [
        12 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + 0.6,
        1.9,
        0.03
    ], 0, "#3fd8c8"));
    group.add(sign("AUDIO", 1.9, [
        W - 0.03,
        1.9,
        7 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + 1.8
    ], -Math.PI / 2, "#3fd8c8"));
    group.add(sign("WEARABLES", 2.2, [
        0.03,
        1.9,
        7 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + 0.6
    ], Math.PI / 2, "#3fd8c8"));
    group.add(sign("AERIAL", 1.9, [
        10.5 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"],
        1.9,
        D - 0.03
    ], Math.PI, "#3fd8c8"));
    group.add(sign("FOOTWEAR", 1.9, [
        13 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"],
        1.9,
        D - 0.03
    ], Math.PI, "#3fd8c8"));
    group.add(sign("COMPUTING", 2.0, [
        3 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + 0.6,
        1.9,
        D - 0.03
    ], Math.PI, "#3fd8c8"));
    // ── lights (temple of retail) ──
    const hemi = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HemisphereLight"](0xfff5e0, 0x6b7a80, 0.8);
    group.add(hemi);
    const sun = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DirectionalLight"](0xffeecf, 1.5);
    sun.position.set(pool.cx + 2.5, WALL_H + 5, pool.cz - 1.5);
    sun.target.position.set(pool.cx, 0, pool.cz);
    group.add(sun, sun.target);
    const oculusGlow = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PointLight"](0xffe4b0, 14, 15, 2);
    oculusGlow.position.set(pool.cx, WALL_H - 0.8, pool.cz);
    group.add(oculusGlow);
    const poolLight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PointLight"](0x49e0d0, 24, 22, 2);
    poolLight.position.set(pool.cx, WATER_Y + 0.7, pool.cz);
    group.add(poolLight);
    const exitLight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PointLight"](0xffd98c, 9, 12, 2);
    exitLight.position.set(spawn.x, 2.6, spawn.z - 1.5);
    group.add(exitLight);
    const seraphLight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PointLight"](0xfff0c8, 7, 11, 2);
    seraphLight.position.set(3 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + 0.6, 2.9, 9 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CELL"] + 0.6);
    group.add(seraphLight);
    // ── angel dust: golden motes rising through the light ──
    const DUST = 360;
    const dustGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferGeometry"]();
    const dustPos = new Float32Array(DUST * 3);
    const dustSeed = new Float32Array(DUST);
    for(let i = 0; i < DUST; i++){
        dustPos[i * 3] = Math.random() * W;
        dustPos[i * 3 + 1] = 0.4 + Math.random() * (WALL_H - 0.8);
        dustPos[i * 3 + 2] = Math.random() * D;
        dustSeed[i] = Math.random() * Math.PI * 2;
    }
    dustGeo.setAttribute("position", new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BufferAttribute"](dustPos, 3));
    const dust = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Points"](dustGeo, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PointsMaterial"]({
        color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xffdf9e).multiplyScalar(1.8),
        size: 0.03,
        transparent: true,
        opacity: 0.5,
        blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
        depthWrite: false,
        fog: true
    }));
    group.add(dust);
    // ── wandering light orbs (soft golden spirits) ──
    const orbs = [];
    const orbSpecs = [
        // [x, z, height, scale, speed]
        [
            3.5,
            3.5,
            2.6,
            0.5,
            0.11
        ],
        [
            15.5,
            4.2,
            3.1,
            0.38,
            0.14
        ],
        [
            16.2,
            12.5,
            2.2,
            0.55,
            0.09
        ],
        [
            3.0,
            12.8,
            3.4,
            0.42,
            0.12
        ],
        [
            9.6,
            2.6,
            3.0,
            0.34,
            0.16
        ],
        [
            9.6,
            14.2,
            2.5,
            0.46,
            0.1
        ],
        [
            6.2,
            8.4,
            3.6,
            0.3,
            0.18
        ],
        [
            12.8,
            3.4,
            2.8,
            0.36,
            0.13
        ],
        [
            6.9,
            11.6,
            3.2,
            0.33,
            0.15
        ],
        [
            13.4,
            13.8,
            2.6,
            0.4,
            0.12
        ]
    ];
    for (const [ox, oz, oy, sc, sp] of orbSpecs){
        const s = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sprite"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SpriteMaterial"]({
            map: glowTex,
            color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xffe4ae).multiplyScalar(1.7),
            transparent: true,
            blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
            depthWrite: false,
            fog: true
        }));
        s.scale.set(sc, sc, 1);
        s.userData = {
            ox,
            oz,
            oy,
            sp,
            ph: Math.random() * Math.PI * 2
        };
        orbs.push(s);
        group.add(s);
    }
    return {
        group,
        grid,
        pedestals,
        pool,
        spawn,
        envTexture,
        envRT,
        update (t, dt) {
            water.update(t);
            fu.uTime.value = t;
            skyMat.uniforms.uTime.value = t;
            for(let i = 0; i < shafts.length; i++){
                const m = shafts[i];
                const u = m.material.uniforms;
                u.uTime.value = t;
                u.uIntensity.value = shaftSpecs[i][3] * (0.82 + 0.18 * Math.sin(t * 0.7 + i * 1.7));
            }
            // lagoon glow breathing
            poolLight.intensity = 22 + Math.sin(t * 1.7) * 4;
            oculusGlow.intensity = 13 + Math.sin(t * 0.8) * 3;
            // seraph pulse (gentle, no doom flicker in heaven)
            seraphLight.intensity = 6.5 + Math.sin(t * 0.9) * 2.5;
            // angel dust rises with a slow swirl
            const pos = dustGeo.attributes.position;
            for(let i = 0; i < DUST; i++){
                let y = pos.getY(i) + dt * 0.07;
                let x = pos.getX(i) + Math.sin(t * 0.35 + dustSeed[i]) * dt * 0.03;
                if (y > WALL_H - 0.3) y = 0.4;
                pos.setY(i, y);
                pos.setX(i, Math.max(0.2, Math.min(W - 0.2, x)));
            }
            pos.needsUpdate = true;
            // light orbs drift on lissajous paths
            for (const s of orbs){
                const ud = s.userData;
                s.position.set(ud.ox + Math.sin(t * ud.sp + ud.ph) * 1.1, ud.oy + Math.sin(t * ud.sp * 0.7 + ud.ph * 2.0) * 0.35, ud.oz + Math.cos(t * ud.sp * 0.85 + ud.ph) * 1.1);
            }
        },
        renderReflection,
        setMirror
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/products.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CATALOG",
    ()=>CATALOG,
    "PRODUCT_BUILDERS",
    ()=>PRODUCT_BUILDERS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript)");
;
// ─── Procedural product models ──────────────────────────────────────────────
// Each product is a throwaway THREE.Group (front = +Z). The baker renders it
// from 9 bearings and throws the geometry away — customers only ever download
// the resulting sprite atlas. That is the whole Doom trick.
const CHARCOAL = 0x1f2328;
const DARKGRY = 0x2b3138;
const GUNMETAL = 0x454c54;
const AMBER = 0xf59e0b;
const TEAL = 0x2dd4bf;
const OFFWHITE = 0xd8d4cc;
const RED = 0xdc2626;
const GLASS = 0x0e2a2e;
function std(color, rough = 0.55, metal = 0.35) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color,
        roughness: rough,
        metalness: metal
    });
}
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BoxGeometry"](w, h, d), mat);
    m.position.set(x, y, z);
    return m;
}
function cyl(rTop, rBot, h, mat, x = 0, y = 0, z = 0, seg = 20) {
    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CylinderGeometry"](rTop, rBot, h, seg), mat);
    m.position.set(x, y, z);
    return m;
}
// ── 1. VOIDCAM X9 — mirrorless camera ──
function buildCamera() {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const body = std(CHARCOAL, 0.5, 0.3);
    const grip = std(DARKGRY, 0.8, 0.1);
    const lensGlass = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: GLASS,
        roughness: 0.08,
        metalness: 0.9
    });
    const ring = std(GUNMETAL, 0.35, 0.8);
    g.add(box(0.62, 0.42, 0.26, body, 0, 0.36, 0)); // body
    g.add(box(0.16, 0.4, 0.3, grip, -0.32, 0.35, -0.02)); // grip
    g.add(box(0.2, 0.09, 0.18, std(GUNMETAL, 0.3, 0.9), 0.18, 0.6, -0.03)); // hot shoe
    g.add(cyl(0.075, 0.075, 0.1, std(AMBER, 0.3, 0.6), -0.18, 0.55, 0.06)); // shutter dial
    const lens = cyl(0.17, 0.19, 0.3, ring, 0.05, 0.36, 0.22);
    lens.rotation.x = Math.PI / 2;
    g.add(lens);
    const glass = cyl(0.13, 0.13, 0.045, lensGlass, 0.05, 0.36, 0.38);
    glass.rotation.x = Math.PI / 2;
    g.add(glass);
    const hood = cyl(0.2, 0.2, 0.05, std(0x14161a, 0.6, 0.2), 0.05, 0.36, 0.34);
    hood.rotation.x = Math.PI / 2;
    g.add(hood);
    g.add(box(0.1, 0.05, 0.02, std(TEAL, 0.2, 0.4), 0.28, 0.42, 0.14)); // teal rec light
    return g;
}
// ── 2. PLAYSLAB-4 — next-gen console slab ──
function buildConsole() {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const slab = std(0x191d22, 0.42, 0.25);
    g.add(box(1.3, 0.09, 0.42, slab, 0, 0.28, 0)); // slab
    g.add(box(1.3, 0.03, 0.42, std(0x0c0e11, 0.7, 0.1), 0, 0.24, 0)); // shadow underside
    // angled front light strip (the iconic lean)
    const strip = box(1.26, 0.028, 0.05, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: AMBER,
        emissive: AMBER,
        emissiveIntensity: 1.6,
        roughness: 0.3
    }), 0, 0.335, 0.19);
    g.add(strip);
    g.add(box(0.5, 0.05, 0.3, std(0x14171c, 0.5, 0.4), 0.33, 0.24, -0.05)); // stand base
    g.add(box(0.07, 0.22, 0.07, std(GUNMETAL, 0.4, 0.7), 0.33, 0.35, -0.05)); // stand neck
    g.add(cyl(0.055, 0.055, 0.09, std(CHARCOAL, 0.5, 0.3), -0.45, 0.345, 0.14)); // eject
    g.add(cyl(0.045, 0.045, 0.03, std(0x0a0c0f, 0.3, 0.6), -0.45, 0.345, 0.16)); // button
    return g;
}
// ── 3. AURA-CANS — over-ear headphones ──
function buildHeadphones() {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const shell = std(CHARCOAL, 0.5, 0.2);
    const pad = std(0x11141a, 0.9, 0.05);
    const metal = std(GUNMETAL, 0.35, 0.85);
    // band: half torus
    const band = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TorusGeometry"](0.3, 0.035, 10, 24, Math.PI), metal);
    band.position.set(0, 0.62, 0);
    g.add(band);
    // cups
    for (const side of [
        -1,
        1
    ]){
        const cup = cyl(0.17, 0.19, 0.14, shell, side * 0.31, 0.34, 0);
        cup.rotation.z = Math.PI / 2;
        g.add(cup);
        const cap = cyl(0.17, 0.17, 0.03, metal, side * 0.39, 0.34, 0);
        cap.rotation.z = Math.PI / 2;
        g.add(cap);
        const earpad = cyl(0.15, 0.15, 0.06, pad, side * 0.24, 0.34, 0);
        earpad.rotation.z = Math.PI / 2;
        g.add(earpad);
        // teal LED ring on cap
        const led = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TorusGeometry"](0.1, 0.012, 8, 20), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
            color: TEAL,
            emissive: TEAL,
            emissiveIntensity: 1.4
        }));
        led.position.set(side * 0.41, 0.34, 0);
        led.rotation.y = Math.PI / 2;
        g.add(led);
        // yoke
        g.add(box(0.028, 0.18, 0.05, metal, side * 0.31, 0.5, 0));
    }
    return g;
}
// ── 4. CHRONO-7 — smartwatch ──
function buildWatch() {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const caseMat = std(0x2a2f36, 0.3, 0.9);
    const body = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.21, 0.21, 0.07, 28), caseMat);
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0.38, 0);
    g.add(body);
    const screen = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.185, 0.185, 0.075, 28), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: 0x061418,
        emissive: 0x0f766e,
        emissiveIntensity: 0.55,
        roughness: 0.15,
        metalness: 0.6
    }));
    screen.rotation.x = Math.PI / 2;
    screen.position.set(0, 0.38, 0.02);
    g.add(screen);
    // crown
    g.add(cyl(0.03, 0.03, 0.05, std(AMBER, 0.3, 0.9), 0.225, 0.38, 0.0).rotateZ(Math.PI / 2));
    // band straps
    const bandMat = std(0x15181d, 0.85, 0.05);
    const b1 = box(0.16, 0.34, 0.045, bandMat, 0, 0.7, -0.01);
    b1.rotation.x = -0.18;
    g.add(b1);
    const b2 = box(0.16, 0.34, 0.045, bandMat, 0, 0.06, -0.01);
    b2.rotation.x = 0.18;
    g.add(b2);
    // face glow dot
    g.add(box(0.05, 0.01, 0.01, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: RED,
        emissive: RED,
        emissiveIntensity: 2
    }), 0, 0.42, 0.055));
    return g;
}
// ── 5. SCOUT-1 — camera drone ──
function buildDrone() {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const frame = std(CHARCOAL, 0.45, 0.5);
    const arm = std(0x22262c, 0.5, 0.4);
    const rot = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TorusGeometry"](0.16, 0.022, 8, 22), std(0x101316, 0.6, 0.2));
    const hub = box(0.3, 0.11, 0.3, frame, 0, 0.4, 0);
    g.add(hub);
    g.add(box(0.2, 0.06, 0.2, std(0x191d22, 0.4, 0.3), 0, 0.47, 0.02)); // top shell
    g.add(box(0.12, 0.07, 0.1, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: RED,
        emissive: RED,
        emissiveIntensity: 1.6,
        roughness: 0.3
    }), 0, 0.47, 0.11)); // front sensor
    // gimbal camera
    const gim = cyl(0.06, 0.06, 0.1, std(0x0c0e11, 0.4, 0.6), 0, 0.24, 0.14);
    g.add(gim);
    g.add(box(0.05, 0.05, 0.03, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: GLASS,
        roughness: 0.1,
        metalness: 0.9
    }), 0, 0.24, 0.2));
    // 4 arms + rotor rings
    for (const [sx, sz] of [
        [
            -1,
            -1
        ],
        [
            1,
            -1
        ],
        [
            -1,
            1
        ],
        [
            1,
            1
        ]
    ]){
        const a = box(0.34, 0.045, 0.07, arm, sx * 0.2, 0.4, sz * 0.2);
        a.rotation.y = sx * sz > 0 ? -0.72 : 0.72;
        g.add(a);
        const r = rot.clone();
        r.position.set(sx * 0.33, 0.43, sz * 0.33);
        r.rotation.x = Math.PI / 2;
        g.add(r);
        g.add(cyl(0.05, 0.05, 0.09, std(GUNMETAL, 0.4, 0.8), sx * 0.33, 0.42, sz * 0.33));
    }
    return g;
}
// ── 6. THUMP TOWER — smart speaker ──
function buildSpeaker() {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const mesh = std(0x171b20, 0.85, 0.1);
    const body = cyl(0.24, 0.28, 0.86, mesh, 0, 0.43, 0, 26);
    g.add(body);
    const top = cyl(0.24, 0.24, 0.03, std(0x0d0f13, 0.5, 0.4), 0, 0.87, 0, 26);
    g.add(top);
    // teal control ring on top
    const ring = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TorusGeometry"](0.14, 0.014, 8, 26), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: TEAL,
        emissive: TEAL,
        emissiveIntensity: 1.5
    }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.89, 0);
    g.add(ring);
    // amber base glow
    const base = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TorusGeometry"](0.2, 0.016, 8, 26), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: AMBER,
        emissive: AMBER,
        emissiveIntensity: 1.2
    }));
    base.rotation.x = Math.PI / 2;
    base.position.set(0, 0.05, 0);
    g.add(base);
    // subtle horizontal weave lines (grille illusion)
    for(let i = 0; i < 7; i++){
        const t = cyl(0.2805 + i * 0.0004, 0.2805 + i * 0.0004, 0.012, std(0x101316, 0.9, 0.05), 0, 0.18 + i * 0.09, 0, 26);
        g.add(t);
    }
    return g;
}
// ─── 7. CLOUDSTEP OG — celestial runner ──
function buildSneaker() {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const soleMat = std(OFFWHITE, 0.55, 0.05);
    const upperMat = std(0xf2ece0, 0.5, 0.1);
    // moon-foam sole slab
    g.add(box(0.98, 0.09, 0.4, soleMat, 0, 0.05, 0));
    // toe cap rising into the sole
    const toe = box(0.34, 0.16, 0.38, soleMat, 0.33, 0.13, 0);
    toe.rotation.z = -0.22;
    g.add(toe);
    // pearl upper
    g.add(box(0.62, 0.2, 0.36, upperMat, -0.08, 0.2, 0));
    // heel collar
    g.add(box(0.18, 0.26, 0.34, std(0x1f2328, 0.7, 0.1), -0.42, 0.25, 0));
    // gold lightning stripe
    const stripe = box(0.36, 0.05, 0.37, std(AMBER, 0.3, 0.85), 0.02, 0.17, 0);
    stripe.rotation.z = 0.38;
    g.add(stripe);
    // laces
    for(let i = 0; i < 4; i++){
        g.add(box(0.05, 0.022, 0.31, std(0xe7e0d0, 0.6, 0), -0.05 + i * 0.13, 0.3 - i * 0.012, 0));
    }
    // teal sigil on the heel
    g.add(box(0.08, 0.08, 0.02, std(TEAL, 0.3, 0.5), -0.37, 0.17, 0.18));
    return g;
}
// ─── 8. SERAPH BOOK 16 — halo-grade laptop ──
function buildLaptop() {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    const alu = std(0xd9d6cf, 0.32, 0.78);
    // base
    g.add(box(1.1, 0.045, 0.78, alu, 0, 0.023, 0));
    // keyboard plate + key rows (bake-only detail, thrown away after)
    g.add(box(0.95, 0.012, 0.58, std(0x2b3038, 0.5, 0.3), -0.02, 0.05, 0.02));
    for(let r = 0; r < 4; r++){
        for(let c = 0; c < 6; c++){
            g.add(box(0.115, 0.008, 0.085, std(0x3a4048, 0.6, 0.2), -0.37 + c * 0.148, 0.06, -0.2 + r * 0.115));
        }
    }
    // gold hinge bar
    g.add(box(1.02, 0.03, 0.05, std(AMBER, 0.3, 0.9), 0, 0.055, -0.37));
    // screen slab, opened ~105°
    const screen = box(1.1, 0.72, 0.035, alu, 0, 0.37, -0.375);
    screen.rotation.x = -0.24;
    g.add(screen);
    // emissive display facing the pilgrim
    const disp = box(1.02, 0.64, 0.012, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
        color: 0x0b1416,
        emissive: 0x0f766e,
        emissiveIntensity: 0.9,
        roughness: 0.18,
        metalness: 0.55
    }), 0, 0.372, -0.352);
    disp.rotation.x = -0.24;
    g.add(disp);
    // gold sun-dot logo on the lid's back (shows in the rear angles)
    const logo = cyl(0.05, 0.05, 0.012, std(AMBER, 0.25, 0.95), 0, 0.37, -0.4);
    logo.rotation.x = -0.24 + Math.PI / 2;
    g.add(logo);
    return g;
}
const PRODUCT_BUILDERS = {
    voidcam: buildCamera,
    playslab: buildConsole,
    auracans: buildHeadphones,
    chrono: buildWatch,
    scout: buildDrone,
    thump: buildSpeaker,
    cloudstep: buildSneaker,
    seraphbook: buildLaptop
};
const CATALOG = [
    {
        id: "voidcam",
        name: "VOIDCAM X9",
        category: "OPTICS",
        price: 1299,
        credits: 1299,
        blurb: "Full-frame mirrorless predator. 61MP sensor, 8-stop stabilization and a f/0.95 prime lens that drinks light in the dark. Built like a bunker, shoots like a railgun.",
        specs: [
            "61MP FULL-FRAME SENSOR",
            "8K/30 RAW VIDEO",
            "8-STOP IBIS",
            "F/0.95 PRIME KIT",
            "DUAL CFexpress SLOTS",
            "WEATHER-SEALED TITANIUM"
        ],
        spriteW: 0.95,
        spriteH: 0.78,
        accent: 0x2dd4bf
    },
    {
        id: "playslab",
        name: "PLAYSLAB-4",
        category: "GAMING",
        price: 549,
        credits: 549,
        blurb: "Liquid-cooled 12TFLOP console slab with an amber pulse strip. 4K/120 ray-traced frames, 2TB NVMe warpspeed storage, and a standby mode so deep it borders on cryo-sleep.",
        specs: [
            "12 TFLOPS RDNA GPU",
            "4K/120HZ RAY-TRACING",
            "2TB NVME SSD",
            "LIQUID METAL COOLING",
            "HAPTIC CONTROLLER",
            "8K UPSCALING ENGINE"
        ],
        spriteW: 1.35,
        spriteH: 0.6,
        accent: 0xf59e0b
    },
    {
        id: "auracans",
        name: "AURA-CANS 900",
        category: "AUDIO",
        price: 399,
        credits: 399,
        blurb: "Planar-magnetic over-ears with adaptive noise cancellation that erases the world. Machined aluminium yokes, memory-foam cryo-pads and 80 hours of untethered silence.",
        specs: [
            "PLANAR MAGNETIC DRIVERS",
            "-42DB ADAPTIVE ANC",
            "80H BATTERY LIFE",
            "LDAC HI-RES WIRELESS",
            "MACHINED ALU YOKES",
            "SPATIAL HEAD TRACKING"
        ],
        spriteW: 0.92,
        spriteH: 1.0,
        accent: 0x2dd4bf
    },
    {
        id: "chrono",
        name: "CHRONO-7 TITAN",
        category: "WEARABLES",
        price: 799,
        credits: 799,
        blurb: "Grade-5 titanium smartwatch with sapphire crystal, 30-day battery and a sensor array that reads your blood like a med-bay. ECG, SpO2, HRV, sleep stages — the full telemetry package.",
        specs: [
            "GRADE-5 TITANIUM CASE",
            "SAPPHIRE CRYSTAL",
            "30-DAY BATTERY",
            "ECG + SPO2 + HRV",
            "200M WATER RESIST",
            "DUAL-BAND GNSS"
        ],
        spriteW: 0.62,
        spriteH: 1.0,
        accent: 0xf59e0b
    },
    {
        id: "scout",
        name: "SCOUT-1 DRONE",
        category: "AERIAL",
        price: 1099,
        credits: 1099,
        blurb: "48MP folding drone with 8K HDR gimbal, 46 minutes of flight time and omnidirectional obstacle sensing. Follows you through canyons like a trained hunting hawk.",
        specs: [
            "48MP 8K HDR GIMBAL",
            "46MIN FLIGHT TIME",
            "15KM OCC LINK",
            "OMNIDIRECTIONAL SENSING",
            "42MPH SPORT MODE",
            "FOLDABLE TITANIUM ARMS"
        ],
        spriteW: 0.95,
        spriteH: 0.7,
        accent: 0xdc2626
    },
    {
        id: "thump",
        name: "THUMP TOWER XL",
        category: "AUDIO",
        price: 299,
        credits: 299,
        blurb: "360° room-shaking smart speaker with a down-firing 6.5\" woofer and teal command ring. Auto-tunes itself to your room's acoustics in 12 seconds flat. The neighbors will file reports.",
        specs: [
            "360° WAVEGUIDE ARRAY",
            "6.5\" DOWNFIRE WOOFER",
            "130W RMS CLASS-D",
            "ROOM AUTO-CALIBRATION",
            "MULTI-ROOM MESH",
            "TEAL COMMAND RING"
        ],
        spriteW: 0.72,
        spriteH: 1.1,
        accent: 0x2dd4bf
    },
    {
        id: "cloudstep",
        name: "CLOUDSTEP OG",
        category: "FOOTWEAR",
        price: 249,
        credits: 249,
        blurb: "Cloud-composite runner on a moon-foam midsole that returns 78% of every stride. Pearl-knit upper, gold lightning stripe, and a teal sigil stitched into the heel. Walks like a hymn.",
        specs: [
            "CLOUD-COMPOSITE MIDSOLE",
            "78% ENERGY RETURN",
            "PEARL-KNIT UPPER",
            "TITANIUM LACE LOCKS",
            "228G PER SHOE",
            "AQUA-GRIP OUTSOLE"
        ],
        spriteW: 1.05,
        spriteH: 0.62,
        accent: 0xf59e0b
    },
    {
        id: "seraphbook",
        name: "SERAPH BOOK 16",
        category: "COMPUTING",
        price: 2199,
        credits: 2199,
        blurb: "16-core halo-silicon laptop with a 120Hz mini-LED panel that peaks at 1600 nits. Cold-forged aluminium unibody, gold hinge, and a fan that never preaches above 18 dB.",
        specs: [
            "16-CORE HALO SILICON",
            "16\" 120HZ MINI-LED",
            "1600-NIT PEAK HDR",
            "64GB UNIFIED MEMORY",
            "8TB NVME RAID",
            "18DB WHISPER COOLING"
        ],
        spriteW: 1.25,
        spriteH: 0.85,
        accent: 0x2dd4bf
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/baker.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ANGLES",
    ()=>ANGLES,
    "FRAME",
    ()=>FRAME,
    "atlasToDataURL",
    ()=>atlasToDataURL,
    "bakeProduct",
    ()=>bakeProduct,
    "sheetToAtlas",
    ()=>sheetToAtlas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$products$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/products.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/memory.ts [app-client] (ecmascript)");
;
;
;
const ANGLES = 9;
const FRAME = 224; // px per frame → atlas 2016×224 ≈ 2.4 MB RGBA+MIPS
function bakeProduct(renderer, id) {
    const builder = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$products$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PRODUCT_BUILDERS"][id];
    if (!builder) return null;
    const group = builder();
    // ── throwaway scene ──
    const scene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scene"]();
    scene.add(group);
    // lights parented to the CAMERA so every bearing is lit identically —
    // celestial three-point: warm sun key, golden rim, pearl-sky fill, aqua bounce
    const key = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DirectionalLight"](0xfff1d8, 2.6);
    const rim = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DirectionalLight"](0xffd9a0, 1.5);
    const amb = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AmbientLight"](0xd8e8ee, 1.05);
    const bounce = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DirectionalLight"](0x9fd8d0, 0.55);
    bounce.position.set(0, -1, 0);
    scene.add(amb, key, rim, bounce);
    // ── fit camera to bounds ──
    const box = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Box3"]().setFromObject(group);
    const center = box.getCenter(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]());
    const sphere = box.getBoundingSphere(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sphere"]());
    const fov = 26 * Math.PI / 180;
    const dist = sphere.radius / Math.sin(fov / 2) * 1.06;
    const cam = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"](26, 1, 0.05, dist * 4);
    key.position.set(0.6, 1.2, 1); // relative to cam below
    rim.position.set(-0.8, 0.5, -1);
    const rt = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebGLRenderTarget"](FRAME, FRAME, {
        samples: 4,
        format: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RGBAFormat"]
    });
    const atlas = document.createElement("canvas");
    atlas.width = FRAME * ANGLES;
    atlas.height = FRAME;
    const actx = atlas.getContext("2d");
    const buf = new Uint8Array(FRAME * FRAME * 4);
    const flip = document.createElement("canvas");
    flip.width = FRAME;
    flip.height = FRAME;
    const fctx = flip.getContext("2d");
    const prevRT = renderer.getRenderTarget();
    const prevClr = renderer.getClearColor(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"]());
    const prevAlpha = renderer.getClearAlpha();
    try {
        for(let k = 0; k < ANGLES; k++){
            const a = k * 40 * Math.PI / 180; // bearing
            cam.position.set(center.x + Math.sin(a) * dist, center.y + dist * 0.34, center.z + Math.cos(a) * dist);
            cam.lookAt(center);
            // move lights with camera (billboard-consistent shading)
            key.position.copy(cam.position).add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](0.5, 0.8, 0));
            key.target.position.copy(center);
            key.target.updateMatrixWorld();
            rim.position.copy(cam.position).add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"](-1, 0.3, -0.6));
            renderer.setRenderTarget(rt);
            renderer.setClearColor(0x000000, 0);
            renderer.clear(true, true, true);
            renderer.render(scene, cam);
            renderer.readRenderTargetPixels(rt, 0, 0, FRAME, FRAME, buf);
            // WebGL origin is bottom-left → vertical flip
            const img = fctx.createImageData(FRAME, FRAME);
            for(let y = 0; y < FRAME; y++){
                const src = y * FRAME * 4;
                const dst = (FRAME - 1 - y) * FRAME * 4;
                img.data.set(buf.subarray(src, src + FRAME * 4), dst);
            }
            fctx.putImageData(img, 0, 0);
            actx.drawImage(flip, k * FRAME, 0);
        }
    } finally{
        renderer.setRenderTarget(prevRT);
        renderer.setClearColor(prevClr, prevAlpha);
        rt.dispose();
        scene.traverse((o)=>{
            const m = o;
            if (m.geometry) m.geometry.dispose();
            const mat = m.material;
            if (Array.isArray(mat)) mat.forEach((x)=>x.dispose());
            else if (mat) mat.dispose();
        });
    }
    const texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CanvasTexture"](atlas);
    texture.minFilter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LinearMipmapLinearFilter"];
    texture.magFilter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LinearFilter"];
    texture.generateMipmaps = true;
    texture.wrapS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClampToEdgeWrapping"];
    texture.wrapT = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClampToEdgeWrapping"];
    texture.colorSpace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SRGBColorSpace"];
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mem"].register(texture, atlas.width, atlas.height, true);
    // alpha content box across all 9 frames (for pixel-perfect grounding)
    const data = actx.getImageData(0, 0, atlas.width, atlas.height).data;
    let minY = FRAME, maxY = -1, minX = atlas.width, maxX = -1;
    for(let y = 0; y < FRAME; y++){
        for(let x = 0; x < atlas.width; x++){
            if (data[(y * atlas.width + x) * 4 + 3] > 24) {
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
            }
        }
    }
    if (maxY < 0) {
        minY = 0;
        maxY = FRAME - 1;
        minX = 0;
        maxX = atlas.width - 1;
    }
    const content = [
        minY / FRAME,
        (maxY + 1) / FRAME,
        minX / atlas.width,
        (maxX + 1) / atlas.width
    ];
    return {
        atlas,
        texture,
        content,
        radius: sphere.radius
    };
}
function atlasToDataURL(atlas) {
    return atlas.toDataURL("image/png");
}
function sheetToAtlas(img, frameW = FRAME, frameH = FRAME) {
    const atlas = document.createElement("canvas");
    atlas.width = frameW * ANGLES;
    atlas.height = frameH;
    const ctx = atlas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    const w = img.width / ANGLES;
    const h = img.height;
    const side = Math.min(w, h); // centered square crop per cell
    for(let k = 0; k < ANGLES; k++){
        ctx.drawImage(img, k * w + (w - side) / 2, (h - side) / 2, side, side, k * frameW, 0, frameW, frameH);
    }
    return atlas;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/sprites.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProductSprite",
    ()=>ProductSprite
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$baker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/baker.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/textures.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/memory.ts [app-client] (ecmascript)");
;
;
;
;
// ─── Billboard sprite system — 9-frame Doom rotation + mirrored reflection ──
// CELESTIAL EDITION: every product now wears a golden halo and stands in a
// column of sanctum light.
const SPRITE_VERT = /* glsl */ `
  uniform float uFrame;
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = vec2(uv.x / ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$baker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ANGLES"]}.0 + uFrame / ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$baker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ANGLES"]}.0, uv.y);
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
const PLANE = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](1, 1);
// shared GPU textures — one upload for every ring / beam in the shop.
// Lazy: module-level document access would break SSR prerendering.
let _ringTexture = null;
let _beamTexture = null;
function ringTexture() {
    if (!_ringTexture) _ringTexture = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["texGlow"])(), false);
    return _ringTexture;
}
function beamTexture() {
    if (!_beamTexture) _beamTexture = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$textures$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["texBeam"])(), false);
    return _beamTexture;
}
function spriteMaterial(map, reflect) {
    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
        vertexShader: SPRITE_VERT,
        fragmentShader: SPRITE_FRAG,
        uniforms: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UniformsUtils"].merge([
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UniformsLib"].fog,
            {
                map: {
                    value: null
                },
                uFrame: {
                    value: 0
                },
                uOpacity: {
                    value: reflect ? 0.42 : 1.0
                },
                uReflect: {
                    value: reflect ? 1 : 0
                },
                uHolo: {
                    value: 0
                },
                uTime: {
                    value: 0
                },
                uTint: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xffffff)
                }
            }
        ]),
        transparent: true,
        depthTest: !reflect,
        depthWrite: !reflect,
        side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DoubleSide"],
        fog: true
    });
    m.uniforms.map.value = map;
    return m;
}
function makeTag(spec, qty) {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 56;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(22,18,10,0.82)";
    ctx.fillRect(0, 8, 160, 40);
    ctx.strokeStyle = `#${spec.accent.toString(16).padStart(6, "0")}`;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 9, 158, 38);
    ctx.strokeStyle = "rgba(255,224,150,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 11, 154, 34);
    ctx.font = "bold 17px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f7f0dd";
    ctx.fillText(spec.name.slice(0, 15), 80, 22);
    ctx.fillStyle = "#ffd98c";
    ctx.fillText(qty > 0 ? `CRED ${spec.price} [x${qty}]` : `CRED ${spec.price}`, 80, 40);
    return c;
}
class ProductSprite {
    mesh;
    reflection;
    ring;
    beam;
    tag;
    halo;
    haloGlow;
    group = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"]();
    spec;
    mat;
    rmat;
    tagCanvas;
    tagTex;
    haloMat;
    frame = 0;
    hover = false;
    bob = Math.random() * Math.PI * 2;
    baseY;
    constructor(spec, texture, /** alpha content box of the atlas, fractions [y0, y1, x0, x1] (y from TOP) */ content, pos, facing, floorY, pedestalTop){
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
        this.mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](PLANE, this.mat);
        this.mesh.scale.set(planeW, planeH, 1);
        this.mesh.position.set(0, this.baseY, 0);
        this.mesh.renderOrder = 3;
        // mirrored copy across the pedestal-top plane (fake mirror, zero cost)
        const refH = planeH;
        this.reflection = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](PLANE, this.rmat);
        this.reflection.scale.set(planeW, -refH, 1);
        this.reflection.position.set(0, 2 * pedestalTop - this.baseY, 0);
        this.reflection.renderOrder = 2;
        // glow ring on the pedestal
        const ringMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            map: ringTexture(),
            color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](spec.accent).multiplyScalar(1.6),
            transparent: true,
            blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
            depthWrite: false,
            opacity: 0.55,
            fog: true
        });
        this.ring = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlaneGeometry"](1, 1), ringMat);
        this.ring.rotation.x = -Math.PI / 2;
        this.ring.position.set(0, pedestalTop + 0.012, 0);
        this.ring.scale.set(1.15, 1.15, 1);
        this.ring.renderOrder = 4;
        // sanctum light column behind the product
        const beamMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            map: beamTexture(),
            color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](spec.accent).lerp(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xffd98c), 0.45).multiplyScalar(1.5),
            transparent: true,
            blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
            depthWrite: false,
            opacity: 0.18,
            side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DoubleSide"],
            fog: true
        });
        this.beam = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](PLANE, beamMat);
        this.beam.scale.set(spec.spriteW * 1.5, pedestalTop - floorY + spec.spriteH * 1.6, 1);
        this.beam.position.set(0, (pedestalTop + floorY + spec.spriteH) * 0.5 - 0.2, -0.28);
        this.beam.renderOrder = 1;
        // golden halo floating above the product — big enough to read at distance
        this.haloMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MeshStandardMaterial"]({
            color: 0xffe4a8,
            metalness: 1.0,
            roughness: 0.18,
            emissive: 0xc98a20,
            emissiveIntensity: 2.2
        });
        const haloR = Math.max(0.18, Math.min(spec.spriteW, spec.spriteH) * 0.34);
        this.halo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TorusGeometry"](haloR, haloR * 0.13, 10, 28), this.haloMat);
        this.halo.rotation.x = Math.PI / 2 + 0.16;
        this.halo.position.set(0, this.baseY + planeH * 0.5 + 0.42, 0);
        // soft golden aura behind the halo — reads at any distance
        this.haloGlow = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sprite"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SpriteMaterial"]({
            map: ringTexture(),
            color: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xffdf9a).multiplyScalar(1.5),
            transparent: true,
            blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdditiveBlending"],
            depthWrite: false,
            opacity: 0.5,
            fog: true
        }));
        this.haloGlow.scale.set(haloR * 5.2, haloR * 5.2, 1);
        this.haloGlow.position.set(0, this.baseY + planeH * 0.5 + 0.42, 0);
        this.haloGlow.renderOrder = 5;
        // floating price tag
        this.tagCanvas = makeTag(spec, 0);
        this.tagTex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])(this.tagCanvas, false);
        this.tag = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sprite"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SpriteMaterial"]({
            map: this.tagTex,
            transparent: true,
            depthTest: true,
            fog: true
        }));
        this.tag.scale.set(0.92, 0.32, 1);
        this.tag.position.set(0, this.baseY + planeH * 0.5 + 0.28, 0);
        this.tag.renderOrder = 5;
        this.group.position.copy(pos);
        this.group.rotation.y = facing;
        this.group.add(this.mesh, this.reflection, this.ring, this.beam, this.halo, this.haloGlow, this.tag);
    }
    setHover(h) {
        this.hover = h;
        this.haloMat.emissiveIntensity = h ? 4.0 : 2.2;
        this.haloGlow.material.opacity = h ? 0.85 : 0.5;
    }
    updateTag(qty) {
        const c = makeTag(this.spec, qty);
        this.tagCanvas.width = c.width;
        this.tagCanvas.height = c.height;
        this.tagCanvas.getContext("2d").drawImage(c, 0, 0);
        this.tagTex.needsUpdate = true;
    }
    /** swap in a freshly baked/uploaded atlas texture (asset pipeline) */ swapTexture(texture, content) {
        this.mat.uniforms.map.value = texture;
        this.rmat.uniforms.map.value = texture;
        void content;
    }
    update(camPos, t, dt) {
        const facing = this.group.rotation.y;
        // bearing from sprite to camera (0 = +Z)
        const g = Math.atan2(camPos.x - this.group.position.x, camPos.z - this.group.position.z);
        // billboard: compensate for the group's facing so world yaw = bearing
        this.mesh.rotation.y = g - facing;
        this.reflection.rotation.y = g - facing;
        // 9-frame rotation: relative bearing vs the sprite's facing
        const rel = ((g - facing) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const frame = Math.round(rel / (Math.PI * 2 / __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$baker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ANGLES"])) % __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$baker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ANGLES"];
        if (frame !== this.frame) {
            this.frame = frame;
            this.mat.uniforms.uFrame.value = frame;
            this.rmat.uniforms.uFrame.value = frame;
        }
        this.mat.uniforms.uTime.value = t;
        this.rmat.uniforms.uTime.value = t;
        // hover holo pulse + gentle idle bob
        const targetHolo = this.hover ? 1 : 0;
        const u = this.mat.uniforms.uHolo;
        u.value += (targetHolo - u.value) * Math.min(1, dt * 8);
        this.bob += dt * (this.hover ? 3.4 : 1.1);
        const bobY = Math.sin(this.bob) * (this.hover ? 0.045 : 0.014);
        this.mesh.position.y = this.baseY + bobY;
        this.tag.position.y = this.baseY + this.mesh.scale.y * 0.5 + 0.3 + Math.sin(this.bob * 0.8) * 0.03;
        // halo floats and wobbles above the crown
        this.halo.position.y = this.baseY + this.mesh.scale.y * 0.5 + 0.42 + bobY * 0.6;
        this.haloGlow.position.y = this.halo.position.y;
        this.halo.rotation.z = Math.sin(t * 1.3 + this.bob * 0.2) * 0.22;
        this.halo.rotation.y += dt * 0.6;
        const hov = this.hover ? 1.18 : 1.0;
        const hs = hov + Math.sin(t * 2.2 + this.bob) * 0.04;
        this.halo.scale.set(hs, hs, 1);
        const ringMat = this.ring.material;
        const pulse = this.hover ? 0.75 + 0.25 * Math.sin(t * 6) : 0.42;
        ringMat.opacity += (pulse - ringMat.opacity) * Math.min(1, dt * 8);
        const rs = this.hover ? 1.32 + 0.06 * Math.sin(t * 5) : 1.15;
        this.ring.scale.set(rs, rs, 1);
        const beamMat = this.beam.material;
        beamMat.opacity = this.hover ? 0.32 + 0.1 * Math.sin(t * 4) : 0.17;
    }
    dispose() {
        this.mat.dispose();
        this.rmat.dispose();
        this.ring.material.dispose();
        this.beam.material.dispose();
        this.tag.material.dispose();
        this.tagTex.dispose();
        this.haloMat.dispose();
        this.halo.geometry.dispose();
        this.haloGlow.material.dispose();
        this.ring.geometry.dispose();
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/audio.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ─── WebAudio synth — every sound is generated, 0 bytes of samples ──────────
__turbopack_context__.s([
    "DoomAudio",
    ()=>DoomAudio
]);
class DoomAudio {
    ctx = null;
    master = null;
    ambientNodes = [];
    enabled = true;
    started = false;
    stepAlt = false;
    /** must be called from a user gesture */ unlock() {
        if (this.started) {
            this.ctx?.resume().catch(()=>{});
            return;
        }
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.enabled ? 0.9 : 0;
            this.master.connect(this.ctx.destination);
            this.started = true;
            this.startAmbient();
        } catch  {
        /* audio unavailable */ }
    }
    setEnabled(on) {
        this.enabled = on;
        if (this.master && this.ctx) {
            this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05);
        }
    }
    startAmbient() {
        if (!this.ctx || !this.master) return;
        const ctx = this.ctx;
        // seraph pad: A-major add9 cluster of detuned sines through a soft filter
        const g = ctx.createGain();
        g.gain.value = 0.028;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 1100;
        lp.Q.value = 0.4;
        g.connect(lp).connect(this.master);
        const pad = [
            110,
            164.81,
            220,
            246.94,
            277.18,
            329.63
        ];
        for (const f of pad){
            for (const det of [
                -1.2,
                1.2
            ]){
                const o = ctx.createOscillator();
                o.type = "sine";
                o.frequency.value = f;
                o.detune.value = det;
                const og = ctx.createGain();
                og.gain.value = 1 / pad.length;
                o.connect(og).connect(g);
                o.start();
                this.ambientNodes.push(o);
            }
        }
        // slow breathing LFO on the filter — the temple inhales
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.07;
        const lfoG = ctx.createGain();
        lfoG.gain.value = 420;
        lfo.connect(lfoG).connect(lp.frequency);
        lfo.start();
        this.ambientNodes.push(lfo);
        // faint angelic shimmer (high air)
        const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for(let i = 0; i < nd.length; i++)nd[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        noise.loop = true;
        const nlp = ctx.createBiquadFilter();
        nlp.type = "bandpass";
        nlp.frequency.value = 2900;
        nlp.Q.value = 0.5;
        const ng = ctx.createGain();
        ng.gain.value = 0.006;
        noise.connect(nlp).connect(ng).connect(this.master);
        noise.start();
        this.ambientNodes.push(noise);
    }
    blip(freq, dur, type, vol, delay = 0, slideTo) {
        if (!this.ctx || !this.master || !this.enabled) return;
        const ctx = this.ctx;
        const t0 = ctx.currentTime + delay;
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(this.master);
        o.start(t0);
        o.stop(t0 + dur + 0.05);
    }
    noiseBurst(dur, freq, vol, q = 1.2) {
        if (!this.ctx || !this.master || !this.enabled) return;
        const ctx = this.ctx;
        const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for(let i = 0; i < len; i++)d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = freq;
        bp.Q.value = q;
        const g = ctx.createGain();
        g.gain.value = vol;
        src.connect(bp).connect(g).connect(this.master);
        src.start();
    }
    footstep() {
        // polished marble click
        this.stepAlt = !this.stepAlt;
        this.noiseBurst(0.05, this.stepAlt ? 260 : 225, 0.1, 3);
        this.blip(this.stepAlt ? 96 : 88, 0.06, "sine", 0.05);
    }
    hover() {
        this.blip(1568, 0.045, "sine", 0.035);
    }
    interact() {
        this.blip(784, 0.09, "sine", 0.08);
        this.blip(1175, 0.09, "sine", 0.06, 0.07);
    }
    /** blessed pickup chime — bell partials */ pickup() {
        this.blip(1046.5, 0.1, "sine", 0.2);
        this.blip(1318.5, 0.1, "sine", 0.16, 0.08);
        this.blip(1568, 0.16, "sine", 0.18, 0.16);
        this.blip(2093, 0.2, "sine", 0.07, 0.16);
    }
    deny() {
        this.blip(130, 0.16, "triangle", 0.1, 0, 82);
    }
    checkout() {
        // ascending major arpeggio into the light
        const seq = [
            523.25,
            659.25,
            783.99,
            1046.5,
            1318.5
        ];
        seq.forEach((f, i)=>this.blip(f, 0.13, "sine", 0.18, i * 0.09));
        this.blip(2093, 0.4, "sine", 0.06, 0.45);
    }
    splash() {
        this.noiseBurst(0.4, 900, 0.1, 0.5);
        this.blip(300, 0.25, "sine", 0.08, 0, 120);
    }
    dispose() {
        for (const n of this.ambientNodes){
            try {
                n.stop?.();
            } catch  {
            /* already stopped */ }
        }
        this.ambientNodes = [];
        this.ctx?.close().catch(()=>{});
        this.ctx = null;
        this.started = false;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/doom/engine.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DoomEngine",
    ()=>DoomEngine
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$postprocessing$2f$EffectComposer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/examples/jsm/postprocessing/EffectComposer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$postprocessing$2f$RenderPass$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/examples/jsm/postprocessing/RenderPass.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$postprocessing$2f$UnrealBloomPass$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$postprocessing$2f$OutputPass$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/examples/jsm/postprocessing/OutputPass.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$level$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/level.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$products$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/products.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$baker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/baker.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$sprites$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/sprites.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$audio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/audio.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/memory.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
const EYE = 1.66;
const RADIUS = 0.34;
const WALK = 3.4;
const RUN = 5.7;
class DoomEngine {
    renderer;
    composer;
    bloom;
    scene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Scene"]();
    camera;
    level;
    sprites = [];
    baked = new Map();
    audio = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$audio$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DoomAudio"]();
    raf = 0;
    clock = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Clock"]();
    t = 0;
    paused = false;
    disposed = false;
    // adaptive quality — the Doom way: run beautifully on GPUs, gracefully
    // everywhere else (SwiftShader, weak iGPUs). Auto-degrades after a warmup.
    quality = "ultra";
    mirrorOn = true;
    lowFpsStreak = 0;
    qualityWarmup = 3.0;
    realT = 0;
    qualityLocked = false;
    celebrateT = 0;
    // input state
    keys = new Set();
    moveInput = {
        x: 0,
        y: 0
    };
    yaw = 0;
    pitch = 0;
    pos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    vel = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
    bobPhase = 0;
    lastStepBob = 0;
    locked = false;
    dragging = false;
    dragButton = false;
    dragMoved = 0;
    touchLook = null;
    // interaction
    hovered = null;
    promptSpec = null;
    promptTimer = 0;
    // stats
    frames = 0;
    statAcc = 0;
    lastStats = {
        fps: 0,
        vramMB: 0,
        drawCalls: 0,
        sprites: 0,
        px: 0,
        pz: 0,
        yaw: 0
    };
    cb;
    // DOM handles
    canvas;
    onKeyDown;
    onKeyUp;
    onMouseMove;
    onMouseDown;
    onMouseUp;
    onLockChange;
    onResize;
    onTouchStart;
    onTouchMove;
    onTouchEnd;
    constructor(canvas, cb = {}){
        this.canvas = canvas;
        this.cb = cb;
        this.renderer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebGLRenderer"]({
            canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SRGBColorSpace"];
        // AAA-grade filmic response — highlights roll off like heaven, not clip
        this.renderer.toneMapping = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ACESFilmicToneMapping"];
        this.renderer.toneMappingExposure = 1.04;
        // composer-owned frame: we reset stats manually once per frame
        this.renderer.info.autoReset = false;
        this.camera = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"](74, 1, 0.08, 70);
        this.camera.rotation.order = "YXZ";
        // ── world ──
        this.scene.fog = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FogExp2"](0xe9eef0, 0.026);
        this.scene.background = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Color"](0xdcedf0);
        this.level = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$level$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildLevel"])(this.renderer);
        this.scene.add(this.level.group);
        // the pearl heavens become the PBR environment — gold drinks the sky
        this.scene.environment = this.level.envTexture;
        // ── bake all products to 9-angle sprite atlases (the Doom method) ──
        for(let i = 0; i < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$products$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CATALOG"].length && i < this.level.pedestals.length; i++){
            const spec = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$products$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CATALOG"][i];
            const ped = this.level.pedestals[i];
            const baked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$baker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["bakeProduct"])(this.renderer, spec.id);
            if (!baked) continue;
            this.baked.set(spec.id, baked);
            const sprite = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$sprites$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProductSprite"](spec, baked.texture, baked.content, ped.pos, ped.facing, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$level$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FLOOR_Y"], ped.top);
            sprite.setHover(false);
            this.scene.add(sprite.group);
            this.sprites.push(sprite);
        }
        // ── post pipeline: render → Unreal bloom → filmic output ──
        // budget broken ON PURPOSE: 4×MSAA HalfFloat frame chain — post-processed
        // geometry keeps crisp silhouette edges instead of the composer's blur.
        const bufSize = this.renderer.getDrawingBufferSize(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"]());
        const frameRT = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebGLRenderTarget"](bufSize.x, bufSize.y, {
            samples: 4,
            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HalfFloatType"]
        });
        this.composer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$postprocessing$2f$EffectComposer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EffectComposer"](this.renderer, frameRT);
        this.composer.addPass(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$postprocessing$2f$RenderPass$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RenderPass"](this.scene, this.camera));
        this.bloom = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$postprocessing$2f$UnrealBloomPass$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UnrealBloomPass"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector2"](512, 512), 0.5, 0.6, 0.85 // threshold — only true light blooms
        );
        this.composer.addPass(this.bloom);
        this.composer.addPass(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$postprocessing$2f$OutputPass$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OutputPass"]());
        // ── spawn ──
        this.pos.set(this.level.spawn.x, EYE, this.level.spawn.z);
        this.yaw = this.level.spawn.yaw;
        // ── listeners ──
        this.onKeyDown = (e)=>{
            if (this.paused) return;
            const k = e.key.toLowerCase();
            if ([
                "w",
                "a",
                "s",
                "d",
                "arrowup",
                "arrowdown",
                "arrowleft",
                "arrowright",
                "shift",
                "e"
            ].includes(k)) {
                e.preventDefault();
            }
            this.keys.add(k);
            if (k === "e") this.tryInteract();
        };
        this.onKeyUp = (e)=>this.keys.delete(e.key.toLowerCase());
        this.onMouseMove = (e)=>{
            if (this.paused) return;
            if (this.locked || this.dragging) {
                this.dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
                this.yaw -= e.movementX * 0.0021;
                this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - e.movementY * 0.0021));
            }
        };
        this.onMouseDown = (e)=>{
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
                        const p = this.canvas.requestPointerLock?.();
                        p?.catch?.(()=>{});
                    } catch  {
                    /* drag-look fallback active */ }
                }
            }
        };
        this.onMouseUp = ()=>{
            // only treat as a CLICK (not a drag-look) for interaction
            if (this.dragButton && this.dragMoved < 6 && this.promptSpec) this.tryInteract();
            this.dragging = false;
            this.dragButton = false;
        };
        this.onLockChange = ()=>{
            this.locked = document.pointerLockElement === this.canvas;
            if (!this.locked) this.dragging = false;
        };
        this.onResize = ()=>this.resize();
        this.onTouchStart = (e)=>{
            if (this.paused) return;
            const t = e.changedTouches[0];
            if (t && !this.touchLook) {
                this.touchLook = {
                    id: t.identifier,
                    x: t.clientX,
                    y: t.clientY
                };
            }
        };
        this.onTouchMove = (e)=>{
            if (this.paused || !this.touchLook) return;
            for (const t of Array.from(e.changedTouches)){
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
        this.onTouchEnd = (e)=>{
            const tl = this.touchLook;
            if (!tl) return;
            for (const t of Array.from(e.changedTouches)){
                if (t.identifier === tl.id) this.touchLook = null;
            }
        };
        window.addEventListener("keydown", this.onKeyDown, {
            passive: false
        });
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);
        window.addEventListener("resize", this.onResize);
        document.addEventListener("pointerlockchange", this.onLockChange);
        canvas.addEventListener("mousedown", this.onMouseDown);
        canvas.addEventListener("touchstart", this.onTouchStart, {
            passive: false
        });
        canvas.addEventListener("touchmove", this.onTouchMove, {
            passive: false
        });
        canvas.addEventListener("touchend", this.onTouchEnd);
        this.resize();
        this.cb.onReady?.(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mem"].usedMB);
        // test/debug hook (harmless in prod, aids E2E verification)
        window.__doomDebug = {
            pos: ()=>({
                    x: +this.pos.x.toFixed(2),
                    z: +this.pos.z.toFixed(2),
                    yaw: +this.yaw.toFixed(3)
                }),
            tp: (x, z, yaw)=>{
                this.pos.set(x, EYE, z);
                if (typeof yaw === "number") this.yaw = yaw;
                this.vel.set(0, 0, 0);
                return {
                    x,
                    z,
                    yaw: +this.yaw.toFixed(3)
                };
            },
            paused: ()=>this.paused,
            frames: ()=>this.sprites.map((s)=>({
                        id: s.spec.id,
                        frame: s.frame,
                        reflY: +s.reflection.position.y.toFixed(2),
                        meshY: +s.mesh.position.y.toFixed(2)
                    })),
            prompt: ()=>this.promptSpec?.id ?? null,
            vram: ()=>+__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mem"].usedMB.toFixed(3),
            quality: ()=>this.quality,
            setQuality: (q)=>this.setQuality(q),
            lockQuality: ()=>{
                this.qualityLocked = true;
                return this.quality;
            }
        };
    }
    // ── public API ──
    setPaused(p) {
        this.paused = p;
        if (p && this.locked) document.exitPointerLock?.();
        if (!p) this.keys.clear();
    }
    /** force a quality tier ("ultra" = mirror floor + bloom; "lite" = lean) */ setQuality(q) {
        if (q === this.quality) return;
        this.quality = q;
        const ultra = q === "ultra";
        this.mirrorOn = ultra;
        this.level.setMirror(ultra);
        this.bloom.enabled = ultra;
        const pr = ultra ? Math.min(window.devicePixelRatio, 2) : 1;
        this.renderer.setPixelRatio(pr);
        this.composer.setPixelRatio(pr);
        this.resize();
    }
    getQuality() {
        return this.quality;
    }
    setMoveInput(x, y) {
        this.moveInput.x = x;
        this.moveInput.y = y;
    }
    setSound(on) {
        this.audio.setEnabled(on);
    }
    /** checkout blessing — a swell of bloom and light through the temple */ celebrate() {
        this.celebrateT = 2.2;
    }
    /** public interact (mobile E button / dialog triggers) */ interactNow() {
        this.tryInteract();
    }
    updateCartQty(productId, qty) {
        const s = this.sprites.find((x)=>x.spec.id === productId);
        s?.updateTag(qty);
    }
    /** asset pipeline: replace a product's sprite atlas from an uploaded image */ applySpriteSheet(productId, img) {
        const sprite = this.sprites.find((s)=>s.spec.id === productId);
        if (!sprite) return false;
        const atlas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$baker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sheetToAtlas"])(img);
        const tex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["trackedCanvasTexture"])(atlas, true);
        tex.colorSpace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SRGBColorSpace"];
        sprite.swapTexture(tex);
        return true;
    }
    /** export the baked reference sheet for the asset pipeline */ exportSheet(productId) {
        const b = this.baked.get(productId);
        return b ? b.atlas.toDataURL("image/png") : null;
    }
    /** minimap data for the React automap */ getMinimap() {
        return {
            grid: this.level.grid,
            pool: this.level.pool
        };
    }
    /** live player state for the automap (updated every frame) */ getStats() {
        return this.lastStats;
    }
    start() {
        this.clock.start();
        const loop = ()=>{
            if (this.disposed) return;
            this.raf = requestAnimationFrame(loop);
            const realDt = this.clock.getDelta();
            const dt = Math.min(0.05, realDt);
            this.t += dt;
            this.realT += realDt;
            this.update(dt);
            // manual stats reset: one honest count for the whole composed frame
            this.renderer.info.reset();
            // 1) floor mirror pass (renders the reflected world into the marble
            //    AND — budget broken edition — the lagoon drinks the same target)
            if (this.mirrorOn) {
                this.level.renderReflection(this.renderer, this.scene, this.camera, this.sprites.map((s)=>s.reflection) // hide fake pedestal mirrors
                );
            }
            // 2) main pass: scene → bloom → ACES filmic output
            this.composer.render();
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
        for (const s of this.sprites)s.dispose();
        this.scene.traverse((o)=>{
            const m = o;
            if (m.geometry) m.geometry.dispose();
            const mat = m.material;
            if (Array.isArray(mat)) mat.forEach((x)=>x.dispose());
            else if (mat) mat.dispose();
        });
        this.bloom.dispose();
        this.composer.dispose();
        this.level.envRT.dispose();
        this.renderer.dispose();
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mem"].reset();
    }
    // ── internals ──
    resize() {
        const w = this.canvas.clientWidth || window.innerWidth;
        const h = this.canvas.clientHeight || window.innerHeight;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / Math.max(1, h);
        this.camera.updateProjectionMatrix();
        this.composer.setSize(w, h);
    }
    update(dt) {
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
        this.camera.position.set(this.pos.x, EYE + Math.sin(this.bobPhase * 2) * 0.028 * bobAmp, this.pos.z);
        this.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bobPhase) * 0.006 * bobAmp);
        if (bobAmp > 0.35 && Math.floor(this.bobPhase / Math.PI) !== this.lastStepBob) {
            this.lastStepBob = Math.floor(this.bobPhase / Math.PI);
            this.audio.footstep();
        }
        // world
        this.level.update(this.t, dt);
        for (const s of this.sprites)s.update(this.camera.position, this.t, dt);
        // checkout blessing: bloom & exposure swell, then settle back
        if (this.celebrateT > 0) {
            this.celebrateT = Math.max(0, this.celebrateT - dt);
            const k = this.celebrateT / 2.2;
            if (this.bloom.enabled) this.bloom.strength = 0.5 + Math.sin((2.2 - this.celebrateT) * 9) * 0.3 * k;
            this.renderer.toneMappingExposure = 1.04 + 0.12 * k;
        } else {
            this.bloom.strength = 0.5;
            this.renderer.toneMappingExposure = 1.04;
        }
        // live stats for the automap
        this.lastStats.px = this.pos.x;
        this.lastStats.pz = this.pos.z;
        this.lastStats.yaw = this.yaw;
        // interaction prompt
        this.updatePrompt(dt);
    }
    collides(x, z) {
        const g = this.level.grid;
        const r = RADIUS;
        const minCX = Math.floor((x - r) / g.cell);
        const maxCX = Math.floor((x + r) / g.cell);
        const minCZ = Math.floor((z - r) / g.cell);
        const maxCZ = Math.floor((z + r) / g.cell);
        for(let cz = minCZ; cz <= maxCZ; cz++){
            for(let cx = minCX; cx <= maxCX; cx++){
                if (cx < 0 || cz < 0 || cx >= g.w || cz >= g.h) return true;
                if (g.cells[cz * g.w + cx] !== 0) return true;
            }
        }
        return false;
    }
    updatePrompt(dt) {
        // nearest product within reach AND roughly in the crosshair
        let best = null;
        let bestScore = -1;
        const fwd = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Vector3"]();
        this.camera.getWorldDirection(fwd);
        for (const s of this.sprites){
            const dx = s.group.position.x - this.camera.position.x;
            const dz = s.group.position.z - this.camera.position.z;
            const dist = Math.hypot(dx, dz);
            if (dist > 3.1) continue;
            const dot = dx / dist * fwd.x + dz / dist * fwd.z;
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
    tryInteract() {
        if (!this.promptSpec) {
            this.audio.deny();
            return;
        }
        this.audio.interact();
        this.cb.onSelect?.(this.promptSpec);
    }
    emitStats() {
        const fps = Math.round(this.frames / Math.max(0.001, this.statAcc));
        this.lastStats = {
            fps,
            vramMB: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$memory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mem"].usedMB,
            drawCalls: this.renderer.info.render.calls,
            sprites: this.sprites.length,
            px: this.pos.x,
            pz: this.pos.z,
            yaw: this.yaw
        };
        // adaptive quality governor: sustained low fps after warmup → lite tier
        if (this.realT > this.qualityWarmup && this.quality === "ultra" && !this.qualityLocked) {
            if (fps < 26) {
                this.lowFpsStreak++;
                if (this.lowFpsStreak >= 4) this.setQuality("lite");
            } else {
                this.lowFpsStreak = 0;
            }
        }
        this.cb.onStats?.(this.lastStats);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useShop",
    ()=>useShop
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
"use client";
;
const MAX_QTY = 9;
// cart persistence — migrated from the DOOM MART era key on first load
const CART_KEY = "celestia-cart";
const LEGACY_KEY = "doommart-cart";
function persist(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch  {
    /* sandboxed iframe — cart stays in memory */ }
}
(function migrateLegacyCart() {
    try {
        const fresh = localStorage.getItem(CART_KEY);
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (!fresh && legacy) localStorage.setItem(CART_KEY, legacy);
    } catch  {
    /* storage unavailable */ }
})();
/** rehydrate the blessed locker on page load (ssr:false — browser only) */ function loadCart() {
    try {
        const raw = localStorage.getItem(CART_KEY) ?? localStorage.getItem(LEGACY_KEY);
        if (raw) {
            const items = JSON.parse(raw);
            if (Array.isArray(items)) {
                return items.filter((it)=>it && typeof it.id === "string" && typeof it.qty === "number");
            }
        }
    } catch  {
    /* corrupted or blocked storage — start with an empty locker */ }
    return [];
}
const useShop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set, get)=>({
        cart: loadCart(),
        addToCart: (spec)=>{
            const cart = [
                ...get().cart
            ];
            const i = cart.findIndex((c)=>c.id === spec.id);
            if (i >= 0) {
                if (cart[i].qty < MAX_QTY) cart[i] = {
                    ...cart[i],
                    qty: cart[i].qty + 1
                };
            } else {
                cart.push({
                    id: spec.id,
                    name: spec.name,
                    price: spec.price,
                    qty: 1
                });
            }
            set({
                cart
            });
            persist(cart);
        },
        removeFromCart: (id)=>{
            const cart = get().cart.filter((c)=>c.id !== id);
            set({
                cart
            });
            persist(cart);
        },
        setQty: (id, qty)=>{
            let cart = get().cart.map((c)=>c.id === id ? {
                    ...c,
                    qty: Math.max(0, Math.min(MAX_QTY, qty))
                } : c);
            cart = cart.filter((c)=>c.qty > 0);
            set({
                cart
            });
            persist(cart);
        },
        clearCart: ()=>{
            set({
                cart: []
            });
            try {
                localStorage.removeItem(CART_KEY);
            } catch  {
            /* noop */ }
        },
        cartCount: ()=>get().cart.reduce((a, c)=>a + c.qty, 0),
        cartTotal: ()=>get().cart.reduce((a, c)=>a + c.qty * c.price, 0),
        stats: {
            fps: 0,
            vramMB: 0,
            drawCalls: 0,
            sprites: 0,
            px: 0,
            pz: 0,
            yaw: 0
        },
        setStats: (stats)=>set({
                stats
            }),
        prompt: null,
        setPrompt: (prompt)=>set({
                prompt
            }),
        selected: null,
        setSelected: (selected)=>set({
                selected
            }),
        cartOpen: false,
        setCartOpen: (cartOpen)=>set({
                cartOpen
            }),
        started: false,
        setStarted: (started)=>set({
                started
            }),
        soundOn: true,
        setSoundOn: (soundOn)=>set({
                soundOn
            }),
        lastOrder: null,
        setLastOrder: (lastOrder)=>set({
                lastOrder
            }),
        toastMsg: null,
        setToastMsg: (toastMsg)=>set({
                toastMsg
            })
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
            destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2 has-[>svg]:px-3",
            sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
            lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
            icon: "size-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/TitleScreen.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TitleScreen",
    ()=>TitleScreen
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
// ─── Title screen — the classic PSX Doom fire, recast as ascending ──────────
// golden light rising from below. Same 37-step algorithm, heaven palette.
const FW = 192;
const FH = 100;
function palette() {
    // dark amber → deep gold → bright gold → cream → white (37 steps)
    const stops = [
        [
            26,
            14,
            2
        ],
        [
            122,
            62,
            10
        ],
        [
            212,
            140,
            40
        ],
        [
            255,
            208,
            120
        ],
        [
            255,
            246,
            220
        ]
    ];
    const p = new Uint8Array(37 * 3);
    for(let i = 0; i < 37; i++){
        const t = i / 36;
        const seg = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
        const lt = t * (stops.length - 1) - seg;
        for(let c = 0; c < 3; c++){
            p[i * 3 + c] = Math.round(stops[seg][c] + (stops[seg + 1][c] - stops[seg][c]) * lt);
        }
    }
    return p;
}
function TitleScreen({ onEnter }) {
    _s();
    const fireRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("none");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TitleScreen.useEffect": ()=>{
            const canvas = fireRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const pal = palette();
            const fire = new Uint8Array(FW * FH);
            for(let x = 0; x < FW; x++)fire[(FH - 1) * FW + x] = 36;
            let raf = 0;
            let alive = true;
            const img = ctx.createImageData(FW, FH);
            const step = {
                "TitleScreen.useEffect.step": ()=>{
                    if (!alive) return;
                    for(let x = 0; x < FW; x++){
                        for(let y = 1; y < FH; y++){
                            const src = y * FW + x;
                            const v = fire[src];
                            if (v === 0) {
                                fire[src - FW] = 0;
                            } else {
                                const r = Math.random() * 3 | 0;
                                const dst = src - FW - r + 1;
                                const v2 = Math.max(0, v - (r & 1));
                                fire[Math.max(0, Math.min(FW * FH - 1, dst))] = v2;
                            }
                        }
                    }
                    // ignite the bottom row with slight flicker
                    for(let x = 0; x < FW; x++){
                        fire[(FH - 1) * FW + x] = 36 - (Math.random() * 3 | 0);
                    }
                    const d = img.data;
                    for(let i = 0; i < FW * FH; i++){
                        const v = fire[i];
                        d[i * 4] = pal[v * 3];
                        d[i * 4 + 1] = pal[v * 3 + 1];
                        d[i * 4 + 2] = pal[v * 3 + 2];
                        d[i * 4 + 3] = v === 0 ? 0 : 255;
                    }
                    ctx.putImageData(img, 0, 0);
                    raf = requestAnimationFrame(step);
                }
            }["TitleScreen.useEffect.step"];
            step();
            return ({
                "TitleScreen.useEffect": ()=>{
                    alive = false;
                    cancelAnimationFrame(raf);
                }
            })["TitleScreen.useEffect"];
        }
    }["TitleScreen.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none bg-[#070502]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: fireRef,
                width: FW,
                height: FH,
                "aria-hidden": true,
                className: "absolute bottom-0 left-0 w-full h-[46%] object-cover opacity-95",
                style: {
                    imageRendering: "pixelated"
                }
            }, void 0, false, {
                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 pointer-events-none",
                style: {
                    background: "radial-gradient(ellipse 60% 40% at 50% 34%, rgba(255,214,140,0.16) 0%, rgba(255,214,140,0.05) 45%, transparent 70%)"
                }
            }, void 0, false, {
                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                lineNumber: 103,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 scanlines pointer-events-none"
            }, void 0, false, {
                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 flex flex-col items-center gap-1 px-4 -mt-16 md:-mt-24",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[11px] md:text-sm tracking-[0.5em] text-amber-200/80 font-mono",
                        children: "✦ THE TEMPLE OF RETAIL ✦"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "font-mono font-black text-4xl sm:text-5xl md:text-7xl leading-none text-center whitespace-nowrap",
                        style: {
                            color: "#ffe9b8",
                            textShadow: "0 0 18px rgba(255,214,140,0.9), 0 0 60px rgba(255,190,90,0.55), 0 4px 0 #a06a1e, 0 6px 0 #6b430e",
                            letterSpacing: "0.04em"
                        },
                        children: "CELESTIA GALLERIA"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-mono text-teal-200/90 text-[11px] md:text-base tracking-[0.25em] mt-2 text-center",
                        children: "✦ FORMERLY DOOM MART — REBORN IN GOLDEN LIGHT ✦"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-mono text-neutral-500 text-[10px] md:text-xs mt-1 text-center",
                        children: "9-ANGLE SPRITES · MIRROR MARBLE · BUDGET GLORIOUSLY BROKEN · ZERO DOWNLOADS"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        onClick: onEnter,
                        className: "mt-8 h-12 md:h-14 px-8 md:px-12 text-lg md:text-xl font-mono font-bold tracking-widest border-2 border-amber-300 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-[#241304] shadow-[0_0_36px_rgba(255,208,120,0.55)] hover:from-amber-200 hover:to-amber-500 active:translate-y-0.5",
                        children: "✦ ASCEND TO THE SHOP"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                        lineNumber: 135,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3 mt-4 font-mono text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setTab(tab === "help" ? "none" : "help"),
                                className: "text-amber-200/80 hover:text-amber-100 underline underline-offset-4",
                                children: "HOW TO PLAY"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 143,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-neutral-700",
                                children: "|"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 149,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setTab(tab === "assets" ? "none" : "assets"),
                                className: "text-amber-200/80 hover:text-amber-100 underline underline-offset-4",
                                children: "ASSET PIPELINE"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this),
                    tab === "help" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 max-w-md w-full bg-black/80 border border-amber-900/70 rounded p-4 font-mono text-xs text-neutral-300 space-y-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-300",
                                        children: "WASD / ARROWS"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                        lineNumber: 160,
                                        columnNumber: 16
                                    }, this),
                                    " — move · ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-300",
                                        children: "SHIFT"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                        lineNumber: 160,
                                        columnNumber: 79
                                    }, this),
                                    " — run"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 160,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-300",
                                        children: "MOUSE"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                        lineNumber: 161,
                                        columnNumber: 16
                                    }, this),
                                    " — click to lock & look (or drag)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 161,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-300",
                                        children: "E / CLICK"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                        lineNumber: 162,
                                        columnNumber: 16
                                    }, this),
                                    " — inspect highlighted product"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 162,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-300",
                                        children: "TOUCH"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                        lineNumber: 163,
                                        columnNumber: 16
                                    }, this),
                                    " — left stick moves, drag looks"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "Walk up to any product — the golden halo marks it in reach."
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 164,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                        lineNumber: 159,
                        columnNumber: 11
                    }, this),
                    tab === "assets" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 max-w-md w-full bg-black/80 border border-amber-900/70 rounded p-4 font-mono text-xs text-neutral-300 space-y-1.5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Products are ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-300",
                                        children: "9-angle PNG sprite sheets"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                        lineNumber: 169,
                                        columnNumber: 29
                                    }, this),
                                    " (Doom method)."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 169,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "Drop a ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-teal-200",
                                        children: "9-frame horizontal strip"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                        lineNumber: 170,
                                        columnNumber: 23
                                    }, this),
                                    " onto the shop window to replace any product live — design your 2D art, upload, customers shop it in 3D."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 170,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: [
                                    "In-shop ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-teal-200",
                                        children: "ASSETS"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                        lineNumber: 171,
                                        columnNumber: 24
                                    }, this),
                                    " button exports reference sheets."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                                lineNumber: 171,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/TitleScreen.tsx",
                        lineNumber: 168,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                lineNumber: 113,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute bottom-3 z-10 font-mono text-[10px] text-neutral-600 tracking-widest",
                children: "© 1993-2026 CELESTIA RETAIL — “WHERE EVERY DEAL IS DIVINE”"
            }, void 0, false, {
                fileName: "[project]/src/components/doom/TitleScreen.tsx",
                lineNumber: 176,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/doom/TitleScreen.tsx",
        lineNumber: 92,
        columnNumber: 5
    }, this);
}
_s(TitleScreen, "zYUBrOl9fvaf34xo0VT6YGj8uVE=");
_c = TitleScreen;
var _c;
__turbopack_context__.k.register(_c, "TitleScreen");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/HudBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HudBar",
    ()=>HudBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
// ─── Doom status bar — CART / CREDITS / VRAM / FPS + mood face ─────────────
function MoodFace({ count }) {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mood = count === 0 ? 0 : count <= 3 ? 1 : count <= 7 ? 2 : 3;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MoodFace.useEffect": ()=>{
            const c = ref.current;
            if (!c) return;
            const ctx = c.getContext("2d");
            ctx.clearRect(0, 0, 24, 24);
            // golden halo grows with devotion (cart size)
            if (mood > 0) {
                ctx.strokeStyle = `rgba(255,214,120,${0.45 + mood * 0.18})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(12, 3.4, 5 + mood * 1.6, 1.6, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.fillStyle = "#e8c9a0";
            ctx.fillRect(4, 4, 16, 17); // face
            ctx.fillStyle = "#3a2a16";
            ctx.fillRect(7, 10, 3, 3); // eyes
            ctx.fillRect(14, 10, 3, 3);
            // serene brows rise with devotion
            ctx.fillStyle = "#8a5a24";
            ctx.fillRect(6, 7 - mood, 5, 1);
            ctx.fillRect(13, 7 - mood, 5, 1);
            // mouth per mood — from neutral to blessed grin
            if (mood === 0) ctx.fillRect(8, 18, 8, 1);
            else if (mood === 1) ctx.fillRect(8, 17, 8, 2);
            else if (mood === 2) {
                ctx.fillRect(7, 16, 10, 3);
                ctx.fillStyle = "#e8c9a0";
                ctx.fillRect(8, 16, 8, 1);
            } else {
                ctx.fillRect(6, 15, 12, 4);
                ctx.fillStyle = "#5a3010";
                ctx.fillRect(7, 16, 10, 2);
            }
        }
    }["MoodFace.useEffect"], [
        mood
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
        ref: ref,
        width: 24,
        height: 24,
        "aria-hidden": true,
        className: "w-10 h-10 md:w-12 md:h-12 [image-rendering:pixelated] border border-amber-800/70 bg-[#161006]"
    }, void 0, false, {
        fileName: "[project]/src/components/doom/HudBar.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
_s(MoodFace, "8uVE59eA/r6b92xF80p7sH8rXLk=");
_c = MoodFace;
function HudBar({ onCart, onAssets, onHelp }) {
    _s1();
    const stats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "HudBar.useShop[stats]": (s)=>s.stats
    }["HudBar.useShop[stats]"]);
    const cart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "HudBar.useShop[cart]": (s)=>s.cart
    }["HudBar.useShop[cart]"]);
    const soundOn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "HudBar.useShop[soundOn]": (s)=>s.soundOn
    }["HudBar.useShop[soundOn]"]);
    const setSoundOn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "HudBar.useShop[setSoundOn]": (s)=>s.setSoundOn
    }["HudBar.useShop[setSoundOn]"]);
    const count = cart.reduce((a, c)=>a + c.qty, 0);
    const total = cart.reduce((a, c)=>a + c.qty * c.price, 0);
    const vram = stats.vramMB;
    // the 4 MB Doom club was left behind on purpose — the meter now celebrates it
    const vramPct = Math.min(100, vram / 32 * 100);
    const fpsColor = stats.fps >= 50 ? "#4ade80" : stats.fps >= 30 ? "#eab308" : "#ef4444";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed bottom-0 inset-x-0 z-40 font-mono select-none pointer-events-none",
        role: "status",
        "aria-label": "Shop status bar",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto max-w-5xl px-1 md:px-3 pb-1",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hud-panel pointer-events-auto flex items-stretch gap-1 md:gap-2 p-1.5 md:p-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden sm:flex flex-col items-center justify-center px-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MoodFace, {
                                count: count
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 89,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[8px] text-amber-700 tracking-widest",
                                children: "PILGRIM"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 90,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/HudBar.tsx",
                        lineNumber: 88,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center justify-center min-w-[64px] md:min-w-[90px] px-2 border border-amber-900/60 bg-[#140e04]/80",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[9px] md:text-[10px] text-amber-600/90 tracking-[0.25em]",
                                children: "CART"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 95,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-2xl md:text-4xl font-black tabular-nums",
                                style: {
                                    color: "#ffb44d",
                                    textShadow: "0 0 12px rgba(255,180,77,0.65)"
                                },
                                children: String(count).padStart(2, "0")
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 96,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/HudBar.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center justify-center min-w-[80px] md:min-w-[120px] px-2 border border-amber-900/60 bg-[#140e04]/80",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[9px] md:text-[10px] text-amber-600/90 tracking-[0.25em]",
                                children: "CREDITS"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 106,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-lg md:text-3xl font-black tabular-nums",
                                style: {
                                    color: "#ffe9b0",
                                    textShadow: "0 0 12px rgba(255,233,176,0.55)"
                                },
                                children: total.toLocaleString()
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 107,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/HudBar.tsx",
                        lineNumber: 105,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden md:flex flex-col justify-center min-w-[170px] px-2 border border-amber-900/60 bg-[#140e04]/80 gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-[9px] text-amber-600/90 tracking-[0.2em]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "VRAM"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/HudBar.tsx",
                                        lineNumber: 118,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-300",
                                        children: [
                                            vram.toFixed(1),
                                            " MB"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/doom/HudBar.tsx",
                                        lineNumber: 119,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 117,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-2.5 bg-[#241a08] border border-amber-900/60 overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-full transition-all duration-500",
                                    style: {
                                        width: `${vramPct}%`,
                                        background: "linear-gradient(90deg, #b9862f, #ffd98c, #ff9ea0)",
                                        boxShadow: "0 0 10px rgba(255,217,140,0.7)"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/HudBar.tsx",
                                    lineNumber: 122,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 121,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between text-[9px] tracking-wider",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-800/80",
                                        children: [
                                            "SPR ",
                                            stats.sprites
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/doom/HudBar.tsx",
                                        lineNumber: 132,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-rose-300/90",
                                        children: "✦ BUDGET BROKEN"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/HudBar.tsx",
                                        lineNumber: 133,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-amber-800/80",
                                        children: [
                                            "DC ",
                                            stats.drawCalls
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/doom/HudBar.tsx",
                                        lineNumber: 134,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/HudBar.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex md:hidden flex-col items-center justify-center px-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[9px] text-amber-600/90",
                                children: "FPS"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-base font-black tabular-nums",
                                style: {
                                    color: fpsColor
                                },
                                children: stats.fps
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 141,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/HudBar.tsx",
                        lineNumber: 139,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/HudBar.tsx",
                        lineNumber: 146,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1 md:gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setSoundOn(!soundOn),
                                "aria-label": "Toggle sound",
                                className: "hud-btn",
                                children: soundOn ? "🔊" : "🔇"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 150,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onAssets,
                                "aria-label": "Asset pipeline",
                                className: "hud-btn hidden sm:block",
                                children: "🖼"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 157,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onHelp,
                                "aria-label": "Help",
                                className: "hud-btn hidden sm:block",
                                children: "?"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 160,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onCart,
                                className: "hud-btn !px-3 md:!px-5 !text-xs md:!text-sm !bg-gradient-to-b !from-amber-300 !via-amber-400 !to-amber-600 !border-amber-300 !text-[#241304] !font-bold",
                                "aria-label": `Open cart, ${count} items`,
                                children: [
                                    "🛒 ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "hidden md:inline",
                                        children: "CART"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/HudBar.tsx",
                                        lineNumber: 168,
                                        columnNumber: 18
                                    }, this),
                                    " [",
                                    count,
                                    "]"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/HudBar.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/HudBar.tsx",
                        lineNumber: 149,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/doom/HudBar.tsx",
                lineNumber: 86,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/doom/HudBar.tsx",
            lineNumber: 85,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/doom/HudBar.tsx",
        lineNumber: 80,
        columnNumber: 5
    }, this);
}
_s1(HudBar, "f1w8BQDe9o9Xqpb0b7ue2Cgm8w4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"]
    ];
});
_c1 = HudBar;
var _c, _c1;
__turbopack_context__.k.register(_c, "MoodFace");
__turbopack_context__.k.register(_c1, "HudBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/Minimap.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Minimap",
    ()=>Minimap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function Minimap({ engine }) {
    _s();
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Minimap.useEffect": ()=>{
            if (!engine) return;
            const canvas = ref.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            const SIZE = 150;
            const VIEW = 7.5; // meters radius shown
            let raf = 0;
            let alive = true;
            const draw = {
                "Minimap.useEffect.draw": ()=>{
                    if (!alive) return;
                    const mm = engine.getMinimap();
                    // player state via stats is too slow; read engine internals through API
                    const st = engine.getStats();
                    const { grid, pool } = mm;
                    const scale = SIZE / 2 / VIEW;
                    const cell = grid.cell;
                    ctx.clearRect(0, 0, SIZE, SIZE);
                    // backdrop
                    ctx.fillStyle = "rgba(10,7,3,0.72)";
                    ctx.fillRect(0, 0, SIZE, SIZE);
                    ctx.save();
                    ctx.translate(SIZE / 2, SIZE / 2);
                    // rotate so player faces up (Doom automap style)
                    ctx.rotate(st.yaw + Math.PI);
                    const px = st.px;
                    const pz = st.pz;
                    const toX = {
                        "Minimap.useEffect.draw.toX": (wx)=>(wx - px) * scale
                    }["Minimap.useEffect.draw.toX"];
                    const toY = {
                        "Minimap.useEffect.draw.toY": (wz)=>(wz - pz) * scale
                    }["Minimap.useEffect.draw.toY"];
                    // cells
                    for(let cz = 0; cz < grid.h; cz++){
                        for(let cx = 0; cx < grid.w; cx++){
                            const v = grid.cells[cz * grid.w + cx];
                            if (v === 0) continue;
                            const x = toX(cx * cell);
                            const y = toY(cz * cell);
                            const s = cell * scale;
                            if (Math.abs(x) > SIZE / 2 + s || Math.abs(y) > SIZE / 2 + s) continue;
                            if (v === 1) ctx.fillStyle = "rgba(200,150,60,0.5)";
                            else if (v === 2) ctx.fillStyle = "rgba(63,216,200,0.30)";
                            else ctx.fillStyle = "rgba(255,217,140,0.75)";
                            ctx.fillRect(x, y, s, s);
                        }
                    }
                    // pool outline shimmer
                    ctx.strokeStyle = "rgba(63,216,200,0.8)";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(toX(pool.cx - pool.w / 2), toY(pool.cz - pool.d / 2), pool.w * scale, pool.d * scale);
                    // view cone
                    ctx.rotate(-(st.yaw + Math.PI));
                    ctx.fillStyle = "rgba(255,255,255,0.06)";
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    const spread = 0.62;
                    const r = SIZE / 2;
                    ctx.lineTo(Math.sin(-spread) * r, -Math.cos(-spread) * r);
                    ctx.lineTo(0, -r);
                    ctx.lineTo(Math.sin(spread) * r, -Math.cos(spread) * r);
                    ctx.closePath();
                    ctx.fill();
                    // player arrow (gold pilgrim)
                    ctx.fillStyle = "#ffd98c";
                    ctx.beginPath();
                    ctx.moveTo(0, -7);
                    ctx.lineTo(5, 6);
                    ctx.lineTo(0, 3);
                    ctx.lineTo(-5, 6);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    // frame
                    ctx.strokeStyle = "rgba(201,150,46,0.6)";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2);
                    // N marker rotates with map
                    ctx.save();
                    ctx.translate(SIZE / 2, SIZE / 2);
                    ctx.rotate(st.yaw + Math.PI);
                    ctx.fillStyle = "rgba(255,217,140,0.9)";
                    ctx.font = "bold 10px monospace";
                    ctx.textAlign = "center";
                    ctx.fillText("N", 0, -(SIZE / 2 - 8));
                    ctx.restore();
                    raf = requestAnimationFrame(draw);
                }
            }["Minimap.useEffect.draw"];
            draw();
            return ({
                "Minimap.useEffect": ()=>{
                    alive = false;
                    cancelAnimationFrame(raf);
                }
            })["Minimap.useEffect"];
        }
    }["Minimap.useEffect"], [
        engine
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
        ref: ref,
        width: 150,
        height: 150,
        "aria-label": "Shop automap",
        className: "w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-sm shadow-lg shadow-black/60"
    }, void 0, false, {
        fileName: "[project]/src/components/doom/Minimap.tsx",
        lineNumber: 119,
        columnNumber: 5
    }, this);
}
_s(Minimap, "8uVE59eA/r6b92xF80p7sH8rXLk=");
_c = Minimap;
var _c;
__turbopack_context__.k.register(_c, "Minimap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/dialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dialog",
    ()=>Dialog,
    "DialogClose",
    ()=>DialogClose,
    "DialogContent",
    ()=>DialogContent,
    "DialogDescription",
    ()=>DialogDescription,
    "DialogFooter",
    ()=>DialogFooter,
    "DialogHeader",
    ()=>DialogHeader,
    "DialogOverlay",
    ()=>DialogOverlay,
    "DialogPortal",
    ()=>DialogPortal,
    "DialogTitle",
    ()=>DialogTitle,
    "DialogTrigger",
    ()=>DialogTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as XIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
function Dialog({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "dialog",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 12,
        columnNumber: 10
    }, this);
}
_c = Dialog;
function DialogTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "dialog-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 18,
        columnNumber: 10
    }, this);
}
_c1 = DialogTrigger;
function DialogPortal({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Portal"], {
        "data-slot": "dialog-portal",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 24,
        columnNumber: 10
    }, this);
}
_c2 = DialogPortal;
function DialogClose({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
        "data-slot": "dialog-close",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 30,
        columnNumber: 10
    }, this);
}
_c3 = DialogClose;
function DialogOverlay({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Overlay"], {
        "data-slot": "dialog-overlay",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c4 = DialogOverlay;
function DialogContent({ className, children, showCloseButton = true, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogPortal, {
        "data-slot": "dialog-portal",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogOverlay, {}, void 0, false, {
                fileName: "[project]/src/components/ui/dialog.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
                "data-slot": "dialog-content",
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg", className),
                ...props,
                children: [
                    children,
                    showCloseButton && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
                        "data-slot": "dialog-close",
                        className: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__["XIcon"], {}, void 0, false, {
                                fileName: "[project]/src/components/ui/dialog.tsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/dialog.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ui/dialog.tsx",
                        lineNumber: 70,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/dialog.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_c5 = DialogContent;
function DialogHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "dialog-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-2 text-center sm:text-left", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 85,
        columnNumber: 5
    }, this);
}
_c6 = DialogHeader;
function DialogFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "dialog-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 95,
        columnNumber: 5
    }, this);
}
_c7 = DialogFooter;
function DialogTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        "data-slot": "dialog-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-lg leading-none font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 111,
        columnNumber: 5
    }, this);
}
_c8 = DialogTitle;
function DialogDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        "data-slot": "dialog-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, this);
}
_c9 = DialogDescription;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
__turbopack_context__.k.register(_c, "Dialog");
__turbopack_context__.k.register(_c1, "DialogTrigger");
__turbopack_context__.k.register(_c2, "DialogPortal");
__turbopack_context__.k.register(_c3, "DialogClose");
__turbopack_context__.k.register(_c4, "DialogOverlay");
__turbopack_context__.k.register(_c5, "DialogContent");
__turbopack_context__.k.register(_c6, "DialogHeader");
__turbopack_context__.k.register(_c7, "DialogFooter");
__turbopack_context__.k.register(_c8, "DialogTitle");
__turbopack_context__.k.register(_c9, "DialogDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/badge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "badgeVariants",
    ()=>badgeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
            secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
            destructive: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Badge({ className, variant, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "span";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "badge",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/badge.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c = Badge;
;
var _c;
__turbopack_context__.k.register(_c, "Badge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/separator.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Separator",
    ()=>Separator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-separator/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
function Separator({ className, orientation = "horizontal", decorative = true, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "separator",
        decorative: decorative,
        orientation: orientation,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/separator.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_c = Separator;
;
var _c;
__turbopack_context__.k.register(_c, "Separator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/ProductDialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProductDialog",
    ()=>ProductDialog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/dialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/badge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/separator.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function ProductDialog({ onPick, spriteSheetUrl }) {
    _s();
    const selected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "ProductDialog.useShop[selected]": (s)=>s.selected
    }["ProductDialog.useShop[selected]"]);
    const setSelected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "ProductDialog.useShop[setSelected]": (s)=>s.setSelected
    }["ProductDialog.useShop[setSelected]"]);
    const addToCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "ProductDialog.useShop[addToCart]": (s)=>s.addToCart
    }["ProductDialog.useShop[addToCart]"]);
    const setToastMsg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "ProductDialog.useShop[setToastMsg]": (s)=>s.setToastMsg
    }["ProductDialog.useShop[setToastMsg]"]);
    const cart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "ProductDialog.useShop[cart]": (s)=>s.cart
    }["ProductDialog.useShop[cart]"]);
    const [qty, setQtyLocal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    if (!selected) return null;
    const inCart = cart.find((c)=>c.id === selected.id)?.qty ?? 0;
    const accent = `#${selected.accent.toString(16).padStart(6, "0")}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Dialog"], {
        open: !!selected,
        onOpenChange: (o)=>!o && setSelected(null),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
            className: "max-w-lg bg-[#0b0e12] border-2 border-neutral-700 font-mono text-neutral-200 [&>button]:border-neutral-600",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 flex-wrap",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
                                className: "text-xl md:text-2xl font-black tracking-wider",
                                style: {
                                    color: accent,
                                    textShadow: `0 0 18px ${accent}55`
                                },
                                children: selected.name
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                lineNumber: 34,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                variant: "outline",
                                className: "border-teal-700 text-teal-300 tracking-widest text-[10px]",
                                children: selected.category
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                lineNumber: 40,
                                columnNumber: 13
                            }, this),
                            inCart > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                                className: "bg-amber-600 text-black font-bold tracking-widest text-[10px]",
                                children: [
                                    "×",
                                    inCart,
                                    " IN CART"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                lineNumber: 47,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/doom/ProductDialog.tsx",
                        lineNumber: 33,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this),
                spriteSheetUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative h-32 md:h-40 overflow-hidden border border-neutral-700 bg-[repeating-conic-gradient(#18181b_0%_25%,#101012_0%_50%)] bg-[length:18px_18px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute inset-0 flex items-center justify-center",
                            style: {
                                boxShadow: `inset 0 0 60px ${accent}22`
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: spriteSheetUrl,
                                alt: `${selected.name} 9-angle sprite rotation`,
                                className: "sprite-rotate h-[85%] w-[900%] max-w-none object-contain object-left",
                                style: {
                                    filter: `drop-shadow(0 10px 14px rgba(0,0,0,0.55))`
                                }
                            }, selected.id, false, {
                                fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                lineNumber: 62,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                            lineNumber: 57,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute bottom-1 right-2 text-[9px] font-mono text-neutral-500 tracking-widest",
                            children: "LIVE 9-ANGLE ROTATION"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                            lineNumber: 70,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                    lineNumber: 56,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border border-neutral-700 bg-black/60 p-3 text-xs md:text-sm leading-relaxed text-neutral-300",
                    style: {
                        boxShadow: `inset 0 0 40px ${accent}11`
                    },
                    children: selected.blurb
                }, void 0, false, {
                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                    lineNumber: 76,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-2 gap-1.5 text-[10px] md:text-xs",
                    children: selected.specs.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 border border-neutral-800 bg-neutral-900/60 px-2 py-1.5 text-teal-200/90",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-amber-500",
                                    children: "▸"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                    lineNumber: 89,
                                    columnNumber: 15
                                }, this),
                                s
                            ]
                        }, s, true, {
                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                            lineNumber: 85,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                    lineNumber: 83,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Separator"], {
                    className: "bg-neutral-800"
                }, void 0, false, {
                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                    lineNumber: 95,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between gap-3 flex-wrap",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-[10px] text-neutral-500 tracking-[0.3em]",
                                    children: "PRICE"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                    lineNumber: 99,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-3xl font-black tabular-nums text-amber-400",
                                    style: {
                                        textShadow: "0 0 14px rgba(251,191,36,0.5)"
                                    },
                                    children: [
                                        selected.price.toLocaleString(),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm text-neutral-500 ml-1",
                                            children: "CRED"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                            lineNumber: 105,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                    lineNumber: 100,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                            lineNumber: 98,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center border border-neutral-700 bg-black/50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "px-3 py-2 text-lg text-neutral-300 hover:text-white",
                                            onClick: ()=>setQtyLocal(Math.max(1, qty - 1)),
                                            "aria-label": "Decrease quantity",
                                            children: "−"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                            lineNumber: 111,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "w-8 text-center text-xl font-bold tabular-nums",
                                            children: qty
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                            lineNumber: 118,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "px-3 py-2 text-lg text-neutral-300 hover:text-white",
                                            onClick: ()=>setQtyLocal(Math.min(9, qty + 1)),
                                            "aria-label": "Increase quantity",
                                            children: "+"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                            lineNumber: 119,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                    lineNumber: 110,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    onClick: ()=>{
                                        for(let i = 0; i < qty; i++)addToCart(selected);
                                        onPick?.(selected.id);
                                        setToastMsg(`${selected.name} ×${qty} ADDED TO CART`);
                                        setTimeout(()=>setToastMsg(null), 2200);
                                        setSelected(null);
                                        setQtyLocal(1);
                                    },
                                    className: "h-12 px-6 font-bold tracking-widest border-2 border-amber-400 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 hover:to-amber-500 !text-[#241304]",
                                    children: "✦ ADD TO CART"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                                    lineNumber: 127,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/ProductDialog.tsx",
                            lineNumber: 109,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-[10px] text-neutral-600 tracking-wider",
                    children: "RENDERED AS 9-ANGLE SPRITE IMPOSTER · CELESTIA VERIFIED"
                }, void 0, false, {
                    fileName: "[project]/src/components/doom/ProductDialog.tsx",
                    lineNumber: 143,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/doom/ProductDialog.tsx",
            lineNumber: 31,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/doom/ProductDialog.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_s(ProductDialog, "vl8cqDAGlnls8IJBn0ZlsPZaE70=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"]
    ];
});
_c = ProductDialog;
var _c;
__turbopack_context__.k.register(_c, "ProductDialog");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/sheet.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Sheet",
    ()=>Sheet,
    "SheetClose",
    ()=>SheetClose,
    "SheetContent",
    ()=>SheetContent,
    "SheetDescription",
    ()=>SheetDescription,
    "SheetFooter",
    ()=>SheetFooter,
    "SheetHeader",
    ()=>SheetHeader,
    "SheetTitle",
    ()=>SheetTitle,
    "SheetTrigger",
    ()=>SheetTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as XIcon>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
function Sheet({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        "data-slot": "sheet",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 10,
        columnNumber: 10
    }, this);
}
_c = Sheet;
function SheetTrigger({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"], {
        "data-slot": "sheet-trigger",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 16,
        columnNumber: 10
    }, this);
}
_c1 = SheetTrigger;
function SheetClose({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
        "data-slot": "sheet-close",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 22,
        columnNumber: 10
    }, this);
}
_c2 = SheetClose;
function SheetPortal({ ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Portal"], {
        "data-slot": "sheet-portal",
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 28,
        columnNumber: 10
    }, this);
}
_c3 = SheetPortal;
function SheetOverlay({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Overlay"], {
        "data-slot": "sheet-overlay",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_c4 = SheetOverlay;
function SheetContent({ className, children, side = "right", ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SheetPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SheetOverlay, {}, void 0, false, {
                fileName: "[project]/src/components/ui/sheet.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
                "data-slot": "sheet-content",
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500", side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm", side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm", side === "top" && "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b", side === "bottom" && "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t", className),
                ...props,
                children: [
                    children,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
                        className: "ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__XIcon$3e$__["XIcon"], {
                                className: "size-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/sheet.tsx",
                                lineNumber: 76,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/sheet.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ui/sheet.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/sheet.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_c5 = SheetContent;
function SheetHeader({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "sheet-header",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col gap-1.5 p-4", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
_c6 = SheetHeader;
function SheetFooter({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-slot": "sheet-footer",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("mt-auto flex flex-col gap-2 p-4", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 96,
        columnNumber: 5
    }, this);
}
_c7 = SheetFooter;
function SheetTitle({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        "data-slot": "sheet-title",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-foreground font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
_c8 = SheetTitle;
function SheetDescription({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        "data-slot": "sheet-description",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-muted-foreground text-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/sheet.tsx",
        lineNumber: 122,
        columnNumber: 5
    }, this);
}
_c9 = SheetDescription;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
__turbopack_context__.k.register(_c, "Sheet");
__turbopack_context__.k.register(_c1, "SheetTrigger");
__turbopack_context__.k.register(_c2, "SheetClose");
__turbopack_context__.k.register(_c3, "SheetPortal");
__turbopack_context__.k.register(_c4, "SheetOverlay");
__turbopack_context__.k.register(_c5, "SheetContent");
__turbopack_context__.k.register(_c6, "SheetHeader");
__turbopack_context__.k.register(_c7, "SheetFooter");
__turbopack_context__.k.register(_c8, "SheetTitle");
__turbopack_context__.k.register(_c9, "SheetDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/CartDrawer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartDrawer",
    ()=>CartDrawer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/sheet.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/separator.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function CartDrawer({ onCheckoutSound }) {
    _s();
    const cart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "CartDrawer.useShop[cart]": (s)=>s.cart
    }["CartDrawer.useShop[cart]"]);
    const cartOpen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "CartDrawer.useShop[cartOpen]": (s)=>s.cartOpen
    }["CartDrawer.useShop[cartOpen]"]);
    const setCartOpen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "CartDrawer.useShop[setCartOpen]": (s)=>s.setCartOpen
    }["CartDrawer.useShop[setCartOpen]"]);
    const setQty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "CartDrawer.useShop[setQty]": (s)=>s.setQty
    }["CartDrawer.useShop[setQty]"]);
    const removeFromCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "CartDrawer.useShop[removeFromCart]": (s)=>s.removeFromCart
    }["CartDrawer.useShop[removeFromCart]"]);
    const clearCart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "CartDrawer.useShop[clearCart]": (s)=>s.clearCart
    }["CartDrawer.useShop[clearCart]"]);
    const lastOrder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "CartDrawer.useShop[lastOrder]": (s)=>s.lastOrder
    }["CartDrawer.useShop[lastOrder]"]);
    const setLastOrder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "CartDrawer.useShop[setLastOrder]": (s)=>s.setLastOrder
    }["CartDrawer.useShop[setLastOrder]"]);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const total = cart.reduce((a, c)=>a + c.qty * c.price, 0);
    const count = cart.reduce((a, c)=>a + c.qty, 0);
    const checkout = async ()=>{
        if (cart.length === 0) return;
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    items: cart,
                    customer: "WALK-IN"
                })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || "Checkout failed");
            setLastOrder({
                orderId: data.orderId,
                total: data.total
            });
            clearCart();
            onCheckoutSound();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Checkout terminal offline");
        } finally{
            setBusy(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sheet"], {
        open: cartOpen,
        onOpenChange: setCartOpen,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetContent"], {
            side: "right",
            className: "w-full sm:max-w-md bg-[#120d06] border-l-2 border-amber-600/70 font-mono text-neutral-200 p-0 flex flex-col",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetHeader"], {
                    className: "p-4 pb-3 border-b border-neutral-800",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$sheet$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SheetTitle"], {
                            className: "font-black tracking-widest text-amber-300 text-lg",
                            children: "🛒 BLESSED LOCKER"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-[10px] text-neutral-500 tracking-[0.25em]",
                            children: "CELESTIA GALLERIA · CHECKOUT SHRINE"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 61,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                    lineNumber: 57,
                    columnNumber: 9
                }, this),
                lastOrder && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "m-4 border-2 border-green-600/70 bg-green-950/40 p-4 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-green-400 font-bold tracking-widest text-base",
                            children: "✔ ORDER PLACED — BLESSINGS RENDERED"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 68,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-neutral-400 text-xs mt-1.5 font-mono",
                            children: [
                                "ORDER #",
                                lastOrder.orderId.slice(0, 8).toUpperCase(),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                    lineNumber: 73,
                                    columnNumber: 15
                                }, this),
                                lastOrder.total.toLocaleString(),
                                " CREDITS CHARGED"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 71,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "outline",
                            size: "sm",
                            className: "mt-3 border-green-700 text-green-300 hover:bg-green-900/40 h-8 text-xs",
                            onClick: ()=>setLastOrder(null),
                            children: "KEEP SHOPPING"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 76,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                    lineNumber: 67,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto max-h-[52vh] p-4 space-y-2",
                    children: [
                        cart.length === 0 && !lastOrder && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center py-10 text-neutral-600 text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-4xl mb-3 opacity-40",
                                    children: "∅"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                    lineNumber: 90,
                                    columnNumber: 15
                                }, this),
                                "LOCKER EMPTY.",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-[11px] mt-1",
                                    children: "WALK UP TO A HALOED PRODUCT AND PRESS E."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                    lineNumber: 92,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 89,
                            columnNumber: 13
                        }, this),
                        cart.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 border border-amber-900/50 bg-[#1a1207]/60 p-2.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-bold text-teal-200 truncate",
                                                children: item.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                                lineNumber: 103,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] text-neutral-500",
                                                children: [
                                                    item.price.toLocaleString(),
                                                    " CRED ea"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                                lineNumber: 104,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                        lineNumber: 102,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center border border-amber-900/60 bg-black/50 h-8",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "w-7 h-8 text-neutral-400 hover:text-white text-sm",
                                                onClick: ()=>item.qty <= 1 ? removeFromCart(item.id) : setQty(item.id, item.qty - 1),
                                                "aria-label": `Decrease ${item.name}`,
                                                children: "−"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                                lineNumber: 109,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-7 text-center text-sm font-bold tabular-nums text-amber-300",
                                                children: item.qty
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                                lineNumber: 116,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "w-7 h-8 text-neutral-400 hover:text-white text-sm",
                                                onClick: ()=>setQty(item.id, item.qty + 1),
                                                "aria-label": `Increase ${item.name}`,
                                                children: "+"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                                lineNumber: 119,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                        lineNumber: 108,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-20 text-right text-sm font-black tabular-nums text-amber-300",
                                        children: (item.qty * item.price).toLocaleString()
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                        lineNumber: 127,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, item.id, true, {
                                fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                lineNumber: 98,
                                columnNumber: 13
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                    lineNumber: 87,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4 border-t border-neutral-800 bg-black/40 mt-auto",
                    children: [
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-2 text-xs text-red-400 border border-red-900 p-2",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 136,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-end mb-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-[10px] tracking-[0.3em] text-neutral-500",
                                    children: [
                                        "TOTAL · ",
                                        count,
                                        " ITEM",
                                        count === 1 ? "" : "S"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                    lineNumber: 139,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-3xl font-black tabular-nums text-amber-300",
                                    style: {
                                        textShadow: "0 0 14px rgba(255,217,140,0.55)"
                                    },
                                    children: total.toLocaleString()
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                                    lineNumber: 142,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 138,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Separator"], {
                            className: "bg-neutral-800 mb-3"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 149,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            disabled: cart.length === 0 || busy,
                            onClick: checkout,
                            className: "w-full h-12 font-bold tracking-[0.3em] border-2 border-amber-400 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 hover:to-amber-500 disabled:opacity-40 !text-[#241304]",
                            children: busy ? "AUTHORIZING…" : "✦ CHECKOUT"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 150,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-[9px] text-neutral-600 mt-2 text-center tracking-wider",
                            children: "DEMO CHECKOUT — ORDERS PERSIST TO SQLITE (node:sqlite)"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/CartDrawer.tsx",
                            lineNumber: 157,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/CartDrawer.tsx",
                    lineNumber: 134,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/doom/CartDrawer.tsx",
            lineNumber: 53,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/doom/CartDrawer.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_s(CartDrawer, "DDBLLRA8H6zemSlQJx/4cZVWu/Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"]
    ];
});
_c = CartDrawer;
var _c;
__turbopack_context__.k.register(_c, "CartDrawer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/TouchControls.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TouchControls",
    ()=>TouchControls
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function TouchControls({ onMove, onInteract, onCart }) {
    _s();
    const baseRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [knob, setKnob] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const activeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const R = 44;
    const handle = (e)=>{
        const base = baseRef.current;
        if (!base) return;
        const rect = base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const t = "touches" in e ? e.touches[0] ?? e.changedTouches[0] : e;
        if (!t) return;
        let dx = t.clientX - cx;
        let dy = t.clientY - cy;
        const len = Math.hypot(dx, dy);
        if (len > R) {
            dx = dx / len * R;
            dy = dy / len * R;
        }
        setKnob({
            x: dx,
            y: dy
        });
        onMove(dx / R, -dy / R);
    };
    const end = ()=>{
        activeRef.current = null;
        setKnob({
            x: 0,
            y: 0
        });
        onMove(0, 0);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-30 pointer-events-none md:hidden select-none",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: baseRef,
                className: "pointer-events-auto absolute left-5 bottom-24 w-28 h-28 rounded-full border-2 border-teal-800/80 bg-black/50 backdrop-blur-[2px]",
                onTouchStart: (e)=>{
                    activeRef.current = 1;
                    handle(e);
                },
                onTouchMove: (e)=>{
                    if (activeRef.current !== null) handle(e);
                    e.preventDefault();
                },
                onTouchEnd: end,
                onTouchCancel: end,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute left-1/2 top-1/2 w-12 h-12 rounded-full bg-teal-600/70 border-2 border-teal-300 shadow-[0_0_16px_rgba(45,212,191,0.6)]",
                        style: {
                            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TouchControls.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 flex items-center justify-center text-[9px] font-mono text-teal-500/60 tracking-widest",
                        children: "MOVE"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TouchControls.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/doom/TouchControls.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-auto absolute right-5 bottom-24 flex flex-col gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onPointerDown: onCart,
                        className: "w-14 h-14 rounded-full border-2 border-amber-600 bg-black/60 text-xl font-mono text-amber-400 active:bg-amber-900/60",
                        "aria-label": "Open cart",
                        children: "🛒"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TouchControls.tsx",
                        lineNumber: 79,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onPointerDown: onInteract,
                        className: "w-16 h-16 rounded-full border-2 border-teal-500 bg-black/60 text-2xl font-black font-mono text-teal-300 active:bg-teal-900/60 shadow-[0_0_16px_rgba(45,212,191,0.35)]",
                        "aria-label": "Inspect product",
                        children: "E"
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/TouchControls.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/doom/TouchControls.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/doom/TouchControls.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
_s(TouchControls, "SiF8ITzFFqUl3ESdDmuy5PV4UFc=");
_c = TouchControls;
var _c;
__turbopack_context__.k.register(_c, "TouchControls");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/AssetDialog.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AssetDialog",
    ()=>AssetDialog
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/dialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$products$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/products.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function AssetDialog({ open, onOpenChange, engine, pendingImage, onConsumePending, onToast }) {
    _s();
    const [target, setTarget] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const downloadSheet = (id)=>{
        if (!engine) return;
        const url = engine.exportSheet(id);
        if (!url) return;
        const a = document.createElement("a");
        a.href = url;
        a.download = `celestia-${id}-9angle-reference.png`;
        a.click();
        onToast(`REFERENCE SHEET FOR ${id.toUpperCase()} EXPORTED`);
    };
    const apply = (id)=>{
        if (!engine || !pendingImage) return;
        const ok = engine.applySpriteSheet(id, pendingImage);
        if (ok) {
            onToast(`CUSTOM SPRITE SHEET APPLIED TO ${id.toUpperCase()}`);
            onConsumePending();
            setTarget(null);
            onOpenChange(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Dialog"], {
        open: open,
        onOpenChange: onOpenChange,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
            className: "max-w-xl bg-[#0b0e12] border-2 border-teal-800 font-mono text-neutral-200 [&>button]:border-neutral-600 max-h-[85vh] overflow-y-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
                            className: "text-lg font-black tracking-widest text-teal-300",
                            children: "🖼 ASSET PIPELINE"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                            lineNumber: 63,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-[10px] text-neutral-500 tracking-[0.25em]",
                            children: "2D SPRITE SHEETS → LIVE 3D SHOP"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                            lineNumber: 66,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                    lineNumber: 62,
                    columnNumber: 9
                }, this),
                pendingImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border border-amber-700/70 bg-amber-950/30 p-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-amber-300 text-sm font-bold tracking-wider",
                                    children: "SPRITE SHEET RECEIVED"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 74,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-[11px] text-neutral-400 mt-1",
                                    children: [
                                        pendingImage.width,
                                        "×",
                                        pendingImage.height,
                                        "px — sliced into 9 frames of",
                                        " ",
                                        Math.round(pendingImage.width / 9),
                                        "px."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 77,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    src: pendingImage.src,
                                    alt: "Dropped 9-frame sprite sheet preview",
                                    className: "mt-2 w-full border border-neutral-700 bg-[repeating-conic-gradient(#1a1a1a_0%_25%,#111_0%_50%)] bg-[length:16px_16px]"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 81,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                            lineNumber: 73,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-neutral-400",
                            children: "APPLY TO WHICH PRODUCT?"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                            lineNumber: 87,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-2",
                            children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$products$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CATALOG"].map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    variant: "outline",
                                    onClick: ()=>apply(p.id),
                                    className: `h-auto py-2 justify-start text-left border-neutral-700 hover:border-teal-500 hover:bg-teal-950/40 ${target === p.id ? "border-teal-500" : ""}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-bold text-teal-200",
                                        children: p.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                        lineNumber: 98,
                                        columnNumber: 19
                                    }, this)
                                }, p.id, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 90,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                            lineNumber: 88,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                    lineNumber: 72,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border border-neutral-800 bg-black/50 p-4 text-xs leading-relaxed text-neutral-300 space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-teal-300 font-bold tracking-wider text-sm",
                                    children: "THE 9-ANGLE SPEC (DOOM METHOD)"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 106,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: [
                                        "Every product is a single PNG strip of",
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "9 square frames side by side"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                            lineNumber: 111,
                                            columnNumber: 17
                                        }, this),
                                        ", one per ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "40° of rotation"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                            lineNumber: 112,
                                            columnNumber: 21
                                        }, this),
                                        " (9 × 40° = 360°). Frame 1 shows the front, frames 2-9 circle clockwise. Transparent background, subject centered, feet at the bottom edge."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 109,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-neutral-500",
                                    children: "Recommended ≥ 432×48 (9 × 48px frames). Larger is fine — the engine reslices. Think Doom sprites: photo-real renders, AI renders, or hand-drawn art all work."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 116,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                            lineNumber: 105,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border-2 border-dashed border-teal-800 rounded p-6 text-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-3xl mb-2",
                                    children: "📥"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 124,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-sm text-teal-300 font-bold tracking-wider",
                                    children: "DRAG & DROP A PNG ANYWHERE ON THE SHOP"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 125,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-[11px] text-neutral-500 mt-1",
                                    children: "The sheet will be sliced live and replace any product instantly — no reload, no rebuild."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 128,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                            lineNumber: 123,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-neutral-400 mb-2 tracking-wider",
                                    children: "EXPORT BAKED REFERENCE SHEETS (LOAD THEM IN YOUR 2D EDITOR):"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 135,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-2",
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$products$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CATALOG"].map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "outline",
                                            size: "sm",
                                            onClick: ()=>downloadSheet(p.id),
                                            className: "justify-start border-neutral-700 hover:border-amber-500 hover:bg-amber-950/30 text-[11px]",
                                            children: [
                                                "⇩ ",
                                                p.name
                                            ]
                                        }, p.id, true, {
                                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                            lineNumber: 140,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                                    lineNumber: 138,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/AssetDialog.tsx",
                            lineNumber: 134,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/AssetDialog.tsx",
                    lineNumber: 104,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/doom/AssetDialog.tsx",
            lineNumber: 61,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/doom/AssetDialog.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
_s(AssetDialog, "FDogMEKiTY+DU7OSf9PRqD8i1xc=");
_c = AssetDialog;
var _c;
__turbopack_context__.k.register(_c, "AssetDialog");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/DoomShop.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DoomShop",
    ()=>DoomShop
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$engine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/doom/engine.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$TitleScreen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/doom/TitleScreen.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$HudBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/doom/HudBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$Minimap$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/doom/Minimap.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$ProductDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/doom/ProductDialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$CartDrawer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/doom/CartDrawer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$TouchControls$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/doom/TouchControls.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$AssetDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/doom/AssetDialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/dialog.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
function DoomShop() {
    _s();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const engineRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [engine, setEngine] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const started = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[started]": (s)=>s.started
    }["DoomShop.useShop[started]"]);
    const setStarted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[setStarted]": (s)=>s.setStarted
    }["DoomShop.useShop[setStarted]"]);
    const setStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[setStats]": (s)=>s.setStats
    }["DoomShop.useShop[setStats]"]);
    const setPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[setPrompt]": (s)=>s.setPrompt
    }["DoomShop.useShop[setPrompt]"]);
    const setSelected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[setSelected]": (s)=>s.setSelected
    }["DoomShop.useShop[setSelected]"]);
    const prompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[prompt]": (s)=>s.prompt
    }["DoomShop.useShop[prompt]"]);
    const selected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[selected]": (s)=>s.selected
    }["DoomShop.useShop[selected]"]);
    const cartOpen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[cartOpen]": (s)=>s.cartOpen
    }["DoomShop.useShop[cartOpen]"]);
    const setCartOpen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[setCartOpen]": (s)=>s.setCartOpen
    }["DoomShop.useShop[setCartOpen]"]);
    const soundOn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[soundOn]": (s)=>s.soundOn
    }["DoomShop.useShop[soundOn]"]);
    const setSoundOn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[setSoundOn]": (s)=>s.setSoundOn
    }["DoomShop.useShop[setSoundOn]"]);
    const toastMsg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[toastMsg]": (s)=>s.toastMsg
    }["DoomShop.useShop[toastMsg]"]);
    const setToastMsg = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[setToastMsg]": (s)=>s.setToastMsg
    }["DoomShop.useShop[setToastMsg]"]);
    const cart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"])({
        "DoomShop.useShop[cart]": (s)=>s.cart
    }["DoomShop.useShop[cart]"]);
    const [assetOpen, setAssetOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [helpOpen, setHelpOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dragOver, setDragOver] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [pendingImage, setPendingImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const paused = !!selected || cartOpen || assetOpen || helpOpen;
    // ── engine lifecycle (StrictMode-safe: full dispose on unmount) ──
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DoomShop.useEffect": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            const eng = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$doom$2f$engine$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DoomEngine"](canvas, {
                onStats: setStats,
                onPrompt: setPrompt,
                onSelect: {
                    "DoomShop.useEffect": (spec)=>setSelected(spec)
                }["DoomShop.useEffect"]
            });
            engineRef.current = eng;
            setEngine(eng);
            eng.start();
            return ({
                "DoomShop.useEffect": ()=>{
                    eng.dispose();
                    engineRef.current = null;
                    setEngine(null);
                }
            })["DoomShop.useEffect"];
        }
    }["DoomShop.useEffect"], []);
    // pause engine while any modal is open
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DoomShop.useEffect": ()=>{
            engineRef.current?.setPaused(paused || !started);
        }
    }["DoomShop.useEffect"], [
        paused,
        started
    ]);
    // sound flag
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DoomShop.useEffect": ()=>{
            engineRef.current?.setSound(soundOn);
        }
    }["DoomShop.useEffect"], [
        soundOn
    ]);
    // cart qty → floating tags
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DoomShop.useEffect": ()=>{
            for (const item of cart){
                engineRef.current?.updateCartQty(item.id, item.qty);
            }
        }
    }["DoomShop.useEffect"], [
        cart
    ]);
    // restore persisted cart into tags (migrated from the DOOM MART key)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DoomShop.useEffect": ()=>{
            try {
                const raw = localStorage.getItem("celestia-cart") ?? localStorage.getItem("doommart-cart");
                if (raw) {
                    const items = JSON.parse(raw);
                    for (const it of items)engineRef.current?.updateCartQty(it.id, it.qty);
                }
            } catch  {
            /* noop */ }
        }
    }["DoomShop.useEffect"], [
        engine
    ]);
    // live 9-angle atlas for the inspect dialog (Doom showcase rotation)
    const spriteSheetUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "DoomShop.useMemo[spriteSheetUrl]": ()=>engine && selected ? engine.exportSheet(selected.id) : null
    }["DoomShop.useMemo[spriteSheetUrl]"], [
        engine,
        selected
    ]);
    const enterShop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DoomShop.useCallback[enterShop]": ()=>{
            setStarted(true);
            engineRef.current?.audio.unlock();
            engineRef.current?.audio.setEnabled(soundOn);
            canvasRef.current?.focus();
        }
    }["DoomShop.useCallback[enterShop]"], [
        setStarted,
        soundOn
    ]);
    const handleDrop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DoomShop.useCallback[handleDrop]": (e)=>{
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (!file || !file.type.startsWith("image/")) {
                setToastMsg("NOT AN IMAGE FILE — PNG EXPECTED");
                setTimeout({
                    "DoomShop.useCallback[handleDrop]": ()=>setToastMsg(null)
                }["DoomShop.useCallback[handleDrop]"], 2400);
                return;
            }
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = ({
                "DoomShop.useCallback[handleDrop]": ()=>{
                    if (img.width < 9 * 8) {
                        setToastMsg("SHEET TOO SMALL — NEEDS 9 FRAMES");
                        setTimeout({
                            "DoomShop.useCallback[handleDrop]": ()=>setToastMsg(null)
                        }["DoomShop.useCallback[handleDrop]"], 2400);
                        URL.revokeObjectURL(url);
                        return;
                    }
                    setPendingImage(img);
                    setAssetOpen(true);
                }
            })["DoomShop.useCallback[handleDrop]"];
            img.onerror = ({
                "DoomShop.useCallback[handleDrop]": ()=>{
                    setToastMsg("COULD NOT READ IMAGE");
                    setTimeout({
                        "DoomShop.useCallback[handleDrop]": ()=>setToastMsg(null)
                    }["DoomShop.useCallback[handleDrop]"], 2400);
                    URL.revokeObjectURL(url);
                }
            })["DoomShop.useCallback[handleDrop]"];
            img.src = url;
        }
    }["DoomShop.useCallback[handleDrop]"], [
        setToastMsg
    ]);
    const interact = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DoomShop.useCallback[interact]": ()=>{
            engineRef.current?.interactNow();
        }
    }["DoomShop.useCallback[interact]"], []);
    const checkoutSound = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DoomShop.useCallback[checkoutSound]": ()=>{
            engineRef.current?.audio.checkout();
            engineRef.current?.celebrate(); // bloom + light swell through the temple
        }
    }["DoomShop.useCallback[checkoutSound]"], []);
    const pickupSound = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DoomShop.useCallback[pickupSound]": ()=>{
            engineRef.current?.audio.pickup();
        }
    }["DoomShop.useCallback[pickupSound]"], []);
    const toast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "DoomShop.useCallback[toast]": (msg)=>{
            setToastMsg(msg);
            setTimeout({
                "DoomShop.useCallback[toast]": ()=>setToastMsg(null)
            }["DoomShop.useCallback[toast]"], 2400);
        }
    }["DoomShop.useCallback[toast]"], [
        setToastMsg
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 bg-black overflow-hidden",
        onDragOver: (e)=>{
            e.preventDefault();
            setDragOver(true);
        },
        onDragLeave: ()=>setDragOver(false),
        onDrop: handleDrop,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: canvasRef,
                className: "w-full h-full block touch-none outline-none cursor-crosshair",
                "aria-label": "3D shop viewport — use WASD to move"
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 170,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute inset-0 scanlines"
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 177,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute inset-0 vignette"
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 178,
                columnNumber: 7
            }, this),
            !started && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$TitleScreen$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TitleScreen"], {
                onEnter: enterShop
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 180,
                columnNumber: 20
            }, this),
            started && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-5 h-5 relative opacity-80",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute left-1/2 top-0 w-[2px] h-1.5 -translate-x-1/2 bg-amber-200/90"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 187,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute left-1/2 bottom-0 w-[2px] h-1.5 -translate-x-1/2 bg-amber-200/90"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 188,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-1/2 left-0 h-[2px] w-1.5 -translate-y-1/2 bg-amber-200/90"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 189,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-1/2 right-0 h-[2px] w-1.5 -translate-y-1/2 bg-amber-200/90"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 190,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute left-1/2 top-1/2 w-[3px] h-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 191,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                            lineNumber: 186,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/DoomShop.tsx",
                        lineNumber: 185,
                        columnNumber: 11
                    }, this),
                    prompt && !selected && !cartOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 z-20 font-mono",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-3 py-1.5 bg-black/70 border border-amber-400/70 text-amber-100 text-xs tracking-widest animate-pulse",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-amber-300 font-black",
                                    children: "[E]"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 199,
                                    columnNumber: 17
                                }, this),
                                " INSPECT ",
                                prompt.name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                            lineNumber: 198,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/DoomShop.tsx",
                        lineNumber: 197,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute right-2 top-2 z-20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$Minimap$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Minimap"], {
                            engine: engine
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                            lineNumber: 206,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/DoomShop.tsx",
                        lineNumber: 205,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$TouchControls$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TouchControls"], {
                        onMove: (x, y)=>engineRef.current?.setMoveInput(x, y),
                        onInteract: interact,
                        onCart: ()=>setCartOpen(true)
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/DoomShop.tsx",
                        lineNumber: 209,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$HudBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HudBar"], {
                        onCart: ()=>setCartOpen(true),
                        onAssets: ()=>setAssetOpen(true),
                        onHelp: ()=>setHelpOpen(true)
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/DoomShop.tsx",
                        lineNumber: 215,
                        columnNumber: 11
                    }, this),
                    toastMsg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 z-40 font-mono",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-4 py-2 bg-black/85 border-2 border-amber-400 text-amber-200 text-xs md:text-sm font-bold tracking-widest shadow-[0_0_24px_rgba(255,208,120,0.4)]",
                            children: toastMsg
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                            lineNumber: 224,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/doom/DoomShop.tsx",
                        lineNumber: 223,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$ProductDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProductDialog"], {
                onPick: pickupSound,
                spriteSheetUrl: spriteSheetUrl
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 232,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$CartDrawer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CartDrawer"], {
                onCheckoutSound: checkoutSound
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 233,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$doom$2f$AssetDialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AssetDialog"], {
                open: assetOpen,
                onOpenChange: setAssetOpen,
                engine: engine,
                pendingImage: pendingImage,
                onConsumePending: ()=>setPendingImage(null),
                onToast: toast
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 234,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Dialog"], {
                open: helpOpen,
                onOpenChange: setHelpOpen,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
                    className: "max-w-sm bg-[#120d06] border-2 border-amber-800/70 font-mono text-neutral-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
                                className: "text-amber-300 font-black tracking-widest text-base",
                                children: "PILGRIM'S MANUAL"
                            }, void 0, false, {
                                fileName: "[project]/src/components/doom/DoomShop.tsx",
                                lineNumber: 247,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                            lineNumber: 246,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs space-y-2 leading-relaxed",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "WASD / ARROWS"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                                            lineNumber: 253,
                                            columnNumber: 15
                                        }, this),
                                        " move ·",
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "SHIFT"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                                            lineNumber: 254,
                                            columnNumber: 15
                                        }, this),
                                        " run ·",
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "MOUSE"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                                            lineNumber: 255,
                                            columnNumber: 15
                                        }, this),
                                        " look (click to lock)"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 252,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "E"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                                            lineNumber: 258,
                                            columnNumber: 15
                                        }, this),
                                        " or",
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "CLICK"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                                            lineNumber: 259,
                                            columnNumber: 15
                                        }, this),
                                        " inspect the haloed product"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 257,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "TOUCH"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                                            lineNumber: 262,
                                            columnNumber: 15
                                        }, this),
                                        " left stick moves · drag right side looks · tap ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-amber-400",
                                            children: "E"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                                            lineNumber: 263,
                                            columnNumber: 32
                                        }, this),
                                        " inspects"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 261,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-neutral-500 pt-2 border-t border-neutral-800",
                                    children: "The turquoise lagoon is animated shader water that mirrors the real temple — god rays fall through the open oculus, the marble floor is a true planar mirror, and the gilded reliquary crates drink the sky's reflection. Every product is a 9-angle sprite imposter with a golden halo: orbit a pedestal to see it rotate through its 9 baked views, Doom-style. The 4 MB budget was broken on purpose — the HUD keeps honest count of every glorious megabyte."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                                    lineNumber: 265,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                            lineNumber: 251,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                    lineNumber: 245,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 244,
                columnNumber: 7
            }, this),
            dragOver && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 z-50 bg-black/70 border-4 border-dashed border-amber-400 flex items-center justify-center pointer-events-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "font-mono text-amber-200 text-xl font-black tracking-widest text-center",
                    children: [
                        "📥 DROP 9-FRAME SPRITE SHEET PNG",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-xs text-neutral-400 font-normal mt-2 tracking-normal",
                            children: "9 square frames side-by-side · 40° apart · transparent background"
                        }, void 0, false, {
                            fileName: "[project]/src/components/doom/DoomShop.tsx",
                            lineNumber: 283,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/doom/DoomShop.tsx",
                    lineNumber: 281,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/doom/DoomShop.tsx",
                lineNumber: 280,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/doom/DoomShop.tsx",
        lineNumber: 161,
        columnNumber: 5
    }, this);
}
_s(DoomShop, "LaPlRpMuXbs+9/0sfLpCcWpbj0w=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useShop"]
    ];
});
_c = DoomShop;
var _c;
__turbopack_context__.k.register(_c, "DoomShop");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/doom/DoomShop.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/doom/DoomShop.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_972a1023._.js.map