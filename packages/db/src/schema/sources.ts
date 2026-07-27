import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// A "source" is a registered data feed (feigua, business Excel, future
// SAP, or a distributed collector). Configuration is JSONB so a single
// schema covers all kinds; the shape is per-kind and validated by the
// connector / collector client that owns it.
//
// `ingest_token_hash` holds a sha-256 of the bearer token a remote
// collector uses to call the admin ingest API. Plain tokens are never
// stored.
export const sources = pgTable('sources', {
  id:                text('id').primaryKey(),                              // 'feigua' | 'excel:finance_q3' | 'sap:s4'
  kind:              text('kind').notNull(),                               // 'feigua' | 'excel' | 'sap' | 'collector'
  displayName:       text('display_name').notNull(),
  enabled:           boolean('enabled').notNull().default(true),
  config:            jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
  cronExpr:          text('cron_expr'),
  ingestTokenHash:   text('ingest_token_hash'),
  lastRunAt:         timestamp('last_run_at', { withTimezone: true }),
  lastStatus:        text('last_status'),                                  // 'ok' | 'fail' | 'pending'
  lastError:         text('last_error'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});