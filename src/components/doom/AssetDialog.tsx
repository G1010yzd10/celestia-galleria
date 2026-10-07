"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CATALOG } from "@/lib/doom/products";
import type { DoomEngine } from "@/lib/doom/engine";

// ─── Asset pipeline — 9-frame sprite sheets in, 3D shop products out ───────

export interface DropPayload {
  img: HTMLImageElement;
}

export function AssetDialog({
  open,
  onOpenChange,
  engine,
  pendingImage,
  onConsumePending,
  onToast,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  engine: DoomEngine | null;
  pendingImage: HTMLImageElement | null;
  onConsumePending: () => void;
  onToast: (msg: string) => void;
}) {
  const [target, setTarget] = useState<string | null>(null);

  const downloadSheet = (id: string) => {
    if (!engine) return;
    const url = engine.exportSheet(id);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `celestia-${id}-9angle-reference.png`;
    a.click();
    onToast(`REFERENCE SHEET FOR ${id.toUpperCase()} EXPORTED`);
  };

  const apply = (id: string) => {
    if (!engine || !pendingImage) return;
    const ok = engine.applySpriteSheet(id, pendingImage);
    if (ok) {
      onToast(`CUSTOM SPRITE SHEET APPLIED TO ${id.toUpperCase()}`);
      onConsumePending();
      setTarget(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-[#0b0e12] border-2 border-teal-800 font-mono text-neutral-200 [&>button]:border-neutral-600 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-widest text-teal-300">
            🖼 ASSET PIPELINE
          </DialogTitle>
          <div className="text-[10px] text-neutral-500 tracking-[0.25em]">
            2D SPRITE SHEETS → LIVE 3D SHOP
          </div>
        </DialogHeader>

        {pendingImage ? (
          <div className="space-y-3">
            <div className="border border-amber-700/70 bg-amber-950/30 p-3">
              <div className="text-amber-300 text-sm font-bold tracking-wider">
                SPRITE SHEET RECEIVED
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                {pendingImage.width}×{pendingImage.height}px — sliced into 9 frames of{" "}
                {Math.round(pendingImage.width / 9)}px.
              </div>
              <img
                src={pendingImage.src}
                alt="Dropped 9-frame sprite sheet preview"
                className="mt-2 w-full border border-neutral-700 bg-[repeating-conic-gradient(#1a1a1a_0%_25%,#111_0%_50%)] bg-[length:16px_16px]"
              />
            </div>
            <div className="text-xs text-neutral-400">APPLY TO WHICH PRODUCT?</div>
            <div className="grid grid-cols-2 gap-2">
              {CATALOG.map((p) => (
                <Button
                  key={p.id}
                  variant="outline"
                  onClick={() => apply(p.id)}
                  className={`h-auto py-2 justify-start text-left border-neutral-700 hover:border-teal-500 hover:bg-teal-950/40 ${
                    target === p.id ? "border-teal-500" : ""
                  }`}
                >
                  <span className="text-xs font-bold text-teal-200">{p.name}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-neutral-800 bg-black/50 p-4 text-xs leading-relaxed text-neutral-300 space-y-2">
              <div className="text-teal-300 font-bold tracking-wider text-sm">
                THE 9-ANGLE SPEC (DOOM METHOD)
              </div>
              <p>
                Every product is a single PNG strip of{" "}
                <span className="text-amber-400">9 square frames side by side</span>, one
                per <span className="text-amber-400">40° of rotation</span> (9 × 40° = 360°).
                Frame 1 shows the front, frames 2-9 circle clockwise. Transparent
                background, subject centered, feet at the bottom edge.
              </p>
              <p className="text-neutral-500">
                Recommended ≥ 432×48 (9 × 48px frames). Larger is fine — the engine
                reslices. Think Doom sprites: photo-real renders, AI renders, or hand-drawn
                art all work.
              </p>
            </div>

            <div className="border-2 border-dashed border-teal-800 rounded p-6 text-center">
              <div className="text-3xl mb-2">📥</div>
              <div className="text-sm text-teal-300 font-bold tracking-wider">
                DRAG &amp; DROP A PNG ANYWHERE ON THE SHOP
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">
                The sheet will be sliced live and replace any product instantly —
                no reload, no rebuild.
              </div>
            </div>

            <div>
              <div className="text-xs text-neutral-400 mb-2 tracking-wider">
                EXPORT BAKED REFERENCE SHEETS (LOAD THEM IN YOUR 2D EDITOR):
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CATALOG.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    size="sm"
                    onClick={() => downloadSheet(p.id)}
                    className="justify-start border-neutral-700 hover:border-amber-500 hover:bg-amber-950/30 text-[11px]"
                  >
                    ⇩ {p.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
