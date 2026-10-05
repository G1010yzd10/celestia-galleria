// ─── Procedural texture forge — zero downloaded assets ─────────────────────
// Every texture is painted on a 128×128 canvas: dark tech-panel Doom aesthetic
// with teal / amber accents. Total VRAM stays inside the 4 MB club.

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

/** rivet helper */
function rivet(ctx: CanvasRenderingContext2D, x: number, y: number, r = 3) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r);
  g.addColorStop(0, "rgba(120,132,140,0.9)");
  g.addColorStop(1, "rgba(20,24,28,0.9)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** dark tech wall panels with teal vent slit */
export function texWall(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#181b1f";
  ctx.fillRect(0, 0, S, S);

  // big plates
  const plates = [
    [4, 4, 120, 58],
    [4, 68, 58, 56],
    [66, 68, 58, 56],
  ];
  for (const [x, y, w, h] of plates) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#262b31");
    g.addColorStop(0.5, "#20242a");
    g.addColorStop(1, "#15181c");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(10,12,14,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // bevel highlight
    ctx.strokeStyle = "rgba(90,100,110,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + h - 3);
    ctx.lineTo(x + 2, y + 2);
    ctx.lineTo(x + w - 3, y + 2);
    ctx.stroke();
  }

  // teal vent slits (emissive-ish)
  ctx.fillStyle = "rgba(45,212,191,0.55)";
  for (let i = 0; i < 5; i++) ctx.fillRect(74, 78 + i * 9, 42, 3);
  ctx.fillStyle = "rgba(45,212,191,0.10)";
  for (let i = 0; i < 5; i++) ctx.fillRect(72, 77 + i * 9, 46, 5);

  rivet(ctx, 10, 10);
  rivet(ctx, S - 10, 10);
  rivet(ctx, 10, S - 10);
  rivet(ctx, S - 10, S - 10);
  rivet(ctx, 64, 10);
  rivet(ctx, 64, S - 10);
  noise(ctx, S, S);
  return c;
}

/** glossy dark floor tiles with hairline seams */
export function texFloor(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0d0f12";
  ctx.fillRect(0, 0, S, S);
  // 2×2 tiles
  for (let ty = 0; ty < 2; ty++)
    for (let tx = 0; tx < 2; tx++) {
      const x = tx * 64,
        y = ty * 64;
      const g = ctx.createLinearGradient(x, y, x + 64, y + 64);
      g.addColorStop(0, "#14171c");
      g.addColorStop(0.45, "#101318");
      g.addColorStop(1, "#0b0d10");
      ctx.fillStyle = g;
      ctx.fillRect(x + 1, y + 1, 62, 62);
    }
  // seams
  ctx.strokeStyle = "rgba(60,70,80,0.35)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, 0); ctx.lineTo(64, S);
  ctx.moveTo(0, 64); ctx.lineTo(S, 64);
  ctx.stroke();
  // faint teal specks (floor reflections shimmer)
  ctx.fillStyle = "rgba(45,212,191,0.08)";
  for (let i = 0; i < 26; i++)
    ctx.fillRect(Math.random() * S, Math.random() * S, 2, 1);
  noise(ctx, S, S, 1400, 0.04);
  return c;
}

/** ceiling panels — light squares in a grid */
export function texCeil(): HTMLCanvasElement {
  const c = makeCanvas();
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#121418";
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = "#171a1f";
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++)
      ctx.fillRect(x * 32 + 3, y * 32 + 3, 26, 26);
  // one warm light tile per texture (tiled 2× → rhythm of lights)
  ctx.fillStyle = "rgba(255,196,110,0.85)";
  ctx.fillRect(40, 40, 20, 20);
  ctx.fillStyle = "rgba(255,225,180,0.95)";
  ctx.fillRect(44, 44, 12, 12);
  noise(ctx, S, S, 600, 0.04);
  return c;
}

/** pedestal side: brushed metal + hazard chevrons on top band */
export function texPedestal(): HTMLCanvasElement {
  const c = makeCanvas(64, 128);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, "#1c2026");
  g.addColorStop(0.5, "#272c33");
  g.addColorStop(1, "#161a1f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 128);
  // hazard band
  ctx.fillStyle = "#101316";
  ctx.fillRect(0, 8, 64, 18);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 8, 64, 18);
  ctx.clip();
  ctx.strokeStyle = "rgba(245,158,11,0.85)";
  ctx.lineWidth = 5;
  for (let x = -20; x < 80; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.lineTo(x + 14, 4);
    ctx.stroke();
  }
  ctx.restore();
  // teal glow seam at top
  ctx.fillStyle = "rgba(45,212,191,0.9)";
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillStyle = "rgba(45,212,191,0.25)";
  ctx.fillRect(0, 2, 64, 4);
  noise(ctx, 64, 128, 400, 0.05);
  return c;
}

/** radial glow sprite (additive) used for rings / halos */
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

/** vertical gradient beam (hologram cone / neon halo) */
export function texBeam(): HTMLCanvasElement {
  const c = makeCanvas(32, 128);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(255,255,255,0.10)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 128);
  // horizontal soft edges
  const g2 = ctx.createLinearGradient(0, 0, 32, 0);
  g2.addColorStop(0, "rgba(0,0,0,1)");
  g2.addColorStop(0.5, "rgba(0,0,0,0)");
  g2.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, 32, 128);
  return c;
}

/** wall sign text plate */
export function texSign(text: string, accent = "#2dd4bf"): HTMLCanvasElement {
  const c = makeCanvas(256, 64);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#101316";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, 250, 58);
  ctx.font = "bold 34px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.fillStyle = accent;
  ctx.fillText(text, 128, 34);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(text, 128, 34);
  return c;
}
