"use client";

import { useEffect, useRef } from "react";
import type { DoomEngine } from "@/lib/doom/engine";

// ─── Doom automap — rotates with the player, red arrow, live product dots ──

export function Minimap({ engine }: { engine: DoomEngine | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!engine) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const SIZE = 150;
    const VIEW = 7.5; // meters radius shown
    let raf = 0;
    let alive = true;

    const draw = () => {
      if (!alive) return;
      const mm = engine.getMinimap();
      // player state via stats is too slow; read engine internals through API
      const st = engine.getStats();
      const { grid, pool } = mm;
      const scale = SIZE / 2 / VIEW;
      const cell = grid.cell;

      ctx.clearRect(0, 0, SIZE, SIZE);
      // backdrop
      ctx.fillStyle = "rgba(4,8,10,0.72)";
      ctx.fillRect(0, 0, SIZE, SIZE);

      ctx.save();
      ctx.translate(SIZE / 2, SIZE / 2);
      // rotate so player faces up (Doom automap style)
      ctx.rotate(st.yaw + Math.PI);

      const px = st.px;
      const pz = st.pz;
      const toX = (wx: number) => (wx - px) * scale;
      const toY = (wz: number) => (wz - pz) * scale;

      // cells
      for (let cz = 0; cz < grid.h; cz++) {
        for (let cx = 0; cx < grid.w; cx++) {
          const v = grid.cells[cz * grid.w + cx];
          if (v === 0) continue;
          const x = toX(cx * cell);
          const y = toY(cz * cell);
          const s = cell * scale;
          if (Math.abs(x) > SIZE / 2 + s || Math.abs(y) > SIZE / 2 + s) continue;
          if (v === 1) ctx.fillStyle = "rgba(190,60,50,0.5)";
          else if (v === 2) ctx.fillStyle = "rgba(45,212,191,0.30)";
          else ctx.fillStyle = "rgba(245,158,11,0.75)";
          ctx.fillRect(x, y, s, s);
        }
      }

      // pool outline shimmer
      ctx.strokeStyle = "rgba(45,212,191,0.8)";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        toX(pool.cx - pool.w / 2),
        toY(pool.cz - pool.d / 2),
        pool.w * scale,
        pool.d * scale
      );

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

      // player arrow (Doom red)
      ctx.fillStyle = "#ff4436";
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // frame
      ctx.strokeStyle = "rgba(45,212,191,0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, SIZE - 2, SIZE - 2);
      // N marker rotates with map
      ctx.save();
      ctx.translate(SIZE / 2, SIZE / 2);
      ctx.rotate(st.yaw + Math.PI);
      ctx.fillStyle = "rgba(45,212,191,0.9)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("N", 0, -(SIZE / 2 - 8));
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [engine]);

  return (
    <canvas
      ref={ref}
      width={150}
      height={150}
      aria-label="Shop automap"
      className="w-[110px] h-[110px] md:w-[150px] md:h-[150px] rounded-sm shadow-lg shadow-black/60"
    />
  );
}
