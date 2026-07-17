import { db } from "@data-tw/db";
import { alertRules, alerts } from "@data-tw/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

/**
 * Evaluate all enabled alert_rules against v_douyin_account_latest.
 * Returns the number of NEW alerts inserted (de-duped against last 50 fires).
 *
 * Kinds:
 *  - dead_count_ge:  number of accounts with status='dead' is >= threshold
 *  - warn_count_ge:  number of accounts with status='warn' is >= threshold
 *  - rate_avg_lt:    average rate across all accounts is < threshold
 *  - fans_inc_total_lt: SUM(fans_inc) is < threshold
 *  - dead_pct_ge:    dead_count / total_count is >= threshold (0..1)
 *
 * ponytail: single-worker evaluator. If you scale to multi-node, gate with
 * a PG advisory lock so multiple processes don't double-fire.
 */
export type AlertKind = "dead_count_ge" | "warn_count_ge" | "rate_avg_lt" | "fans_inc_total_lt" | "dead_pct_ge";

export interface AlertEvalReport {
  evaluated: number;
  fired: number;
  errors: string[];
}

export async function evaluateAlerts(): Promise<AlertEvalReport> {
  const rules = await db.select().from(alertRules).where(eq(alertRules.enabled, "true"));
  const report: AlertEvalReport = { evaluated: rules.length, fired: 0, errors: [] };

  // Single pass over view → aggregates. Avoid round-trip per rule.
  const aggregates = await db.execute<{
    total: number; dead: number; warn: number; live: number;
    avg_rate: string; sum_fans_inc: string;
  }>(sql`
    SELECT
      COUNT(*)::int                                              AS total,
      COUNT(*) FILTER (WHERE status='dead')::int                 AS dead,
      COUNT(*) FILTER (WHERE status='warn')::int                 AS warn,
      COUNT(*) FILTER (WHERE status='live')::int                 AS live,
      AVG(rate)::numeric                                         AS avg_rate,
      SUM(fans_inc)::numeric                                     AS sum_fans_inc
    FROM v_douyin_account_latest
  `);
  const agg = (aggregates as unknown as Array<{
    total: number; dead: number; warn: number; live: number;
    avg_rate: string; sum_fans_inc: string;
  }>)[0];

  for (const rule of rules) {
    try {
      const triggered = checkRule(rule.kind as AlertKind, Number(rule.threshold), agg);
      if (!triggered) continue;

      const dedupKey = rule.id;
      const recent = await db.execute<{ n: number }>(sql`
        SELECT COUNT(*)::int AS n FROM alerts
        WHERE rule_id = ${dedupKey} AND resolved = false
      `);
      const [{ n }] = recent as unknown as { n: number }[];
      if (n > 0) continue;  // dedupe: skip if there's already an open alert

      await db.insert(alerts).values({
        id: randomUUID(),
        ruleId: dedupKey,
        severity: rule.severity,
        message: describe(rule.kind as AlertKind, Number(rule.threshold), agg),
        context: { aggregates: agg },
      });
      report.fired++;
    } catch (e: unknown) {
      report.errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  return report;
}

function checkRule(kind: AlertKind, threshold: number, a: {
  total: number; dead: number; warn: number; live: number;
  avg_rate: string; sum_fans_inc: string;
}): boolean {
  switch (kind) {
    case "dead_count_ge":       return a.dead >= threshold;
    case "warn_count_ge":       return a.warn >= threshold;
    case "rate_avg_lt":         return Number(a.avg_rate) < threshold;
    case "fans_inc_total_lt":   return Number(a.sum_fans_inc) < threshold;
    case "dead_pct_ge":         return a.total > 0 && (a.dead / a.total) >= threshold;
    default:                    return false;
  }
}

function describe(kind: AlertKind, threshold: number, a: {
  total: number; dead: number; warn: number; live: number;
  avg_rate: string; sum_fans_inc: string;
}): string {
  switch (kind) {
    case "dead_count_ge":       return `停播 ${a.dead} ≥ ${threshold}`;
    case "warn_count_ge":       return `预警 ${a.warn} ≥ ${threshold}`;
    case "rate_avg_lt":         return `平均完播 ${Number(a.avg_rate).toFixed(2)} < ${threshold}`;
    case "fans_inc_total_lt":   return `新增粉丝 ${Number(a.sum_fans_inc)} < ${threshold}`;
    case "dead_pct_ge":         return `停播占比 ${a.total > 0 ? (a.dead / a.total * 100).toFixed(1) : 0}% ≥ ${(threshold * 100).toFixed(0)}%`;
    default:                    return `${kind} threshold=${threshold}`;
  }
}