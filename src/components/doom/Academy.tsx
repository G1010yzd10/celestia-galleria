"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// ─── THE SPRITE ACADEMY — the 9-angle craft, taught with references ────────
// The full ritual: why 9 angles, the frame contract, three ways to author
// them (photo / render / AI), the size dial (sofa big, mug small), and the
// upload walkthrough. Every diagram lives here as crisp SVG; the AI-painted
// references illustrate the vibe.

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-neutral-800 bg-black/40 p-4 md:p-5 space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="text-amber-500 text-lg font-black tabular-nums">{n}</span>
        <h3 className="text-amber-200 text-base md:text-lg font-bold tracking-widest">{title}</h3>
      </div>
      {children}
    </section>
  );
}

/** the engine's atlas contract, drawn precisely */
function StripDiagram() {
  const labels = ["0° FRONT", "40°", "80°", "120°", "160°", "200°", "240°", "280°", "320°"];
  return (
    <svg viewBox="0 0 920 190" className="w-full border border-neutral-800 bg-[#0a0805]" role="img" aria-label="Nine frame strip layout, forty degrees apart">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2dd4bf" />
        </marker>
      </defs>
      {/* rotation arrow */}
      <path d="M 30 26 Q 460 -8 890 26" fill="none" stroke="#2dd4bf" strokeWidth={2} strokeDasharray="6 5" markerEnd="url(#arrow)" />
      <text x={460} y={18} fontSize={13} fill="#2dd4bf" fontFamily="monospace" textAnchor="middle">
        PRODUCT ROTATES 40° CLOCKWISE EACH STEP (VIEWED FROM ABOVE)
      </text>
      {/* cells */}
      {labels.map((l, k) => (
        <g key={k}>
          <rect
            x={20 + k * 98}
            y={44}
            width={92}
            height={92}
            fill={k === 0 ? "#123a36" : "#151119"}
            stroke={k === 0 ? "#2dd4bf" : "#3a3f45"}
            strokeWidth={k === 0 ? 2.5 : 1.5}
          />
          {/* stand-in glyph */}
          {k === 0 ? (
            <g>
              <rect x={20 + k * 98 + 26} y={62} width={40} height={56} rx={4} fill="none" stroke="#ffd98c" strokeWidth={2} />
              <circle cx={20 + k * 98 + 46} cy={80} r={7} fill="none" stroke="#ffd98c" strokeWidth={2} />
            </g>
          ) : (
            <g opacity={0.5}>
              <rect x={20 + k * 98 + 30} y={66} width={32} height={48} rx={4} fill="none" stroke="#8a8168" strokeWidth={1.6} transform={`rotate(${Math.min(30, k * 4)} ${20 + k * 98 + 46} ${90})`} />
            </g>
          )}
          <text x={20 + k * 98 + 46} y={158} fontSize={11} fill={k === 0 ? "#2dd4bf" : "#8a8168"} fontFamily="monospace" textAnchor="middle">
            {l}
          </text>
          <text x={20 + k * 98 + 46} y={174} fontSize={9} fill="#57503a" fontFamily="monospace" textAnchor="middle">
            FRAME {k + 1}
          </text>
        </g>
      ))}
      <text x={460} y={188} fontSize={10} fill="#57503a" fontFamily="monospace" textAnchor="middle">
        ONE PNG · 9 SQUARE CELLS SIDE BY SIDE · TRANSPARENT BACKGROUND · SAME SCALE IN EVERY CELL
      </text>
    </svg>
  );
}

