# DOOM MART — Sector-7 Galleria

> A Doom-style **first-person 3D shopping experience** built with Three.js.
> Products are rendered as **9-angle PNG sprite imposters** (the classic Doom
> sprite method), the whole shop fits in **under 4 MB of VRAM**, and customers
> can check out for real.

![scene](https://img.shields.io/badge/engine-Three.js-049fb4?style=flat-square) ![method](https://img.shields.io/badge/rendering-9--angle%20sprite%20imposters-f59e0b?style=flat-square) ![budget](https://img.shields.io/badge/VRAM-%3C4%20MB-22c55e?style=flat-square)

## What it is

Walk through a retro-futuristic retail sector in first person: a teal
coolant pool with animated shader water and caustics, glossy reflective
floors, neon strips, flickering sector lights, and six products on hologram
pedestals. Walk up to any product, inspect it, drop it in the cart, and
check out — orders persist to SQLite.

**The Doom method:** every product is baked at startup from a tiny
procedural 3D model into a **9-frame sprite strip** (one frame per 40° of
rotation = full 360°). The 3D geometry is thrown away. What ships to the
GPU is a single 864×96 PNG atlas per product. That is how the original Doom
rendered its monsters, and it is why this scene costs megabytes, not
gigabytes.

## Feature highlights

- 🕹️ First-person controls — WASD + mouse-look (pointer lock with drag-look
  fallback), Shift to run, head-bob, synthesized footsteps
- 📱 Touch support — virtual joystick, drag-to-look, E / cart buttons
- 🌊 Shader water — animated 3-octave normal field, fresnel environment
  reflection, analytic neon specular streaks, sparkle, edge foam, caustics
  on the pool floor (all pure math, 0 bytes of textures)
- 🪞 Reflections — mirrored sprite copies under every product (the classic
  cheap planar trick) plus fresnel sheen and neon smears on the floor
- 🔫 Doom HUD — status bar with CART / CREDITS / live VRAM meter / FPS,
  shopper mood face, rotating automap minimap, CRT scanlines
- 🔥 PSX Doom fire algorithm on the title screen
- 🛒 E-commerce — product dialogs with specs, quantities, cart drawer,
  checkout API backed by Prisma + SQLite
- 🖼️ **Asset pipeline** — drag & drop your own 9-frame PNG sprite sheet
  onto the page to replace any product live (see below)
- 🔊 All audio synthesized with WebAudio — zero asset downloads anywhere

## The 9-angle sprite spec

```
┌───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │   one PNG, transparent bg
└───┴───┴───┴───┴───┴───┴───┴───┴───┘
  0°  40° 80° …                    320°   frame 0 = front view
```

- 9 square frames side-by-side, 40° apart (9 × 40° = 360°)
- Frame 0 = front; frames advance clockwise as the camera orbits
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
| UI | Tailwind CSS 4 + shadcn/ui |
| State | Zustand (+ localStorage cart persistence) |
| DB | Prisma ORM + SQLite (`Order` model) |
| Audio | WebAudio synthesis (no files) |
| Textures | 100% procedural canvas generation |

## Run it

```bash
bun install
bun run db:push     # create SQLite schema
bun run dev         # http://localhost:3000
```

## Project map

```
src/
  app/page.tsx                 — mounts the shop (client-only)
  app/api/checkout/route.ts    — POST orders → SQLite
  lib/doom/
    engine.ts                  — renderer, controls, collision, loop
    level.ts                   — atrium, walls, pool, neons, lights
    baker.ts                   — 9-angle sprite baking (the Doom method)
    sprites.ts                 — billboard system + mirrored reflections
    water.ts                   — water + caustics shaders
    products.ts                — procedural product models + catalog
    textures.ts                — procedural texture forge
    audio.ts                   — WebAudio synth
    memory.ts                  — VRAM budget tracker
  components/doom/             — TitleScreen, HudBar, Minimap, dialogs…
prisma/schema.prisma           — Order model
```

## Performance notes

- ~75 draw calls, 6 sprite products, ~3.66 MB tracked VRAM of a 4.00 MB
  budget (displayed live on the HUD)
- All world textures are 128×128 procedural canvases; product atlases are
  864×96; nothing is downloaded at runtime
- Sprite rotation is a texture-offset uniform flip — no geometry work per
  frame; reflections are pre-transformed quads with depth-test disabled

---

*“Where shopping is hell of a deal.”* — Sector-7 Retail
