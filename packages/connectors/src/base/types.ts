import { z } from "zod";

/**
 * A SnapshotRecord is one EAV-like fact row written to account_snapshots.
 * - entityKind: "douyin_account" | "sap_material" ...
 * - entityId:   stable id (account_name, material_no ...)
 * - metricName: snake_case, e.g. fans_total, plays_inc, live_status
 * - value:      numeric (preferred) or string. Null for string-only metrics.
 * - capturedAt: when the source reported it (NOT when ingested).
 * - dims:       free-form jsonb (dept, person, status, ...) read by views.
 */
export const SnapshotRecord = z.object({
  entityKind: z.string().min(1).max(64),
  entityId: z.string().min(1).max(128),
  entityName: z.string().max(256).optional(),
  metricName: z.string().min(1).max(128),
  value: z.number().finite().optional(),
  valueStr: z.string().max(2048).optional(),
  capturedAt: z.coerce.date(),
  dims: z.record(z.unknown()).optional(),
});
export type SnapshotRecord = z.infer<typeof SnapshotRecord>;

export interface ConnectorContext {
  sourceId: string;
  config: Record<string, unknown>;
  log: {
    info: (m: string, extra?: unknown) => void;
    warn: (m: string, extra?: unknown) => void;
    error: (m: string, extra?: unknown) => void;
  };
}

export interface BaseConnector {
  kind: string;
  validateConfig(config: Record<string, unknown>): Promise<void> | void;
  fetch(ctx: ConnectorContext): Promise<SnapshotRecord[]>;
}