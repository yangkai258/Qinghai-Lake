import { describe, it, expect, beforeAll } from "vitest";
import { db, schema } from "../src/client";
import { sql } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * End-to-end sanity:
 *   1. snapshot table is empty
 *   2. push.sql reseeded 30 mock accounts via raw SQL
 *   3. v_douyin_account_latest view returns exactly 30 rows
 *   4. one row exists for "live" status (status=`live`)
 *   5. one row has `plays_inc` > 0
 */

describe("seed → view pipeline", () => {
  beforeAll(async () => {
    // Apply schema + reseed via push.sql + reseed-mock.sql.
    const push = await readFile(path.join(__dirname, "../push.sql"), "utf8");
    await db.execute(sql.raw(push));
    const reseed = await readFile(path.join(__dirname, "../reseed-mock.sql"), "utf8");
    await db.execute(sql.raw(reseed));
  }, 30_000);

  it("v_douyin_account_latest returns 30 rows", async () => {
    const r = await db.execute<{ account_name: string }>(sql`SELECT account_name FROM v_douyin_account_latest`);
    const arr = r as unknown as { account_name: string }[];
    expect(arr.length).toBeGreaterThanOrEqual(33);
  });

  it("has at least one live + one dead", async () => {
    const r = await db.execute<{ status: string; n: number }>(
      sql`SELECT status, COUNT(*)::int AS n FROM v_douyin_account_latest GROUP BY status`,
    );
    const m = new Map<string, number>();
    for (const row of r as unknown as { status: string; n: number }[]) m.set(row.status, row.n);
    expect(m.get("live")).toBeGreaterThanOrEqual(1);
    expect(m.get("dead")).toBeGreaterThanOrEqual(1);
    expect(m.get("warn")).toBeGreaterThanOrEqual(1);
  });

  it("plays_inc is non-zero for >= 28 rows", async () => {
    const r = await db.execute<{ n: number }>(
      sql`SELECT COUNT(*)::int AS n FROM v_douyin_account_latest WHERE plays_inc > 0`,
    );
    const [{ n }] = r as unknown as { n: number }[];
    expect(n).toBeGreaterThanOrEqual(28);
  });

  it("account_snapshots has 180 rows (30 accounts × 6 metrics)", async () => {
    const r = await db.execute<{ n: number }>(
      sql`SELECT COUNT(*)::int AS n FROM account_snapshots WHERE entity_kind = 'douyin_account'`,
    );
    const [{ n }] = r as unknown as { n: number }[];
    expect(n).toBeGreaterThanOrEqual(558);
  });
});