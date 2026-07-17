import { unstable_cache as cache } from "next/cache";
import { db } from "./db";
import { sql } from "drizzle-orm";
import type {
  DouyinAccountRow, Screen1Data, Screen2Data, Screen3Data, Screen4Data, Screen5Data, Screen6Data,
  AccStatus,
} from "./types.js";

type RawViewRow = {
  account_name: string;
  douyin_name: string | null;
  dept: string | null;
  person: string | null;
  status: string | null;
  plays_inc: string | null;
  like_count: string | null;
  fans_total: string | null;
  fans_inc: string | null;
  works_total: string | null;
  rate: string | null;
  captured_at: string | null;
};

const toNum = (s: string | null | undefined) => (s == null ? 0 : Number(s) || 0);
const toStatus = (s: string | null | undefined): AccStatus => {
  const v = (s ?? "warn").toLowerCase();
  if (v === "live" || v === "warn" || v === "dead") return v as AccStatus;
  return "warn";
};

function rowFrom(r: RawViewRow): DouyinAccountRow {
  return {
    accountName: r.account_name,
    douyinName: r.douyin_name,
    dept: r.dept,
    person: r.person,
    status: toStatus(r.status),
    playsInc: toNum(r.plays_inc),
    likeCount: toNum(r.like_count),
    fansTotal: toNum(r.fans_total),
    fansInc: toNum(r.fans_inc),
    worksTotal: toNum(r.works_total),
    rate: Number(r.rate ?? 0),
    capturedAt: r.captured_at ?? new Date().toISOString(),
  };
}

function buildMeta(rows: DouyinAccountRow[]) {
  return {
    totalAccounts: rows.length,
    liveCount: rows.filter((x) => x.status === "live").length,
    warnCount: rows.filter((x) => x.status === "warn").length,
    deadCount: rows.filter((x) => x.status === "dead").length,
    capturedAt: rows[0]?.capturedAt ?? new Date().toISOString(),
  };
}

/**
 * ponytail: 30 dashboards all hit the same view. unstable_cache wraps the
 * PG fetch so 6 screens + 1 rotator share ONE query result with 30s TTL.
 * Bypasses per-screen fetch overhead. Re-fetch on source.lastRunAt update.
 */
const getLatest = cache(
  async (): Promise<DouyinAccountRow[]> => {
    try {
      const rows = await db.execute<RawViewRow>(sql`SELECT * FROM v_douyin_account_latest`);
      return (rows as unknown as RawViewRow[]).map(rowFrom);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/relation .* does not exist/.test(msg)) throw e;
      return [];
    }
  },
  ["v_douyin_account_latest"],
  { revalidate: 30, tags: ["douyin"] },
);

export async function getMeta() {
  const rows = await getLatest();
  return buildMeta(rows);
}

export async function getScreen1(): Promise<Screen1Data> {
  const rows = await getLatest();
  return { meta: buildMeta(rows), rows };
}

export async function getScreen2(): Promise<Screen2Data> {
  const rows = await getLatest();
  return { meta: buildMeta(rows), rows: [...rows].sort((a, b) => b.playsInc - a.playsInc) };
}

export async function getScreen3(): Promise<Screen3Data> {
  const rows = await getLatest();
  return { meta: buildMeta(rows), rows: [...rows].sort((a, b) => b.worksTotal - a.worksTotal) };
}

export async function getScreen4(): Promise<Screen4Data> {
  const rows = await getLatest();
  return { meta: buildMeta(rows), rows: [...rows].sort((a, b) => b.fansTotal - a.fansTotal) };
}

export async function getScreen5(): Promise<Screen5Data> {
  const rows = await getLatest();
  return { meta: buildMeta(rows), rows: [...rows].sort((a, b) => b.rate - a.rate) };
}

export async function getScreen6(): Promise<Screen6Data> {
  const rows = await getLatest();
  return { meta: buildMeta(rows), rows: [...rows].sort((a, b) => b.fansInc - a.fansInc) };
}
/**
 * Count open alerts. Cheap query — used by the dashboard header to flash
 * a red pill when something is wrong. Cached along with the rest.
 */
const getOpenAlertsCount = cache(
  async (): Promise<number> => {
    try {
      const r = await db.execute<{ n: number }>(
        sql`SELECT COUNT(*)::int AS n FROM dashboard.alerts WHERE resolved = false`,
      );
      return (r as unknown as { n: number }[])[0]?.n ?? 0;
    } catch {
      return 0;
    }
  },
  ["open_alerts"],
  { revalidate: 30, tags: ["alerts"] },
);

export async function getOpenAlerts(): Promise<number> {
  return await getOpenAlertsCount();
}