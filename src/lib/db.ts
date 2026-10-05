import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

// ─── SQLite via node:sqlite — zero-dependency, Doom-grade lean ───────────────
// No ORM, no query compiler, no native add-on: the driver ships inside the
// runtime itself (Node 24 / Bun 1.3+). One file, one table, honest SQL.

const DB_PATH = process.env.DOOM_DB_PATH ?? "db/custom.db";

export interface OrderRow {
  id: string;
  customer: string;
  items: string;
  total: number;
  credits: number;
  created_at: number;
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
