import "dotenv/config";
import { mkdir, writeFile, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import cron from "node-cron";
import pino from "pino";
import { fetchFeiguaAccounts } from "@data-tw/feigua-client";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

const INBOX = process.env.FEIGUA_INBOX
  ?? path.join(process.cwd(), "inbox", "feigua");
const CRON = process.env.INGEST_CRON_FEIGUA ?? "0 */1 * * *"; // hourly
const COOKIE = process.env.FEIGUA_COOKIE ?? "";
const BASE_URL = process.env.FEIGUA_BASE_URL ?? "";

let running = false;

async function tickOnce() {
  if (running) {
    log.warn("previous tick still running, skipping");
    return;
  }
  running = true;
  const started = new Date();
  try {
    const payload = await fetchFeiguaAccounts({ cookie: COOKIE, baseUrl: BASE_URL });
    await mkdir(INBOX, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = path.join(INBOX, `feigua-${stamp}.json`);
    await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
    log.info({ file, accounts: payload.accounts.length }, "feigua tick ok");

    // Garbage-collect inbox: keep only last 50 files (rough FIFO).
    const entries = (await readdir(INBOX)).filter((f) => f.endsWith(".json")).sort();
    if (entries.length > 50) {
      const toDelete = entries.slice(0, entries.length - 50);
      for (const f of toDelete) {
        try { await unlink(path.join(INBOX, f)); } catch {/* best effort */}
      }
      log.info({ deleted: toDelete.length }, "inbox gc");
    }
  } catch (e: unknown) {
    log.error({ err: e instanceof Error ? e.message : String(e) }, "feigua tick failed");
  } finally {
    running = false;
    log.info({ elapsed_ms: Date.now() - started.getTime() }, "tick elapsed");
  }
}

async function main() {
  log.info({ inbox: INBOX, cron: CRON, hasCookie: Boolean(COOKIE), baseUrl: BASE_URL || "(synthetic)" }, "feigua-worker starting");

  // Initial run on boot so the dashboard has data immediately.
  await tickOnce();

  if (!cron.validate(CRON)) {
    log.error({ cron: CRON }, "invalid cron expr, will only run on startup");
    return;
  }
  cron.schedule(CRON, () => { void tickOnce(); });

  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    log.info("shutting down");
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  log.error({ err: e instanceof Error ? e.message : String(e) }, "fatal");
  process.exit(1);
});