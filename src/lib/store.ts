"use client";

import { create } from "zustand";
import type { CartItem, EngineStats, ProductSpec, PromptInfo } from "@/lib/doom/types";

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
  prompt: PromptInfo | null;
  setPrompt: (p: PromptInfo | null) => void;
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

  // v2.0 — the living temple
  /** zone banner text (fades out) */
  zoneBanner: string | null;
  setZoneBanner: (z: string | null) => void;
  /** photo mode overlays (viewfinder + gallery) */
  photoMode: boolean;
  setPhotoMode: (b: boolean) => void;
  /** VOIDCAM shots, newest first, capped */
  photos: string[];
  addPhoto: (dataUrl: string) => void;
  /** SERAPH BOOK codex */
  readingSpec: ProductSpec | null;
  setReadingSpec: (p: ProductSpec | null) => void;
  /** purchase ceremony overlay */
  ceremony: { orderId: string; total: number } | null;
  setCeremony: (c: { orderId: string; total: number } | null) => void;
  /** settings dialog */
  settingsOpen: boolean;
  setSettingsOpen: (b: boolean) => void;
}

const MAX_QTY = 9;
const MAX_PHOTOS = 6;

// cart persistence — migrated from the DOOM MART era key on first load
const CART_KEY = "celestia-cart";
const LEGACY_KEY = "doommart-cart";

function persist(cart: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* sandboxed iframe — cart stays in memory */
  }
}

(function migrateLegacyCart() {
  try {
    const fresh = localStorage.getItem(CART_KEY);
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!fresh && legacy) localStorage.setItem(CART_KEY, legacy);
  } catch {
    /* storage unavailable */
  }
})();

/** rehydrate the blessed locker on page load (ssr:false — browser only) */
function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const items = JSON.parse(raw) as CartItem[];
      if (Array.isArray(items)) {
        return items.filter(
          (it) => it && typeof it.id === "string" && typeof it.qty === "number"
        );
      }
    }
  } catch {
    /* corrupted or blocked storage — start with an empty locker */
  }
  return [];
}

export const useShop = create<ShopState>((set, get) => ({
  cart: loadCart(),
  addToCart: (spec) => {
    const cart = [...get().cart];
    const i = cart.findIndex((c) => c.id === spec.id);
    if (i >= 0) {
      if (cart[i].qty < MAX_QTY) cart[i] = { ...cart[i], qty: cart[i].qty + 1 };
    } else {
      cart.push({ id: spec.id, name: spec.name, price: spec.price, qty: 1 });
    }
    set({ cart });
    persist(cart);
  },
  removeFromCart: (id) => {
    const cart = get().cart.filter((c) => c.id !== id);
    set({ cart });
    persist(cart);
  },
  setQty: (id, qty) => {
    let cart = get().cart.map((c) =>
      c.id === id ? { ...c, qty: Math.max(0, Math.min(MAX_QTY, qty)) } : c
    );
    cart = cart.filter((c) => c.qty > 0);
    set({ cart });
    persist(cart);
  },
  clearCart: () => {
    set({ cart: [] });
    try {
      localStorage.removeItem(CART_KEY);
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
    zone: "",
    buffs: [],
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

  // v2.0
  zoneBanner: null,
  setZoneBanner: (zoneBanner) => set({ zoneBanner }),
  photoMode: false,
  setPhotoMode: (photoMode) => set({ photoMode }),
  photos: [],
  addPhoto: (dataUrl) => {
    const photos = [dataUrl, ...get().photos];
    set({ photos: photos.slice(0, MAX_PHOTOS) });
  },
  readingSpec: null,
  setReadingSpec: (readingSpec) => set({ readingSpec }),
  ceremony: null,
  setCeremony: (ceremony) => set({ ceremony }),
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}));
