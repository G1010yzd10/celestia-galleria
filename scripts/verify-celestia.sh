#!/bin/bash
# ─── CELESTIA GALLERIA ✦ — end-to-end verification ──────────────────────────
# Runs the dev server + a headless-browser walkthrough in ONE command (the
# sandbox reaps background processes between commands, so the server and the
# browser flow must share a single lifetime).
set -u
cd /home/z/my-project
mkdir -p download

MARK="◈"
say() { echo "$MARK $1"; }

# ── 1) boot the dev server ──────────────────────────────────────────────────
say "booting dev server…"
setsid nohup bun run dev < /dev/null > /dev/null 2>&1 &
code=000
for i in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:3000/ 2>/dev/null || true)
  [ "$code" = "200" ] && break
  sleep 1
done
say "GET / → $code"
if [ "$code" != "200" ]; then
  echo "!! server failed to boot — dev.log tail:"
  tail -30 dev.log
  exit 1
fi

# ── 2) open the shop ────────────────────────────────────────────────────────
agent-browser set viewport 1600 900 > /dev/null 2>&1
agent-browser open http://127.0.0.1:3000/ > /dev/null 2>&1
agent-browser wait --load networkidle --timeout 60000 > /dev/null 2>&1 || true
agent-browser wait 3000 > /dev/null 2>&1
say "title: $(agent-browser get title 2>/dev/null)"
agent-browser screenshot download/01-celestia-title.png > /dev/null 2>&1
say "saved 01-celestia-title.png"

# logo present?
LOGO=$(agent-browser eval "document.body.innerText.includes('CELESTIA GALLERIA') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
say "CELESTIA GALLERIA branding on title screen: $LOGO"

# ── 3) enter the temple (waits for WebGL bake of 8×9 sprites) ───────────────
say "ascending… (baking 8 products × 9 angles)"
agent-browser find text "ASCEND TO THE SHOP" click > /dev/null 2>&1 || \
  agent-browser find role button click --name "ASCEND TO THE SHOP" > /dev/null 2>&1 || true
agent-browser wait --fn "window.__doomDebug && window.__doomDebug.frames().length === 8" --timeout 90000 > /dev/null 2>&1
BUILT=$(agent-browser eval "window.__doomDebug ? window.__doomDebug.frames().length : 'engine-dead'" 2>/dev/null | tail -1)
say "sprites baked: $BUILT (expect 8)"
agent-browser wait 4000 > /dev/null 2>&1
agent-browser screenshot download/02-celestia-temple.png > /dev/null 2>&1
say "saved 02-celestia-temple.png"

# engine telemetry — the broken budget, on record
VRAM=$(agent-browser eval "window.__doomDebug ? window.__doomDebug.vram().toFixed(2) : 'n/a'" 2>/dev/null | tail -1)
QUAL=$(agent-browser eval "window.__doomDebug ? window.__doomDebug.quality() : 'n/a'" 2>/dev/null | tail -1)
say "tracked VRAM: ${VRAM} MB (4 MB budget broken ✦) · quality: $QUAL"

# ── 4) walk to a pedestal → interact prompt → product dialog ────────────────
say "teleporting pilgrim to the VOIDCAM shrine…"
agent-browser eval "window.__doomDebug.tp(4.2, 4.5, 0)" > /dev/null 2>&1
agent-browser wait 1200 > /dev/null 2>&1
PROMPT=$(agent-browser eval "window.__doomDebug.prompt()" 2>/dev/null | tail -1)
say "crosshair prompt: $PROMPT (expect voidcam)"
agent-browser press e > /dev/null 2>&1
agent-browser wait --text "ADD TO CART" --timeout 20000 > /dev/null 2>&1
DIALOG=$(agent-browser eval "document.body.innerText.includes('VOIDCAM X9') ? 'open' : 'missing'" 2>/dev/null | tail -1)
ROT=$(agent-browser eval "!!document.querySelector('.sprite-rotate')" 2>/dev/null | tail -1)
say "product dialog: $DIALOG · live 9-angle rotation present: $ROT"
agent-browser wait 1200 > /dev/null 2>&1
agent-browser screenshot download/03-celestia-inspect.png > /dev/null 2>&1
say "saved 03-celestia-inspect.png"

# ── 5) add to cart ──────────────────────────────────────────────────────────
agent-browser find text "ADD TO CART" click > /dev/null 2>&1 || true
agent-browser wait 1500 > /dev/null 2>&1
CARTN=$(agent-browser eval "localStorage.getItem('celestia-cart')" 2>/dev/null | tail -1)
say "cart persisted under celestia-cart: $CARTN"
agent-browser screenshot download/04-celestia-hud.png > /dev/null 2>&1
say "saved 04-celestia-hud.png"

# ── 6) cart drawer + checkout (API → node:sqlite) ──────────────────────────
agent-browser find text "CART [1]" click > /dev/null 2>&1 || \
  agent-browser find role button click --name "Open cart" > /dev/null 2>&1 || true
agent-browser wait --text "BLESSED LOCKER" --timeout 15000 > /dev/null 2>&1
DRAWER=$(agent-browser eval "document.body.innerText.includes('BLESSED LOCKER') ? 'open' : 'missing'" 2>/dev/null | tail -1)
say "cart drawer: $DRAWER"
agent-browser screenshot download/05-celestia-cart.png > /dev/null 2>&1
say "saved 05-celestia-cart.png"

agent-browser find role button click --name "✦ CHECKOUT" > /dev/null 2>&1 || \
  agent-browser find text "CHECKOUT" click > /dev/null 2>&1 || true
agent-browser wait --text "ORDER PLACED" --timeout 25000 > /dev/null 2>&1
ORDER=$(agent-browser eval "document.body.innerText.includes('ORDER PLACED') ? 'placed' : 'failed'" 2>/dev/null | tail -1)
say "checkout: $ORDER (persisted to node:sqlite)"
agent-browser screenshot download/06-celestia-order.png > /dev/null 2>&1
say "saved 06-celestia-order.png"

# ── 7) health checks ────────────────────────────────────────────────────────
say "console errors:"
agent-browser errors 2>/dev/null | head -12
say "db check:"
bun run db:check 2>/dev/null | tail -1

agent-browser close > /dev/null 2>&1 || true
say "verification complete ✦"
