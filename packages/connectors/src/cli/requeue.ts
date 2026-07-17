import { config as loadEnv } from "dotenv";
loadEnv();
import { log } from "../base/logger.js";
import { runOnce } from "../base/registry.js";
import { db } from "@data-tw/db";
import { ingestionRuns, sources } from "@data-tw/db/schema";
import { desc, eq } from "drizzle-orm";

const [lastFailed] = await db
  .select()
  .from(ingestionRuns)
  .where(eq(ingestionRuns.status, "error"))
  .orderBy(desc(ingestionRuns.finishedAt))
  .limit(1);

if (!lastFailed) {
  log.info("no failed runs to requeue");
  process.exit(0);
}
const [src] = await db.select().from(sources).where(eq(sources.id, lastFailed.sourceId));
if (!src) {
  log.error({ sourceId: lastFailed.sourceId }, "source missing");
  process.exit(1);
}
const r = await runOnce(src.id, log);
log.info({ sourceId: src.id, ...r }, "requeue result");
process.exit(r.ok ? 0 : 1);