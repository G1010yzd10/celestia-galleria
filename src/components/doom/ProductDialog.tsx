"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useShop } from "@/lib/store";

export function ProductDialog({
  onPick,
  spriteSheetUrl,
}: {
  onPick?: (id: string) => void;
  /** live 9-frame atlas PNG — shown rotating, Doom showcase style */
  spriteSheetUrl?: string | null;
}) {
  const selected = useShop((s) => s.selected);
  const setSelected = useShop((s) => s.setSelected);
  const addToCart = useShop((s) => s.addToCart);
  const setToastMsg = useShop((s) => s.setToastMsg);
  const cart = useShop((s) => s.cart);
  const [qty, setQtyLocal] = useState(1);

  if (!selected) return null;
  const inCart = cart.find((c) => c.id === selected.id)?.qty ?? 0;
  const accent = `#${selected.accent.toString(16).padStart(6, "0")}`;

  return (
    <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
      <DialogContent className="max-w-lg bg-[#0b0e12] border-2 border-neutral-700 font-mono text-neutral-200 [&>button]:border-neutral-600">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle
              className="text-xl md:text-2xl font-black tracking-wider"
              style={{ color: accent, textShadow: `0 0 18px ${accent}55` }}
            >
              {selected.name}
            </DialogTitle>
            <Badge
              variant="outline"
              className="border-teal-700 text-teal-300 tracking-widest text-[10px]"
            >
              {selected.category}
            </Badge>
            {inCart > 0 && (
              <Badge className="bg-amber-600 text-black font-bold tracking-widest text-[10px]">
                ×{inCart} IN CART
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* live 9-angle rotation — the Doom sprite, spinning in its shrine */}
        {spriteSheetUrl && (
          <div className="relative h-32 md:h-40 overflow-hidden border border-neutral-700 bg-[repeating-conic-gradient(#18181b_0%_25%,#101012_0%_50%)] bg-[length:18px_18px]">
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ boxShadow: `inset 0 0 60px ${accent}22` }}
            >
              {/* one 9-frame strip stepped left 1/9 at a time = rotation */}
              <img
                key={selected.id}
                src={spriteSheetUrl}
                alt={`${selected.name} 9-angle sprite rotation`}
                className="sprite-rotate h-[85%] w-[900%] max-w-none object-contain object-left"
                style={{ filter: `drop-shadow(0 10px 14px rgba(0,0,0,0.55))` }}
              />
            </div>
            <div className="absolute bottom-1 right-2 text-[9px] font-mono text-neutral-500 tracking-widest">
              LIVE 9-ANGLE ROTATION
            </div>
          </div>
        )}

        <div
          className="border border-neutral-700 bg-black/60 p-3 text-xs md:text-sm leading-relaxed text-neutral-300"
          style={{ boxShadow: `inset 0 0 40px ${accent}11` }}
        >
          {selected.blurb}
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[10px] md:text-xs">
          {selected.specs.map((s) => (
            <div
              key={s}
              className="flex items-center gap-2 border border-neutral-800 bg-neutral-900/60 px-2 py-1.5 text-teal-200/90"
            >
              <span className="text-amber-500">▸</span>
              {s}
            </div>
          ))}
        </div>

        <Separator className="bg-neutral-800" />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] text-neutral-500 tracking-[0.3em]">PRICE</div>
            <div
              className="text-3xl font-black tabular-nums text-amber-400"
              style={{ textShadow: "0 0 14px rgba(251,191,36,0.5)" }}
            >
              {selected.price.toLocaleString()}
              <span className="text-sm text-neutral-500 ml-1">CRED</span>
            </div>
            <div
              className="text-[10px] text-teal-300/90 tabular-nums mt-1 tracking-wider"
              title="World size on the shrine — set in the Sprite Forge"
            >
              ⤢ WORLD SIZE {selected.spriteW.toFixed(2)}m × {selected.spriteH.toFixed(2)}m
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-neutral-700 bg-black/50">
              <button
                className="px-3 py-2 text-lg text-neutral-300 hover:text-white"
                onClick={() => setQtyLocal(Math.max(1, qty - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center text-xl font-bold tabular-nums">{qty}</span>
              <button
                className="px-3 py-2 text-lg text-neutral-300 hover:text-white"
                onClick={() => setQtyLocal(Math.min(9, qty + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <Button
              onClick={() => {
                for (let i = 0; i < qty; i++) addToCart(selected);
                onPick?.(selected.id);
                setToastMsg(`${selected.name} ×${qty} ADDED TO CART`);
                setTimeout(() => setToastMsg(null), 2200);
                setSelected(null);
                setQtyLocal(1);
              }}
              className="h-12 px-6 font-bold tracking-widest border-2 border-amber-400 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 hover:to-amber-500 !text-[#241304]"
            >
              ✦ ADD TO CART
            </Button>
          </div>
        </div>

        <div className="text-[10px] text-neutral-600 tracking-wider">
          RENDERED AS 9-ANGLE SPRITE IMPOSTER · CELESTIA VERIFIED
        </div>
      </DialogContent>
    </Dialog>
  );
}
