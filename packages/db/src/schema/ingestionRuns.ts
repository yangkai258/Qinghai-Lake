import { pgTable, text, integer, timestamp, bigserial, jsonb } from 'drizzle-orm/pg-core';
import { sources } from './sources';

// ingestion run history. 每次 ingest 跑一次插一行（无论成功失败）。
// sources.lastRunAt 有最近一次的状态概要，本表存 history。
export const ingestionRuns = pgTable('ingestion_runs', {
  id:           bigserial('id', { mode: 'number' }).primaryKey(),
  sourceId:     text('source_id').notNull().references(() => sources.id),
  startedAt:    timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt:   timestamp('finished_at', { withTimezone: true }),
  status:       text('status').notNull(),                                 // 'running' | 'success' | 'fail'
  rowsWritten:  integer('rows_written').notNull().default(0),
  errorText:    text('error'),
  stats:        jsonb('stats').$type<Record<string, unknown>>(),
});
