"use client";

import { useEffect } from "react";
import { useShop } from "@/lib/store";

// ─── THE RITE OF ACQUISITION — the purchase ceremony overlay ────────────────
// A real order was placed (SQLite receipt + inventory delivery). Light floods
// the mall, the hands give thumbs, and the invoice descends from heaven.

export function CeremonyOverlay() {
  const ceremony = useShop((s) => s.ceremony);
  const setCeremony = useShop((s) => s.setCeremony);

  useEffect(() => {
    if (!ceremony) return;
    const t = setTimeout(() => setCeremony(null), 6000);
    return () => clearTimeout(t);
  }, [ceremony, setCeremony]);

  if (!ceremony) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto cursor-pointer"
      onClick={() => setCeremony(null)}
      role="alertdialog"
      aria-label="Purchase complete"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100/25 via-transparent to-black/45 animate-[ritefade_6s_ease-out_forwards]" />
      <div className="relative font-mono text-center px-6 animate-[riterise_0.7s_ease-out]">
        <div className="text-[11px] md:text-xs tracking-[0.5em] text-teal-200 mb-3">
          THE ALTAR ACCEPTS YOUR OFFERING
        </div>
        <div
          className="text-3xl md:text-5xl font-black tracking-widest text-amber-200"
          style={{ textShadow: "0 0 32px rgba(255,217,140,0.85), 0 2px 0 rgba(80,50,10,0.8)" }}
        >
          RITE COMPLETE ✦
        </div>
        <div className="mt-5 inline-block border-2 border-amber-500/70 bg-black/70 px-6 py-4">
          <div className="text-[10px] tracking-[0.3em] text-neutral-400">DIVINE INVOICE</div>
          <div className="text-lg md:text-xl text-amber-300 font-bold mt-1 tabular-nums">
            {ceremony.total.toLocaleString()} CREDITS
          </div>
          <div className="text-[10px] text-neutral-500 mt-1 tracking-widest">
            ORDER #{ceremony.orderId.slice(0, 8).toUpperCase()} · PERSISTED TO SQLITE
          </div>
        </div>
        <div className="mt-5 text-xs md:text-sm text-amber-100/90 tracking-[0.25em] animate-pulse">
          YOUR RELICS TAKE FLESH IN THE SANCTUM
        </div>
        <div className="text-[10px] text-neutral-500 mt-2 tracking-[0.2em]">
          SOUTH HALL · FOLLOW THE GOLDEN LIGHT · [CLICK TO CONTINUE]
        </div>
      </div>
    </div>
  );
}
