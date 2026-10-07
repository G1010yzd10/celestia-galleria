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
import { SettingsDialog } from "./SettingsDialog";
import { PhotoMode } from "./PhotoMode";
import { CeremonyOverlay } from "./CeremonyOverlay";
import { CodexDialog } from "./CodexDialog";
import { loadImage, toCanvas } from "@/lib/doom/forge";
import { postCheckout, fetchInventory } from "@/lib/checkout";
import type { CustomProductJSON } from "@/app/api/products/route";
import type { CartItem } from "@/lib/doom/types";
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
  const clearCart = useShop((s) => s.clearCart);
  const setLastOrder = useShop((s) => s.setLastOrder);
  const setCeremony = useShop((s) => s.setCeremony);
  const setZoneBanner = useShop((s) => s.setZoneBanner);
  const setPhotoMode = useShop((s) => s.setPhotoMode);
  const addPhoto = useShop((s) => s.addPhoto);
  const setReadingSpec = useShop((s) => s.setReadingSpec);
  const settingsOpen = useShop((s) => s.settingsOpen);
  const setSettingsOpen = useShop((s) => s.setSettingsOpen);
  const stats = useShop((s) => s.stats);
  const zoneBanner = useShop((s) => s.zoneBanner);

  const [assetOpen, setAssetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pendingImage, setPendingImage] = useState<HTMLImageElement | null>(null);
  const [forgeOpen, setForgeOpen] = useState(false);
  const [academyOpen, setAcademyOpen] = useState(false);

  const paused =
    !!selected || cartOpen || assetOpen || helpOpen || forgeOpen || academyOpen || settingsOpen || !!useShop.getState().readingSpec;

  // ── shared checkout: the drawer button AND the altar rite land here ──
  const runCheckout = useCallback(
    async (items: CartItem[]) => {
      const eng = engineRef.current;
      if (!eng || items.length === 0) return;
      const r = await postCheckout(items);
      if (!r.ok || !r.orderId) {
        setToastMsg(r.error ?? "CHECKOUT FAILED");
        setTimeout(() => setToastMsg(null), 2600);
        return;
      }
      // the ceremony: light column, thumbs, choir, invoice from heaven
      eng.ceremony();
      setCeremony({ orderId: r.orderId, total: r.total ?? 0 });
      setLastOrder({ orderId: r.orderId, total: r.total ?? 0 });
      clearCart();
      // deliver: new relics take flesh in the Sanctum
      deliverNewOwned(eng).catch(() => {});
    },
    [clearCart, setCeremony, setLastOrder, setToastMsg]
  );

  // ── inventory → living props (shared by boot + every checkout) ──
  const deliverNewOwned = useCallback(async (eng: DoomEngine) => {
    try {
      const inv = await fetchInventory();
      const ids = Object.keys(inv);
      let delivered = 0;
      // fetch custom products once if any owned id is a Forge relic
      const customs = new Map<string, CustomProductJSON>();
      const unknown = ids.filter((id) => !eng.specById(id));
      if (unknown.length > 0) {
        try {
          const r = await fetch("/api/products");
          const j = await r.json();
          if (j?.ok) {
            for (const p of j.products as CustomProductJSON[]) customs.set(p.id, p);
          }
        } catch {
          /* forge ledger offline */
        }
      }
      for (const id of ids) {
        if (eng.hasOwned(id)) continue;
        const spec = eng.specById(id);
        if (spec) {
          if (eng.spawnOwned(spec)) delivered++;
          continue;
        }
        const custom = customs.get(id);
        if (custom) {
          try {
            const img = await loadImage(custom.spriteUrl);
            if (eng.spawnOwned(specFromJSON(custom), toCanvas(img))) delivered++;
          } catch {
            /* missing atlas */
          }
        }
      }
      if (delivered > 0) {
        setToastMsg(`${delivered} RELIC${delivered === 1 ? "" : "S"} DELIVERED TO THE SANCTUM`);
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      /* inventory offline */
    }
  }, [setToastMsg]);

  // ── engine lifecycle (StrictMode-safe: full dispose on unmount) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const eng = new DoomEngine(canvas, {
      onStats: setStats,
      onPrompt: (p) => setPrompt(p),
      onSelect: (spec) => setSelected(spec),
      onAltarRite: () => {
        const items = useShop.getState().cart;
        runCheckout(items);
      },
      onPhotoMode: (on) => setPhotoMode(on),
      onPhoto: (dataUrl) => addPhoto(dataUrl),
      onRead: (spec) => setReadingSpec(spec),
      onUseToast: (text) => {
        setToastMsg(text);
        setTimeout(() => setToastMsg(null), 3200);
      },
      onZone: (zone) => {
        if (!zone) return;
        setZoneBanner(zone);
      },
    });
    engineRef.current = eng;
    setEngine(eng);
    eng.start();

    // ── restore persisted Forge relics + owned Sanctum relics (SQLite → 3D) ──
    (async () => {
      try {
        const r = await fetch("/api/products");
        const j = await r.json();
        if (j?.ok) {
          for (const p of j.products as CustomProductJSON[]) {
            try {
              const img = await loadImage(p.spriteUrl);
              eng.addCustomProduct(specFromJSON(p), toCanvas(img));
            } catch {
              /* one missing atlas shouldn't stop the procession */
            }
          }
        }
      } catch {
        /* API offline — the core temple still stands */
      }
      // the Sanctum: relics you own take their plinths
      await deliverNewOwned(eng);
      eng.applySavedLayout();
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

  // cart → floating tags + altar rite availability
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    for (const item of cart) eng.updateCartQty(item.id, item.qty);
    eng.setCartCount(cart.reduce((a, c) => a + c.qty, 0));
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

  // zone banner auto-fade
  useEffect(() => {
    if (!zoneBanner) return;
    const t = setTimeout(() => setZoneBanner(null), 2600);
    return () => clearTimeout(t);
  }, [zoneBanner]);

  // G hotkey → settings
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "g" && !paused) {
        e.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, paused, setSettingsOpen]);

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
        aria-label="3D mall viewport — use WASD to move"
      />

      {/* CRT scanlines + vignette (toggleable via settings grade) */}
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

          {/* zone banner — entering a named hall of the mall */}
          {zoneBanner && (
            <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-20 font-mono">
              <div className="zone-banner px-8 py-2 border-y border-amber-300/50 bg-black/45 backdrop-blur-[2px] text-center">
                <div className="text-sm md:text-lg tracking-[0.45em] text-amber-100 font-bold whitespace-nowrap">
                  {zoneBanner}
                </div>
              </div>
            </div>
          )}

          {/* interact prompt — INSPECT / USE / SIT / ALTAR / PLACE / STAND */}
          {prompt && !selected && !cartOpen && !settingsOpen && (
            <div className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 z-20 font-mono">
              <div
                className={`px-3 py-1.5 bg-black/70 border text-xs tracking-widest animate-pulse ${
                  prompt.kind === "altar"
                    ? "border-amber-300 text-amber-200 shadow-[0_0_24px_rgba(255,200,100,0.5)]"
                    : prompt.kind === "use" || prompt.kind === "sit"
                      ? "border-teal-400/70 text-teal-100"
                      : "border-amber-400/70 text-amber-100"
                }`}
              >
                <span className="text-amber-300 font-black">[E]</span> {prompt.verb}
                {prompt.kind === "use" && (
                  <span className="text-neutral-500"> · [R] CARRY</span>
                )}
              </div>
            </div>
          )}

          {/* buff chips — CLOUDSTEP / BLESSED / AURORA / ASCENDING */}
          {stats.buffs.length > 0 && (
            <div className="pointer-events-none absolute left-2 bottom-24 md:bottom-28 z-20 flex flex-col gap-1 font-mono">
              {stats.buffs.map((b, i) => (
                <div
                  key={i}
                  className="buff-chip px-2 py-1 text-[9px] tracking-[0.2em] text-teal-200 border border-teal-500/50 bg-black/60"
                >
                  ✦ {b.label}
                  {b.sec > 0 && <span className="text-amber-300 ml-1 tabular-nums">{Math.ceil(b.sec)}s</span>}
                </div>
              ))}
            </div>
          )}

          {/* automap */}
          <div className="absolute right-2 top-2 z-20">
            <Minimap engine={engine} />
          </div>

          {/* zone label under the automap */}
          <div className="absolute right-2 top-[124px] md:top-[164px] z-20 font-mono pointer-events-none">
            <div className="text-[9px] tracking-[0.3em] text-amber-200/80 bg-black/50 px-2 py-0.5 border border-amber-900/50">
              {stats.zone || "THE MALL"}
            </div>
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
            onSettings={() => setSettingsOpen(true)}
          />

          {/* toast */}
          {toastMsg && (
            <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 z-40 font-mono">
              <div className="px-4 py-2 bg-black/85 border-2 border-amber-400 text-amber-200 text-xs md:text-sm font-bold tracking-widest shadow-[0_0_24px_rgba(255,208,120,0.4)]">
                {toastMsg}
              </div>
            </div>
          )}

          {/* photo mode viewfinder + gallery */}
          {useShop.getState().photoMode && <PhotoMode />}
        </>
      )}

      {/* purchase ceremony — light floods the mall */}
      <CeremonyOverlay />

      {/* the SERAPH BOOK opens the Codex */}
      <CodexDialog />

      <ProductDialog onPick={() => engineRef.current?.audio.pickup()} spriteSheetUrl={spriteSheetUrl} />
      <CartDrawer onCheckout={runCheckout} />
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
      <SettingsDialog
        engine={engine}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {/* help dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm bg-[#120d06] border-2 border-amber-800/70 font-mono text-neutral-300">
          <DialogHeader>
            <DialogTitle className="text-amber-300 font-black tracking-widest text-base">
              PILGRIM'S MANUAL — v2.0
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs space-y-2 leading-relaxed">
            <p>
              <span className="text-amber-400">WASD / ARROWS</span> move ·{" "}
              <span className="text-amber-400">SHIFT</span> run ·{" "}
              <span className="text-amber-400">MOUSE</span> look (click to lock)
            </p>
            <p>
              <span className="text-amber-400">E</span> inspect · use owned relics · sit ·
              begin the altar rite · place carried relics
            </p>
            <p>
              <span className="text-amber-400">R</span> pick up an owned relic (carry it
              anywhere) · <span className="text-amber-400">Q</span> stand / lower the camera ·{" "}
              <span className="text-amber-400">G</span> settings
            </p>
            <p>
              <span className="text-amber-400">TOUCH</span> left stick moves · drag right side
              looks · tap <span className="text-amber-400">E</span> interacts
            </p>
            <p className="text-neutral-500 pt-2 border-t border-neutral-800">
              The mall is 43 meters of Doom-method sprite retail. Everything you buy is
              delivered to <span className="text-amber-300">THE SANCTUM</span> in the south —
              sofas you can sit on, a camera that shoots real PNGs, wings that lift you over
              the lagoon. Bring a loaded cart to the golden altar for the full purchase rite.
              The marble is a true planar mirror, the lagoon drinks it too, and the walls?
              You can finally touch them.
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
