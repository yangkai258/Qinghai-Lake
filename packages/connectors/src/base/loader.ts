import { db } from "@data-tw/db";
import { accountSnapshots, ingestionRuns } from "@data-tw/db/schema";
import type { SnapshotRecord } from "./types.js";

/**
 * Insert snapshots in chunks with onConflictDoNothing on
 * (entity_kind, entity_id, metric_name, captured_at).
 * ponytail: snapshots are append-only fact rows; idempotency lets us
 * re-run safely on retry. Ceiling: >50k rows / source should chunk more
 * aggressively to keep each SQL txn small.
 */
export async function loadSnapshots(sourceId: string, rows: SnapshotRecord[]): Promise<number> {
  if (rows.length === 0) return 0;
  const CHUNK = 500;
  let written = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const payload = slice.map((r) => ({
      sourceId,
      entityKind: r.entityKind,
      entityId: r.entityId,
      // NB: schema has no entityName column; name lives in dims.entity_name if needed.
      metricName: r.metricName,
      metricValue: r.value !== undefined ? String(r.value) : null,
      // string metrics also go through metric_value as null and use valueStr-less: not supported today.
      capturedAt: r.capturedAt,
      dims: r.dims ?? {},
    }));
    await db.insert(accountSnapshots).values(payload).onConflictDoNothing();
    written += slice.length;
  }
  return written;
}

export async function logRun(opts: {
  sourceId: string;
  startedAt: Date;
  finishedAt: Date;
  rowsWritten: number;
  status: "ok" | "error";
  error?: string;
}) {
  await db.insert(ingestionRuns).values({
    sourceId: opts.sourceId,
    startedAt: opts.startedAt,
    finishedAt: opts.finishedAt,
    rowsWritten: opts.rowsWritten,
    status: opts.status,
    error: opts.error ?? null,
  } as any);
}