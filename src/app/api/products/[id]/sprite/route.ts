import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getCustomProduct, UPLOADS_DIR } from "@/lib/db";

// ─── Serve a shrine resident's 9-frame atlas PNG (immutable, cacheable) ────
// Route-served instead of public/-served so runtime uploads work in every
// environment (dev, standalone, read-only public dirs).

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const row = getCustomProduct(id);
  if (!row) {
    return NextResponse.json(
      { ok: false, error: "No such shrine resident." },
      { status: 404 }
    );
  }
  try {
    const buf = readFileSync(resolve(process.cwd(), UPLOADS_DIR, row.atlas_file));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Atlas file missing from the reliquary." },
      { status: 404 }
    );
  }
}
