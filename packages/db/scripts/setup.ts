/**
 * db:setup — bootstrap a fresh DB by applying every migration in order.
 * Idempotent: each statement uses IF NOT EXISTS so re-runs are safe.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
import { db } from "../src/client";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";

async function main() {
  const dir = path.join(__dirname, "..", "migrations");
  const entries = (await readdir(dir, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && /^\d{4}_/.test(d.name))
    .map((d) => d.name)
    .sort();
  for (const e of entries) {
    const f = path.join(dir, e, "migration.sql");
    const body = await readFile(f, "utf8");
    console.log(`[db:setup] applying ${e}`);
    await db.execute(sql.raw(body));
  }
  console.log("[db:setup] done");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });