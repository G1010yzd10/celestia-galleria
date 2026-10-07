import { NextRequest, NextResponse } from "next/server";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import {
  deleteCustomProduct,
  getCustomProduct,
  updateCustomProduct,
  UPLOADS_DIR,
} from "@/lib/db";
import { rowToJSON } from "../route";

// ─── Single shrine resident: PATCH = live size control, DELETE = retire ────

function clampSize(v: unknown, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0.08, Math.min(6, n));
}

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const cur = getCustomProduct(id);
    if (!cur) {
      return NextResponse.json(
        { ok: false, error: "No such shrine resident." },
        { status: 404 }
      );
    }
    const body = await req.json();
    const patch: Parameters<typeof updateCustomProduct>[1] = {};

    if (body?.name !== undefined) {
      const name = String(body.name).trim().slice(0, 48);
      if (name.length < 2) {
        return NextResponse.json(
          { ok: false, error: "Name too short." },
          { status: 400 }
        );
      }
      patch.name = name;
    }
    if (body?.category !== undefined) {
      patch.category = String(body.category).trim().slice(0, 24).toUpperCase();
    }
    if (body?.price !== undefined) {
      patch.price = Math.max(1, Math.min(999999, Math.round(Number(body.price) || 1)));
    }
    if (body?.blurb !== undefined) {
      patch.blurb = String(body.blurb).trim().slice(0, 600);
    }
    if (body?.accent !== undefined) {
      const a = String(body.accent);
      patch.accent = /^#[0-9a-fA-F]{6}$/.test(a) ? a : cur.accent;
    }
    if (body?.spriteW !== undefined || body?.spriteH !== undefined) {
      // the sofa-is-big / mug-is-small dials, clamped to mortal ranges
      patch.sprite_w = clampSize(body.spriteW, cur.sprite_w);
      patch.sprite_h = clampSize(body.spriteH, cur.sprite_h);
    }

    const next = updateCustomProduct(id, patch);
    if (!next) {
      return NextResponse.json(
        { ok: false, error: "Update vanished — try again." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, product: rowToJSON(next) });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The Forge fire went out. Try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const cur = getCustomProduct(id);
    if (!cur) {
      return NextResponse.json(
        { ok: false, error: "No such shrine resident." },
        { status: 404 }
      );
    }
    if (deleteCustomProduct(id)) {
      try {
        rmSync(resolve(process.cwd(), UPLOADS_DIR, cur.atlas_file));
      } catch {
        /* file already gone — the shrine is still cleansed */
      }
      return NextResponse.json({ ok: true, retired: id });
    }
    return NextResponse.json(
      { ok: false, error: "Retirement failed." },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "The Forge fire went out. Try again." },
      { status: 500 }
    );
  }
}
