import { NextResponse } from "next/server";
import { listInventory } from "@/lib/db";

// ─── THE SANCTUM INVENTORY API ─────────────────────────────────────────────
// GET → every relic the pilgrim owns (product ids + quantities). The client
// turns these into living, usable props in the Sanctum wing.

export async function GET() {
  try {
    const rows = listInventory();
    return NextResponse.json({
      ok: true,
      items: rows.map((r) => ({ id: r.product_id, qty: r.qty })),
    });
  } catch {
    return NextResponse.json(
      { ok: false, items: [] as { id: string; qty: number }[] },
      { status: 500 }
    );
  }
}
