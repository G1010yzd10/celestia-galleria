"use client";

import { create } from "zustand";
import type { CartItem, EngineStats, ProductSpec } from "@/lib/doom/types";

interface ShopState {
  // cart
  cart: CartItem[];
  addToCart: (spec: ProductSpec) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartTotal: () => number;

  // engine / hud
  stats: EngineStats;
  setStats: (s: EngineStats) => void;
  prompt: ProductSpec | null;
  setPrompt: (p: ProductSpec | null) => void;
  selected: ProductSpec | null;
  setSelected: (p: ProductSpec | null) => void;
  cartOpen: boolean;
  setCartOpen: (b: boolean) => void;
  started: boolean;
  setStarted: (b: boolean) => void;
  soundOn: boolean;
  setSoundOn: (b: boolean) => void;
  lastOrder: { orderId: string; total: number } | null;
  setLastOrder: (o: { orderId: string; total: number } | null) => void;
  toastMsg: string | null;
  setToastMsg: (m: string | null) => void;
}

const MAX_QTY = 9;

export const useShop = create<ShopState>((set, get) => ({
  cart: [],
  addToCart: (spec) => {
    const cart = [...get().cart];
    const i = cart.findIndex((c) => c.id === spec.id);
    if (i >= 0) {
      if (cart[i].qty < MAX_QTY) cart[i] = { ...cart[i], qty: cart[i].qty + 1 };
    } else {
      cart.push({ id: spec.id, name: spec.name, price: spec.price, qty: 1 });
    }
    set({ cart });
    try {
      localStorage.setItem("doommart-cart", JSON.stringify(cart));
    } catch {
      /* sandboxed iframe — cart stays in memory */
    }
  },
  removeFromCart: (id) => {
    set({ cart: get().cart.filter((c) => c.id !== id) });
    try {
      localStorage.setItem("doommart-cart", JSON.stringify(get().cart));
    } catch {
      /* noop */
    }
  },
  setQty: (id, qty) => {
    let cart = get().cart.map((c) =>
      c.id === id ? { ...c, qty: Math.max(0, Math.min(MAX_QTY, qty)) } : c
    );
    cart = cart.filter((c) => c.qty > 0);
    set({ cart });
    try {
      localStorage.setItem("doommart-cart", JSON.stringify(cart));
    } catch {
      /* noop */
    }
  },
  clearCart: () => {
    set({ cart: [] });
    try {
      localStorage.removeItem("doommart-cart");
    } catch {
      /* noop */
    }
  },
  cartCount: () => get().cart.reduce((a, c) => a + c.qty, 0),
  cartTotal: () => get().cart.reduce((a, c) => a + c.qty * c.price, 0),

  stats: {
    fps: 0,
    vramMB: 0,
    drawCalls: 0,
    sprites: 0,
    px: 0,
    pz: 0,
    yaw: 0,
  },
  setStats: (stats) => set({ stats }),
  prompt: null,
  setPrompt: (prompt) => set({ prompt }),
  selected: null,
  setSelected: (selected) => set({ selected }),
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  started: false,
  setStarted: (started) => set({ started }),
  soundOn: true,
  setSoundOn: (soundOn) => set({ soundOn }),
  lastOrder: null,
  setLastOrder: (lastOrder) => set({ lastOrder }),
  toastMsg: null,
  setToastMsg: (toastMsg) => set({ toastMsg }),
}));
