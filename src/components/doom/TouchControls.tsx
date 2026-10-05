"use client";

import { useRef, useState } from "react";

// ─── Mobile: left thumbstick + E button ─────────────────────────────────────

export function TouchControls({
  onMove,
  onInteract,
  onCart,
}: {
  onMove: (x: number, y: number) => void;
  onInteract: () => void;
  onCart: () => void;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeRef = useRef<number | null>(null);
  const R = 44;

  const handle = (e: React.TouchEvent | React.PointerEvent) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const t =
      "touches" in e
        ? e.touches[0] ?? e.changedTouches[0]
        : (e as React.PointerEvent);
    if (!t) return;
    let dx = t.clientX - cx;
    let dy = t.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > R) {
      dx = (dx / len) * R;
      dy = (dy / len) * R;
    }
    setKnob({ x: dx, y: dy });
    onMove(dx / R, -dy / R);
  };

  const end = () => {
    activeRef.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-none md:hidden select-none">
      {/* thumbstick */}
      <div
        ref={baseRef}
        className="pointer-events-auto absolute left-5 bottom-24 w-28 h-28 rounded-full border-2 border-teal-800/80 bg-black/50 backdrop-blur-[2px]"
        onTouchStart={(e) => {
          activeRef.current = 1;
          handle(e);
        }}
        onTouchMove={(e) => {
          if (activeRef.current !== null) handle(e);
          e.preventDefault();
        }}
        onTouchEnd={end}
        onTouchCancel={end}
      >
        <div
          className="absolute left-1/2 top-1/2 w-12 h-12 rounded-full bg-teal-600/70 border-2 border-teal-300 shadow-[0_0_16px_rgba(45,212,191,0.6)]"
          style={{
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-teal-500/60 tracking-widest">
          MOVE
        </div>
      </div>

      {/* action buttons */}
      <div className="pointer-events-auto absolute right-5 bottom-24 flex flex-col gap-3">
        <button
          onPointerDown={onCart}
          className="w-14 h-14 rounded-full border-2 border-amber-600 bg-black/60 text-xl font-mono text-amber-400 active:bg-amber-900/60"
          aria-label="Open cart"
        >
          🛒
        </button>
        <button
          onPointerDown={onInteract}
          className="w-16 h-16 rounded-full border-2 border-teal-500 bg-black/60 text-2xl font-black font-mono text-teal-300 active:bg-teal-900/60 shadow-[0_0_16px_rgba(45,212,191,0.35)]"
          aria-label="Inspect product"
        >
          E
        </button>
      </div>
    </div>
  );
}
