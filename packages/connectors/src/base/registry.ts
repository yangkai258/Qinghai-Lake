import { db } from "@data-tw/db";
import { sources } from "@data-tw/db/schema";
import { eq } from "drizzle-orm";
import { feiguaConnector } from "../connectors/feigua/index";
import { excelConnector } from "../connectors/excel/index";
import { sapConnector } from "../connectors/sap/index";
import type { BaseConnector } from "./types";
import type { Logger } from "pino";

const registry: Record<string, BaseConnector> = {
  feigua: feiguaConnector,
  excel: excelConnector,
  sap: sapConnector,
};

export function connectorFor(kind: string): BaseConnector | undefined {
  return registry[kind];
}

export function listKnownKinds(): string[] {
  return Object.keys(registry);
}

export async function listEnabledSources(): Promise<
  Array<{ id: string; kind: string; name: string; config: Record<string, unknown>; cronExpr: string | null }>
> {
  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.enabled, true));
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    name: r.displayName,
    config: (r.config as Record<string, unknown>) ?? {},
    cronExpr: r.cronExpr,
  }));
}

/**
 * Run one source once. Updates source.last_run_at on success.
 */
export async function runOnce(sourceId: string, log: Logger): Promise<{ ok: boolean; rows: number; error?: string }> {
  const started = new Date();
  const [row] = await db.select().from(sources).where(eq(sources.id, sourceId));
  if (!row) return { ok: false, rows: 0, error: "source not found" };
  if (!row.enabled) return { ok: false, rows: 0, error: "source disabled" };

  const conn = connectorFor(row.kind);
  if (!conn) return { ok: false, rows: 0, error: `unknown kind: ${row.kind}` };

  const config = (row.config as Record<string, unknown>) ?? {};
  try {
    await conn.validateConfig(config);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, rows: 0, error: `validateConfig failed: ${msg}` };
  }

  try {
    const snapshots = await conn.fetch({
      sourceId: row.id,
      config,
      log: { info: (m, x) => log.info(x ?? {}, m), warn: (m, x) => log.warn(x ?? {}, m), error: (m, x) => log.error(x ?? {}, m) },
    });
    const written = await import("./loader").then((m) => m.loadSnapshots(row.id, snapshots));
    const finished = new Date();
    await import("./loader").then((m) =>
      m.logRun({ sourceId: row.id, startedAt: started, finishedAt: finished, rowsWritten: written, status: "ok" }),
    );
    await db.update(sources).set({ lastRunAt: finished } as any).where(eq(sources.id, row.id));
    return { ok: true, rows: written };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const finished = new Date();
    await import("./loader").then((m) =>
      m.logRun({ sourceId: row.id, startedAt: started, finishedAt: finished, rowsWritten: 0, status: "error", error: msg }),
    );
    return { ok: false, rows: 0, error: msg };
  }
}