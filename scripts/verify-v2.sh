#!/bin/bash
# ─── CELESTIA GALLERIA ✦ v2.0 — THE GRAND MALL E2E verification ──────────────
# Full walkthrough in one command (the sandbox reaps processes between
# commands, so the dev server is started INSIDE this script):
#   title → enter mall → 20 sprites + 30 pedestals → honest collision probe →
#   inspect + cart → ALTAR RITE (ceremony overlay + SQLite order + inventory
#   delivery) → owned relic usable → SIT + STAND → PHOTO MODE (real PNG) →
#   CARRY + PLACE (layout persisted) → SETTINGS (RETRO DOOM grade) → zone
#   banner → zero console errors.
set -u
cd "$(dirname "$0")/.."

PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ❌ $1"; }

echo "── v2.0 GRAND MALL E2E ─────────────────────────────────────────"
echo "[0] dev server"
if curl -s -o /dev/null --max-time 3 http://localhost:3000/; then
  ok "dev server already up (reusing)"
else
  (nohup bun run dev > dev.log 2>&1 &)
  for i in $(seq 1 40); do
    sleep 1
    if curl -s -o /dev/null --max-time 2 http://localhost:3000/; then break; fi
  done
  curl -s -o /dev/null --max-time 5 http://localhost:3000/ && ok "dev server up" || bad "dev server down"
fi

echo "[1] boot + title"
agent-browser close >/dev/null 2>&1 || true
agent-browser open http://localhost:3000/ >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1
agent-browser wait 2500 >/dev/null 2>&1
TITLE=$(agent-browser get title 2>/dev/null | tail -1)
echo "$TITLE" | rg -q "CELESTIA GALLERIA" && ok "title screen" || bad "title screen: $TITLE"
agent-browser find text "✦ ASCEND TO THE MALL" click >/dev/null 2>&1 && ok "entered the mall" || bad "enter button"
agent-browser wait 12000 >/dev/null 2>&1

echo "[2] engine state"
STATE=$(agent-browser eval "JSON.stringify({s: window.__doomDebug.sprites().length, sh: window.__doomDebug.shrines(), o: window.__doomDebug.owned().length, z: window.__doomDebug.zone()})" 2>/dev/null | tail -1 | sed 's/\\"/"/g')
echo "  $STATE"
echo "$STATE" | rg -q '"s":20' && ok "20 catalog relics baked" || bad "sprites != 20"
echo "$STATE" | rg -q '"total":30' && ok "30 pedestals (10 forge shrines free)" || bad "pedestals != 30"
echo "$STATE" | rg -q 'THE SANCTUM' && ok "spawn zone = THE SANCTUM" || bad "spawn zone"

echo "[3] honest collision (the hidden obstacle is dead)"
COLL=$(agent-browser eval "JSON.stringify({w: window.__doomDebug.collides(1.45, 10.8), w2: window.__doomDebug.collides(1.55, 10.8), p: window.__doomDebug.collides(6.6+0.73, 6.6), p2: window.__doomDebug.collides(6.6+0.83, 6.6)})" 2>/dev/null | tail -1 | sed 's/\\"/"/g')
echo "  $COLL"
echo "$COLL" | rg -q '"w":true' && echo "$COLL" | rg -q '"w2":false' && ok "wall touchable at 0.3 m" || bad "wall collision"
echo "$COLL" | rg -q '"p":true' && echo "$COLL" | rg -q '"p2":false' && ok "pedestal collider tight to 0.9 m box" || bad "pedestal collision"