/** top-down turntable map — where the camera stands for each frame */
function TurntableMap() {
  const cx = 210;
  const cy = 210;
  const R = 150;
  return (
    <svg viewBox="0 0 420 420" className="w-full max-w-sm mx-auto border border-neutral-800 bg-[#0a0805]" role="img" aria-label="Top-down turntable map with nine camera positions">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#3a3f45" strokeWidth={1.5} strokeDasharray="4 6" />
      <circle cx={cx} cy={cy} r={56} fill="#12302c" stroke="#2dd4bf" strokeWidth={1.5} />
      <text x={cx} y={cy - 6} fontSize={11} fill="#2dd4bf" fontFamily="monospace" textAnchor="middle">PRODUCT</text>
      <text x={cx} y={cy + 10} fontSize={9} fill="#57503a" fontFamily="monospace" textAnchor="middle">STILL · CENTERED</text>
      {Array.from({ length: 9 }).map((_, k) => {
        const a = (k * 40 - 90) * (Math.PI / 180); // frame 1 at top, clockwise
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        return (
          <g key={k}>
            <line x1={cx + Math.cos(a) * 60} y1={cy + Math.sin(a) * 60} x2={x} y2={y} stroke={k === 0 ? "#ffd98c" : "#57503a"} strokeWidth={k === 0 ? 2 : 1} />
            <circle cx={x} cy={y} r={k === 0 ? 10 : 7} fill={k === 0 ? "#ffd98c" : "#151119"} stroke={k === 0 ? "#ffd98c" : "#8a8168"} strokeWidth={1.5} />
            <text
              x={cx + Math.cos(a) * (R + 26)}
              y={cy + Math.sin(a) * (R + 26) + 4}
              fontSize={11}
              fill={k === 0 ? "#ffd98c" : "#8a8168"}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {k === 0 ? "1·0°" : `${k + 1}·${k * 40}°`}
            </text>
          </g>
        );
      })}
      <text x={cx} y={408} fontSize={10} fill="#57503a" fontFamily="monospace" textAnchor="middle">
        SHOOT CLOCKWISE FROM ABOVE · SAME DISTANCE EVERY TIME
      </text>
    </svg>
  );
}

/** 3×3 grid input → strip mapping */
function GridMap() {
  return (
    <svg viewBox="0 0 560 170" className="w-full border border-neutral-800 bg-[#0a0805]" role="img" aria-label="Three by three grid mapping to nine frames">
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const k = row * 3 + col;
          return (
            <g key={k}>
              <rect x={16 + col * 56} y={20 + row * 44} width={50} height={38} fill="#151119" stroke={k === 0 ? "#2dd4bf" : "#3a3f45"} strokeWidth={k === 0 ? 2 : 1} />
              <text x={41 + col * 56} y={44 + row * 44} fontSize={11} fill={k === 0 ? "#2dd4bf" : "#8a8168"} fontFamily="monospace" textAnchor="middle">
                {k * 40}°
              </text>
            </g>
          );
        })
      )}
      <path d="M 200 86 L 320 86" stroke="#ffd98c" strokeWidth={2} markerEnd="url(#arrow)" />
      <text x={260} y={78} fontSize={10} fill="#ffd98c" fontFamily="monospace" textAnchor="middle">ROW BY ROW</text>
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const k = row * 3 + col;
          return (
            <g key={`s${k}`}>
              <rect x={330 + col * 56 + row * 0} y={20 + row * 44} width={50} height={38} fill="#151119" stroke="#3a3f45" strokeWidth={1} />
              <text x={355 + col * 56} y={44 + row * 44} fontSize={11} fill="#8a8168" fontFamily="monospace" textAnchor="middle">
                {k + 1}
              </text>
            </g>
          );
        })
      )}
      <text x={280} y={160} fontSize={10} fill="#57503a" fontFamily="monospace" textAnchor="middle">
        GRID CELLS FILL THE STRIP IN READING ORDER — THE FORGE SLICES IT FOR YOU
      </text>
    </svg>
  );
}

