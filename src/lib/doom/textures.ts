// ─── Procedural texture forge — CELESTIAL EDITION ───────────────────────────
// Ivory marble, gold inlay, mother-of-pearl. Every texture is still painted on
// a tiny canvas: zero downloaded assets, VRAM stays inside the 4 MB club.

const S = 128;

function makeCanvas(w = S, h = S): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, n = 900, alpha = 0.05) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

/** flowing marble vein — the signature of divine stone */
function vein(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  width: number,
  alpha: number,
  seed = 0
) {
  let x = (Math.sin(seed * 12.9) * 0.5 + 0.5) * w;
  let y = -10;
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y);
  while (y < h + 10) {
    y += 8 + Math.sin(seed * 7.7) * 5;
    x += Math.sin(y * 0.09 + seed * 31.7) * 14;
    x = Math.max(-8, Math.min(w + 8, x));
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** gold dot inlay */
function goldRivet(ctx: CanvasRenderingContext2D, x: number, y: number, r = 3) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r);
  g.addColorStop(0, "rgba(255,232,170,0.95)");
  g.addColorStop(0.6, "rgba(201,150,46,0.9)");
  g.addColorStop(1, "rgba(90,62,18,0.9)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** ivory temple marble walls with gold inlay + aqua glow slit */
export function texWall(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  // ivory marble base
  const base = ctx.createLinearGradient(0, 0, S, S);
  base.addColorStop(0, "#f6efdd");
  base.addColorStop(0.5, "#efe5cd");
  base.addColorStop(1, "#e7dabf");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  // marble veins (soft grey-gold)
  for (let i = 0; i < 5; i++)
    vein(ctx, S, S, i % 2 ? "rgba(150,132,96,1)" : "rgba(120,128,120,1)", 1.6, 0.16, i * 3.1 + 0.7);
  vein(ctx, S, S, "rgba(201,150,46,1)", 1.2, 0.28, 9.4);
  vein(ctx, S, S, "rgba(201,150,46,1)", 0.8, 0.2, 2.2);

  // raised panels — pearl slabs
  const plates = [
    [4, 4, 120, 58],
    [4, 68, 58, 56],
    [66, 68, 58, 56],
  ];
  for (const [x, y, w, h] of plates) {
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
  for (let i = 0; i < 5; i++) ctx.fillRect(74, 78 + i * 9, 42, 3);
  ctx.fillStyle = "rgba(64,222,208,0.10)";
  for (let i = 0; i < 5; i++) ctx.fillRect(72, 77 + i * 9, 46, 5);

  goldRivet(ctx, 10, 10);
  goldRivet(ctx, S - 10, 10);
  goldRivet(ctx, 10, S - 10);
  goldRivet(ctx, S - 10, S - 10);
  goldRivet(ctx, 64, 10);
  goldRivet(ctx, 64, S - 10);
  noise(ctx, S, S, 700, 0.03);
  return c;
}

/** mother-of-pearl floor with gold veins */
export function texFloor(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  // pearl base with faint opal hue shifts
  const base = ctx.createLinearGradient(0, 0, S, S);
  base.addColorStop(0, "#eef2ee");
  base.addColorStop(0.35, "#e9f0f0");
  base.addColorStop(0.65, "#f0ece4");
  base.addColorStop(1, "#e8eee9");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  // opal iridescent washes
  const washes: [string, number][] = [
    ["rgba(180,235,225,0.5)", 0.35],
    ["rgba(235,215,245,0.4)", 0.55],
    ["rgba(250,230,190,0.45)", 0.75],
  ];
  for (const [col, y0] of washes) {
    const g = ctx.createRadialGradient(S * 0.5, S * y0, 4, S * 0.5, S * y0, S * 0.6);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }
  // gold veins
  for (let i = 0; i < 4; i++)
    vein(ctx, S, S, "rgba(198,146,52,1)", 1.3, 0.30, i * 4.3 + 1.3);
  vein(ctx, S, S, "rgba(255,224,150,1)", 0.9, 0.35, 6.1);
  // 2×2 slab seams
  ctx.strokeStyle = "rgba(176,166,140,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, 0); ctx.lineTo(64, S);
  ctx.moveTo(0, 64); ctx.lineTo(S, 64);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(65, 0); ctx.lineTo(65, S);
  ctx.moveTo(0, 65); ctx.lineTo(S, 65);
  ctx.stroke();
  noise(ctx, S, S, 900, 0.025);
  return c;
}

/** gilded coffered ceiling — deep bronze trays with glowing gold ribs */
export function texCeil(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  // deep bronze base (dark ceiling = contrast for mirror reflections + oculus)
  const base = ctx.createLinearGradient(0, 0, S, S);
  base.addColorStop(0, "#241a0e");
  base.addColorStop(0.5, "#2e2214");
  base.addColorStop(1, "#1e150b");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  // coffer trays — rich umber with warm inner glow
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      const px = x * 32,
        py = y * 32;
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
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, S);
    ctx.moveTo(0, i * 32); ctx.lineTo(S, i * 32);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,230,170,0.5)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 32 + 1, 0); ctx.lineTo(i * 32 + 1, S);
    ctx.moveTo(0, i * 32 + 1); ctx.lineTo(S, i * 32 + 1);
    ctx.stroke();
  }
  noise(ctx, S, S, 500, 0.05);
  return c;
}

/** pedestal side: carved white marble with gold laurel band */
export function texPedestal(): HTMLCanvasElement {
  const c = makeCanvas(64, 128);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, "#e9e0c8");
  g.addColorStop(0.5, "#f4eeda");
  g.addColorStop(1, "#ddd2b4");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 128);
  // marble veins
  for (let i = 0; i < 3; i++)
    vein(ctx, 64, 128, "rgba(140,125,95,1)", 1.1, 0.18, i * 5.3 + 0.4);
  // gold laurel band
  ctx.fillStyle = "rgba(201,150,46,0.16)";
  ctx.fillRect(0, 6, 64, 22);
  ctx.strokeStyle = "rgba(186,134,44,0.95)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 7, 62, 20);
  ctx.strokeStyle = "rgba(255,224,150,0.9)";
  ctx.lineWidth = 1;
  // laurel leaves
  for (let x = 6; x < 60; x += 8) {
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

/** radial glow sprite (additive) used for rings / halos / suns */
export function texGlow(): HTMLCanvasElement {
  const c = makeCanvas(64, 64);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return c;
}

/** vertical gradient beam (light shaft / holo cone) */
export function texBeam(): HTMLCanvasElement {
  const c = makeCanvas(32, 128);
  const ctx = c.getContext("2d")!;
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

/** wall sign text plate — pearl with gold or aqua lettering */
export function texSign(text: string, accent = "#c9962e"): HTMLCanvasElement {
  const c = makeCanvas(256, 64);
  const ctx = c.getContext("2d")!;
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
