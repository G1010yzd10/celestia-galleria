"use client";

import { useEffect, useMemo, useRef } from "react";
import { useShop } from "@/lib/store";

// ─── Doom status bar — CART / CREDITS / VRAM / FPS + mood face ─────────────

function MoodFace({ count }: { count: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mood = count === 0 ? 0 : count <= 3 ? 1 : count <= 7 ? 2 : 3;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
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
  }, [mood]);
  return (
    <canvas
      ref={ref}
      width={24}
      height={24}
      aria-hidden
      className="w-10 h-10 md:w-12 md:h-12 [image-rendering:pixelated] border border-amber-800/70 bg-[#161006]"
    />
  );
}

export function HudBar({
  onCart,
  onAssets,
  onHelp,
}: {
  onCart: () => void;
  onAssets: () => void;
  onHelp: () => void;
}) {
  const stats = useShop((s) => s.stats);
  const cart = useShop((s) => s.cart);
  const soundOn = useShop((s) => s.soundOn);
  const setSoundOn = useShop((s) => s.setSoundOn);
  const count = cart.reduce((a, c) => a + c.qty, 0);
  const total = cart.reduce((a, c) => a + c.qty * c.price, 0);

  const vram = stats.vramMB;
  // the 4 MB Doom club was left behind on purpose — the meter now celebrates it
  const vramPct = Math.min(100, (vram / 32) * 100);

  const fpsColor = stats.fps >= 50 ? "#4ade80" : stats.fps >= 30 ? "#eab308" : "#ef4444";

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 font-mono select-none pointer-events-none"
      role="status"
      aria-label="Shop status bar"
    >
      <div className="mx-auto max-w-5xl px-1 md:px-3 pb-1">
        <div className="hud-panel pointer-events-auto flex items-stretch gap-1 md:gap-2 p-1.5 md:p-2">
          {/* face */}
          <div className="hidden sm:flex flex-col items-center justify-center px-1">
            <MoodFace count={count} />
            <span className="text-[8px] text-amber-700 tracking-widest">PILGRIM</span>
          </div>

          {/* cart count */}
          <div className="flex flex-col items-center justify-center min-w-[64px] md:min-w-[90px] px-2 border border-amber-900/60 bg-[#140e04]/80">
            <span className="text-[9px] md:text-[10px] text-amber-600/90 tracking-[0.25em]">CART</span>
            <span
              className="text-2xl md:text-4xl font-black tabular-nums"
              style={{ color: "#ffb44d", textShadow: "0 0 12px rgba(255,180,77,0.65)" }}
            >
              {String(count).padStart(2, "0")}
            </span>
          </div>

          {/* credits */}
          <div className="flex flex-col items-center justify-center min-w-[80px] md:min-w-[120px] px-2 border border-amber-900/60 bg-[#140e04]/80">
            <span className="text-[9px] md:text-[10px] text-amber-600/90 tracking-[0.25em]">CREDITS</span>
            <span
              className="text-lg md:text-3xl font-black tabular-nums"
              style={{ color: "#ffe9b0", textShadow: "0 0 12px rgba(255,233,176,0.55)" }}
            >
              {total.toLocaleString()}
            </span>
          </div>

          {/* vram — the budget, proudly broken */}
          <div className="hidden md:flex flex-col justify-center min-w-[170px] px-2 border border-amber-900/60 bg-[#140e04]/80 gap-1">
            <div className="flex justify-between text-[9px] text-amber-600/90 tracking-[0.2em]">
              <span>VRAM</span>
              <span className="text-amber-300">{vram.toFixed(1)} MB</span>
            </div>
            <div className="h-2.5 bg-[#241a08] border border-amber-900/60 overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${vramPct}%`,
                  background: "linear-gradient(90deg, #b9862f, #ffd98c, #ff9ea0)",
                  boxShadow: "0 0 10px rgba(255,217,140,0.7)",
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] tracking-wider">
              <span className="text-amber-800/80">SPR {stats.sprites}</span>
              <span className="text-rose-300/90">✦ BUDGET BROKEN</span>
              <span className="text-amber-800/80">DC {stats.drawCalls}</span>
            </div>
          </div>

          {/* fps (compact) */}
          <div className="flex md:hidden flex-col items-center justify-center px-2">
            <span className="text-[9px] text-amber-600/90">FPS</span>
            <span className="text-base font-black tabular-nums" style={{ color: fpsColor }}>
              {stats.fps}
            </span>
          </div>

          <div className="flex-1" />

          {/* buttons */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setSoundOn(!soundOn)}
              aria-label="Toggle sound"
              className="hud-btn"
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
            <button onClick={onAssets} aria-label="Asset pipeline" className="hud-btn hidden sm:block">
              🖼
            </button>
            <button onClick={onHelp} aria-label="Help" className="hud-btn hidden sm:block">
              ?
            </button>
            <button
              onClick={onCart}
              className="hud-btn !px-3 md:!px-5 !text-xs md:!text-sm !bg-gradient-to-b !from-amber-300 !via-amber-400 !to-amber-600 !border-amber-300 !text-[#241304] !font-bold"
              aria-label={`Open cart, ${count} items`}
            >
              🛒 <span className="hidden md:inline">CART</span> [{count}]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
