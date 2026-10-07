import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// ─── SQLite via node:sqlite — zero-dependency, Doom-grade lean ───────────
// No ORM, no query compiler, no native add-on: the driver ships inside the
// runtime itself (Node 24 / Bun 1.3+). One file, honest SQL.
// CELESTIA GALLERIA keeps the Prisma exorcism permanent.

const DB_PATH =
  process.env.CELESTIA_DB_PATH ?? process.env.DOOM_DB_PATH ?? "db/custom.db";

export interface OrderRow {
  id: string;
  customer: string;
  items: string;
  total: number;
  credits: number;
  created_at: number;
}

// ── The Sprite Forge: pilgrim-uploaded 9-angle products, persisted ──
export interface CustomProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  blurb: string;
  /** hex accent for halo / ring / holo tint, e.g. "#2dd4bf" */
  accent: string;
  /** world display size in meters — the sofa-is-big mug-is-small control */
  sprite_w: number;
  sprite_h: number;
  /** atlas png filename inside UPLOADS_DIR */
  atlas_file: string;
  created_at: number;
}

/** how many empty shrines the temple holds for custom sprites */
export const MAX_CUSTOM_PRODUCTS = 10;

/** how many owned relics the Sanctum can hold at once */
export const MAX_SANCTUM_SLOTS = 10;

export const UPLOADS_DIR = "public/uploads/sprites";

