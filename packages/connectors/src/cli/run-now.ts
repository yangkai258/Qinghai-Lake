import { config as loadEnv } from "dotenv";
loadEnv();
import { log } from "../base/logger.js";
import { runOnce } from "../base/registry.js";

const id = process.argv[2];
if (!id) {
  console.error("usage: pnpm ingest:now <sourceId>");
  process.exit(2);
}
const r = await runOnce(id, log);
if (r.ok) {
  log.info({ sourceId: id, rows: r.rows }, "run-now ok");
  process.exit(0);
} else {
  log.error({ sourceId: id, error: r.error }, "run-now failed");
  process.exit(1);
}