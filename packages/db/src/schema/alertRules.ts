import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";

/**
 * Alert rules — declarative thresholds evaluated against v_douyin_account_latest.
 * kind: "dead_count_ge" | "warn_count_ge" | "fans_inc_total_lt" | "rate_avg_lt"
 * threshold: numeric value. The evaluator (alerts/evaluator.ts) loops this
 * table and inserts into `alerts` when a rule fires.
 */
export const alertRules = pgTable("alert_rules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  enabled: text("enabled").notNull().default("true"),
  kind: text("kind").notNull(),
  threshold: numeric("threshold", { precision: 18, scale: 4 }).notNull(),
  severity: text("severity").notNull().default("warn"), // "info" | "warn" | "bad"
  scope: text("scope").notNull().default("all"),         // "all" | "<dept_name>"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});