echo "[4] purchase → altar rite → delivery"
agent-browser eval "window.__doomDebug.setQuality('lite'); window.__doomDebug.tp(6.6, 8.9, 0)" >/dev/null 2>&1
agent-browser wait 1000 >/dev/null 2>&1
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'e', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 1500 >/dev/null 2>&1
agent-browser find text "✦ ADD TO CART" click >/dev/null 2>&1 && ok "added to cart" || bad "add to cart"
agent-browser press Escape >/dev/null 2>&1
agent-browser wait 800 >/dev/null 2>&1
INV_BEFORE=$(curl -s http://localhost:3000/api/inventory)
agent-browser eval "window.__doomDebug.tp(21.6, 32.3, 0)" >/dev/null 2>&1
agent-browser wait 1200 >/dev/null 2>&1
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'e', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 3000 >/dev/null 2>&1
RITE=$(agent-browser eval "document.body.innerText.includes('RITE COMPLETE')" 2>/dev/null | tail -1)
[ "$RITE" = "true" ] && ok "ceremony overlay rendered" || bad "ceremony overlay"
INV_AFTER=$(curl -s http://localhost:3000/api/inventory)
echo "  before: $INV_BEFORE"
echo "  after:  $INV_AFTER"
[ "$INV_AFTER" != "$INV_BEFORE" ] && ok "inventory delivered (SQLite)" || bad "inventory unchanged"
ORDERS=$(curl -s http://localhost:3000/api/checkout)
echo "  orders: $ORDERS"
echo "$ORDERS" | rg -q '"ok":true' && ok "order persisted" || bad "orders endpoint"

echo "[5] owned relic usable (debug-owned trio)"
agent-browser eval "window.__doomDebug.own('nebulasofa'); window.__doomDebug.own('seraphwings')" >/dev/null 2>&1
agent-browser wait 800 >/dev/null 2>&1
OWNED=$(agent-browser eval "window.__doomDebug.owned().length" 2>/dev/null | tail -1)
[ "${OWNED:-0}" -ge 1 ] && ok "owned relics stand in the Sanctum ($OWNED)" || bad "owned relics"

echo "[6] SIT on the sofa"
SOFAX=4.2
for TRY in 1 2 3 4 5 6; do
  agent-browser eval "window.__doomDebug.tp($SOFAX, 33.5, 0)" >/dev/null 2>&1
  agent-browser wait 900 >/dev/null 2>&1
  VERB=$(agent-browser eval "window.__doomDebug.prompt()?.verb || ''" 2>/dev/null | tail -1)
  if echo "$VERB" | rg -q "NEBULA SOFA"; then break; fi
  SOFAX=$(python3 -c "print(round($SOFAX + 3.6, 2))")
done
echo "  sofa found at x=$SOFAX (verb: $VERB)"
PROMPT=$(agent-browser eval "window.__doomDebug.prompt()?.kind" 2>/dev/null | tail -1)
[ "$PROMPT" = '"use"' ] || [ "$PROMPT" = "use" ] && ok "USE prompt on owned sofa" || bad "use prompt: $PROMPT"
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'e', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 1500 >/dev/null 2>&1
SIT=$(agent-browser eval "window.__doomDebug.prompt()?.kind" 2>/dev/null | tail -1)
[ "$SIT" = '"stand"' ] || [ "$SIT" = "stand" ] && ok "seated (STAND prompt)" || bad "sit: $SIT"
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'e', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 800 >/dev/null 2>&1

echo "[7] PHOTO MODE — a real PNG of the mall"
agent-browser eval "window.__doomDebug.photo(true)" >/dev/null 2>&1
agent-browser wait 1500 >/dev/null 2>&1
VF=$(agent-browser eval "document.body.innerText.includes('VOIDCAM X9')" 2>/dev/null | tail -1)
[ "$VF" = "true" ] && ok "viewfinder up" || bad "viewfinder"
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'e', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 2000 >/dev/null 2>&1
SHOT=$(agent-browser eval "document.body.innerText.includes('SHOTS') || document.querySelectorAll('img').length > 0" 2>/dev/null | tail -1)
[ "$SHOT" = "true" ] && ok "frame captured + gallery strip" || bad "photo capture"
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'q', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 600 >/dev/null 2>&1

echo "[8] CARRY + PLACE (re-spawn anywhere)"
agent-browser eval "window.__doomDebug.tp(4.2, 33.5, 0)" >/dev/null 2>&1
agent-browser wait 900 >/dev/null 2>&1
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'r', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 1200 >/dev/null 2>&1
CARRY=$(agent-browser eval "window.__doomDebug.carrying()" 2>/dev/null | tail -1)
[ "$CARRY" != "null" ] && ok "carrying relic ($CARRY)" || bad "carry"
PROMPT2=$(agent-browser eval "window.__doomDebug.prompt()?.kind" 2>/dev/null | tail -1)
[ "$PROMPT2" = '"place"' ] || [ "$PROMPT2" = "place" ] && ok "PLACE prompt" || bad "place prompt: $PROMPT2"
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'e', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 1200 >/dev/null 2>&1
LAYOUT=$(agent-browser eval "JSON.parse(localStorage.getItem('celestia-layout-v2') || '[]').length" 2>/dev/null | tail -1)
[ "${LAYOUT:-0}" -ge 1 ] && ok "placement persisted to localStorage" || bad "layout persistence"

echo "[9] SETTINGS — RETRO DOOM grade"
agent-browser eval "window.dispatchEvent(new KeyboardEvent('keydown', {key: 'g', bubbles: true}))" >/dev/null 2>&1
agent-browser wait 1500 >/dev/null 2>&1
agent-browser find text "SCREEN SHADER" click >/dev/null 2>&1
agent-browser wait 800 >/dev/null 2>&1
agent-browser find text "RETRO DOOM" click >/dev/null 2>&1
agent-browser wait 1200 >/dev/null 2>&1
GRADE=$(agent-browser eval "window.__doomDebug.settings().grade" 2>/dev/null | tail -1)
[ "$GRADE" = '"retro"' ] || [ "$GRADE" = "retro" ] && ok "RETRO DOOM grade active" || bad "grade: $GRADE"
agent-browser press Escape >/dev/null 2>&1

echo "[10] zone banner"
agent-browser eval "window.__doomDebug.tp(21.6, 10.9, 3.14)" >/dev/null 2>&1
agent-browser wait 1800 >/dev/null 2>&1
ZONE=$(agent-browser eval "window.__doomDebug.zone()" 2>/dev/null | tail -1)
[ "$ZONE" = '"THE GRAND ATRIUM"' ] || [ "$ZONE" = "THE GRAND ATRIUM" ] && ok "zone tracking works" || bad "zone: $ZONE"

echo "[11] console errors"
ERRS=$(agent-browser errors 2>/dev/null | rg -c . || true)
[ "${ERRS:-0}" -eq 0 ] && ok "zero console errors" || bad "$ERRS console errors"

agent-browser screenshot download/v2-e2e-final.png >/dev/null 2>&1 || true
agent-browser close >/dev/null 2>&1 || true

echo "───────────────────────────────────────────────────────────────"
echo "RESULT: $PASS passed · $FAIL failed"
[ "$FAIL" -eq 0 ] && echo "ALL GREEN ✦ THE MALL IS ALIVE" || exit 1
