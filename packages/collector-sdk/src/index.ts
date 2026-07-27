// Collector SDK: turns row-shaped facts into idempotent POST batches aimed
// at the admin ingest-external API.
//
// There is deliberately no DB connection, no business logic, no session
// state beyond the token. Collectors can be rewritten, moved to another
// box, or rotated, and the SDK stays the same.
//
// Uses Node 20+ built-in `fetch`, not `undici`, so no new dependency
// is added by this package.

import { z } from "zod";

export const SnapshotRowSchema = z.object({
  entityKind: z.string().min(1).max(64),
  entityId:   z.string().min(1).max(128),
  entityName: z.string().max(256).optional(),
  metricName: z.string().min(1).max(128),
  value:      z.number().finite().optional(),
  valueStr:   z.string().max(2048).optional(),
  capturedAt: z.coerce.date().optional(),
  dims:       z.record(z.unknown()).optional(),
});
export type SnapshotRow = z.infer<typeof SnapshotRowSchema>;

export interface PushOptions {
  baseUrl: string;        // e.g. http://172.16.120.120:3004
  token: string;          // bearer dtw_ingest_xxx
  sourceId: string;       // matches /api/ingest-external/[id]
  capturedAt?: Date;
  rows: SnapshotRow[];
  batchSize?: number;     // default 500, hard server-side ceiling 5000
  timeoutMs?: number;     // default 30000
}

export interface PushResult { ok: true; rows: number; runId: number; }
export interface PushFailure { ok: false; status: number; error: string; }

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

async function postJson(url: string, token: string, body: string, timeoutMs: number): Promise<{ status: number; json: unknown }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body,
      signal: ac.signal,
    });
    let json: unknown = null;
    try { json = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, json };
  } finally { clearTimeout(timer); }
}

export async function push(opts: PushOptions): Promise<PushResult | PushFailure> {
  const baseUrl = opts.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/api/ingest-external/${encodeURIComponent(opts.sourceId)}`;
  const batchSize = Math.min(opts.batchSize ?? 500, 5000);
  const capturedAt = opts.capturedAt ?? new Date();
  const timeoutMs = opts.timeoutMs ?? 30000;

  let totalRows = 0;
  let lastRunId = 0;

  for (const part of chunk(opts.rows, batchSize)) {
    const body = JSON.stringify({ capturedAt: capturedAt.toISOString(), rows: part });
    const { status, json } = await postJson(url, opts.token, body, timeoutMs);
    const parsed = json as { ok?: boolean; rows?: number; runId?: number; error?: string } | null;
    if (status >= 200 && status < 300) {
      if (parsed && parsed.ok) {
        totalRows += parsed.rows ?? part.length;
        if (parsed.runId) lastRunId = parsed.runId;
      } else {
        return { ok: false, status, error: "unexpected success body" };
      }
    } else {
      const msg = parsed && typeof parsed.error === "string" ? parsed.error : `HTTP ${status}`;
      return { ok: false, status, error: msg };
    }
  }
  return { ok: true, rows: totalRows, runId: lastRunId };
}

export async function ping(baseUrl: string, sourceId: string, token: string): Promise<{ ok: boolean; status: number }> {
  const url = `${baseUrl.replace(/\/+$/, "")}/api/ingest-external/${encodeURIComponent(sourceId)}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 5000);
  try {
    const res = await fetch(url, { method: "GET", headers: { authorization: `Bearer ${token}` }, signal: ac.signal });
    await res.arrayBuffer().catch(() => undefined);
    return { ok: res.status === 200, status: res.status };
  } finally { clearTimeout(timer); }
}