function CopyRow({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 text-[10px] md:text-xs text-teal-200 bg-[#0b0e12] border border-neutral-800 p-2 break-all leading-relaxed">
        {text}
      </code>
      <Button
        variant="outline"
        size="sm"
        className="border-neutral-700 text-[10px] shrink-0"
        onClick={() => {
          void navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
      >
        {copied ? "✓ COPIED" : "COPY"}
      </Button>
    </div>
  );
}

function RefFigure({
  src,
  caption,
  alt,
  wide,
}: {
  src: string;
  caption: string;
  alt: string;
  wide?: boolean;
}) {
  return (
    <figure className={`space-y-1.5 ${wide ? "lg:col-span-2" : ""}`}>
      <img
        src={src}
        alt={alt}
        className="w-full border border-neutral-700 bg-[#0d0d12] object-cover"
        loading="lazy"
      />
      <figcaption className="text-[10px] text-neutral-500 tracking-wider text-center">
        {caption}
      </figcaption>
    </figure>
  );
}

const SIZE_TABLE: { name: string; w: number; h: number; note: string }[] = [
  { name: "MUG", w: 0.13, h: 0.1, note: "jewel on the altar — lean in to adore it" },
  { name: "HEADPHONES", w: 0.22, h: 0.28, note: "shelf-scale display" },
  { name: "CAMERA", w: 0.35, h: 0.26, note: "counter-scale classic" },
  { name: "CONSOLE", w: 0.45, h: 0.1, note: "low slab under the halo" },
  { name: "CHAIR", w: 0.55, h: 0.95, note: "room-scale presence" },
  { name: "SOFA", w: 2.2, h: 0.85, note: "the grand monument" },
  { name: "CAR", w: 4.6, h: 1.5, note: "colossal — mind the pillars" },
];

export function Academy({
  open,
  onOpenChange,
  onOpenForge,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOpenForge: () => void;
}) {
  if (!open) return null;
  const maxW = Math.max(...SIZE_TABLE.map((s) => s.w));
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070502]/[0.97] backdrop-blur-sm font-mono text-neutral-300">
      <div className="mx-auto max-w-4xl px-3 md:px-6 py-4 md:py-8 space-y-5">
        {/* header */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-amber-900/50 pb-3">
          <div>
            <h2
              className="text-2xl md:text-4xl font-black tracking-wider"
              style={{ color: "#ffe9b8", textShadow: "0 0 18px rgba(255,214,140,0.6)" }}
            >
              🎓 THE SPRITE ACADEMY
            </h2>
            <div className="text-[10px] md:text-xs text-teal-200/80 tracking-[0.3em] mt-1">
              DRAW IT · SHOOT IT · RENDER IT — THE TEMPLE SELLS IT IN 3D
            </div>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-amber-700 hover:bg-amber-950/40">
            ✕ RETURN TO TEMPLE
          </Button>
        </div>

        {/* §1 the method */}
        <Section n="§1" title="THE DOOM METHOD — WHY 9 ANGLES">
          <p className="text-xs md:text-sm leading-relaxed text-neutral-300">
            In 1993, Doom shipped terrifying monsters on a sliver of memory: every creature was a
            handful of pre-drawn pictures — a <span className="text-amber-300">sprite</span> —
            photographed from several angles. The engine always faces you (a{" "}
            <span className="text-amber-300">billboard</span>), but as you circle it, it swaps to
            the picture that matches your bearing. Your brain does the rest: it{" "}
            <em className="text-teal-200">feels</em> like a solid 3D object. CELESTIA GALLERIA
            uses the exact same trick with nine bearings — 9 × 40° = 360° — so every product
            weighs megabytes, not gigabytes, and runs on anything with a browser.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <TurntableMap />
            <RefFigure
              src="/tutorial/ref-turntable.png"
              alt="Illustration of a product on a photography turntable with camera positions around it"
              caption="REF-01 · THE TURNTABLE MINDSET — one product, nine bearings, one fixed camera distance"
            />
          </div>
        </Section>

        {/* §2 the contract */}
        <Section n="§2" title="THE 9-FRAME CONTRACT">
          <StripDiagram />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-xs leading-relaxed">
              <p>
                <span className="text-amber-300">One PNG strip</span> — nine equal square cells
                side by side. Cell 1 is the front; each next cell is the product rotated{" "}
                <span className="text-teal-200">40° clockwise</span> (seen from above).
              </p>
              <ul className="space-y-1.5 text-neutral-400">
                <li>
                  <span className="text-amber-400">▸</span> Transparent background (PNG-32). The
                  Forge can also strip a flat white sweep for you.
                </li>
                <li>
                  <span className="text-amber-400">▸</span> Same scale &amp; center in every cell
                  — the rotation pivot must hold still.
                </li>
                <li>
                  <span className="text-amber-400">▸</span> Product fills ~70–85% of the cell
                  height, feet near the bottom edge.
                </li>
                <li>
                  <span className="text-amber-400">▸</span> Even, soft studio light — no baked
                  hard shadows under the product.
                </li>
                <li>
                  <span className="text-amber-400">▸</span> 224px cells are lean, 320px is glory;
                  bigger is fine, the Forge reslices.
                </li>
              </ul>
              <p className="text-neutral-500 text-[11px]">
                Prefer a 3×3 grid sheet? Accepted as-is — cells are read row by row.
              </p>
            </div>
            <div className="space-y-3">
              <RefFigure
                src="/tutorial/ref-sheet.png"
                alt="Example of a nine frame sprite sheet with a camera rotating forty degrees per frame"
                caption="REF-02 · A REAL SHEET — one camera, nine rotations, identical scale"
                wide={false}
              />
              <GridMap />
            </div>
          </div>
        </Section>

        {/* §3 three ways to author */}
        <Section n="§3" title="THREE WAYS TO FORGE YOUR FRAMES">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-neutral-800 p-3 space-y-2">
              <div className="text-teal-200 text-xs font-bold tracking-widest">A · PHOTOGRAPH</div>
              <ol className="text-[11px] text-neutral-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Put the product on a <span className="text-neutral-200">turntable</span> (or a sheet of paper you rotate).</li>
                <li>Camera on tripod, <span className="text-neutral-200">eye level</span>, fixed distance.</li>
                <li>Shoot, rotate 40°, repeat — 9 shots total (front first).</li>
                <li>Cut the background out (remove.bg, Photoshop, GIMP).</li>
                <li>Export 9 square PNGs, named in order.</li>
              </ol>
            </div>
            <div className="border border-neutral-800 p-3 space-y-2">
              <div className="text-teal-200 text-xs font-bold tracking-widest">B · RENDER (BLENDER)</div>
              <ol className="text-[11px] text-neutral-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Model or import your product (front faces +Y... any front you like).</li>
                <li>Camera on a circle: radius fits the object, <span className="text-neutral-200">height = object center</span>.</li>
                <li>Keyframe the camera azimuth: 0°, 40°, … 320° — 9 frames.</li>
                <li>Transparent film (RGBA), soft world light, 512²+ each.</li>
                <li>Render sequence → the Forge eats it as 9 files.</li>
              </ol>
            </div>
            <div className="border border-neutral-800 p-3 space-y-2">
              <div className="text-teal-200 text-xs font-bold tracking-widest">C · AI-GENERATE</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Modern image models draw consistent turntables surprisingly well. Generate the
                sheet on a white sweep, then let the Forge strip the background. Copy the recipe:
              </p>
              <CopyRow label="ai" text={`Product sprite sheet: one horizontal row of nine identical [YOUR PRODUCT], each rotated 40 degrees more than the previous, first frame shows the front view, pure white background, studio lighting, consistent scale and framing, sharp focus, professional product photography`} />
            </div>
          </div>
        </Section>

        {/* §4 size */}
        <Section n="§4" title="SAY THE SIZE — SOFA BIG, MUG SMALL">
          <p className="text-xs md:text-sm leading-relaxed">
            Every relic carries a <span className="text-amber-300">world size in meters</span> —
            the exact footprint it occupies on its shrine. This is the dial that sells sofas as
            monuments and mugs as jewels. Set it once in the Forge (sliders + presets + a pilgrim
            for scale), and change it any time — residents resize{" "}
            <span className="text-teal-200">live, while you walk the temple</span>.
          </p>
          <RefFigure
            src="/tutorial/ref-sizes.png"
            alt="Size comparison lineup of a mug, camera, console, chair and sofa at the same scale"
            caption="REF-03 · SAME WORLD, VERY DIFFERENT RELICS — the size dial in action"
            wide
          />
          <div className="border border-neutral-800 divide-y divide-neutral-800/70">
            {SIZE_TABLE.map((s) => (
              <div key={s.name} className="flex items-center gap-3 px-3 py-2">
                <div className="w-24 md:w-28 text-[10px] md:text-xs text-amber-200 tracking-widest shrink-0">{s.name}</div>
                <div className="flex-1 h-3 bg-[#0d0906] border border-neutral-800 overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.max(3, (s.w / maxW) * 100)}%`,
                      background: "linear-gradient(90deg, #b9862f, #ffd98c)",
                      boxShadow: "0 0 8px rgba(255,217,140,0.5)",
                    }}
                  />
                </div>
                <div className="w-32 md:w-40 text-right shrink-0">
                  <span className="text-[10px] md:text-xs text-teal-200 tabular-nums">
                    {s.w.toFixed(2)}m × {s.h.toFixed(2)}m
                  </span>
                  <div className="text-[9px] text-neutral-600 hidden md:block">{s.note}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Rule of thumb: match the real object. A 0.13 m mug sits on the pedestal like a ring in
            a display case; a 2.2 m sofa commands its whole bay. The temple clamps sizes to
            0.08 m – 6 m so nothing becomes invisible or clips the ceiling.
          </p>
        </Section>

        {/* §5 upload ritual */}
        <Section n="§5" title="THE UPLOAD RITUAL — FIVE STEPS">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] md:text-xs">
            {[
              ["1", "OPEN THE FORGE", "From the title screen or the 🛠 button on the HUD bar."],
              ["2", "FEED IT SPRITES", "Drop 9 PNGs into the angle slots — or one strip / one 3×3 grid. Toggle background removal if your art has a solid sweep."],
              ["3", "CONJURE THE ATLAS", "The Forge trims, centers and scale-locks all 9 frames into one strip. Drag the spin preview to verify every angle."],
              ["4", "SAY THE SIZE", "Pick a preset (MUG … CAR) or drag the W/H sliders. The pilgrim silhouette shows the exact world scale."],
              ["5", "PUBLISH", "The relic takes an empty shrine instantly — persisted in SQLite, alive in 3D, shoppable forever. Resize or retire it from the resident list."],
            ].map(([n, t, d]) => (
              <div key={n} className="flex gap-3 border border-neutral-800 p-3">
                <div className="w-8 h-8 shrink-0 border border-amber-600 text-amber-300 font-black flex items-center justify-center">
                  {n}
                </div>
                <div>
                  <div className="text-amber-200 font-bold tracking-widest text-[11px]">{t}</div>
                  <div className="text-neutral-400 leading-relaxed mt-0.5">{d}</div>
                </div>
              </div>
            ))}
            <div className="flex gap-3 border border-teal-800/60 bg-teal-950/20 p-3">
              <div className="w-8 h-8 shrink-0 border border-teal-600 text-teal-300 font-black flex items-center justify-center">
                ⚒
              </div>
              <div>
                <div className="text-teal-200 font-bold tracking-widest text-[11px]">READY?</div>
                <Button
                  size="sm"
                  onClick={onOpenForge}
                  className="mt-1.5 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 !text-[#241304] font-bold tracking-widest text-[10px] h-8"
                >
                  OPEN THE SPRITE FORGE
                </Button>
              </div>
            </div>
          </div>
        </Section>

        {/* §6 cheat sheet */}
        <Section n="§6" title="CHEAT SHEET">
          <div className="space-y-2">
            <CopyRow
              label="files"
              text="mug_00.png mug_01.png mug_02.png mug_03.png mug_04.png mug_05.png mug_06.png mug_07.png mug_08.png   (00 = FRONT, each next +40°)"
            />
            <CopyRow
              label="sheet"
              text="mug_sheet.png   (1 PNG, 9 equal square cells side by side, transparent, cell1 = front)"
            />
            <CopyRow
              label="grid"
              text="mug_grid.png   (1 PNG, 3×3 cells, read row by row, cell[0][0] = front)"
            />
          </div>
          <div className="text-[11px] text-neutral-500 leading-relaxed space-y-1">
            <p>
              <span className="text-amber-400">▸</span> The temple holds{" "}
              <span className="text-neutral-200">6 pilgrim shrines</span>; retire a resident to
              free its altar. Every publish is persisted (SQLite + PNG on disk) and survives
              reloads.
            </p>
            <p>
              <span className="text-amber-400">▸</span> Quick-test without publishing: drag any
              9-frame strip straight onto the shop window — it live-replaces a product for the
              session (the classic Asset Pipeline).
            </p>
            <p>
              <span className="text-amber-400">▸</span> Export any current product&apos;s sheet
              from the Forge / ASSETS dialogs — a perfect starting template for your own art.
            </p>
          </div>
        </Section>

        <div className="text-center text-[10px] text-neutral-600 tracking-widest pb-4">
          ✦ CLASS DISMISSED — GO MAKE SOMETHING DIVINE ✦
        </div>
      </div>
    </div>
  );
}
