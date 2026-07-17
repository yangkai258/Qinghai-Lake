import cron from "node-cron";
import { listEnabledSources } from "./registry.js";
import { runOnce } from "./registry.js";
import type { Logger } from "pino";

/**
 * Schedule each enabled source by its cron_expr. Single-process scheduler
 * (no leader election) — fine for a macmini single-node deployment.
 * ponytail: if you move to multi-node, gate this with a PG advisory lock.
 */
export async function startScheduler(log: Logger) {
  const sources = await listEnabledSources();
  for (const s of sources) {
    if (!s.cronExpr) continue;
    if (!cron.validate(s.cronExpr)) {
      log.warn({ sourceId: s.id, cronExpr: s.cronExpr }, "invalid cron expr, skipping");
      continue;
    }
    cron.schedule(s.cronExpr, async () => {
      log.info({ sourceId: s.id }, "cron tick");
      const r = await runOnce(s.id, log);
      if (!r.ok) log.error({ sourceId: s.id, error: r.error }, "run failed");
      else log.info({ sourceId: s.id, rows: r.rows }, "run ok");
    });
    log.info({ sourceId: s.id, cronExpr: s.cronExpr }, "scheduled");
  }
}