# CELESTIA GALLERIA ✦

> *Formerly DOOM MART — reborn in golden light.* **v2.0 — THE GRAND MALL.**
> A Doom-style **first-person 3D shopping mall** at **heaven-tier quality**: 43
> meters of celestial retail where **everything you buy becomes a usable,
> living prop**. Products are rendered as **9-angle PNG sprite imposters** (the
> classic Doom sprite method), the temple mirrors itself in **real-time planar
> reflections**, and the 4 MB budget was **broken on purpose** — every extra
> megabyte spent on glory, tracked honestly on the HUD. Zero downloads, pure
> math, still fast. And now: **you can finally touch the walls.**

![engine](https://img.shields.io/badge/engine-Three.js-049fb4?style=flat-square) ![method](https://img.shields.io/badge/rendering-9--angle%20sprite%20imposters-f59e0b?style=flat-square) ![budget](https://img.shields.io/badge/VRAM-BUDGET%20BROKEN%20%E2%9C%A6-ff9ea0?style=flat-square) ![db](https://img.shields.io/badge/db-node%3Asqlite%20(zero--dep)-c9962e?style=flat-square) ![mall](https://img.shields.io/badge/mall-43M%20%C2%B7%20LIVING%20RELICS-9de8b8?style=flat-square)

## What it is

Walk a **grand mall** in first person — six named halls: the **FORGE GALLERY**
(ten shrines for YOUR uploaded sprites), the **GRAND ATRIUM** around a
lagoon under an open oculus, the **GARDEN & AUDIO** and **VISION** wings off
the **PROMENADE**, and **THE SANCTUM** in the south — where every purchase
**takes flesh on a golden plinth and actually works**. Sit on the sofa you
bought. Raise the camera to your eye and shoot real PNGs of the mall. Sip a
blessing from the mug, equip the sneakers, unfold the laptop's codex, ring a
sunrise through the whole building, or strap on the wings and ascend above
the lagoon. Carry your relics anywhere and re-place them — the mall is yours.

**The Doom method, kept holy:** every product is baked at startup from a tiny
procedural 3D model into a **9-frame sprite strip** (one frame per 40° of
rotation = full 360°). The 3D geometry is thrown away. What ships to the GPU
is a single 2016×224 PNG atlas per product — that is how the original Doom
rendered its monsters, and it is why this scene costs megabytes, not
gigabytes. **20 relics. One mall. Real hands.**

## The budget, broken with intent

| What | DOOM MART | CELESTIA GALLERIA v2.0 |
|---|---|---|
| Sprite frame | 96×96 px | **224×224 px** (5.4× the pixels) |
| Mirror target | 448×224 | **896×448** (4× — glass-crisp reflections) |
| Post chain | plain RT | **4×MSAA HalfFloat + screen-shader grade pass** |
| Environment | none | **PMREM sky probe** (gold reflects heaven — hands too) |
| Water | analytic sky only | **+ true planar mirror sampling** |
| Level | 16×14 room | **36×30 GRAND MALL** (43.2 m × 36 m, six halls) |
| Angel dust / orbs | 160 / 7 | **520 / 14** |
| Products / pedestals | 6 / 12 | **20 relics + 10 uploadable shrines / 30** |
| Viewmodel | none | **REAL 3D SERAPH HANDS** (28 jointed volumes, 9 poses) |
| Tracked VRAM | ~3.97 MB | **~51 MB and proud of it** |
| Collision | invisible 1.2 m wall gap | **honest AABBs — touch the marble at 0.3 m** |

The HUD meter displays the honest number with a rose-gold
**✦ BUDGET BROKEN** badge. Adaptive quality still auto-degrades to LITE
(mirror off, bloom off, 1× ratio) on weak GPUs — the Doom way: beautiful
everywhere.

## Feature highlights

### v2.0 — THE LIVING MALL

- 🏛️ **THE GRAND MALL** — 36×30 cells (43.2 m × 36 m), six named halls with
  zone banners, partition bulkheads with gilded gate arches, a two-bench
  Promenade, and a golden **ACQUISITION ALTAR** in the Sanctum
- 🤲 **THE HANDS** — real 3D viewmodel seraph hands: rounded palms, 28
  jointed finger volumes, pearlescent skin with golden sheen, gilded cuffs
  of light — breathing, swaying with your look, bobbing with your steps, and
  posing for every rite (reach, press, revere, thumbs-up on checkout, rest
  while seated, cradle while carrying — and they hold the camera & mug)
- 🛒 **A REAL-BUY LOOP** — inspect → cart → **walk your loaded cart to the
  altar** → press E → the **RITE OF ACQUISITION**: light column, choir
  fanfare, divine invoice, and **your relics take flesh in THE SANCTUM**
  (SQLite `inventory` table + golden plinths; the drawer's checkout button
  performs the same rite)
- 🪑 **USE WHAT YOU BUY** — 14 use-verbs across 20 relics: **SIT** (sofa,
  bench), **PHOTO MODE** (the VOIDCAM raises to your eye — viewfinder, FOV
  zoom, shutter flash, real PNG capture + gallery strip), **SIP** (blessed
  speed buff), **EQUIP** (permanent +25% speed), **READ** (the Seraph Codex
  overlay), **LAMP** (a personal halo follows you), **CINEMA** (movie-night
  dimming), **BLOOM** (angel-dust burst), **STARS** (the heavens twinkle),
  **DAWN** (a sunrise passes through), **ASCEND** (12 s of flight on
  seraph wings), **HARMONY** (the temple sings), **CHIME** (the temple reads
  the hour), **REVERE** (hands raised)
- ✋ **CARRY & RE-SPAWN** — press R to pick up any owned relic, walk it
  anywhere in the mall, press E to place it; placements persist to
  localStorage and restore on boot
- 🎛️ **SETTINGS — command the light** (⚙ button or G key): three quality
  tiers (GLORY / BALANCED / LITE), **six full-screen shader grades** — PEARL,
  GOLDEN HOUR, MOONLIT, SCRIPTORIUM, **RETRO DOOM** (12-level posterize +
  Bayer dither + scanlines, mathematically crushed) and VIVID — plus FOV,
  bloom, sensitivity, invert-Y, head-bob, angel dust, god rays, volume;
  everything applied live and persisted
- 🧱 **HONEST COLLISION** — walls sit on the inner faces of their cells and
  every prop gets a tight AABB: touch the marble at 0.3 m, hug pedestals,
  walk the wings. The invisible 1.2 m obstacle band is dead (verified
  analytically in the E2E suite)

### v1.x — the temple that started it

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
  fake-volumetric god-ray shafts over the oculus, pedestals, altar and
  galleries, sun glare, gilded coffered ceiling
- 📦 **Gilded reliquary crates** — clearcoat gold with sky reflections and
  glowing aqua relic gems (the Doom crates, promoted)
- 😇 **Golden halos** — every relic wears a floating, wobbling gold torus
  with a soft aura; 520 angel-dust motes and 14 wandering light orbs
- 🔫 Doom HUD — status bar with CART / CREDITS / live broken-budget VRAM
  meter / FPS / zone, pilgrim mood face, buff chips (CLOUDSTEP · BLESSED ·
  AURORA · ASCENDING), rotating automap with owned-relic diamonds, CRT
  scanlines
- 🔥 PSX Doom fire algorithm on the title screen — recast as ascending
  golden light
- 🛒 E-commerce — product dialogs with **live 9-angle rotating sprite
  preview**, world-size readout, specs, quantities, cart drawer, orders
  persisted to **`node:sqlite`** (built into Node 24 / Bun — zero
  dependencies, zero native binaries, **no Prisma**)
- ⚒ **THE SPRITE FORGE — upload your own 2D sprites** (`⚒` button or title
  screen): drop **9 PNGs**, **one 9-frame strip**, or **one 3×3 grid** →
  automatic background removal (border flood-fill, tunable tolerance),
  scale-locked trim & centering, live drag-to-spin preview → **publish to a
  persistent shrine** (SQLite + PNG on disk, survives reloads). Residents
  can be **resized live** or retired to free the altar.
- 📏 **SAY THE SIZE — the world-size dial**: every relic carries real-world
  meters (0.08–6 m). Presets from **MUG (0.13 m)** to **SOFA (2.2 m)** and
  **CAR (4.6 m)**, W/H sliders with aspect lock, a pilgrim-silhouette scale
  ruler in the Forge, and **live 3D resizing while you walk the temple** —
  sofa big, mug small, exactly as you say.
- 🎓 **THE SPRITE ACADEMY — a full tutorial with image references** (`🎓`
  button): the Doom billboard method explained, the 9-frame contract as a
  precise SVG diagram + AI-painted reference figures, three authoring paths
  (photo turntable / Blender render / copy-paste AI prompt), the size guide
  with a preset table, and the five-step upload ritual.
- 🖼️ **Asset pipeline (quick swap)** — drag & drop your own 9-frame PNG
  sprite sheet onto the page to replace any product live for the session
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

**Workflow for your own products (the full ritual):** title screen →
**⚒ SPRITE FORGE** → drop your 9 frames (or strip / grid) → tune background
removal → **CONJURE ATLAS** → drag the spin preview to verify every angle →
**say the size** (preset or sliders, pilgrim ruler for scale) → **PUBLISH**.
The relic takes an empty shrine instantly and persists across reloads.

**Quick swap (no persistence):** drag any 9-frame strip onto the shop window
→ pick the product to replace for this session — the engine hot-swaps the
atlas with no reload, no rebuild.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| 3D | three.js 0.169 — vanilla, no react-three-fiber (kept lean) |
| Post FX | EffectComposer (4×MSAA HalfFloat) + UnrealBloomPass + OutputPass + **GradePass (6 screen shaders)** |
| Viewmodel | **`hands.ts`** — 3D seraph hands (RoundedBoxGeometry joints, overlay pass) |
| Environment | PMREMGenerator.fromScene (pearl-sky cubemap) |
| UI | Tailwind CSS 4 + shadcn/ui |
| State | Zustand (+ localStorage cart persistence, legacy key migrated) |
| DB | **`node:sqlite` DatabaseSync** (`orders` + `custom_products` + `inventory`, WAL) — no ORM, no drivers, no Prisma |
| Audio | WebAudio synthesis (no files) |
| Textures | 100% procedural canvas generation |

## Run it

```bash
bun install
bun run dev         # http://localhost:3000
bun run db:check    # prints order count from db/custom.db
bash scripts/verify-v2.sh   # full 23-check E2E walkthrough
```

The SQLite schema creates itself on first request (and migrates any legacy
Prisma `Order` table automatically). Override the path with
`CELESTIA_DB_PATH=my.db` (the old `DOOM_DB_PATH` still works).

## Project map

```
src/
  app/page.tsx                 — mounts the shop (client-only)
  app/api/checkout/route.ts    — POST orders → node:sqlite (+ inventory delivery)
  app/api/inventory/route.ts   — GET owned relics (the Sanctum manifest)
  app/api/products/route.ts    — GET list · POST publish forged relics
  app/api/products/[id]/
    route.ts                   — PATCH (live size control) · DELETE (retire)
    sprite/route.ts            — serves uploaded atlas PNGs (immutable cache)
  lib/db.ts                    — DatabaseSync wrapper + Forge CRUD + inventory
  lib/checkout.ts              — shared checkout + inventory fetch (altar & drawer)
  lib/doom/
    forge.ts                   — client sprite pipeline: slice / flood-fill
                                 bg removal / trim & center / atlas compose
    engine.ts                  — renderer, controls, honest collision, prompts,
                                 Sanctum owned props, sit/carry/photo/verbs,
                                 buffs, altar rite, settings, adaptive quality
    level.ts                   — THE GRAND MALL: six halls, gates, altar,
                                 benches, sanctum slots, zones, mirror floor
    hands.ts                   — 3D seraph viewmodel hands + pose system
    settings.ts               — quality tiers, 6 screen-shader grades, persistence
    baker.ts                   — 9-angle sprite baking at 224px (Doom method)
    sprites.ts                 — billboards + mirrored copies + golden halos
    water.ts                   — mirror-drinking lagoon + caustics shaders
    products.ts                — procedural product models + catalog (20)
    textures.ts                — procedural texture forge (ivory/gold)
    audio.ts                   — WebAudio seraph synth + shutter/bell/swell
    memory.ts                  — honest VRAM tracker (budget: broken ✦)
  components/doom/             — TitleScreen, HudBar, Minimap, SettingsDialog,
                                 PhotoMode, CeremonyOverlay, CodexDialog, Forge,
                                 Academy, dialogs…
db/custom.db                   — SQLite orders + inventory (node:sqlite)
```

## Performance notes

- ~500 draw calls in GLORY (the mirror pass re-renders the whole mall), 20
  sprite relics + owned props, **~51 MB tracked VRAM** — displayed live on
  the HUD with pride; the mall still ships zero texture bytes at runtime
- The marble floor is **pure shader math** — no texture, infinite detail
- All world textures are 128×128 procedural canvases; product atlases are
  2016×224; the hands are ~40 rounded volumes rendered in a depth-cleared
  overlay pass (no bloom blow-out, crisp silhouette)
- Sprite rotation is a texture-offset uniform flip — no geometry work per
  frame; reflections are pre-transformed quads with depth-test disabled
- The water shares the floor's mirror target — one extra reflection pass
  powers two mirrored surfaces
- Quality tiers (auto under sustained low fps: GLORY → BALANCED → LITE):
  bloom/mirror step down, pixel ratio 2.0 → 1.5 → 1.0 — still gorgeous,
  still playable (verified headless on SwiftShader at 2.5 fps)
- `scripts/verify-v2.sh` runs the full 23-check E2E walkthrough (collision
  probes, altar rite, sit, photo, carry, settings, zones, zero console errors)

---

*"Where every deal is divine."* — Celestia Retail ✦
