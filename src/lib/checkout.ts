import type { CartItem } from "@/lib/doom/types";

// ─── Checkout + Sanctum delivery (shared by the cart drawer and the Altar) ──

export interface CheckoutResult {
  ok: boolean;
  orderId?: string;
  total?: number;
  error?: string;
}

/** place the order — the API persists it AND delivers to the inventory */
export async function postCheckout(items: CartItem[], customer = "WALK-IN"): Promise<CheckoutResult> {
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, customer }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) return { ok: false, error: data.error || "Checkout failed" };
    return { ok: true, orderId: data.orderId, total: data.total };
  } catch {
    return { ok: false, error: "Checkout terminal offline" };
  }
}

/** which relics does this pilgrim own? */
export async function fetchInventory(): Promise<Record<string, number>> {
  try {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data.items)) return {};
    const map: Record<string, number> = {};
    for (const it of data.items as { id: string; qty: number }[]) {
      map[it.id] = it.qty;
    }
    return map;
  } catch {
    return {};
  }
}
