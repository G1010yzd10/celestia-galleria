"use client";

import { useEffect, useRef, useState } from "react";
import { useShop } from "@/lib/store";

// ─── PHOTO MODE — the VOIDCAM's viewfinder, live in the mall ────────────────
// Frame brackets, REC pulse, frame counter, and the gallery strip of shots
// (click any shot to download the PNG).

export function PhotoMode() {
  const photos = useShop((s) => s.photos);
  const addPhoto = useShop((s) => s.addPhoto);
  const [flash, setFlash] = useState(0);
  const countRef = useRef(photos.length);

  // a fresh frame landed — flash the sensor
  useEffect(() => {
    if (photos.length > countRef.current) {
      setFlash((f) => f + 1);
    }
    countRef.current = photos.length;
  }, [photos.length]);

  const download = (dataUrl: string, i: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `celestia-galleria-${Date.now()}-${i}.png`;
    a.click();
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none">
      {/* viewfinder frame brackets */}
      <div className="absolute inset-4 md:inset-10 border border-teal-200/25" />
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-teal-200/80" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-teal-200/80" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-teal-200/80" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-teal-200/80" />

      {/* center reticle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-10 h-10 border border-teal-200/50 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-teal-300/90 rounded-full" />
        </div>
      </div>

      {/* REC + counter */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-teal-200/90">
        <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
        VOIDCAM X9 · F/0.95
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.25em] text-teal-200/80">
        FRAME {String(photos.length).padStart(3, "0")} · [CLICK / E] SHUTTER · [Q] LOWER CAMERA
      </div>

      {/* shutter flash */}
      {flash > 0 && (
        <div
          key={flash}
          className="absolute inset-0 bg-white animate-[photoflash_0.4s_ease-out_forwards]"
        />
      )}

      {/* gallery strip — click to download */}
      {photos.length > 0 && (
        <div className="absolute bottom-8 right-6 flex flex-col gap-2 pointer-events-auto">
          <div className="font-mono text-[9px] tracking-[0.25em] text-neutral-400 text-right">
            SHOTS · CLICK TO KEEP
          </div>
          <div className="flex gap-2">
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={() => download(p, i)}
                className="w-16 h-10 md:w-20 md:h-[52px] border border-amber-400/60 overflow-hidden hover:border-amber-300 transition-colors shadow-lg shadow-black/50"
                aria-label={`Download photo ${i + 1}`}
                title="DOWNLOAD PNG"
              >
                <img src={p} alt={`Temple shot ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
