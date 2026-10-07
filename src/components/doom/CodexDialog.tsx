"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShop } from "@/lib/store";

// ─── THE SERAPH CODEX — the SERAPH BOOK's readable overlay ──────────────────
// Open the laptop in the Sanctum and it actually opens.

export function CodexDialog() {
  const reading = useShop((s) => s.readingSpec);
  const setReading = useShop((s) => s.setReadingSpec);

  return (
    <Dialog open={!!reading} onOpenChange={(b) => !b && setReading(null)}>
      <DialogContent className="max-w-lg bg-[#0d1416] border-2 border-teal-800/60 font-mono text-neutral-200 max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-teal-300 font-black tracking-widest text-base">
            ✦ THE SERAPH CODEX
          </DialogTitle>
          <div className="text-[10px] text-neutral-500 tracking-[0.25em]">
            SERAPH BOOK 16 · 1600 NITS · 120 HZ
          </div>
        </DialogHeader>

        <div className="text-xs space-y-4 leading-relaxed">
          <section>
            <h3 className="text-teal-200 font-bold tracking-widest text-[11px] mb-1.5">ON THE METHOD</h3>
            <p className="text-neutral-400">
              Every relic in this mall is a <span className="text-amber-300">9-angle sprite imposter</span> —
              the trick the old Doom engines used to fake 3D in 4 MB. Each product is rendered from nine
              bearings, 40° apart, then flattened into one PNG strip. The temple draws them as billboards
              that swap frames as you orbit. The geometry is thrown away; only the light remains.
            </p>
          </section>

          <section>
            <h3 className="text-teal-200 font-bold tracking-widest text-[11px] mb-1.5">ON THE MALL</h3>
            <p className="text-neutral-400">
              Forty-three meters of celestial retail: the <span className="text-amber-300">Forge Gallery</span> in
              the north (your own uploaded sprites take its shrines), the <span className="text-amber-300">Grand
              Atrium</span> around the lagoon, the <span className="text-amber-300">Garden &amp; Audio</span> and{" "}
              <span className="text-amber-300">Vision</span> wings, and the{" "}
              <span className="text-amber-300">Sanctum</span> in the south — where everything you buy takes
              flesh, stands on a golden plinth, and <em>works</em>.
            </p>
          </section>

          <section>
            <h3 className="text-teal-200 font-bold tracking-widest text-[11px] mb-1.5">ON THE RITES</h3>
            <div className="grid grid-cols-1 gap-1.5 text-neutral-400">
              <div><span className="text-amber-300">SIT</span> — sofas &amp; benches hold you (E to stand)</div>
              <div><span className="text-amber-300">SHOOT</span> — the VOIDCAM saves PNGs of the mall</div>
              <div><span className="text-amber-300">SIP</span> — the HALO MUG blesses your speed</div>
              <div><span className="text-amber-300">EQUIP</span> — CLOUDSTEP gives +25% pace forever</div>
              <div><span className="text-amber-300">CARRY</span> — R picks up owned relics, E places them anywhere</div>
              <div><span className="text-amber-300">ASCEND</span> — SERAPH WINGS lift you above the temple</div>
              <div><span className="text-amber-300">RITE</span> — bring a loaded cart to the golden altar</div>
            </div>
          </section>

          <section>
            <h3 className="text-teal-200 font-bold tracking-widest text-[11px] mb-1.5">ON THE KEYS</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-neutral-400">
              <div><span className="text-amber-300">WASD</span> walk</div>
              <div><span className="text-amber-300">SHIFT</span> run</div>
              <div><span className="text-amber-300">E</span> interact / use</div>
              <div><span className="text-amber-300">R</span> carry / place</div>
              <div><span className="text-amber-300">Q</span> lower camera / stand</div>
              <div><span className="text-amber-300">G</span> settings</div>
            </div>
          </section>

          <p className="text-[10px] text-neutral-600 border-t border-neutral-800 pt-3">
            node:sqlite · zero downloads · every megabyte tracked on the HUD ·
            the budget was broken on purpose.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
