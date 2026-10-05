import { NextRequest, NextResponse } from "next/server";
import { countOrders, insertOrder } from "@/lib/db";

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: CartItem[] = Array.isArray(body?.items) ? body.items : [];
    const customer: string =
      typeof body?.customer === "string" && body.customer.trim().length > 0
        ? body.customer.trim().slice(0, 64)
        : "WALK-IN";

    if (items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Cart is empty — nothing to check out." },
        { status: 400 }
      );
    }

    // Re-validate server-side (never trust client totals)
    let total = 0;
    const safeItems = items.slice(0, 64).map((it) => {
      const qty = Math.max(1, Math.min(99, Math.round(Number(it?.qty) || 1)));
      const price = Math.max(0, Number(it?.price) || 0);
      total += price * qty;
      return {
        id: String(it?.id ?? "unknown").slice(0, 48),
        name: String(it?.name ?? "Item").slice(0, 96),
        price: Math.round(price * 100) / 100,
        qty,
      };
    });
    total = Math.round(total * 100) / 100;

    const order = insertOrder({
      customer,
      items: JSON.stringify(safeItems),
      total,
      credits: Math.round(total),
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      total,
      sector: "CELESTIA",
      message: "ORDER PLACED — BLESSINGS RENDERED",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Checkout terminal offline. Try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, orders: countOrders() });
  } catch {
    return NextResponse.json({ ok: false, orders: 0 }, { status: 500 });
  }
}
