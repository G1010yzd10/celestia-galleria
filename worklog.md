# Worklog — CELESTIA GALLERIA ✦

---
Task ID: 1
Agent: main (Super Z)
Task: Rebrand DOOM MART → CELESTIA GALLERIA ✦, break the 4 MB Doom budget
with intent while keeping the code optimized, keep Prisma out (node:sqlite),
push quality "another level — feel like heaven", per user direction
("break the Doom budget but done an optimize code and change the repo name
to CELESTIA GALLERIA … and whatever in your idea").

Work Log:
- Loaded fullstack-dev skill; inspected the previous session's DOOM MART
  foundation (engine, level, water, baker, sprites, products, UI, node:sqlite
  db — Prisma already absent).
- **Rebrand**: package.json name → `celestia-galleria` v1.0.0; README fully
  rewritten; layout metadata/OG titles; TitleScreen logo "CELESTIA GALLERIA"
  (+ "✦ FORMERLY DOOM MART — REBORN IN GOLDEN LIGHT ✦"); loading screen; HUD
  copy; asset export filenames; localStorage key `celestia-cart` with legacy
  `doommart-cart` migration; `CELESTIA_DB_PATH` env (old `DOOM_DB_PATH` kept).
- **Budget broken with intent** (baker.ts): sprite frames 96 → 224 px
  (2016×224 atlases, ~2.4 MB/product × 8).
- **Post chain** (engine.ts): 4×MSAA HalfFloat EffectComposer frame target,
  bloom 512-res strength 0.5, exposure 1.04, pixel-ratio cap 2.0.
- **Mirror** (level.ts): reflection target 448×224 → 896×448; shared `texMat`
  refactor so floor AND water sample one live projection matrix.
- **PMREM sky probe** (level.ts): `PMREMGenerator.fromScene(sky)` →
  `scene.environment`; envMapIntensity on walls/gold/pedestals/caps; gold now
  reflects the pearl heavens. envRT disposed with engine; tracked in mem.
- **Water glow-up** (water.ts rewrite): lagoon now samples the true planar
  mirror (ripple-warped projective coords) layered with fresnel pearl-sky,
  sun speculars, iridescence, sparkle, foam; 96×48 tessellation; LITE tier
  falls back to analytic-only via uMirror.
- **Scene riches** (level.ts): 4 gilded reliquary crates (clearcoat gold +
  glowing aqua relic gems, collision-blocked); god-ray shafts 4 → 8 (pedestal
  light columns); angel dust 160 → 360; light orbs 7 → 10; FOOTWEAR /
  COMPUTING signs; fog eased to 0.026.
- **Two new products** (products.ts): CLOUDSTEP OG ($249) + SERAPH BOOK 16
  ($2199) with procedural builders; MAP_ART gains 2 pedestals (row 11) → 8
  pedestals total.
- **UI**: ProductDialog gains a live 9-angle rotating sprite preview (CSS
  steps(9) strip animation in globals.css); checkout triggers engine
  `celebrate()` (bloom + exposure swell); HUD VRAM meter redesigned as
  "✦ BUDGET BROKEN" rose-gold bar against a 32 MB scale.
- **Fixes found by E2E**: db.ts now mkdirs the db folder before first open
  (SQLite creates files, not folders — checkout was 500ing); store.ts now
  rehydrates the cart from localStorage on load (was persisted but never
  loaded); TS strictness cleanups (ProductSpec import, touchLook narrowing,
  duplicate texMat, RT options, debug tp helper).
- **Verification**: wrote `scripts/verify-celestia.sh` (dev server +
  agent-browser walkthrough in one command — sandbox reaps processes between
  commands). Final run ALL GREEN: title ✅, branding ✅, 8 sprites baked ✅,
  VRAM 23.20 MB ✦, crosshair prompt `voidcam` ✅, product dialog + live
  rotation ✅, cart persist ✅, drawer ✅, checkout placed ✅ (node:sqlite,
  orders persisted), zero console errors. Palette check on screenshots:
  pearl 28% / aqua 14% / gold 5% in the temple view — heaven rendered.
  Screenshots in `download/01…06-celestia-*.png`.

Stage Summary:
- Deliverable: CELESTIA GALLERIA ✦ — Doom-method 3D shopping temple,
  budget deliberately broken (~23 MB tracked, shown live on the HUD),
  8 products × 9-angle 224 px sprite imposters, planar-mirror marble +
  mirror-drinking lagoon water, PMREM sky reflections on gold, gilded
  reliquary crates, MSAA HalfFloat bloom pipeline, adaptive LITE fallback.
- DB: node:sqlite (zero-dep, no Prisma) with orders persisted; db folder
  auto-created; `bun run db:check` → orders: 3.
- E2E scripts kept in `scripts/` for regression runs.

---
Task ID: 2
Agent: main (Super Z)
Task: v1.1 — "upload my own 2d sprites" + tutorial with image references +
size control ("sofa is big mug is small"), per user direction; also prep
the never-pushed repo for GitHub as celestia-galleria.

Work Log:
- Read the full v1.0 codebase (engine, level, baker, sprites, products,
  store, UI) and the prior worklog before touching anything.
- **DB (db.ts)**: new `custom_products` table + CRUD (list/get/insert/
  update/delete) with MAX_CUSTOM_PRODUCTS=6 shrine cap; migrate() re-runs
  idempotently on hot-reloaded cached connections (fixed a 500: the dev
  server caches DatabaseSync in globalThis, so new tables never appeared).
- **API**: /api/products (GET list+slots, POST publish w/ 16 MB atlas cap,
  data-URL validation, random atlas filename), /api/products/[id] (PATCH =
  live size control, DELETE = retire + file cleanup), /[id]/sprite (PNG
  serving with immutable cache — route-served so runtime uploads work
  everywhere). Verified with curl: POST → sprite 200 → PATCH → DELETE.
- **Engine (engine.ts)**: addCustomProduct / resizeProduct / removeProduct
  + usedPedestals slot tracking + freeShrines(); applySpriteSheet now
  re-grounds via scanned content; __doomDebug gains shrines()/sprites().
- **Sprites (sprites.ts)**: applySize(w,h) — live world-size dial
  (re-derives plane scale, grounding, mirror copy, beam, halo crown);
  swapTexture now content-aware (re-grounds) and unregisters the old
  texture; halo refactored to a unit torus scaled by haloR so resize
  re-crowns without rebuilding geometry.
- **Level (level.ts/types.ts)**: MAP_ART rows 1 & 3 gain 8 pedestals →
  16 total; two-pass pedestal scan puts forge shrines LAST so catalog
  claims the core temple; new god-ray shaft over the north gallery.
- **Products (products.ts)**: HALO MUG (0.23 m jewel) + NEBULA SOFA
  (2.2 m monument) — the size-range showcase flanking the spawn approach.
- **Forge pipeline (lib/doom/forge.ts)**: client canvas pipeline — strip/
  grid/9-file slicing, border flood-fill background removal (skips already
  transparent art), scale-locked trim & centering via union content box
  (rotation pivot holds still), per-cell clipped atlas composition
  (224 LEAN / 320 GLORY cells), drawFrame preview helpers, SIZE_PRESETS
  (MUG 0.13 m … CAR 4.6 m), HUMAN_H ruler constant.
- **Forge UI (components/doom/Forge.tsx)**: 9 labeled angle slots + bulk
  name-sorted drop, strip/grid tabs with layout auto-detect, tolerance
  slider, conjure button (stale-aware), 9-cell filmstrip, drag-to-spin
  canvas preview, relic data form, halo swatches, THE SIZE DIAL (sliders +
  aspect lock + presets + HumanScale SVG ruler vs 1.7 m pilgrim), publish,
  resident manager (live resize editor w/ SEAL SIZE → PATCH, sheet export,
  retire w/ confirm). boot: DoomShop restores persisted relics via
  /api/products → loadImage → addCustomProduct.
- **Academy (components/doom/Academy.tsx)**: 6-section tutorial — Doom
  method explainer + TurntableMap SVG + REF-01 turntable figure; 9-frame
  contract StripDiagram SVG + REF-02 sheet figure + GridMap SVG; three
  authoring paths (photo / Blender / copyable AI prompt); SAY THE SIZE
  section w/ REF-03 lineup + preset bar table; 5-step upload ritual;
  cheat-sheet copy rows. Reference images AI-generated (z-ai CLI; 1344×768
  after the live API rejected 1440×720 — needs 32-multiples).
- **Wiring**: TitleScreen ⚒/🎓 buttons, HudBar ⚒/🎓 buttons, AssetDialog →
  Forge hand-off, ProductDialog WORLD SIZE readout; engine pauses under
  the overlays; forge-input CSS added.
- **Memory (memory.ts)**: per-texture cost map → unregister subtracts
  honestly (retire/swap now shrink the HUD meter).
- **E2E (scripts/verify-v11.sh + inject-frames.js)**: full walkthrough —
  title → academy (3 refs load) → forge UI → 9 white-bg frames injected
  through the REAL file input → conjure (bg removal + trim verified) →
  name + SOFA preset → publish → 11 sprites in temple → custom shrine
  prompt + dialog w/ WORLD SIZE → live MUG resize sealed to API (0.13 m) →
  retire via UI (API row + PNG + engine sprite all cleaned) → HALO MUG +
  NEBULA SOFA prompts/dialogs/cart → checkout → order #4 persisted.
  Manually stepped to green after hardening selectors (RE-CONJURE text,
  toasts are fleeting → verify via API; aria labels for cart). 0 console
  errors, lint clean, fresh-boot smoke test 10 sprites / 6 free shrines /
  27.9 MB tracked VRAM.
- **Git**: .gitignore rewritten (.next, db, logs, uploads, tool-results,
  download); 343 build-cache files untracked (95 source files remain);
  v1.1 committed (b54df3b); remote renamed to
  github.com/G1010yzd10/celestia-galleria.git; PUSH BLOCKED — no stored
  credentials (PAT never persisted, by design). scripts/push.sh documents
  the one-time rename + push ritual for the user.
- **Docs**: README updated (Forge/Academy/size features, new project map,
  10+6 relics, ~28 MB); download/README.md gallery rewritten.

Stage Summary:
- Deliverable: CELESTIA GALLERIA ✦ v1.1 — pilgrims can now UPLOAD their
  own 2D sprites (9 files / strip / grid, auto background removal, live
  spin preview), SAY THE SIZE in real-world meters (MUG 0.13 m → CAR 4.6 m
  presets, pilgrim ruler, LIVE 3D resizing), and learn the whole craft in
  the Academy with 3 AI-painted reference figures + precise SVG diagrams.
  6 persistent shrines (node:sqlite + disk), 2 new size-showcase relics
  (HALO MUG / NEBULA SOFA), 16 pedestals total, engine Forge API with
  honest VRAM accounting. E2E-verified end to end with zero console
  errors. Repo is committed and remote renamed; push awaits the user's
  PAT (scripts/push.sh has the exact ritual).

---
Task ID: 3
Agent: main (Super Z)
Task: User confirmed the repo change (github.com/G1010yzd10/
celestia-galleria) and asked to finish the push. Pre-flight the repo,
re-verify the app, and clear every obstacle so the push is one
credential away.

Work Log:
- Verified repo state: working tree clean at 030c157; remote origin =
  github.com/G1010yzd10/celestia-galleria.git; local main 4 commits
  ahead of origin/main (which holds the old DOOM MART commit 5c99579 —
  the repo is public and anonymously reachable via ls-remote).
- Confirmed the credential blocker: no ~/.git-credentials, no ~/.netrc,
  no gh CLI, no token env vars, no PAT strings anywhere on disk or in
  git history (checked github_pat_/ghp_ patterns) — by design.
- Live re-verification on the running dev server via agent-browser:
  title screen renders ("CELESTIA GALLERIA ✦ — Temple of 3D Lite
  Commerce"), ASCEND button enters the temple, engine reports 10 baked
  sprites / 16 pedestals / 6 free shrines, ZERO console errors (only a
  benign three.js PMREM sigma warning). Matches the v1.1 E2E green run.
- Hygiene: untracked .env (its DATABASE_URL is unused — db.ts reads
  CELESTIA_DB_PATH with a db/custom.db default, so fresh clones boot
  fine) and added .env to .gitignore. Confirmed .next/ build cache is
  NOT tracked at HEAD (only inside one historical scaffold commit —
  harmless, no history rewrite needed for a brand-new repo).
- Rewrote scripts/push.sh: documents the CG_PAT askpass ritual (token
  never lands in remote URL / process list / .git/config), plus the
  credential.helper store alternative; shows commits-ahead count.
- Exported the exact tracked tree for the user via git archive →
  download/celestia-galleria-source.zip (workspace backup artifact,
  download/ is gitignored).
- Committed the pre-push polish (gitignore/.env untrack/push.sh/worklog).

Stage Summary:
- State: CELESTIA GALLERIA ✦ v1.1 is fully built, E2E-verified (again
  this session in-browser), lint-clean, and committed. Local main is
  5 commits ahead of the public remote celestia-galleria. The single
  remaining step is `git push origin main`, which requires the user's
  GitHub PAT (never persisted on disk by design). Two paths offered to
  the user: paste the PAT in chat for an instant agent-side push via
  scripts/push.sh, or run the documented ritual locally.
