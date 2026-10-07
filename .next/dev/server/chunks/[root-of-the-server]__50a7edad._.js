module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "countOrders",
    ()=>countOrders,
    "db",
    ()=>db,
    "insertOrder",
    ()=>insertOrder
]);
var __TURBOPACK__url__external__node$3a$sqlite__ = __turbopack_context__.x("node:sqlite", ()=>require("node:sqlite"), true);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
;
;
;
// ─── SQLite via node:sqlite — zero-dependency, Doom-grade lean ───────────
// No ORM, no query compiler, no native add-on: the driver ships inside the
// runtime itself (Node 24 / Bun 1.3+). One file, one table, honest SQL.
// CELESTIA GALLERIA keeps the Prisma exorcism permanent.
const DB_PATH = process.env.CELESTIA_DB_PATH ?? process.env.DOOM_DB_PATH ?? "db/custom.db";
function migrate(db) {
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
    const legacy = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Order'").get();
    if (legacy) {
        db.exec(`
      INSERT OR IGNORE INTO orders (id, customer, items, total, credits, created_at)
      SELECT id, customer, items, total, credits, CAST("createdAt" AS INTEGER) FROM "Order";
      DROP TABLE "Order";
    `);
    }
}
const globalForSqlite = globalThis;
function openDb() {
    // SQLite happily creates a missing FILE, but not a missing FOLDER —
    // make sure the parent directory exists before the first open.
    const target = DB_PATH === ":memory:" ? DB_PATH : (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["resolve"])(process.cwd(), DB_PATH);
    if (target !== ":memory:") {
        try {
            (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["mkdirSync"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["dirname"])(target), {
                recursive: true
            });
        } catch  {
        /* read-only fs — let the open() below surface the real error */ }
    }
    const d = new __TURBOPACK__url__external__node$3a$sqlite__["DatabaseSync"](DB_PATH);
    try {
        d.exec("PRAGMA journal_mode = WAL;");
    } catch  {
    /* read-only fs or locked — plain journal still works */ }
    migrate(d);
    return d;
}
const db = globalForSqlite.__doomSqlite ?? openDb();
if ("TURBOPACK compile-time truthy", 1) globalForSqlite.__doomSqlite = db;
function insertOrder(o) {
    const row = {
        id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])(),
        created_at: Date.now(),
        ...o
    };
    db.prepare("INSERT INTO orders (id, customer, items, total, credits, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(row.id, row.customer, row.items, row.total, row.credits, row.created_at);
    return row;
}
function countOrders() {
    const r = db.prepare("SELECT COUNT(*) AS n FROM orders").get();
    return r?.n ?? 0;
}
}),
"[project]/src/app/api/checkout/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
;
async function POST(req) {
    try {
        const body = await req.json();
        const items = Array.isArray(body?.items) ? body.items : [];
        const customer = typeof body?.customer === "string" && body.customer.trim().length > 0 ? body.customer.trim().slice(0, 64) : "WALK-IN";
        if (items.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: "Cart is empty — nothing to check out."
            }, {
                status: 400
            });
        }
        // Re-validate server-side (never trust client totals)
        let total = 0;
        const safeItems = items.slice(0, 64).map((it)=>{
            const qty = Math.max(1, Math.min(99, Math.round(Number(it?.qty) || 1)));
            const price = Math.max(0, Number(it?.price) || 0);
            total += price * qty;
            return {
                id: String(it?.id ?? "unknown").slice(0, 48),
                name: String(it?.name ?? "Item").slice(0, 96),
                price: Math.round(price * 100) / 100,
                qty
            };
        });
        total = Math.round(total * 100) / 100;
        const order = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["insertOrder"])({
            customer,
            items: JSON.stringify(safeItems),
            total,
            credits: Math.round(total)
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            orderId: order.id,
            total,
            sector: "CELESTIA",
            message: "ORDER PLACED — BLESSINGS RENDERED"
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "Checkout terminal offline. Try again."
        }, {
            status: 500
        });
    }
}
async function GET() {
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: true,
            orders: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["countOrders"])()
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            orders: 0
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__50a7edad._.js.map