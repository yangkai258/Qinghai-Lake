import { pgTable, text, timestamp, bigserial, numeric, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

// 统一事实表（EAV-like + JSONB dims）。当前只接抖音；将来接 SAP 用同样的 shape：
//   entityKind = 'douyin_account' | 'sap_material' | ...
//   metricName = 'fans_total' | 'plays_inc' | 'sales_amount' | ...
// 半年后扩 SAP 不需要 ALTER 视图。
export const accountSnapshots = pgTable(
  'account_snapshots',
  {
    id:          bigserial('id', { mode: 'number' }).primaryKey(),
    sourceId:    text('source_id').notNull(),
    capturedAt:  timestamp('captured_at', { withTimezone: true }).notNull(),
    entityId:    text('entity_id').notNull(),
    entityKind:  text('entity_kind').notNull(),
    metricName:  text('metric_name').notNull(),
    metricValue: numeric('metric_value', { precision: 24, scale: 6 }),
    dims:        jsonb('dims').$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => ({
    byEntity:   index('idx_snap_entity').on(t.entityKind, t.entityId, t.metricName, t.capturedAt),
    bySource:   index('idx_snap_source').on(t.sourceId, t.capturedAt),
    byMetric:   index('idx_snap_metric').on(t.metricName, t.capturedAt),
    byDims:     index('idx_snap_dims').using('gin', t.dims),
    // 幂等性：同一来源同一指标同一时间只一条
    uniqEntry:  uniqueIndex('uq_snap_entity_metric_capture').on(t.entityKind, t.entityId, t.metricName, t.capturedAt),
  }),
);