/** a relic you actually bought — it takes flesh in the Sanctum */
export interface InventoryRow {
  product_id: string;
  qty: number;
  updated_at: number;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id         TEXT PRIMARY KEY,
      customer   TEXT NOT NULL DEFAULT 'WALK-IN',
      items      TEXT NOT NULL,
      total      REAL NOT NULL,
      credits    INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_products (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      category   TEXT NOT NULL DEFAULT 'CURATED',
      price      REAL NOT NULL DEFAULT 99,
      blurb      TEXT NOT NULL DEFAULT '',
      accent     TEXT NOT NULL DEFAULT '#2dd4bf',
      sprite_w   REAL NOT NULL DEFAULT 0.9,
      sprite_h   REAL NOT NULL DEFAULT 0.9,
      atlas_file TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      product_id TEXT PRIMARY KEY,
      qty        INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
  `);
  // one-time handoff from the old Prisma-managed table, then clean it up
  const legacy = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Order'")
    .get();
  if (legacy) {
    db.exec(`
      INSERT OR IGNORE INTO orders (id, customer, items, total, credits, created_at)
      SELECT id, customer, items, total, credits, CAST("createdAt" AS INTEGER) FROM "Order";
      DROP TABLE "Order";
    `);
  }
}

const globalForSqlite = globalThis as unknown as { __doomSqlite?: DatabaseSync };

function openDb(): DatabaseSync {
  // SQLite happily creates a missing FILE, but not a missing FOLDER —
  // make sure the parent directory exists before the first open.
  const target = DB_PATH === ":memory:" ? DB_PATH : resolve(process.cwd(), DB_PATH);
  if (target !== ":memory:") {
    try {
      mkdirSync(dirname(target), { recursive: true });
    } catch {
      /* read-only fs — let the open() below surface the real error */
    }
  }
  const d = new DatabaseSync(DB_PATH);
  try {
    d.exec("PRAGMA journal_mode = WAL;");
  } catch {
    /* read-only fs or locked — plain journal still works */
  }
  migrate(d);
  return d;
}

export const db: DatabaseSync = globalForSqlite.__doomSqlite ?? openDb();
// idempotent DDL — re-run on every (re)load so a hot-reloaded module that
// receives a CACHED connection still gets freshly-added tables.
try {
  migrate(db);
} catch {
  /* hot-reload race with a concurrent migrate — the table check is IF NOT EXISTS */
}
if (process.env.NODE_ENV !== "production") globalForSqlite.__doomSqlite = db;

export function insertOrder(
  o: Omit<OrderRow, "id" | "created_at">
): OrderRow {
  const row: OrderRow = { id: randomUUID(), created_at: Date.now(), ...o };
  db.prepare(
    "INSERT INTO orders (id, customer, items, total, credits, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(row.id, row.customer, row.items, row.total, row.credits, row.created_at);
  return row;
}

export function countOrders(): number {
  const r = db.prepare("SELECT COUNT(*) AS n FROM orders").get() as
    | { n: number }
    | undefined;
  return r?.n ?? 0;
}

// ── Sprite Forge CRUD ───────────────────────────────────────────────────────

export function listCustomProducts(): CustomProductRow[] {
  return db
    .prepare("SELECT * FROM custom_products ORDER BY created_at ASC")
    .all() as unknown as CustomProductRow[];
}

export function getCustomProduct(id: string): CustomProductRow | undefined {
  return db
    .prepare("SELECT * FROM custom_products WHERE id = ?")
    .get(id) as unknown as CustomProductRow | undefined;
}

export function countCustomProducts(): number {
  const r = db.prepare("SELECT COUNT(*) AS n FROM custom_products").get() as
    | { n: number }
    | undefined;
  return r?.n ?? 0;
}

/** place a freshly forged sprite on an empty shrine (caller saves the PNG) */
export function insertCustomProduct(
  p: Omit<CustomProductRow, "id" | "created_at">
): CustomProductRow {
  const row: CustomProductRow = {
    id: `forge-${randomUUID().slice(0, 8)}`,
    created_at: Date.now(),
    ...p,
  };
  db.prepare(
    `INSERT INTO custom_products
       (id, name, category, price, blurb, accent, sprite_w, sprite_h, atlas_file, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    row.id,
    row.name,
    row.category,
    row.price,
    row.blurb,
    row.accent,
    row.sprite_w,
    row.sprite_h,
    row.atlas_file,
    row.created_at
  );
  return row;
}

/** the live size control — resize a shrine resident without reload */
export function updateCustomProduct(
  id: string,
  patch: Partial<
    Pick<
      CustomProductRow,
      "name" | "category" | "price" | "blurb" | "accent" | "sprite_w" | "sprite_h"
    >
  >
): CustomProductRow | undefined {
  const cur = getCustomProduct(id);
  if (!cur) return undefined;
  const next = { ...cur, ...patch };
  db.prepare(
    `UPDATE custom_products
       SET name = ?, category = ?, price = ?, blurb = ?, accent = ?,
           sprite_w = ?, sprite_h = ?
     WHERE id = ?`
  ).run(
    next.name,
    next.category,
    next.price,
    next.blurb,
    next.accent,
    next.sprite_w,
    next.sprite_h,
    id
  );
  return next;
}

/** retire a shrine resident (caller removes the atlas file) */
export function deleteCustomProduct(id: string): boolean {
  const r = db.prepare("DELETE FROM custom_products WHERE id = ?").run(id);
  return r.changes > 0;
}

// ── THE SANCTUM INVENTORY — relics you actually own ──────────────────────

/** checkout delivery: upsert every purchased item into the inventory */
export function deliverToInventory(items: { id: string; qty: number }[]): void {
  const upsert = db.prepare(`
    INSERT INTO inventory (product_id, qty, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET
      qty = qty + excluded.qty,
      updated_at = excluded.updated_at
  `);
  const now = Date.now();
  for (const it of items) {
    const qty = Math.max(1, Math.min(99, Math.round(Number(it?.qty) || 1)));
    const id = String(it?.id ?? "").slice(0, 48);
    if (!id) continue;
    upsert.run(id, qty, now);
  }
}

export function listInventory(): InventoryRow[] {
  return db
    .prepare("SELECT * FROM inventory ORDER BY updated_at DESC")
    .all() as unknown as InventoryRow[];
}

export function getOwnedQty(productId: string): number {
  const r = db
    .prepare("SELECT qty FROM inventory WHERE product_id = ?")
    .get(productId) as unknown as { qty: number } | undefined;
  return r?.qty ?? 0;
}
