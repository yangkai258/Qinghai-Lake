import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

// 数据源注册表。
// 一行 = 一个数据源 (飞瓜 / 某个 Excel / 未来的 SAP)。
// data-tw/connectors 启动时读这张表，配 BaseConnector 实例 + cron。
export const sources = pgTable('sources', {
  id:           text('id').primaryKey(),                                   // 'feigua' | 'excel:finance_q3' | 'sap:s4'
  kind:         text('kind').notNull(),                                    // 'feigua' | 'excel' | 'sap'
  displayName:  text('display_name').notNull(),
  enabled:      boolean('enabled').notNull().default(true),
  config:       jsonb('config').$type<Record<string, unknown>>().notNull().default({}),
  cronExpr:     text('cron_expr'),
  lastRunAt:    timestamp('last_run_at', { withTimezone: true }),
  lastStatus:   text('last_status'),                                       // 'ok' | 'fail' | 'pending'
  lastError:    text('last_error'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
