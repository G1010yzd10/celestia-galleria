# CELESTIA GALLERIA ✦

> *Formerly DOOM MART — reborn in golden light.* A Doom-style **first-person 3D
> shopping experience** at **heaven-tier quality**. Products are rendered as
> **9-angle PNG sprite imposters** (the classic Doom sprite method), the temple
> mirrors itself in **real-time planar reflections** — and the 4 MB budget was
> **broken on purpose**: every extra megabyte was spent on glory, tracked
> honestly on the HUD. Still zero downloads, still pure math, still fast.

![engine](https://img.shields.io/badge/engine-Three.js-049fb4?style=flat-square) ![method](https://img.shields.io/badge/rendering-9--angle%20sprite%20imposters-f59e0b?style=flat-square) ![budget](https://img.shields.io/badge/VRAM-BUDGET%20BROKEN%20%E2%9C%A6-ff9ea0?style=flat-square) ![db](https://img.shields.io/badge/db-node%3Asqlite%20(zero--dep)-c9962e?style=flat-square)

## What it is

Walk through a celestial temple of retail in first person: a gilded coffered
ceiling with an open oculus, **eight** products on marble pedestals wearing
golden halos, volumetric god-ray columns falling onto a **turquoise lagoon
that now mirrors the real temple** (pillars, shafts, halos — ripple-warped),
a **mother-of-pearl marble floor that truly reflects the world**, and
**gilded reliquary crates** (the Doom boxes, promoted to heaven) whose
clearcoat gold drinks the pearl sky through a PMREM environment probe.

**The Doom method, kept holy:** every product is baked at startup from a tiny
procedural 3D model into a **9-frame sprite strip** (one frame per 40° of
rotation = full 360°). The 3D geometry is thrown away. What ships to the GPU
is a single 2016×224 PNG atlas per product — that is how the original Doom
rendered its monsters, and it is why this scene costs megabytes, not
gigabytes.

## The budget, broken with intent

| What | DOOM MART | CELESTIA GALLERIA |
|---|---|---|
| Sprite frame | 96×96 px | **224×224 px** (5.4× the pixels) |
| Mirror target | 448×224 | **896×448** (4× — glass-crisp reflections) |
| Post chain | plain RT | **4×MSAA HalfFloat** (silhouette-clean + HDR bloom) |
| Environment | none | **PMREM sky probe** (gold reflects heaven) |
| Water | analytic sky only | **+ true planar mirror sampling** |
| Water mesh | 48×24 | **96×48** (silk swell) |
| Pixel ratio cap | 1.75 | **2.0** |
| Angel dust / orbs | 160 / 7 | **360 / 10** |
| Products / god rays | 6 / 4 | **8 / 8** |
| Tracked VRAM | ~3.97 MB | **~24 MB and proud of it** |

The HUD meter displays the honest number with a rose-gold
**✦ BUDGET BROKEN** badge. Adaptive quality still auto-degrades to LITE
(mirror off, bloom off, 1× ratio) on weak GPUs — the Doom way: beautiful
everywhere.

## Feature highlights

- 🕹️ First-person controls — WASD + mouse-look (pointer lock with drag-look
  fallback), Shift to run, head-bob, synthesized marble footsteps
- 📱 Touch support — virtual joystick, drag-to-look, E / cart buttons
- 🌊 **Celestial lagoon** — animated 3-octave normal field, ripple-warped
  **true planar reflection** of the temple, fresnel pearl-sky layer, golden
  sun speculars, iridescent thin-film sheen, divine sparkle, edge foam,
  aqua + gold caustics (all pure math + one shared render target)
- 🪞 **True planar mirror floor** — the scene is re-rendered from a mirrored
  camera into an 896×448 target every frame, projected onto the marble with
  fresnel weighting; mirrored sprite copies under every product
- ⛪ **Heaven rendering** — ACES filmic tone mapping, Unreal bloom, 4×MSAA
  HalfFloat post chain, PMREM sky environment on every PBR surface, animated
  shader sky dome with drifting pearl clouds, open oculus with gold rim,
  8 fake-volumetric god-ray shafts, sun glare, gilded coffered ceiling
- 📦 **Gilded reliquary crates** — clearcoat gold with sky reflections and
  glowing aqua relic gems (the Doom crates, promoted)
- 😇 **Golden halos** — every product wears a floating, wobbling gold torus
  with a soft aura; 360 angel-dust motes and 10 wandering light orbs
- 🔫 Doom HUD — status bar with CART / CREDITS / live broken-budget VRAM
  meter / FPS, pilgrim mood face (halo grows as you shop), rotating automap,
  CRT scanlines
- 🔥 PSX Doom fire algorithm on the title screen — recast as ascending
  golden light
- 🛒 E-commerce — product dialogs with **live 9-angle rotating sprite
  preview**, specs, quantities, cart drawer, checkout blessing (bloom swell
  through the whole temple), orders persisted to **`node:sqlite`**
  (built into Node 24 / Bun — zero dependencies, zero native binaries,
  **no Prisma**)
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
| 3D | three.js 0.169 — vanilla, no react-three-fiber (kept lean) |
| Post FX | EffectComposer (4×MSAA HalfFloat) + UnrealBloomPass + OutputPass |
| Environment | PMREMGenerator.fromScene (pearl-sky cubemap) |
| UI | Tailwind CSS 4 + shadcn/ui |
| State | Zustand (+ localStorage cart persistence, legacy key migrated) |
| DB | **`node:sqlite` DatabaseSync** (`orders` table, WAL) — no ORM, no drivers, no Prisma |
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
`CELESTIA_DB_PATH=my.db` (the old `DOOM_DB_PATH` still works).

## Project map

```
src/
  app/page.tsx                 — mounts the shop (client-only)
  app/api/checkout/route.ts    — POST orders → node:sqlite
  lib/db.ts                    — DatabaseSync wrapper + migration
  lib/doom/
    engine.ts                  — renderer, MSAA+bloom pipeline, controls,
                                 adaptive quality governor, collision, loop
    level.ts                   — atrium, sky dome, PMREM env probe, oculus,
                                 god rays, mirror floor, reliquary crates
    baker.ts                   — 9-angle sprite baking at 224px (Doom method)
    sprites.ts                 — billboards + mirrored copies + golden halos
    water.ts                   — mirror-drinking lagoon + caustics shaders
    products.ts                — procedural product models + catalog (8)
    textures.ts                — procedural texture forge (ivory/gold)
    audio.ts                   — WebAudio seraph synth
    memory.ts                  — honest VRAM tracker (budget: broken ✦)
  components/doom/             — TitleScreen, HudBar, Minimap, dialogs…
db/custom.db                   — SQLite orders (node:sqlite)
```

## Performance notes

- ~170 draw calls in ULTRA (the mirror pass re-renders the scene), 8 sprite
  products, **~24 MB tracked VRAM** — displayed live on the HUD with pride
- The marble floor is **pure shader math** — no texture, infinite detail
- All world textures are 128×128 procedural canvases; product atlases are
  2016×224; nothing is downloaded at runtime
- Sprite rotation is a texture-offset uniform flip — no geometry work per
  frame; reflections are pre-transformed quads with depth-test disabled
- The water shares the floor's mirror target — one extra reflection pass
  powers two mirrored surfaces
- LITE tier (auto under sustained <26 fps): bloom off, mirror off, 1× pixel
  ratio — still gorgeous, still playable

---

*"Where every deal is divine."* — Celestia Retail ✦
