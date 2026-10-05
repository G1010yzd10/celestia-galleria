"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// ─── Title screen with the classic PSX Doom fire ────────────────────────────

const FW = 192;
const FH = 100;

function palette(): Uint8Array {
  // black → deep red → orange → yellow → white (37 steps)
  const p = new Uint8Array(37 * 3);
  for (let i = 0; i < 37; i++) {
    const t = i / 36;
    p[i * 3] = Math.min(255, Math.round(t * 2.5 * 255));
    p[i * 3 + 1] = Math.min(255, Math.max(0, Math.round((t - 0.34) * 2.1 * 255)));
    p[i * 3 + 2] = Math.min(255, Math.max(0, Math.round((t - 0.72) * 3.2 * 255)));
  }
  return p;
}

export function TitleScreen({ onEnter }: { onEnter: () => void }) {
  const fireRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<"none" | "help" | "assets">("none");

  useEffect(() => {
    const canvas = fireRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pal = palette();
    const fire = new Uint8Array(FW * FH);
    for (let x = 0; x < FW; x++) fire[(FH - 1) * FW + x] = 36;

    let raf = 0;
    let alive = true;
    const img = ctx.createImageData(FW, FH);

    const step = () => {
      if (!alive) return;
      for (let x = 0; x < FW; x++) {
        for (let y = 1; y < FH; y++) {
          const src = y * FW + x;
          const v = fire[src];
          if (v === 0) {
            fire[src - FW] = 0;
          } else {
            const r = (Math.random() * 3) | 0;
            const dst = src - FW - r + 1;
            const v2 = Math.max(0, v - (r & 1));
            fire[Math.max(0, Math.min(FW * FH - 1, dst))] = v2;
          }
        }
      }
      // ignite the bottom row with slight flicker
      for (let x = 0; x < FW; x++) {
        fire[(FH - 1) * FW + x] = 36 - (Math.random() * 3 | 0);
      }
      const d = img.data;
      for (let i = 0; i < FW * FH; i++) {
        const v = fire[i];
        d[i * 4] = pal[v * 3];
        d[i * 4 + 1] = pal[v * 3 + 1];
        d[i * 4 + 2] = pal[v * 3 + 2];
        d[i * 4 + 3] = v === 0 ? 0 : 255;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(step);
    };
    step();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      {/* fire */}
      <canvas
        ref={fireRef}
        width={FW}
        height={FH}
        aria-hidden
        className="absolute bottom-0 left-0 w-full h-[46%] object-cover opacity-90"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* logo */}
      <div className="relative z-10 flex flex-col items-center gap-1 px-4 -mt-16 md:-mt-24">
        <div className="text-[11px] md:text-sm tracking-[0.5em] text-amber-500/90 font-mono">
          SECTOR-7 GALLERIA PRESENTS
        </div>
        <h1
          className="font-mono font-black text-5xl md:text-8xl leading-none text-center"
          style={{
            color: "#ffb44d",
            textShadow:
              "0 0 18px rgba(255,90,20,0.85), 0 0 60px rgba(255,60,10,0.5), 0 4px 0 #7c2d12, 0 6px 0 #431407",
            letterSpacing: "0.06em",
          }}
        >
          DOOM MART
        </h1>
        <div className="font-mono text-teal-300/90 text-xs md:text-base tracking-[0.35em] mt-2">
          3D LITE COMMERCE ENGINE
        </div>
        <div className="font-mono text-neutral-500 text-[10px] md:text-xs mt-1">
          9-ANGLE SPRITES · &lt;4MB VRAM · ZERO DOWNLOADS
        </div>

        <Button
          onClick={onEnter}
          className="mt-8 h-12 md:h-14 px-8 md:px-12 text-lg md:text-xl font-mono font-bold tracking-widest border-2 border-amber-500 bg-gradient-to-b from-amber-600 to-red-700 text-white shadow-[0_0_30px_rgba(245,158,11,0.45)] hover:from-amber-500 hover:to-red-600 active:translate-y-0.5"
        >
          ⚡ ENTER THE SHOP
        </Button>

        <div className="flex gap-3 mt-4 font-mono text-xs">
          <button
            onClick={() => setTab(tab === "help" ? "none" : "help")}
            className="text-teal-300/80 hover:text-teal-200 underline underline-offset-4"
          >
            HOW TO PLAY
          </button>
          <span className="text-neutral-700">|</span>
          <button
            onClick={() => setTab(tab === "assets" ? "none" : "assets")}
            className="text-teal-300/80 hover:text-teal-200 underline underline-offset-4"
          >
            ASSET PIPELINE
          </button>
        </div>

        {tab === "help" && (
          <div className="mt-4 max-w-md w-full bg-black/80 border border-teal-900 rounded p-4 font-mono text-xs text-neutral-300 space-y-1.5">
            <p><span className="text-teal-300">WASD / ARROWS</span> — move · <span className="text-teal-300">SHIFT</span> — run</p>
            <p><span className="text-teal-300">MOUSE</span> — click to lock &amp; look (or drag)</p>
            <p><span className="text-teal-300">E / CLICK</span> — inspect highlighted product</p>
            <p><span className="text-teal-300">TOUCH</span> — left stick moves, drag looks</p>
            <p>Walk up to any product — the glow ring marks it in reach.</p>
          </div>
        )}
        {tab === "assets" && (
          <div className="mt-4 max-w-md w-full bg-black/80 border border-teal-900 rounded p-4 font-mono text-xs text-neutral-300 space-y-1.5">
            <p>Products are <span className="text-amber-400">9-angle PNG sprite sheets</span> (Doom method).</p>
            <p>Drop a <span className="text-teal-300">9-frame horizontal strip</span> onto the shop window to replace any product live — design your 2D art, upload, customers shop it in 3D.</p>
            <p>In-shop <span className="text-teal-300">ASSETS</span> button exports reference sheets.</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 z-10 font-mono text-[10px] text-neutral-600 tracking-widest">
        © 1993-2026 SECTOR-7 RETAIL — “WHERE SHOPPING IS HELL OF A DEAL”
      </div>
    </div>
  );
}
