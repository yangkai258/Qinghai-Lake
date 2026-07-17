import "dotenv/config";
import { promises as fs } from "node:fs";
import { sql } from "drizzle-orm";
import { db, schema } from "./client";


async function seedSources() {
  const defs = [
    { id: "feigua",        kind: "feigua", displayName: "\u98de\u74dc\uff08\u6296\u97f3\uff09", enabled: true,  cronExpr: process.env.INGEST_CRON_FEIGUA ?? "0 */1 * * *", config: {} },
    { id: "excel:finance", kind: "excel",  displayName: "\u8d22\u52a1 Excel\uff08\u624b\u5de5\uff09", enabled: false, cronExpr: process.env.INGEST_CRON_EXCEL ?? "0 */15 * * *", config: {} },
    { id: "sap:s4",        kind: "sap",    displayName: "SAP S/4HANA\uff08\u534a\u5e74\u540e\u542f\u7528\uff09", enabled: false, cronExpr: "0 0 * * *", config: {} },
  ];
  for (const d of defs) {
    await db.insert(schema.sources).values(d).onConflictDoNothing();
  }
  console.log("[seed] sources ok");
}

async function seedDouyinMock() {
  const jsonPath = new URL("./seed.mock.json", import.meta.url);
  const raw = await fs.readFile(jsonPath, "utf8");
  const payload = JSON.parse(raw);
  const capturedAt = payload.captured_at ?? new Date().toISOString();
  const sourceId = "feigua";
  const rows = [];
  for (const a of payload.accounts ?? []) {
    const dims = {
      dept: a.dept,
      person: a.person,
      douyin_name: a.douyin_name,
      status: a.status ?? "warn",
      __source: sourceId,
    };
    const push = (metric, val) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return;
      rows.push({
        capturedAt: new Date(capturedAt),
        entityId: a.name,
        entityKind: "douyin_account",
        metricName: metric,
        metricValue: String(n),
        dims,
        sourceId,
      });
    };
    push("plays_inc",   a.plays_inc);
    push("like_count",  a.like_count);
    push("fans_total",  a.fans_total);
    push("fans_inc",    a.fans_inc);
    push("works_total", a.works_total);
    push("rate",        a.rate);
  }
  if (rows.length === 0) {
    console.log("[seed] no rows to insert");
    return;
  }
  await db.execute(sql`DELETE FROM account_snapshots WHERE entity_kind = ''douyin_account'' AND captured_at = ${new Date(capturedAt)}::timestamptz`);
  const chunk = 200;
  for (let i = 0; i < rows.length; i += chunk) {
    await db.insert(schema.accountSnapshots).values(rows.slice(i, i + chunk));
  }
  console.log(`[seed] inserted ${rows.length} snapshot rows for ${payload.accounts.length} accounts at ${capturedAt}`);
}

async function main() {
  try {
    await seedSources();
    await seedDouyinMock();
    await db.execute(sql.raw(`CREATE OR REPLACE VIEW v_douyin_account_latest AS
      SELECT
        entity_id                                                    AS account_name,
        (dims ->> ''dept'')::text                                      AS dept,
        (dims ->> ''person'')::text                                    AS person,
        (dims ->> ''douyin_name'')::text                               AS douyin_name,
        (dims ->> ''status'')::text                                    AS status,
        MAX(CASE WHEN metric_name = ''plays_inc''   THEN metric_value END) AS plays_inc,
        MAX(CASE WHEN metric_name = ''like_count''  THEN metric_value END) AS like_count,
        MAX(CASE WHEN metric_name = ''fans_total''  THEN metric_value END) AS fans_total,
        MAX(CASE WHEN metric_name = ''fans_inc''    THEN metric_value END) AS fans_inc,
        MAX(CASE WHEN metric_name = ''works_total'' THEN metric_value END) AS works_total,
        MAX(CASE WHEN metric_name = ''rate''        THEN metric_value END) AS rate,
        MAX(captured_at)                                              AS captured_at
      FROM account_snapshots
      WHERE entity_kind = ''douyin_account''
      GROUP BY entity_id, dims;`));
    console.log("[seed] done");
  } catch (e) {
    console.error("[seed] FAIL", e);
    process.exit(1);
  }
  process.exit(0);
}

main();