#!/bin/bash
# ─── CELESTIA GALLERIA ✦ v1.1 — FORGE & ACADEMY end-to-end verification ─────
# Walks: title → Academy (refs) → Forge upload (real input + bg removal) →
# publish → in-temple custom shrine → live resize → retire → new relics
# (HALO MUG / NEBULA SOFA) → cart. Uses the platform dev server on :3000.
set -u
cd /home/z/my-project
mkdir -p download

MARK="◈"
say() { echo "$MARK $1"; }
AB="agent-browser"
PASS=0; FAIL=0
ok() { if [ "$1" = "yes" ] || [ "$1" = "1" ] || [ "$1" = "placed" ] || [ "$1" = "open" ] || [ "$1" = "present" ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); fi; }

$AB set viewport 1600 900 > /dev/null 2>&1

# ── 1) title screen ─────────────────────────────────────────────────────────
$AB open http://127.0.0.1:3000/ > /dev/null 2>&1
$AB wait --load networkidle --timeout 60000 > /dev/null 2>&1 || true
$AB wait 3500 > /dev/null 2>&1
say "title: $($AB get title 2>/dev/null)"
BRAND=$($AB eval "document.body.innerText.includes('CELESTIA GALLERIA') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
FORGE_BTN=$($AB eval "document.body.innerText.includes('SPRITE FORGE') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
ACAD_BTN=$($AB eval "document.body.innerText.includes('ACADEMY') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
say "branding: $BRAND · forge button: $FORGE_BTN · academy button: $ACAD_BTN"
ok "$BRAND"; ok "$FORGE_BTN"; ok "$ACAD_BTN"
$AB screenshot download/10-v11-title.png > /dev/null 2>&1

# ── 2) the Academy + reference images ───────────────────────────────────────
$AB find text "🎓 ACADEMY" click > /dev/null 2>&1 || $AB find text "ACADEMY" click > /dev/null 2>&1 || true
$AB wait --text "THE 9-FRAME CONTRACT" --timeout 20000 > /dev/null 2>&1
ACAD=$($AB eval "document.body.innerText.includes('THE SPRITE ACADEMY') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
REFS=$($AB eval "Array.from(document.querySelectorAll('img')).filter(function(i){return i.src.indexOf('/tutorial/')>=0 && i.naturalWidth>0}).length" 2>/dev/null | tail -1)
SAY4=$($AB eval "document.body.innerText.includes('SAY THE SIZE') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
say "academy: $ACAD · reference images loaded: $REFS/3 · size section: $SAY4"
ok "$ACAD"; ok "$SAY4"; [ "$REFS" = "3" ] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
$AB screenshot --full download/11-v11-academy.png > /dev/null 2>&1
$AB find text "✕ RETURN TO TEMPLE" click > /dev/null 2>&1 || true
$AB wait 600 > /dev/null 2>&1

# ── 3) the Forge UI ─────────────────────────────────────────────────────────
$AB find text "⚒ SPRITE FORGE" click > /dev/null 2>&1 || true
$AB wait --text "FEED THE FORGE" --timeout 20000 > /dev/null 2>&1
FORGE=$($AB eval "document.body.innerText.includes('THE SPRITE FORGE') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
SIZE=$($AB eval "document.body.innerText.includes('SAY THE SIZE') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
PRESET=$($AB eval "document.body.innerText.includes('SOFA 2.2m') && document.body.innerText.includes('MUG 0.13m') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
HUMAN=$($AB eval "document.body.innerText.includes('PILGRIM 1.70m') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
say "forge: $FORGE · size dial: $SIZE · presets: $PRESET · human scale: $HUMAN"
ok "$FORGE"; ok "$SIZE"; ok "$PRESET"; ok "$HUMAN"
$AB screenshot download/12-v11-forge.png > /dev/null 2>&1

# ── 4) upload 9 frames through the REAL input + conjure ────────────────────
INJ=$($AB eval "$(cat scripts/inject-frames.js)" 2>/dev/null | tail -1)
say "frames injected: $INJ"
$AB wait 1200 > /dev/null 2>&1
# the button reads CONJURE or RE-CONJURE depending on staleness — try both
$AB find text "RE-CONJURE ATLAS" click > /dev/null 2>&1 || \
  $AB find text "CONJURE ATLAS" click > /dev/null 2>&1 || true
$AB wait --text "CONJURED ATLAS" --timeout 30000 > /dev/null 2>&1
STRIP=$($AB eval "document.body.innerText.includes('CONJURED ATLAS') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
SPIN=$($AB eval "document.body.innerText.includes('DRAG TO SPIN') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
say "atlas conjured: $STRIP · spin preview: $SPIN"
ok "$STRIP"; ok "$SPIN"
$AB screenshot download/13-v11-conjured.png > /dev/null 2>&1

# name + sofa size preset + publish
$AB find role textbox fill --name "NAME" "ECHO RELIC" > /dev/null 2>&1 || \
  $AB find label "NAME" fill "ECHO RELIC" > /dev/null 2>&1 || true
$AB find text "SOFA 2.2m" click > /dev/null 2>&1 || true
$AB wait 400 > /dev/null 2>&1
$AB find text "PUBLISH TO AN EMPTY SHRINE" click > /dev/null 2>&1 || true
# blessing is verified through the ledger, not the fleeting toast
$AB wait --fn "fetch('/api/products').then(function(r){return r.json()}).then(function(j){return j.ok && j.products.length === 1})" --timeout 30000 > /dev/null 2>&1
BLESSED=$(curl -s http://127.0.0.1:3000/api/products | python3 -c "import json,sys; print('yes' if len(json.load(sys.stdin)['products'])==1 else 'NO')" 2>/dev/null)
say "publish blessed: $BLESSED"
ok "$BLESSED"
$AB wait 1500 > /dev/null 2>&1
RESIDENT=$($AB eval "document.body.innerText.includes('ECHO RELIC') && document.body.innerText.includes('RESIZE') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
say "resident listed in forge: $RESIDENT"
ok "$RESIDENT"
$AB find text "RETURN TO TEMPLE" click > /dev/null 2>&1 || true
$AB wait 600 > /dev/null 2>&1

# ── 5) enter the temple — 10 baked + 1 custom = 11 sprites ───────────────────
$AB find text "ASCEND TO THE SHOP" click > /dev/null 2>&1 || true
$AB wait --fn "window.__doomDebug && window.__doomDebug.frames().length === 11" --timeout 90000 > /dev/null 2>&1
BUILT=$($AB eval "window.__doomDebug ? window.__doomDebug.frames().length : 'engine-dead'" 2>/dev/null | tail -1)
say "sprites in temple: $BUILT (expect 11 = 10 catalog + 1 forged)"
[ "$BUILT" = "11" ] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
$AB wait 3500 > /dev/null 2>&1
VRAM=$($AB eval "window.__doomDebug ? window.__doomDebug.vram().toFixed(2) : 'n/a'" 2>/dev/null | tail -1)
say "tracked VRAM: ${VRAM} MB · shrines: $($AB eval "JSON.stringify(window.__doomDebug.shrines())" 2>/dev/null | tail -1)"
$AB screenshot download/14-v11-temple.png > /dev/null 2>&1

# ── 6) visit the forged relic's shrine (first free = row 11 col 3) ──────────
$AB eval "window.__doomDebug.tp(4.2, 15.1, 0)" > /dev/null 2>&1
$AB wait 1400 > /dev/null 2>&1
PROMPT=$($AB eval "window.__doomDebug.prompt()" 2>/dev/null | tail -1)
say "crosshair prompt at forge shrine: $PROMPT (expect forge-*)"
case "$PROMPT" in forge-*) PASS=$((PASS+1));; *) FAIL=$((FAIL+1));; esac
$AB press e > /dev/null 2>&1
$AB wait --text "ADD TO CART" --timeout 20000 > /dev/null 2>&1
DIALOG=$($AB eval "document.body.innerText.includes('ECHO RELIC') ? 'open' : 'missing'" 2>/dev/null | tail -1)
WSIZE=$($AB eval "document.body.innerText.includes('WORLD SIZE') ? 'yes' : 'NO'" 2>/dev/null | tail -1)
say "custom relic dialog: $DIALOG · world-size line: $WSIZE"
ok "$DIALOG"; ok "$WSIZE"
$AB screenshot download/15-v11-custom-relic.png > /dev/null 2>&1
$AB find text "✕" click > /dev/null 2>&1 || $AB press Escape > /dev/null 2>&1 || true
$AB wait 800 > /dev/null 2>&1

# ── 7) live resize through the Forge editor (MUG preset) ────────────────────
$AB find role button click --name "Sprite Forge — upload your own sprites" > /dev/null 2>&1 || true
$AB wait --text "SHRINE RESIDENTS" --timeout 20000 > /dev/null 2>&1
$AB find text "RESIZE" click > /dev/null 2>&1 || true
$AB wait --text "SEAL SIZE" --timeout 15000 > /dev/null 2>&1
$AB find text "MUG" click > /dev/null 2>&1 || true
$AB wait 500 > /dev/null 2>&1
$AB find text "SEAL SIZE" click > /dev/null 2>&1 || true
$AB wait --fn "fetch('/api/products').then(function(r){return r.json()}).then(function(j){return j.products[0] && j.products[0].spriteH < 0.2})" --timeout 20000 > /dev/null 2>&1
API_SIZE=$(curl -s http://127.0.0.1:3000/api/products | python3 -c "import json,sys; p=json.load(sys.stdin)['products']; print(p[0]['spriteH'] if p else 'none')" 2>/dev/null)
say "resize sealed · persisted height now: $API_SIZE m (expect ~0.13)"
[ "$(python3 -c "print(1 if float('${API_SIZE:-9}') < 0.2 else 0)" 2>/dev/null)" = "1" ] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
$AB find text "RETURN TO TEMPLE" click > /dev/null 2>&1 || true
$AB wait 600 > /dev/null 2>&1
LIVE=$($AB eval "window.__doomDebug.frames().filter(function(f){return f.id.indexOf('forge-')===0}).map(function(f){return f.meshY.toFixed(2)})" 2>/dev/null | tail -1)
say "forged sprite grounded after resize (meshY ~1.0): $LIVE"

# ── 8) retire the relic through the UI ──────────────────────────────────────
$AB find role button click --name "Sprite Forge — upload your own sprites" > /dev/null 2>&1 || true
$AB wait --text "SHRINE RESIDENTS" --timeout 20000 > /dev/null 2>&1
$AB find text "RETIRE" click > /dev/null 2>&1 || true
$AB wait 600 > /dev/null 2>&1
$AB dialog accept > /dev/null 2>&1 || true
$AB wait --fn "fetch('/api/products').then(function(r){return r.json()}).then(function(j){return j.ok && j.products.length === 0})" --timeout 20000 > /dev/null 2>&1
FREED=$(curl -s http://127.0.0.1:3000/api/products | python3 -c "import json,sys; print('yes' if len(json.load(sys.stdin)['products'])==0 else 'NO')" 2>/dev/null)
AFTER=$($AB eval "window.__doomDebug ? window.__doomDebug.frames().length : 'n/a'" 2>/dev/null | tail -1)
API_N=$(curl -s http://127.0.0.1:3000/api/products | python3 -c "import json,sys; print(len(json.load(sys.stdin)['products']))" 2>/dev/null)
say "retired: $FREED · sprites now: $AFTER (expect 10) · api rows: $API_N (expect 0)"
ok "$FREED"; [ "$AFTER" = "10" ] && PASS=$((PASS+1)) || FAIL=$((FAIL+1)); [ "$API_N" = "0" ] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
$AB find text "RETURN TO TEMPLE" click > /dev/null 2>&1 || true
$AB wait 600 > /dev/null 2>&1

# ── 9) the new size-showcase relics: HALO MUG + NEBULA SOFA ─────────────────
$AB eval "window.__doomDebug.tp(4.2, 12.7, 0)" > /dev/null 2>&1
$AB wait 1400 > /dev/null 2>&1
MUGP=$($AB eval "window.__doomDebug.prompt()" 2>/dev/null | tail -1)
say "prompt at mug shrine: $MUGP (expect halomug)"
[ "$MUGP" = "halomug" ] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
$AB press e > /dev/null 2>&1
$AB wait --text "HALO MUG" --timeout 15000 > /dev/null 2>&1
$AB screenshot download/16-v11-halomug.png > /dev/null 2>&1
$AB find text "✕" click > /dev/null 2>&1 || $AB press Escape > /dev/null 2>&1 || true
$AB wait 800 > /dev/null 2>&1
$AB eval "window.__doomDebug.tp(13.8, 12.7, 0)" > /dev/null 2>&1
$AB wait 1400 > /dev/null 2>&1
SOFAP=$($AB eval "window.__doomDebug.prompt()" 2>/dev/null | tail -1)
say "prompt at sofa shrine: $SOFAP (expect nebulasofa)"
[ "$SOFAP" = "nebulasofa" ] && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
$AB press e > /dev/null 2>&1
$AB wait --text "NEBULA SOFA" --timeout 15000 > /dev/null 2>&1
$AB screenshot download/17-v11-nebulasofa.png > /dev/null 2>&1
# add the sofa to the cart to prove big relics sell too
$AB find text "ADD TO CART" click > /dev/null 2>&1 || true
$AB wait 1500 > /dev/null 2>&1
CARTN=$($AB eval "localStorage.getItem('celestia-cart')" 2>/dev/null | tail -1)
say "cart after sofa add: $CARTN"

# ── 10) health ──────────────────────────────────────────────────────────────
say "console errors:"
$AB errors 2>/dev/null | head -10
ERRN=$($AB errors 2>/dev/null | grep -c "Error" || true)
say "error count: $ERRN"
$AB close > /dev/null 2>&1 || true
say "RESULT: $PASS passed · $FAIL failed"
[ "$FAIL" = "0" ] && say "ALL GREEN ✦" || say "!! FIX NEEDED"
exit 0
