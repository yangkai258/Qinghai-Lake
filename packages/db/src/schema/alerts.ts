import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

/**
 * Active or resolved alerts. Fire-and-forget rows; safe to keep growing for
 * a window (cron job prunes resolved ones older than 30d).
 */
export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  context: jsonb("context").$type<Record<string, unknown>>().notNull().default({}),
  firedAt: timestamp("fired_at", { withTimezone: true }).notNull().defaultNow(),
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});