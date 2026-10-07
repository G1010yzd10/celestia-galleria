"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DoomEngine } from "@/lib/doom/engine";
import { useShop } from "@/lib/store";
import { TitleScreen } from "./TitleScreen";
import { HudBar } from "./HudBar";
import { Minimap } from "./Minimap";
import { ProductDialog } from "./ProductDialog";
import { CartDrawer } from "./CartDrawer";
import { TouchControls } from "./TouchControls";
import { AssetDialog } from "./AssetDialog";
import { Forge, specFromJSON } from "./Forge";
import { Academy } from "./Academy";
import { loadImage, toCanvas } from "@/lib/doom/forge";
import type { CustomProductJSON } from "@/app/api/products/route";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DoomShop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<DoomEngine | null>(null);
  const [engine, setEngine] = useState<DoomEngine | null>(null);

  const started = useShop((s) => s.started);
  const setStarted = useShop((s) => s.setStarted);
  const setStats = useShop((s) => s.setStats);
  const setPrompt = useShop((s) => s.setPrompt);
  const setSelected = useShop((s) => s.setSelected);
  const prompt = useShop((s) => s.prompt);
  const selected = useShop((s) => s.selected);
  const cartOpen = useShop((s) => s.cartOpen);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const soundOn = useShop((s) => s.soundOn);
  const setSoundOn = useShop((s) => s.setSoundOn);
  const toastMsg = useShop((s) => s.toastMsg);
  const setToastMsg = useShop((s) => s.setToastMsg);
  const cart = useShop((s) => s.cart);

  const [assetOpen, setAssetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingImage, setPendingImage] = useState<HTMLImageElement | null>(null);
  const [forgeOpen, setForgeOpen] = useState(false);
  const [academyOpen, setAcademyOpen] = useState(false);

  const paused = !!selected || cartOpen || assetOpen || helpOpen || forgeOpen || academyOpen;

  // ── engine lifecycle (StrictMode-safe: full dispose on unmount) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const eng = new DoomEngine(canvas, {
      onStats: setStats,
      onPrompt: setPrompt,
      onSelect: (spec) => setSelected(spec),
    });
    engineRef.current = eng;
    setEngine(eng);
    eng.start();

    // ── restore persisted Forge relics onto their shrines (SQLite → 3D) ──
    (async () => {
      try {
        const r = await fetch("/api/products");
        const j = await r.json();
        if (!j?.ok) return;
        for (const p of j.products as CustomProductJSON[]) {
          try {
            const img = await loadImage(p.spriteUrl);
            eng.addCustomProduct(specFromJSON(p), toCanvas(img));
          } catch {
            /* one missing atlas shouldn't stop the procession */
          }
        }
      } catch {
        /* API offline — the core temple still stands */
      }
    })();

    return () => {
      eng.dispose();
      engineRef.current = null;
      setEngine(null);
    };
    
  }, []);

  // pause engine while any modal is open
  useEffect(() => {
    engineRef.current?.setPaused(paused || !started);
  }, [paused, started]);

  // sound flag
  useEffect(() => {
    engineRef.current?.setSound(soundOn);
  }, [soundOn]);

  // cart qty → floating tags
  useEffect(() => {
    for (const item of cart) {
      engineRef.current?.updateCartQty(item.id, item.qty);
    }
  }, [cart]);

  // restore persisted cart into tags (migrated from the DOOM MART key)
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("celestia-cart") ?? localStorage.getItem("doommart-cart");
      if (raw) {
        const items = JSON.parse(raw) as { id: string; qty: number }[];
        for (const it of items) engineRef.current?.updateCartQty(it.id, it.qty);
      }
    } catch {
      /* noop */
    }
  }, [engine]);

  // live 9-angle atlas for the inspect dialog (Doom showcase rotation)
  const spriteSheetUrl = useMemo(
    () => (engine && selected ? engine.exportSheet(selected.id) : null),
    [engine, selected]
  );

  const enterShop = useCallback(() => {
    setStarted(true);
    engineRef.current?.audio.unlock();
    engineRef.current?.audio.setEnabled(soundOn);
    canvasRef.current?.focus();
  }, [setStarted, soundOn]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        setToastMsg("NOT AN IMAGE FILE — PNG EXPECTED");
        setTimeout(() => setToastMsg(null), 2400);
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (img.width < 9 * 8) {
          setToastMsg("SHEET TOO SMALL — NEEDS 9 FRAMES");
          setTimeout(() => setToastMsg(null), 2400);
          URL.revokeObjectURL(url);
          return;
        }
        setPendingImage(img);
        setAssetOpen(true);
      };
      img.onerror = () => {
        setToastMsg("COULD NOT READ IMAGE");
        setTimeout(() => setToastMsg(null), 2400);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [setToastMsg]
  );

  const interact = useCallback(() => {
    engineRef.current?.interactNow();
  }, []);

  const checkoutSound = useCallback(() => {
    engineRef.current?.audio.checkout();
    engineRef.current?.celebrate(); // bloom + light swell through the temple
  }, []);

  const pickupSound = useCallback(() => {
    engineRef.current?.audio.pickup();
  }, []);

  const toast = useCallback(
    (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 2400);
    },
    [setToastMsg]
  );

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none outline-none cursor-crosshair"
        aria-label="3D shop viewport — use WASD to move"
      />

      {/* CRT scanlines + vignette */}
      <div className="pointer-events-none absolute inset-0 scanlines" />
      <div className="pointer-events-none absolute inset-0 vignette" />

      {!started && (
        <TitleScreen
          onEnter={enterShop}
          onForge={() => setForgeOpen(true)}
          onAcademy={() => setAcademyOpen(true)}
        />
      )}

      {started && (
        <>
          {/* crosshair */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-5 h-5 relative opacity-80">
              <div className="absolute left-1/2 top-0 w-[2px] h-1.5 -translate-x-1/2 bg-amber-200/90" />
              <div className="absolute left-1/2 bottom-0 w-[2px] h-1.5 -translate-x-1/2 bg-amber-200/90" />
              <div className="absolute top-1/2 left-0 h-[2px] w-1.5 -translate-y-1/2 bg-amber-200/90" />
              <div className="absolute top-1/2 right-0 h-[2px] w-1.5 -translate-y-1/2 bg-amber-200/90" />
              <div className="absolute left-1/2 top-1/2 w-[3px] h-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300" />
            </div>
          </div>

          {/* interact prompt */}
          {prompt && !selected && !cartOpen && (
            <div className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 z-20 font-mono">
              <div className="px-3 py-1.5 bg-black/70 border border-amber-400/70 text-amber-100 text-xs tracking-widest animate-pulse">
                <span className="text-amber-300 font-black">[E]</span> INSPECT {prompt.name}
              </div>
            </div>
          )}

          {/* automap */}
          <div className="absolute right-2 top-2 z-20">
            <Minimap engine={engine} />
          </div>

          <TouchControls
            onMove={(x, y) => engineRef.current?.setMoveInput(x, y)}
            onInteract={interact}
            onCart={() => setCartOpen(true)}
          />

          <HudBar
            onCart={() => setCartOpen(true)}
            onAssets={() => setAssetOpen(true)}
            onHelp={() => setHelpOpen(true)}
            onForge={() => setForgeOpen(true)}
            onAcademy={() => setAcademyOpen(true)}
          />

          {/* toast */}
          {toastMsg && (
            <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 z-40 font-mono">
              <div className="px-4 py-2 bg-black/85 border-2 border-amber-400 text-amber-200 text-xs md:text-sm font-bold tracking-widest shadow-[0_0_24px_rgba(255,208,120,0.4)]">
                {toastMsg}
              </div>
            </div>
          )}
        </>
      )}

      <ProductDialog onPick={pickupSound} spriteSheetUrl={spriteSheetUrl} />
      <CartDrawer onCheckoutSound={checkoutSound} />
      <AssetDialog
        open={assetOpen}
        onOpenChange={setAssetOpen}
        engine={engine}
        pendingImage={pendingImage}
        onConsumePending={() => setPendingImage(null)}
        onToast={toast}
        onForge={() => {
          setAssetOpen(false);
          setForgeOpen(true);
        }}
      />
      <Forge
        open={forgeOpen}
        onOpenChange={setForgeOpen}
        engine={engine}
        onToast={toast}
      />
      <Academy
        open={academyOpen}
        onOpenChange={setAcademyOpen}
        onOpenForge={() => {
          setAcademyOpen(false);
          setForgeOpen(true);
        }}
      />

      {/* help dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm bg-[#120d06] border-2 border-amber-800/70 font-mono text-neutral-300">
          <DialogHeader>
            <DialogTitle className="text-amber-300 font-black tracking-widest text-base">
              PILGRIM'S MANUAL
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs space-y-2 leading-relaxed">
            <p>
              <span className="text-amber-400">WASD / ARROWS</span> move ·{" "}
              <span className="text-amber-400">SHIFT</span> run ·{" "}
              <span className="text-amber-400">MOUSE</span> look (click to lock)
            </p>
            <p>
              <span className="text-amber-400">E</span> or{" "}
              <span className="text-amber-400">CLICK</span> inspect the haloed product
            </p>
            <p>
              <span className="text-amber-400">TOUCH</span> left stick moves · drag right
              side looks · tap <span className="text-amber-400">E</span> inspects
            </p>
            <p className="text-neutral-500 pt-2 border-t border-neutral-800">
              The turquoise lagoon is animated shader water that mirrors the real
              temple — god rays fall through the open oculus, the marble floor is a
              true planar mirror, and the gilded reliquary crates drink the sky's
              reflection. Every product is a 9-angle sprite imposter with a golden
              halo: orbit a pedestal to see it rotate through its 9 baked views,
              Doom-style. The 4 MB budget was broken on purpose — the HUD keeps
              honest count of every glorious megabyte.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* drag-over overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 bg-black/70 border-4 border-dashed border-amber-400 flex items-center justify-center pointer-events-none">
          <div className="font-mono text-amber-200 text-xl font-black tracking-widest text-center">
            📥 DROP 9-FRAME SPRITE SHEET PNG
            <div className="text-xs text-neutral-400 font-normal mt-2 tracking-normal">
              9 square frames side-by-side · 40° apart · transparent background
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
