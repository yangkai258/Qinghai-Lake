// Distributed collector: lives on any machine, talks only HTTP, never
// touches PostgreSQL. Reads the admin URL + token from env, fetches
// feigua via @data-tw/feigua-client, pushes EAV rows to the ingest
// API. On any failure, logs and retries on the next tick.

import "dotenv/config";
import cron from "node-cron";
import pino from "pino";
import { fetchFeiguaAccounts } from "@data-tw/feigua-client";
import { push, type SnapshotRow } from "@data-tw/collector-sdk";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

const CRON       = process.env.INGEST_CRON_FEIGUA ?? "0 */1 * * *"; // hourly
const COOKIE     = process.env.FEIGUA_COOKIE ?? "";                 // session cookie from feigua web
const BASE_URL   = process.env.FEIGUA_BASE_URL ?? "";               // feigua endpoint (or empty => synthetic)
const ADMIN_URL  = process.env.DATA_TW_ADMIN_URL;                   // e.g. http://172.16.120.120:3004
const SOURCE_ID  = process.env.DATA_TW_SOURCE_ID ?? "feigua";
const TOKEN      = process.env.DATA_TW_INGEST_TOKEN;                // dtw_ingest_xxx
const COLLECTOR  = process.env.COLLECTOR_NAME ?? `${process.platform}-${process.env.USERNAME ?? "anon"}`;

if (!ADMIN_URL || !TOKEN) {
  log.error("DATA_TW_ADMIN_URL and DATA_TW_INGEST_TOKEN are required; this collector refuses to start without them");
  process.exit(2);
}

let running = false;

async function tickOnce() {
  if (running) { log.warn("previous tick still running, skipping"); return; }
  running = true;
  const started = new Date();
  try {
    const capturedAt = new Date();
    const payload = await fetchFeiguaAccounts({ cookie: COOKIE, baseUrl: BASE_URL });
    const rows: SnapshotRow[] = [];
    for (const a of payload.accounts) {
      // Each numeric field becomes one EAV row. Tying them together
      // is the server''s job (by capturedAt + entityId), not ours.
      const rowBase = {
        entityKind: "douyin_account",
        entityId:   a.id,
        entityName: a.douyin_name,
        capturedAt,
        dims: {
          dept: (a as { dept?: unknown }).dept,
          person: (a as { person?: unknown }).person,
          status: (a as { status?: unknown }).status,
          collector: COLLECTOR,
        },
      };
      const numeric = [
        ["plays_inc", (a as { plays_inc?: number }).plays_inc],
        ["like_count", (a as { like_count?: number }).like_count],
        ["fans_total", (a as { fans_total?: number }).fans_total],
        ["fans_inc",   (a as { fans_inc?: number }).fans_inc],
        ["works_total",(a as { works_total?: number }).works_total],
        ["rate",       (a as { rate?: number }).rate],
      ] as const;
      for (const [metricName, value] of numeric) {
        if (typeof value === "number" && Number.isFinite(value)) {
          rows.push({ ...rowBase, metricName, value });
        }
      }
    }
    const r = await push({
      baseUrl: ADMIN_URL,
      token: TOKEN,
      sourceId: SOURCE_ID,
      capturedAt,
      rows,
    });
    if (r.ok) log.info({ rows: r.rows, runId: r.runId, accounts: payload.accounts.length }, "feigua push ok");
    else       log.error({ ...r, accounts: payload.accounts.length }, "feigua push failed");
  } catch (e: unknown) {
    log.error({ err: e instanceof Error ? e.message : String(e) }, "feigua tick failed");
  } finally {
    running = false;
    log.info({ elapsed_ms: Date.now() - started.getTime() }, "tick elapsed");
  }
}

async function main() {
  log.info({ source: SOURCE_ID, cron: CRON, admin: ADMIN_URL, hasCookie: Boolean(COOKIE), collector: COLLECTOR }, "feigua-worker starting");
  await tickOnce();
  if (!cron.validate(CRON)) {
    log.error({ cron: CRON }, "invalid cron expr, will only run on startup");
    return;
  }
  cron.schedule(CRON, () => { void tickOnce(); });
  const stop = () => { log.info("shutting down"); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  log.error({ err: e instanceof Error ? e.message : String(e) }, "fatal");
  process.exit(1);
});