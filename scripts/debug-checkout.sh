#!/bin/bash
# focused checkout-UI verification: hydrate cart → drawer → CHECKOUT → order
set -u
cd /home/z/my-project
say() { echo "◈ $1"; }

setsid nohup bun run dev < /dev/null > /dev/null 2>&1 &
code=000
for i in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:3000/ 2>/dev/null || true)
  [ "$code" = "200" ] && break
  sleep 1
done
say "boot: $code"

agent-browser set viewport 1600 900 > /dev/null 2>&1
agent-browser open http://127.0.0.1:3000/ > /dev/null 2>&1
agent-browser wait --load networkidle --timeout 60000 > /dev/null 2>&1 || true
agent-browser wait 2000 > /dev/null 2>&1

# seed the blessed locker, then reload — proves hydration fix too
agent-browser eval "localStorage.setItem('celestia-cart', JSON.stringify([{id:'voidcam',name:'VOIDCAM X9',price:1299,qty:2}]))" > /dev/null 2>&1
agent-browser reload > /dev/null 2>&1
agent-browser wait --load networkidle --timeout 60000 > /dev/null 2>&1 || true
agent-browser wait 2500 > /dev/null 2>&1
HYD=$(agent-browser eval "document.body.innerText.includes('CART') ? (document.body.innerText.match(/CART[^0-9]*(\\d+)/) ? document.body.innerText.match(/CART[^0-9]*(\\d+)/)[1] : '?') : 'no-hud'" 2>/dev/null | tail -1)
say "hydrated cart count on HUD: $HYD (expect 02)"

agent-browser find text "ASCEND TO THE SHOP" click > /dev/null 2>&1 || true
agent-browser wait 3000 > /dev/null 2>&1

# open the cart drawer and inspect its interactive elements
agent-browser find text "CART [2]" click > /dev/null 2>&1 || \
  agent-browser find role button click --name "Open cart" > /dev/null 2>&1 || true
agent-browser wait --text "BLESSED LOCKER" --timeout 15000 > /dev/null 2>&1
say "drawer snapshot (interactive):"
agent-browser snapshot -i -c 2>/dev/null | head -40

# click CHECKOUT via role/name
agent-browser find role button click --name "✦ CHECKOUT" > /dev/null 2>&1 && say "clicked ✦ CHECKOUT (role/name)" || say "role/name click failed"
agent-browser wait --text "ORDER PLACED" --timeout 25000 > /dev/null 2>&1
ORDER=$(agent-browser eval "document.body.innerText.includes('ORDER PLACED') ? 'placed' : 'failed'" 2>/dev/null | tail -1)
say "checkout: $ORDER"
agent-browser screenshot download/06-celestia-order.png > /dev/null 2>&1
say "saved 06-celestia-order.png"
say "console errors:"
agent-browser errors 2>/dev/null | head -10
agent-browser close > /dev/null 2>&1 || true
