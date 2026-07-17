import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { BaseConnector, SnapshotRecord } from "../../base/types.js";

/**
 * Feigua connector — reads JSON files dropped into FEIGUA_INBOX by the
 * (future, separate) feigua-crawler cron that owns the cookie lifecycle.
 *
 * Expected JSON file shape:
 *   {
 *     "capturedAt": "2025-...",
 *     "source": "feigua",
 *     "accounts": [
 *       {
 *         "id": "卓小宝官方",
 *         "douyin_name": "...",
 *         "dept": "...",
 *         "person": "...",
 *         "status": "live" | "warn" | "dead",
 *         "plays_inc": 12345,
 *         "fans_total": 67890,
 *         ...
 *       }
 *     ]
 *   }
 *
 * json keys not in {"id","douyin_name","dept","person","status"} become
 * numeric metric_names (plays_inc, fans_total, ...) with their value as
 * metric_value. Known string metrics (status) are folded into dims.
 */
const FeiguaPayload = z.object({
  capturedAt: z.string().datetime(),
  source: z.string().optional(),
  accounts: z.array(z.object({ id: z.string() }).passthrough()),
});

const DIMS_KEYS = new Set(["douyin_name", "dept", "person", "status"]);

export const feiguaConnector: BaseConnector = {
  kind: "feigua",

  async validateConfig(config) {
    const inbox = String(config.inbox ?? "./inbox/feigua");
    void inbox; // folder may be empty on first run; do not throw
  },

  async fetch(ctx) {
    const inbox = String(ctx.config.inbox ?? "./inbox/feigua");
    let entries: string[] = [];
    try {
      entries = await readdir(inbox);
    } catch {
      ctx.log.warn(`feigua inbox not readable: ${inbox}`);
      return [];
    }
    const jsonFiles = entries.filter((f) => f.endsWith(".json")).sort();
    const out: SnapshotRecord[] = [];
    for (const file of jsonFiles) {
      const full = path.join(inbox, file);
      let raw: string;
      try {
        raw = await readFile(full, "utf8");
      } catch {
        ctx.log.warn(`skip unreadable ${full}`);
        continue;
      }
      let parsed: z.infer<typeof FeiguaPayload>;
      try {
        parsed = FeiguaPayload.parse(JSON.parse(raw));
      } catch {
        ctx.log.warn(`skip invalid json ${full}`);
        continue;
      }
      const capturedAt = new Date(parsed.capturedAt);
      for (const acc of parsed.accounts) {
        const dims: Record<string, unknown> = { __source: "feigua" };
        for (const [k, v] of Object.entries(acc)) {
          if (k === "id") continue;
          if (DIMS_KEYS.has(k)) {
            dims[k] = v;
            continue;
          }
          if (typeof v === "number" && Number.isFinite(v)) {
            out.push({
              entityKind: "douyin_account",
              entityId: acc.id,
              metricName: k,
              value: v,
              capturedAt,
              dims,
            });
          } else if (typeof v === "string") {
            // numeric metrics occasionally arrive as strings — coerce.
            const n = Number(v);
            if (Number.isFinite(n)) {
              out.push({
                entityKind: "douyin_account",
                entityId: acc.id,
                metricName: k,
                value: n,
                capturedAt,
                dims,
              });
            }
          }
        }
      }
    }
    return out;
  },
};