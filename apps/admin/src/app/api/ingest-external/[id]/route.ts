import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { accountSnapshots, ingestionRuns, sources } from "@data-tw/db/schema";
import { eq } from "drizzle-orm";
import { extractBearer, hashIngestToken } from "@/lib/ingestToken";

// Body contract:
//   {
//     "capturedAt": "2026-07-21T08:00:00Z",         // optional, default = now()
//     "rows": [
//       { "entityKind": "douyin_account",
//         "entityId":   "account-123",
//         "entityName": "example",                   // optional, written only as a dim
//         "metricName": "fans_total",
//         "value":      528000,                      // numeric preferred
//         "valueStr":   null,                        // optional string metric
//         "dims":       { "dept": "q3-team", ... }   // optional jsonb
//       },
//       ...
//     ]
//   }
//
// Max 5000 rows per call. Idempotent on (entityKind, entityId, metricName, capturedAt).

const MAX_ROWS = 5000;

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

type SnapshotInsert = typeof accountSnapshots.$inferInsert;
type Coerced =
  | { ok: false; error: string }
  | { ok: true; row: Omit<SnapshotInsert, "sourceId"> };

function coerceRow(r: unknown): Coerced {
  if (!r || typeof r !== "object") return { ok: false, error: "row is not an object" };
  const o = r as Record<string, unknown>;
  const entityKind = String(o.entityKind ?? "").trim();
  const entityId = String(o.entityId ?? "").trim();
  const metricName = String(o.metricName ?? "").trim();
  if (!entityKind || entityKind.length > 64) return { ok: false, error: "entityKind invalid" };
  if (!entityId || entityId.length > 128) return { ok: false, error: "entityId invalid" };
  if (!metricName || metricName.length > 128) return { ok: false, error: "metricName invalid" };
  const dims: Record<string, unknown> = { ...(typeof o.dims === "object" && o.dims ? o.dims as Record<string, unknown> : {}) };
  if (typeof o.entityName === "string" && o.entityName.length <= 256) dims.entity_name = o.entityName;
  let metricValue: string | null = null;
  if (isFiniteNumber(o.value)) metricValue = String(o.value);
  else if (typeof o.valueStr === "string" && o.valueStr.length <= 2048) metricValue = o.valueStr;
  else if (o.value == null && o.valueStr == null) metricValue = null;
  else return { ok: false, error: "value must be a finite number or valueStr" };
  const capturedAt = o.capturedAt ? new Date(String(o.capturedAt)) : new Date();
  if (Number.isNaN(capturedAt.getTime())) return { ok: false, error: "capturedAt is not a valid date" };
  return { ok: true, row: {
    entityKind, entityId, metricName,
    metricValue,
    capturedAt,
    dims,
  }};
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return new NextResponse("missing bearer token", { status: 401 });
  const tokenHash = hashIngestToken(token);

  const [src] = await db.select().from(sources).where(eq(sources.id, id)).limit(1);
  if (!src) return new NextResponse("source not found", { status: 404 });
  if (!src.enabled) return new NextResponse("source disabled", { status: 403 });
  if (!src.ingestTokenHash || src.ingestTokenHash !== tokenHash) {
    return new NextResponse("invalid token", { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return new NextResponse("invalid JSON", { status: 400 }); }
  if (!body || typeof body !== "object") return new NextResponse("body must be an object", { status: 400 });
  const b = body as Record<string, unknown>;
  const rowsIn = b.rows;
  if (!Array.isArray(rowsIn) || rowsIn.length === 0) return new NextResponse("rows[] is required", { status: 400 });
  if (rowsIn.length > MAX_ROWS) return new NextResponse(`too many rows (max ${MAX_ROWS})`, { status: 413 });

  const coerced: SnapshotInsert[] = [];
  for (const r of rowsIn) {
    const c = coerceRow(r);
    if (!c.ok) return new NextResponse(`bad row: ${c.error}`, { status: 400 });
    coerced.push({ ...c.row, sourceId: id });
  }

  const [run] = await db.insert(ingestionRuns).values({
    sourceId: id,
    status: "running",
  }).returning({ id: ingestionRuns.id });

  try {
    // batch insert; ON CONFLICT DO NOTHING via unique index uniq_snap_entity_metric_capture
    await db.insert(accountSnapshots).values(coerced).onConflictDoNothing();
    await db.update(ingestionRuns).set({
      status: "success",
      finishedAt: new Date(),
      rowsWritten: coerced.length,
    }).where(eq(ingestionRuns.id, run.id));
    await db.update(sources).set({
      lastRunAt: new Date(),
      lastStatus: "ok",
      lastError: null,
    }).where(eq(sources.id, id));
    return NextResponse.json({ ok: true, rows: coerced.length, runId: run.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.update(ingestionRuns).set({
      status: "fail",
      finishedAt: new Date(),
      errorText: msg,
      rowsWritten: 0,
    }).where(eq(ingestionRuns.id, run.id));
    await db.update(sources).set({
      lastRunAt: new Date(),
      lastStatus: "fail",
      lastError: msg,
    }).where(eq(sources.id, id));
    return NextResponse.json({ ok: false, error: msg, runId: run.id }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return new NextResponse("missing bearer token", { status: 401 });
  const tokenHash = hashIngestToken(token);
  const [src] = await db.select({ enabled: sources.enabled, hash: sources.ingestTokenHash, kind: sources.kind })
    .from(sources).where(eq(sources.id, id)).limit(1);
  if (!src || !src.hash || src.hash !== tokenHash) return new NextResponse("invalid token", { status: 401 });
  return NextResponse.json({ ok: true, sourceId: id, enabled: src.enabled, kind: src.kind });
}