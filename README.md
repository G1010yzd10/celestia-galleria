# DOOM MART — Celestia Galleria ✦

> A Doom-style **first-person 3D shopping experience** rebuilt at **heaven-tier
> quality**. Products are rendered as **9-angle PNG sprite imposters** (the
> classic Doom sprite method), the whole shop fits in **under 4 MB of VRAM**,
> the floor is a **true planar mirror**, god rays fall from an open oculus —
> and customers can check out for real.

![scene](https://img.shields.io/badge/engine-Three.js-049fb4?style=flat-square) ![method](https://img.shields.io/badge/rendering-9--angle%20sprite%20imposters-f59e0b?style=flat-square) ![budget](https://img.shields.io/badge/VRAM-%3C4%20MB-22c55e?style=flat-square) ![db](https://img.shields.io/badge/db-node%3Asqlite%20(zero--dep)-c9962e?style=flat-square)

## What it is

Walk through a celestial temple of retail in first person: a gilded coffered
ceiling with an open oculus, volumetric **god rays** falling onto a
**turquoise lagoon** with golden glints and iridescence, a **mother-of-pearl
marble floor that truly mirrors the world** (procedural veins, infinite
detail), golden halos over every product, angel dust drifting in the light —
and six products on marble pedestals waiting to be bought.

**The Doom method:** every product is baked at startup from a tiny
procedural 3D model into a **9-frame sprite strip** (one frame per 40° of
rotation = full 360°). The 3D geometry is thrown away. What ships to the
GPU is a single 864×96 PNG atlas per product. That is how the original Doom
rendered its monsters, and it is why this scene costs megabytes, not
gigabytes.

## Feature highlights

- 🕹️ First-person controls — WASD + mouse-look (pointer lock with drag-look
  fallback), Shift to run, head-bob, synthesized marble footsteps
- 📱 Touch support — virtual joystick, drag-to-look, E / cart buttons
- 🌊 **Celestial lagoon water** — animated 3-octave normal field, fresnel
  pearl-sky reflection, golden sun speculars, iridescent thin-film sheen,
  divine sparkle, edge foam, aqua + gold caustics (all pure math, 0 bytes)
- 🪞 **True planar mirror floor** — the scene is re-rendered from a mirrored
  camera into a 448×224 target every frame, projected onto the marble with
  fresnel weighting (grazing angles go glassy). Plus mirrored sprite copies
  under every product
- ⛪ **Heaven rendering** — ACES filmic tone mapping, Unreal bloom (quarter
  res), animated shader sky dome with drifting pearl clouds, open oculus
  with gold rim, 4 fake-volumetric god-ray shafts, sun glare, gilded
  coffered ceiling, gold cornices and pillar capitals
- 😇 **Golden halos** — every product wears a floating, wobbling gold torus
  with a soft aura; angel dust motes and wandering light orbs fill the air
- 🎚️ **Adaptive quality** — ULTRA (mirror + bloom) on GPUs, auto-degrades to
  LITE (marble-only, 1× pixel ratio) when fps is sustained-low. The Doom
  way: runs beautifully everywhere
- 🔫 Doom HUD — status bar with CART / CREDITS / live VRAM meter / FPS,
  pilgrim mood face (halo grows as you shop), rotating automap, CRT scanlines
- 🔥 PSX Doom fire algorithm on the title screen — recast as ascending
  golden light
- 🛒 E-commerce — product dialogs with specs, quantities, cart drawer,
  checkout API backed by **`node:sqlite`** (built into Node 24 / Bun —
  zero dependencies, zero native binaries)
- 🖼️ **Asset pipeline** — drag & drop your own 9-frame PNG sprite sheet
  onto the page to replace any product live (see below)
- 🔊 All audio synthesized with WebAudio — seraph pad (A-major add9),
  bell chimes, arpeggio checkout fanfare — zero asset downloads anywhere

## The 9-angle sprite spec

```
┌───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │   one PNG, transparent bg
└───┴───┴───┴───┴───┴───┴───┴───┴───┘
  0°  40° 80° …                    320°   frame 0 = front view
```

- 9 square frames side-by-side, 40° apart (9 × 40° = 360°)
- Frame 0 = front; frames advance as the camera orbits the pedestal
- Transparent background, subject centered, feet at the bottom edge
- ≥ 432×48 px recommended (larger sheets are resliced automatically)

**Workflow for your own products:** open the shop → press the 🖼 ASSETS
button → export a baked reference sheet → redraw/design each frame in any
2D editor (photo renders, AI renders, hand-drawn art all work) → drag the
finished PNG back onto the shop window → pick the product slot to replace.
The engine hot-swaps the atlas — no reload, no rebuild.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| 3D | three.js 0.169 — vanilla, no react-three-fiber (kept light) |
| Post FX | EffectComposer + UnrealBloomPass + OutputPass (from three/examples) |
| UI | Tailwind CSS 4 + shadcn/ui |
| State | Zustand (+ localStorage cart persistence) |
| DB | **`node:sqlite` DatabaseSync** (`orders` table, WAL) — no ORM, no drivers |
| Audio | WebAudio synthesis (no files) |
| Textures | 100% procedural canvas generation |

## Run it

```bash
bun install
bun run dev         # http://localhost:3000
bun run db:check    # prints order count from db/custom.db
```

The SQLite schema creates itself on first request (and migrates any legacy
Prisma `Order` table automatically). Override the path with
`DOOM_DB_PATH=my.db`.

## Project map

```
src/
  app/page.tsx                 — mounts the shop (client-only)
  app/api/checkout/route.ts    — POST orders → node:sqlite
  lib/db.ts                    — DatabaseSync wrapper + migration
  lib/doom/
    engine.ts                  — renderer, ACES + bloom pipeline, controls,
                                 adaptive quality governor, collision, loop
    level.ts                   — atrium, sky dome, oculus, god rays, mirror
                                 floor (planar reflection), gold trims, lights
    baker.ts                   — 9-angle sprite baking (the Doom method)
    sprites.ts                 — billboards + mirrored copies + golden halos
    water.ts                   — celestial lagoon + caustics shaders
    products.ts                — procedural product models + catalog
    textures.ts                — procedural texture forge (ivory/gold)
    audio.ts                   — WebAudio seraph synth
    memory.ts                  — VRAM budget tracker (the 4 MB club)
  components/doom/             — TitleScreen, HudBar, Minimap, dialogs…
db/custom.db                   — SQLite orders (node:sqlite)
```

## Performance notes

- ~150 draw calls in ULTRA (mirror pass re-renders the scene), 6 sprite
  products, **~3.97 MB tracked VRAM of a 4.00 MB budget** (displayed live
  on the HUD — the 448×224 mirror target is honestly tracked; the freed
  floor-texture bytes pay for it)
- The marble floor is **pure shader math** — no texture, infinite detail
- All world textures are 128×128 procedural canvases; product atlases are
  864×96; nothing is downloaded at runtime
- Sprite rotation is a texture-offset uniform flip — no geometry work per
  frame; reflections are pre-transformed quads with depth-test disabled
- LITE tier (auto under sustained <26 fps): bloom off, mirror off, 1× pixel
  ratio — still gorgeous, still playable

---

*“Where every deal is divine.”* — Celestia Retail ✦
