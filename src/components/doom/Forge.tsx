"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { DoomEngine } from "@/lib/doom/engine";
import type { ProductSpec } from "@/lib/doom/types";
import {
  CELL_GLORY,
  CELL_LEAN,
  composeAtlas,
  detectLayout,
  drawFrame,
  fileToImage,
  FORGE_ANGLES,
  HUMAN_H,
  loadImage,
  naturalFiles,
  removeBackground,
  SIZE_PRESETS,
  sliceGrid,
  sliceStrip,
  toCanvas,
  type ComposedAtlas,
  type InputMode,
} from "@/lib/doom/forge";
import type { CustomProductJSON } from "@/app/api/products/route";

// ─── THE SPRITE FORGE — upload your own 2D sprites, say their size ─────────
// 9 PNG frames (or one strip / one 3×3 grid) in → background removed,
// trimmed, scale-locked → a persistent 9-angle shrine resident you can
// resize LIVE (sofa big, mug small) and customers shop in 3D.

const ANGLE_LABEL = (k: number) => (k === 0 ? "FRONT 0°" : `${k * 40}°`);

const CATEGORY_OPTIONS = [
  "CURATED", "OPTICS", "GAMING", "AUDIO", "WEARABLES", "AERIAL",
  "COMPUTING", "FOOTWEAR", "TABLEWARE", "FURNITURE", "HOME", "OTHER",
];

const ACCENT_SWATCHES: { hex: string; name: string }[] = [
  { hex: "#2dd4bf", name: "AQUA" },
  { hex: "#f59e0b", name: "GOLD" },
  { hex: "#fb7185", name: "ROSE" },
  { hex: "#a78bfa", name: "IRIS" },
  { hex: "#34d399", name: "JADE" },
];

function hexToAccent(hex: string): number {
  return parseInt(hex.replace("#", ""), 16) || 0x2dd4bf;
}

export function specFromJSON(p: CustomProductJSON): ProductSpec {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    credits: p.price,
    blurb: p.blurb,
    specs: [
      "FORGED BY PILGRIM HANDS",
      `WORLD SIZE ${p.spriteW.toFixed(2)}M × ${p.spriteH.toFixed(2)}M`,
      "9-ANGLE UPLOADED ATLAS",
    ],
    spriteW: p.spriteW,
    spriteH: p.spriteH,
    accent: hexToAccent(p.accent),
  };
}

// ── small parts ─────────────────────────────────────────────────────────────

