import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import {
  countCustomProducts,
  insertCustomProduct,
  listCustomProducts,
  MAX_CUSTOM_PRODUCTS,
  UPLOADS_DIR,
  type CustomProductRow,
} from "@/lib/db";

// ─── The Sprite Forge API — pilgrim sprites become persistent shrines ──────
// POST takes the FINAL atlas (a 9-frame horizontal strip PNG the client
// composed + background-removed + trimmed) plus the product's worldly data —
// including the all-important world size in meters (sofa big, mug small).

export interface CustomProductJSON {
  id: string;
  name: string;
  category: string;
  price: number;
  blurb: string;
  accent: string;
  spriteW: number;
  spriteH: number;
  spriteUrl: string;
  createdAt: number;
}

export function rowToJSON(row: CustomProductRow): CustomProductJSON {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    blurb: row.blurb,
    accent: row.accent,
    spriteW: row.sprite_w,
    spriteH: row.sprite_h,
    spriteUrl: `/api/products/${row.id}/sprite`,
    createdAt: row.created_at,
  };
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const MAX_ATLAS_BYTES = 16 * 1024 * 1024; // 16 MB decoded PNG — generous

function clampSize(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0.9;
  return Math.max(0.08, Math.min(6, n));
}

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      products: listCustomProducts().map(rowToJSON),
      slots: { used: countCustomProducts(), total: MAX_CUSTOM_PRODUCTS },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The Forge ledger is unavailable." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim().slice(0, 48);
    if (name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Give the relic a name (2+ characters)." },
        { status: 400 }
      );
    }

    const dataUrl = String(body?.atlasDataUrl ?? "");
    const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!m) {
      return NextResponse.json(
        { ok: false, error: "Atlas must be a PNG data-URL from the Forge." },
        { status: 400 }
      );
    }
    const buf = Buffer.from(m[1], "base64");
    if (buf.length < 256) {
      return NextResponse.json(
        { ok: false, error: "That PNG looks empty." },
        { status: 400 }
      );
    }
    if (buf.length > MAX_ATLAS_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Atlas exceeds 16 MB — slim the frames." },
        { status: 413 }
      );
    }

    if (countCustomProducts() >= MAX_CUSTOM_PRODUCTS) {
      return NextResponse.json(
        {
          ok: false,
          error: `All ${MAX_CUSTOM_PRODUCTS} custom shrines are occupied — retire one first.`,
        },
        { status: 409 }
      );
    }

    const accentRaw = String(body?.accent ?? "#2dd4bf");
    const accent = HEX.test(accentRaw) ? accentRaw : "#2dd4bf";
    const price = Math.max(1, Math.min(999999, Math.round(Number(body?.price) || 99)));
    const spriteW = clampSize(body?.spriteW);
    const spriteH = clampSize(body?.spriteH);

    // atlas filename is a random token (the product id arrives on insert)
    const file = `forge-${randomUUID().slice(0, 10)}.png`;
    const row = insertCustomProduct({
      name,
      category: String(body?.category ?? "CURATED").trim().slice(0, 24).toUpperCase(),
      price,
      blurb: String(body?.blurb ?? "").trim().slice(0, 600),
      accent,
      sprite_w: spriteW,
      sprite_h: spriteH,
      atlas_file: file,
    });

    // persist the atlas (public/ so a prod build could ship it too)
    const dir = resolve(process.cwd(), UPLOADS_DIR);
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, file), buf);

    return NextResponse.json({ ok: true, product: rowToJSON(row) });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The Forge fire went out. Try again." },
      { status: 500 }
    );
  }
}
