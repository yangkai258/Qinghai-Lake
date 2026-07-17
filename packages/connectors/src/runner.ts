import { config as loadEnv } from "dotenv";
loadEnv();
import { log } from "./base/logger.js";
import { startScheduler } from "./base/scheduler.js";
import { listEnabledSources } from "./base/registry.js";
import { runOnce } from "./base/registry.js";

async function main() {
  log.info("ingestion runner starting");
  // Eagerly run all enabled sources once at startup so a fresh box has data.
  const sources = await listEnabledSources();
  for (const s of sources) {
    log.info({ sourceId: s.id, kind: s.kind }, "eager run");
    const r = await runOnce(s.id, log);
    if (!r.ok) log.error({ sourceId: s.id, error: r.error }, "eager run failed");
    else log.info({ sourceId: s.id, rows: r.rows }, "eager run ok");
  }
  await startScheduler(log);
  log.info("scheduler started");

  let shuttingDown = false;
  const stop = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info("shutting down");
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
const runner = main().catch((e) => {
  log.error({ err: e }, "fatal");
  process.exit(1);
});
export default runner;