function AngleSlot({
  k,
  frame,
  onFile,
}: {
  k: number;
  frame: HTMLCanvasElement | null;
  onFile: (k: number, f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!frame || !cvRef.current) return;
    const c = cvRef.current;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    const s = Math.min(c.width / frame.width, c.height / frame.height);
    ctx.drawImage(
      frame,
      (c.width - frame.width * s) / 2,
      (c.height - frame.height * s) / 2,
      frame.width * s,
      frame.height * s
    );
  }, [frame]);
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(k, f);
      }}
      title={ANGLE_LABEL(k)}
      className={`relative w-full aspect-square border flex items-center justify-center overflow-hidden bg-[repeating-conic-gradient(#151109_0%_25%,#0c0a06_0%_50%)] bg-[length:12px_12px] ${
        frame ? "border-teal-600" : "border-dashed border-neutral-700 hover:border-amber-500"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(k, f);
          e.target.value = "";
        }}
      />
      {frame ? (
        <canvas ref={cvRef} width={96} height={96} className="w-full h-full object-contain" />
      ) : (
        <span className="text-[9px] font-mono text-neutral-500 tracking-wider">
          {ANGLE_LABEL(k)}
        </span>
      )}
    </button>
  );
}

function SpinPreview({ atlas, accent }: { atlas: HTMLCanvasElement; accent: string }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const playRef = useRef(true);
  const dragRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (playRef.current && dragRef.current === null) frameRef.current += dt * 1.1;
      const k = ((Math.floor(frameRef.current) % FORGE_ANGLES) + FORGE_ANGLES) % FORGE_ANGLES;
      const c = cvRef.current;
      if (c) drawFrame(c, atlas, k);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [atlas]);

  return (
    <div
      className="relative border border-neutral-700 bg-[repeating-conic-gradient(#151119_0%_25%,#0d0d12_0%_50%)] bg-[length:16px_16px] overflow-hidden"
      style={{ boxShadow: `inset 0 0 50px ${accent}18` }}
    >
      <canvas
        ref={cvRef}
        width={280}
        height={280}
        className="w-full aspect-square cursor-ew-resize touch-none"
        onPointerDown={(e) => {
          dragRef.current = e.clientX;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (dragRef.current === null) return;
          frameRef.current += (e.clientX - dragRef.current) * 0.02;
          dragRef.current = e.clientX;
        }}
        onPointerUp={() => (dragRef.current = null)}
        onPointerCancel={() => (dragRef.current = null)}
      />
      <div className="absolute bottom-1 left-2 text-[9px] font-mono text-neutral-500 tracking-widest">
        DRAG TO SPIN · LIVE 9-ANGLE PREVIEW
      </div>
      <button
        type="button"
        onClick={() => {
          playRef.current = !playRef.current;
          setPlaying(playRef.current);
        }}
        className="absolute bottom-1 right-1 hud-btn !h-6 !min-w-6 !px-1.5 !text-[10px]"
        aria-label={playing ? "Pause rotation" : "Play rotation"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
    </div>
  );
}

/** the sofa-is-big / mug-is-small visual: product box next to a 1.7 m pilgrim */
function HumanScale({ w, h, accent }: { w: number; h: number; accent: string }) {
  const PED = 0.96;
  const pedW = Math.max(0.9, Math.min(2.6, w * 1.15));
  const sceneW = Math.max(pedW, w) + 1.6;
  const topH = Math.max(PED + h, HUMAN_H);
  const sceneH = topH + 0.34;
  const ground = sceneH - 0.28;
  const pedX = (Math.max(pedW, w) - pedW) / 2 + 0.25;
  const boxX = (Math.max(pedW, w) - Math.max(w, 0.05)) / 2 + 0.25;
  const boxY = ground - PED - h;
  const humanX = Math.max(pedW, w) + 0.75;
  return (
    <svg
      viewBox={`0 0 ${sceneW} ${sceneH}`}
      className="w-full h-44 border border-neutral-800 bg-[#0a0805]"
      role="img"
      aria-label={`Product ${w.toFixed(2)} by ${h.toFixed(2)} meters beside a 1.7 meter pilgrim`}
    >
      {/* ruler */}
      <line x1={0.12} y1={ground} x2={0.12} y2={ground - topH} stroke="#57503a" strokeWidth={0.012} />
      {[0.5, 1.0, 1.5].map((m) =>
        m <= topH ? (
          <g key={m}>
            <line x1={0.06} y1={ground - m} x2={0.18} y2={ground - m} stroke="#57503a" strokeWidth={0.012} />
            <text x={0.22} y={ground - m + 0.04} fontSize={0.11} fill="#8a8168" fontFamily="monospace">
              {m.toFixed(1)}m
            </text>
          </g>
        ) : null
      )}
      {/* ground */}
      <line x1={0} y1={ground} x2={sceneW} y2={ground} stroke="#a1804e" strokeWidth={0.02} />
      {/* pedestal */}
      <rect x={pedX} y={ground - PED} width={pedW} height={PED} fill="#181205" stroke="#7c5a22" strokeWidth={0.016} />
      <rect x={pedX} y={ground - PED} width={pedW} height={0.05} fill="#c79a3f" opacity={0.8} />
      {/* product box */}
      <rect
        x={boxX}
        y={boxY}
        width={Math.max(w, 0.05)}
        height={Math.max(h, 0.03)}
        fill={accent}
        opacity={0.35}
        stroke={accent}
        strokeWidth={0.018}
      />
      <text
        x={boxX + Math.max(w, 0.05) / 2}
        y={Math.max(boxY - 0.07, 0.16)}
        fontSize={0.13}
        fill={accent}
        fontFamily="monospace"
        textAnchor="middle"
      >
        {w.toFixed(2)}m × {h.toFixed(2)}m
      </text>
      {/* pilgrim silhouette */}
      <g stroke="#d8b36a" fill="#d8b36a" strokeWidth={0.016} opacity={0.9}>
        <circle cx={humanX} cy={ground - HUMAN_H + 0.12} r={0.11} fill="none" />
        <line x1={humanX} y1={ground - HUMAN_H + 0.24} x2={humanX} y2={ground - 0.78} />
        <line x1={humanX} y1={ground - 0.78} x2={humanX - 0.14} y2={ground} />
        <line x1={humanX} y1={ground - 0.78} x2={humanX + 0.14} y2={ground} />
        <line x1={humanX - 0.24} y1={ground - 1.28} x2={humanX + 0.24} y2={ground - 1.28} opacity={0.55} />
      </g>
      <text x={humanX} y={ground + 0.22} fontSize={0.12} fill="#8a8168" fontFamily="monospace" textAnchor="middle">
        PILGRIM 1.70m
      </text>
    </svg>
  );
}

/** thumbnail: frame k of a persisted atlas URL */
function AtlasThumb({ url, k = 0 }: { url: string; k?: number }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let alive = true;
    loadImage(url)
      .then((i) => alive && setImg(i))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url]);
  useEffect(() => {
    const c = cvRef.current;
    if (!c || !img) return;
    const cell = img.height;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    const s = Math.min(c.width / cell, c.height / cell);
    ctx.drawImage(img, k * cell, 0, cell, cell, (c.width - cell * s) / 2, (c.height - cell * s) / 2, cell * s, cell * s);
  }, [img, k]);
  return (
    <canvas
      ref={cvRef}
      width={72}
      height={72}
      className="w-12 h-12 md:w-14 md:h-14 border border-neutral-700 bg-[repeating-conic-gradient(#151119_0%_25%,#0d0d12_0%_50%)] bg-[length:10px_10px] shrink-0"
    />
  );
}

// ── the Forge ───────────────────────────────────────────────────────────────

export function Forge({
  open,
  onOpenChange,
  engine,
  onToast,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  engine: DoomEngine | null;
  onToast: (msg: string) => void;
}) {
  const [mode, setMode] = useState<InputMode>("frames");
  const [slotFrames, setSlotFrames] = useState<(HTMLCanvasElement | null)[]>(Array(FORGE_ANGLES).fill(null));
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [tolerance, setTolerance] = useState(32);
  const [cell, setCell] = useState<number>(CELL_GLORY);
  const [composed, setComposed] = useState<ComposedAtlas | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("CURATED");
  const [price, setPrice] = useState(99);
  const [blurb, setBlurb] = useState("");
  const [accent, setAccent] = useState("#2dd4bf");

  const [w, setW] = useState(0.9);
  const [h, setH] = useState(0.9);
  const [lockAspect, setLockAspect] = useState(true);
  const sizeTouched = useRef(false);

  const [customs, setCustoms] = useState<CustomProductJSON[]>([]);
  const [slots, setSlots] = useState<{ used: number; total: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editW, setEditW] = useState(0.9);
  const [editH, setEditH] = useState(0.9);

  const filledCount = useMemo(() => slotFrames.filter(Boolean).length, [slotFrames]);

  const refreshCustoms = useCallback(async () => {
    try {
      const r = await fetch("/api/products");
      const j = await r.json();
      if (j?.ok) {
        setCustoms(j.products as CustomProductJSON[]);
        setSlots(j.slots ?? null);
      }
    } catch {
      /* offline — list stays as-is */
    }
  }, []);

  useEffect(() => {
    if (open) void refreshCustoms();
  }, [open, refreshCustoms]);

  // ── conjuring: frames → processed atlas ──
  const conjure = useCallback(async () => {
    let raw: HTMLCanvasElement[] | null = null;
    if (mode === "frames") {
      if (filledCount < FORGE_ANGLES) {
        onToast("ALL 9 ANGLES NEEDED — FILL EVERY SLOT");
        return;
      }
      raw = slotFrames as HTMLCanvasElement[];
    } else if (sourceImg) {
      raw = mode === "strip" ? sliceStrip(sourceImg) : sliceGrid(sourceImg);
    }
    if (!raw) {
      onToast("FEED THE FORGE SOME SPRITES FIRST");
      return;
    }
    setBusy(true);
    // let the spinner paint before the heavy canvas work
    await new Promise((r) => setTimeout(r, 30));
    try {
      const processed = removeBg ? raw.map((c) => removeBackground(c, tolerance)) : raw;
      const out = composeAtlas(processed, cell);
      if (!out) {
        onToast("NOTHING VISIBLE FOUND — CHECK THE FRAMES");
        setComposed(null);
        return;
      }
      setComposed(out);
      setStale(false);
      if (!sizeTouched.current && out.contentAspect > 0) {
        setH((prev) => Math.round(Math.min(6, Math.max(0.08, prev)) * 100) / 100);
        setW((prev) => Math.round(Math.min(6, Math.max(0.08, prev / out.contentAspect)) * 100) / 100);
      }
      onToast("ATLAS CONJURED — 9 FRAMES, SCALE-LOCKED");
    } finally {
      setBusy(false);
    }
  }, [mode, filledCount, slotFrames, sourceImg, removeBg, tolerance, cell, onToast]);

  const markStale = useCallback(() => setStale(true), []);

  const onSlotFile = useCallback(
    async (k: number, f: File) => {
      try {
        const img = await fileToImage(f);
        const c = toCanvas(img);
        setSlotFrames((prev) => {
          const next = [...prev];
          next[k] = c;
          return next;
        });
        markStale();
      } catch {
        onToast("COULD NOT READ THAT IMAGE");
      }
    },
    [markStale, onToast]
  );

  const onSlotFilesBulk = useCallback(
    async (files: File[]) => {
      const imgs = naturalFiles(files).slice(0, FORGE_ANGLES);
      const canvases: HTMLCanvasElement[] = [];
      for (const f of imgs) {
        try {
          canvases.push(toCanvas(await fileToImage(f)));
        } catch {
          /* skip unreadable */
        }
      }
      setSlotFrames((prev) => {
        const next = [...prev];
        canvases.forEach((c, i) => (next[i] = c));
        return next;
      });
      markStale();
    },
    [markStale]
  );

  const onSourceFile = useCallback(
    async (f: File) => {
      try {
        const img = await fileToImage(f);
        setSourceImg(img);
        setMode((m) => (m === "frames" ? detectLayout(img) : m));
        markStale();
      } catch {
        onToast("COULD NOT READ THAT IMAGE");
      }
    },
    [markStale, onToast]
  );

  // ── publish ──
  const publish = useCallback(async () => {
    if (!composed) return;
    if (name.trim().length < 2) {
      onToast("NAME THE RELIC FIRST (2+ CHARS)");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          price,
          blurb: blurb.trim() || `A pilgrim-forged relic, ${w.toFixed(2)}m × ${h.toFixed(2)}m of handcrafted glory.`,
          accent,
          spriteW: w,
          spriteH: h,
          atlasDataUrl: composed.atlas.toDataURL("image/png"),
        }),
      });
      const j = await r.json();
      if (!j?.ok) {
        onToast(j?.error ?? "THE FORGE REJECTED THE OFFERING");
        return;
      }
      const p = j.product as CustomProductJSON;
      const ok = engine?.addCustomProduct(specFromJSON(p), composed.atlas);
      onToast(
        ok
          ? `SHRINE BLESSED — ${p.name.toUpperCase()} NOW ON DISPLAY`
          : `${p.name.toUpperCase()} SAVED — SHRINES FULL, RETIRE ONE TO SHOW IT`
      );
      setName("");
      setBlurb("");
      setPrice(99);
      setComposed(null);
      setSlotFrames(Array(FORGE_ANGLES).fill(null));
      setSourceImg(null);
      sizeTouched.current = false;
      void refreshCustoms();
    } catch {
      onToast("THE FORGE FIRE WENT OUT — TRY AGAIN");
    } finally {
      setBusy(false);
    }
  }, [composed, name, category, price, blurb, accent, w, h, engine, onToast, refreshCustoms]);

  // ── live size editor for persisted customs ──
  const openEditor = useCallback((p: CustomProductJSON) => {
    setEditingId((cur) => (cur === p.id ? null : p.id));
    setEditW(p.spriteW);
    setEditH(p.spriteH);
  }, []);

  const liveResize = useCallback(
    (nw: number, nh: number) => {
      setEditW(nw);
      setEditH(nh);
      engine?.resizeProduct(editingId ?? "", nw, nh);
    },
    [engine, editingId]
  );

  const saveSize = useCallback(async () => {
    if (!editingId) return;
    try {
      const r = await fetch(`/api/products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spriteW: editW, spriteH: editH }),
      });
      const j = await r.json();
      if (j?.ok) {
        onToast("SIZE SEALED INTO THE LEDGER");
        setEditingId(null);
        void refreshCustoms();
      } else {
        onToast(j?.error ?? "THE LEDGER REFUSED");
      }
    } catch {
      onToast("THE FORGE FIRE WENT OUT — TRY AGAIN");
    }
  }, [editingId, editW, editH, onToast, refreshCustoms]);

  const retire = useCallback(
    async (p: CustomProductJSON) => {
      if (!window.confirm(`Retire ${p.name} from its shrine? The atlas is deleted.`)) return;
      try {
        const r = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
        const j = await r.json();
        if (j?.ok) {
          engine?.removeProduct(p.id);
          onToast(`${p.name.toUpperCase()} RETIRED — SHRINE FREED`);
          void refreshCustoms();
        } else {
          onToast(j?.error ?? "RETIREMENT REFUSED");
        }
      } catch {
        onToast("THE FORGE FIRE WENT OUT — TRY AGAIN");
      }
    },
    [engine, onToast, refreshCustoms]
  );

  const setWPreset = useCallback(
    (preset: { w?: number; h: number }) => {
      sizeTouched.current = true;
      const aspect = composed?.contentAspect || 1;
      if (preset.w) {
        setW(preset.w);
        setH(Math.round(Math.min(6, Math.max(0.08, preset.w / aspect)) * 100) / 100);
      } else {
        setH(preset.h);
        setW(Math.round(Math.min(6, Math.max(0.08, preset.h * aspect)) * 100) / 100);
      }
    },
    [composed]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070502]/[0.97] backdrop-blur-sm font-mono text-neutral-200">
      <div className="mx-auto max-w-6xl px-3 md:px-6 py-4 md:py-8 space-y-5">
        {/* header */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-amber-900/50 pb-3">
          <div>
            <h2
              className="text-2xl md:text-4xl font-black tracking-wider"
              style={{ color: "#ffe9b8", textShadow: "0 0 18px rgba(255,214,140,0.6)" }}
            >
              ⚒ THE SPRITE FORGE
            </h2>
            <div className="text-[10px] md:text-xs text-teal-200/80 tracking-[0.3em] mt-1">
              YOUR 2D ART → 9-ANGLE SHRINE RELIC → LIVE 3D SHOPPING
            </div>
          </div>
          <div className="flex items-center gap-3">
            {slots && (
              <div className="text-[10px] text-neutral-400 tracking-widest border border-neutral-800 px-2 py-1">
                SHRINES{" "}
                <span className={slots.used >= slots.total ? "text-rose-400" : "text-amber-300"}>
                  {slots.used}/{slots.total}
                </span>{" "}
                OCCUPIED
              </div>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-amber-700 hover:bg-amber-950/40">
              ✕ RETURN TO TEMPLE
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── LEFT: feed the forge ── */}
          <section className="space-y-4">
            <div className="border border-neutral-800 bg-black/40 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-amber-300 text-sm font-bold tracking-widest">1 · FEED THE FORGE</div>
                <div className="flex gap-1">
                  {(["frames", "strip", "grid"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        markStale();
                      }}
                      className={`px-2.5 py-1 text-[10px] tracking-widest border ${
                        mode === m
                          ? "border-teal-500 text-teal-200 bg-teal-950/40"
                          : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                      }`}
                    >
                      {m === "frames" ? "9 FILES" : m === "strip" ? "1 STRIP" : "3×3 GRID"}
                    </button>
                  ))}
                </div>
              </div>

              {mode === "frames" && (
                <div className="space-y-3">
                  <label className="block border-2 border-dashed border-amber-800/70 hover:border-amber-500 p-4 text-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const fs = Array.from(e.target.files ?? []);
                        if (fs.length) void onSlotFilesBulk(fs);
                        e.target.value = "";
                      }}
                    />
                    <div className="text-amber-200 text-xs font-bold tracking-widest">
                      📥 DROP / PICK UP TO 9 PNGs — SORTED BY NAME
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1">
                      e.g. mug_00.png … mug_08.png · frame 1 = front, each next +40° clockwise
                    </div>
                  </label>
                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                    {Array.from({ length: FORGE_ANGLES }).map((_, k) => (
                      <AngleSlot key={k} k={k} frame={slotFrames[k]} onFile={onSlotFile} />
                    ))}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    {filledCount}/9 SLOTS FILLED — click any slot to replace a single angle
                  </div>
                </div>
              )}

              {mode !== "frames" && (
                <label className="block border-2 border-dashed border-amber-800/70 hover:border-amber-500 p-4 text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onSourceFile(f);
                      e.target.value = "";
                    }}
                  />
                  {sourceImg ? (
                    <div className="space-y-2">
                      <img
                        src={sourceImg.src}
                        alt="Uploaded sprite source"
                        className="mx-auto max-h-40 border border-neutral-700 bg-[repeating-conic-gradient(#151119_0%_25%,#0d0d12_0%_50%)] bg-[length:14px_14px]"
                      />
                      <div className="text-[10px] text-neutral-400">
                        {sourceImg.width}×{sourceImg.height}px — sliced {mode === "strip" ? "into 9 horizontal frames" : "into a 3×3 grid, row by row"}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-amber-200 text-xs font-bold tracking-widest">
                        📥 DROP ONE PNG — {mode === "strip" ? "A 9-FRAME HORIZONTAL STRIP" : "A 3×3 ANGLE GRID"}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        cell 1 = front · every next cell +40° clockwise · row-major for grids
                      </div>
                    </div>
                  )}
                </label>
              )}
            </div>

            {/* forge settings */}
            <div className="border border-neutral-800 bg-black/40 p-4 space-y-3">
              <div className="text-amber-300 text-sm font-bold tracking-widest">2 · FORGE SETTINGS</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-neutral-300">REMOVE BACKGROUND</div>
                  <div className="text-[10px] text-neutral-500">border flood-fill — white sweeps & flat colors</div>
                </div>
                <Switch checked={removeBg} onCheckedChange={(v) => { setRemoveBg(v); markStale(); }} />
              </div>
              {removeBg && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-400 tracking-widest">
                    <span>TOLERANCE</span>
                    <span className="text-amber-300">{tolerance}</span>
                  </div>
                  <Slider
                    value={[tolerance]}
                    min={4}
                    max={90}
                    step={1}
                    onValueChange={([v]) => { setTolerance(v); markStale(); }}
                    aria-label="Background removal tolerance"
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-neutral-300">FRAME CELL</div>
                  <div className="text-[10px] text-neutral-500">atlas = 9 cells side-by-side</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setCell(CELL_LEAN); markStale(); }}
                    className={`px-2 py-1 text-[10px] border ${cell === CELL_LEAN ? "border-teal-500 text-teal-200" : "border-neutral-700 text-neutral-400"}`}
                  >
                    224 LEAN
                  </button>
                  <button
                    onClick={() => { setCell(CELL_GLORY); markStale(); }}
                    className={`px-2 py-1 text-[10px] border ${cell === CELL_GLORY ? "border-amber-500 text-amber-200" : "border-neutral-700 text-neutral-400"}`}
                  >
                    320 GLORY
                  </button>
                </div>
              </div>
              <Button
                onClick={() => void conjure()}
                disabled={busy}
                className={`w-full font-bold tracking-widest border-2 ${
                  stale
                    ? "border-amber-300 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 !text-[#241304]"
                    : "border-teal-600 bg-teal-950/40 hover:bg-teal-900/40 text-teal-200"
                }`}
              >
                {busy ? "CONJURING…" : stale ? "⚒ RE-CONJURE ATLAS" : "⚒ CONJURE ATLAS"}
              </Button>
            </div>

            {/* filmstrip */}
            {composed && (
              <div className="border border-neutral-800 bg-black/40 p-4 space-y-2">
                <div className="text-amber-300 text-sm font-bold tracking-widest">CONJURED ATLAS — 9 CELLS</div>
                <div className="grid grid-cols-9 gap-1">
                  {Array.from({ length: FORGE_ANGLES }).map((_, k) => (
                    <canvas
                      key={k}
                      width={64}
                      height={64}
                      className="w-full aspect-square border border-neutral-800 bg-[repeating-conic-gradient(#151119_0%_25%,#0d0d12_0%_50%)] bg-[length:8px_8px]"
                      ref={(el) => {
                        if (el) drawFrame(el, composed.atlas, k);
                      }}
                    />
                  ))}
                </div>
                <div className="text-[10px] text-neutral-500">
                  {composed.cell * 9}×{composed.cell}px · content aspect {composed.contentAspect.toFixed(2)} · trim + center automatic
                </div>
              </div>
            )}
          </section>

          {/* ── RIGHT: preview, relic data, THE SIZE DIAL ── */}
          <section className="space-y-4">
            <div className="border border-neutral-800 bg-black/40 p-4">
              <div className="text-amber-300 text-sm font-bold tracking-widest mb-2">3 · BEHOLD</div>
              {composed ? (
                <SpinPreview atlas={composed.atlas} accent={accent} />
              ) : (
                <div className="aspect-square border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 text-xs tracking-widest">
                  THE SPIN PREVIEW AWAKENS AFTER CONJURING
                </div>
              )}
            </div>

            {/* relic data */}
            <div className="border border-neutral-800 bg-black/40 p-4 space-y-3">
              <div className="text-amber-300 text-sm font-bold tracking-widest">4 · RELIC DATA</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1 block">
                  <span className="text-[10px] text-neutral-400 tracking-widest">NAME</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={48}
                    placeholder="e.g. STARLIGHT KETTLE"
                    className="forge-input"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] text-neutral-400 tracking-widest">PRICE (CREDITS)</span>
                  <input
                    type="number"
                    min={1}
                    max={999999}
                    value={price}
                    onChange={(e) => setPrice(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    className="forge-input"
                  />
                </label>
                <label className="space-y-1 block sm:col-span-2">
                  <span className="text-[10px] text-neutral-400 tracking-widest">CATEGORY</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="forge-input"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c} className="bg-[#0b0e12]">
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 block sm:col-span-2">
                  <span className="text-[10px] text-neutral-400 tracking-widest">BLURB</span>
                  <textarea
                    value={blurb}
                    onChange={(e) => setBlurb(e.target.value)}
                    maxLength={600}
                    rows={2}
                    placeholder="What makes this relic divine?"
                    className="forge-input resize-none"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-neutral-400 tracking-widest">HALO COLOR</span>
                {ACCENT_SWATCHES.map((s) => (
                  <button
                    key={s.hex}
                    onClick={() => setAccent(s.hex)}
                    title={s.name}
                    aria-label={`Accent ${s.name}`}
                    className={`w-6 h-6 border-2 ${accent === s.hex ? "border-white" : "border-transparent"}`}
                    style={{ backgroundColor: s.hex }}
                  />
                ))}
              </div>
            </div>

            {/* THE SIZE DIAL */}
            <div className="border-2 border-amber-700/70 bg-[#120d06]/80 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-amber-300 text-sm font-bold tracking-widest">
                  5 · SAY THE SIZE <span className="text-neutral-500 text-[10px]">(WORLD METERS)</span>
                </div>
                <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 tracking-widest cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                    className="accent-amber-500"
                  />
                  LOCK ASPECT
                </label>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SIZE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setWPreset(p)}
                    title={p.hint}
                    className={`px-2 py-1 text-[10px] tracking-widest border ${
                      Math.abs(h - (p.w ? p.h : 0)) < 0.001
                        ? "border-amber-400 text-amber-200 bg-amber-950/40"
                        : "border-neutral-700 text-neutral-300 hover:border-amber-500"
                    }`}
                  >
                    {p.label} {p.w ? `${p.w}m` : `${p.h}m`}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-400 tracking-widest">
                    <span>WIDTH</span>
                    <span className="text-amber-300 tabular-nums">{w.toFixed(2)} m</span>
                  </div>
                  <Slider
                    value={[w]}
                    min={0.08}
                    max={6}
                    step={0.01}
                    onValueChange={([v]) => {
                      sizeTouched.current = true;
                      setW(v);
                      if (lockAspect && composed) {
                        setH(Math.round(Math.min(6, Math.max(0.08, v / composed.contentAspect)) * 100) / 100);
                      }
                    }}
                    aria-label="World width in meters"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-neutral-400 tracking-widest">
                    <span>HEIGHT</span>
                    <span className="text-amber-300 tabular-nums">{h.toFixed(2)} m</span>
                  </div>
                  <Slider
                    value={[h]}
                    min={0.08}
                    max={6}
                    step={0.01}
                    onValueChange={([v]) => {
                      sizeTouched.current = true;
                      setH(v);
                      if (lockAspect && composed) {
                        setW(Math.round(Math.min(6, Math.max(0.08, v * composed.contentAspect)) * 100) / 100);
                      }
                    }}
                    aria-label="World height in meters"
                  />
                </div>
              </div>

              <HumanScale w={w} h={h} accent={accent} />
              <div className="text-[10px] text-neutral-500 leading-relaxed">
                This is the exact size the relic occupies on its shrine — a mug reads like a jewel,
                a sofa like a monument. 0.08 m – 6 m; the temple clamps the rest.
              </div>
            </div>

            <Button
              onClick={() => void publish()}
              disabled={busy || !composed}
              className="w-full h-12 font-bold tracking-widest border-2 border-amber-300 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 hover:to-amber-500 !text-[#241304] disabled:opacity-40"
            >
              {busy ? "BLESSING…" : "✦ PUBLISH TO AN EMPTY SHRINE"}
            </Button>
          </section>
        </div>

        {/* ── manage residents ── */}
        <section className="border border-neutral-800 bg-black/40 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-amber-300 text-sm font-bold tracking-widest">SHRINE RESIDENTS — RESIZE ANY TIME</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refreshCustoms()}
              className="border-neutral-700 text-[10px]"
            >
              ↻ REFRESH
            </Button>
          </div>
          {customs.length === 0 ? (
            <div className="text-xs text-neutral-500 border border-dashed border-neutral-800 p-4 text-center">
              No pilgrim relics yet — the shrines stand empty, waiting for your sprites.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/70">
              {customs.map((p) => (
                <div key={p.id} className="py-2.5 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <AtlasThumb url={p.spriteUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-teal-200 truncate">{p.name}</div>
                      <div className="text-[10px] text-neutral-500 tracking-wider">
                        {p.category} · {p.price.toLocaleString()} CRED ·{" "}
                        <span className="text-amber-300">
                          {p.spriteW.toFixed(2)}m × {p.spriteH.toFixed(2)}m
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => openEditor(p)} className="border-neutral-700 text-[10px]">
                        ⤢ RESIZE
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = engine?.exportSheet(p.id);
                          if (!url) {
                            onToast("LOAD THE TEMPLE FIRST TO EXPORT");
                            return;
                          }
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `celestia-${p.id}-9angle-reference.png`;
                          a.click();
                        }}
                        className="border-neutral-700 text-[10px]"
                      >
                        ⇩ SHEET
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void retire(p)}
                        className="border-rose-900 text-rose-300 hover:bg-rose-950/30 text-[10px]"
                      >
                        ✕ RETIRE
                      </Button>
                    </div>
                  </div>
                  {editingId === p.id && (
                    <div className="border border-amber-800/60 bg-[#120d06]/60 p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400 tracking-widest">
                            <span>WIDTH</span>
                            <span className="text-amber-300 tabular-nums">{editW.toFixed(2)} m</span>
                          </div>
                          <Slider
                            value={[editW]}
                            min={0.08}
                            max={6}
                            step={0.01}
                            onValueChange={([v]) => liveResize(v, editH)}
                            aria-label={`Resize ${p.name} width`}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-neutral-400 tracking-widest">
                            <span>HEIGHT</span>
                            <span className="text-amber-300 tabular-nums">{editH.toFixed(2)} m</span>
                          </div>
                          <Slider
                            value={[editH]}
                            min={0.08}
                            max={6}
                            step={0.01}
                            onValueChange={([v]) => liveResize(editW, v)}
                            aria-label={`Resize ${p.name} height`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {SIZE_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              const aspect = p.spriteW / Math.max(0.01, p.spriteH);
                              if (preset.w) liveResize(preset.w, Math.min(6, Math.max(0.08, preset.w / aspect)));
                              else liveResize(Math.min(6, Math.max(0.08, preset.h * aspect)), preset.h);
                            }}
                            className="px-2 py-1 text-[10px] border border-neutral-700 text-neutral-300 hover:border-amber-500"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void saveSize()} className="bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] tracking-widest">
                          ✓ SEAL SIZE
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            engine?.resizeProduct(p.id, p.spriteW, p.spriteH);
                            setEditingId(null);
                          }}
                          className="border-neutral-700 text-[10px]"
                        >
                          REVERT
                        </Button>
                        <span className="text-[10px] text-neutral-500 self-center">
                          live in the 3D temple right now — walk out and see it breathe
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="text-center text-[10px] text-neutral-600 tracking-widest pb-4">
          ✦ NEED THE FULL RITUAL? THE SPRITE ACADEMY TEACHES THE 9-ANGLE CRAFT ✦
        </div>
      </div>
    </div>
  );
}
