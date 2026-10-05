"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useShop } from "@/lib/store";

export function CartDrawer({ onCheckoutSound }: { onCheckoutSound: () => void }) {
  const cart = useShop((s) => s.cart);
  const cartOpen = useShop((s) => s.cartOpen);
  const setCartOpen = useShop((s) => s.setCartOpen);
  const setQty = useShop((s) => s.setQty);
  const removeFromCart = useShop((s) => s.removeFromCart);
  const clearCart = useShop((s) => s.clearCart);
  const lastOrder = useShop((s) => s.lastOrder);
  const setLastOrder = useShop((s) => s.setLastOrder);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = cart.reduce((a, c) => a + c.qty * c.price, 0);
  const count = cart.reduce((a, c) => a + c.qty, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, customer: "WALK-IN" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Checkout failed");
      setLastOrder({ orderId: data.orderId, total: data.total });
      clearCart();
      onCheckoutSound();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout terminal offline");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#120d06] border-l-2 border-amber-600/70 font-mono text-neutral-200 p-0 flex flex-col"
      >
        <SheetHeader className="p-4 pb-3 border-b border-neutral-800">
          <SheetTitle className="font-black tracking-widest text-amber-300 text-lg">
            🛒 BLESSED LOCKER
          </SheetTitle>
          <div className="text-[10px] text-neutral-500 tracking-[0.25em]">
            CELESTIA GALLERIA · CHECKOUT SHRINE
          </div>
        </SheetHeader>

        {lastOrder && (
          <div className="m-4 border-2 border-green-600/70 bg-green-950/40 p-4 text-sm">
            <div className="text-green-400 font-bold tracking-widest text-base">
              ✔ ORDER PLACED — BLESSINGS RENDERED
            </div>
            <div className="text-neutral-400 text-xs mt-1.5 font-mono">
              ORDER #{lastOrder.orderId.slice(0, 8).toUpperCase()}
              <br />
              {lastOrder.total.toLocaleString()} CREDITS CHARGED
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-green-700 text-green-300 hover:bg-green-900/40 h-8 text-xs"
              onClick={() => setLastOrder(null)}
            >
              KEEP SHOPPING
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto max-h-[52vh] p-4 space-y-2">
          {cart.length === 0 && !lastOrder && (
            <div className="text-center py-10 text-neutral-600 text-sm">
              <div className="text-4xl mb-3 opacity-40">∅</div>
              LOCKER EMPTY.
              <div className="text-[11px] mt-1">
                WALK UP TO A HALOED PRODUCT AND PRESS E.
              </div>
            </div>
          )}
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 border border-amber-900/50 bg-[#1a1207]/60 p-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-teal-200 truncate">{item.name}</div>
                <div className="text-[11px] text-neutral-500">
                  {item.price.toLocaleString()} CRED ea
                </div>
              </div>
              <div className="flex items-center border border-amber-900/60 bg-black/50 h-8">
                <button
                  className="w-7 h-8 text-neutral-400 hover:text-white text-sm"
                  onClick={() => (item.qty <= 1 ? removeFromCart(item.id) : setQty(item.id, item.qty - 1))}
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-bold tabular-nums text-amber-300">
                  {item.qty}
                </span>
                <button
                  className="w-7 h-8 text-neutral-400 hover:text-white text-sm"
                  onClick={() => setQty(item.id, item.qty + 1)}
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>
              <div className="w-20 text-right text-sm font-black tabular-nums text-amber-300">
                {(item.qty * item.price).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-800 bg-black/40 mt-auto">
          {error && (
            <div className="mb-2 text-xs text-red-400 border border-red-900 p-2">{error}</div>
          )}
          <div className="flex justify-between items-end mb-3">
            <span className="text-[10px] tracking-[0.3em] text-neutral-500">
              TOTAL · {count} ITEM{count === 1 ? "" : "S"}
            </span>
            <span
              className="text-3xl font-black tabular-nums text-amber-300"
              style={{ textShadow: "0 0 14px rgba(255,217,140,0.55)" }}
            >
              {total.toLocaleString()}
            </span>
          </div>
          <Separator className="bg-neutral-800 mb-3" />
          <Button
            disabled={cart.length === 0 || busy}
            onClick={checkout}
            className="w-full h-12 font-bold tracking-[0.3em] border-2 border-amber-400 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 hover:from-amber-200 hover:to-amber-500 disabled:opacity-40 !text-[#241304]"
          >
            {busy ? "AUTHORIZING…" : "✦ CHECKOUT"}
          </Button>
          <div className="text-[9px] text-neutral-600 mt-2 text-center tracking-wider">
            DEMO CHECKOUT — ORDERS PERSIST TO SQLITE (node:sqlite)
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
