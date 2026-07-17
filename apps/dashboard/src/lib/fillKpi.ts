import type { DouyinAccountRow, Kpi6 } from "./types.js";
import { fmt } from "./utils.js";

const sum = (rows: DouyinAccountRow[], k: keyof DouyinAccountRow) =>
  rows.reduce((acc, r) => acc + (typeof r[k] === "number" ? (r[k] as number) : 0), 0);

/** Always 6 KPI tiles for the ops (status / plays) screen. */
export function fillOpsKpi(rows: DouyinAccountRow[]): Kpi6[] {
  const live = rows.filter((r) => r.status === "live").length;
  const warn = rows.filter((r) => r.status === "warn").length;
  const dead = rows.filter((r) => r.status === "dead").length;
  const plays = sum(rows, "playsInc");
  const fans = sum(rows, "fansInc");
  const top = [...rows].sort((a, b) => b.playsInc - a.playsInc)[0];
  return [
    { label: "在播账号", value: live, unit: "个", tone: "good" },
    { label: "预警账号", value: warn, unit: "个", tone: "warn" },
    { label: "停播账号", value: dead, unit: "个", tone: "bad" },
    { label: "今日总播放", value: plays, unit: "次" },
    { label: "今日新增粉丝", value: fans, unit: "人" },
    { label: "TOP 账号", value: top?.accountName ?? "—" },
  ];
}

/** Always 6 KPI tiles for the content (works / posts) screen. */
export function fillContentKpi(rows: DouyinAccountRow[]): Kpi6[] {
  const works = sum(rows, "worksTotal");
  const plays = sum(rows, "playsInc");
  const avgRate =
    rows.length === 0 ? 0 : rows.reduce((a, r) => a + r.rate, 0) / rows.length;
  const top = [...rows].sort((a, b) => b.worksTotal - a.worksTotal)[0];
  return [
    { label: "作品总数", value: works, unit: "条" },
    { label: "本周播放", value: plays, unit: "次" },
    { label: "平均完播率", value: (avgRate * 100).toFixed(1), unit: "%", tone: "good" },
    { label: "活跃账号", value: rows.length, unit: "个" },
    { label: "头部账号", value: top?.accountName ?? "—" },
    { label: "新增粉丝", value: sum(rows, "fansInc"), unit: "人" },
  ];
}

/** Always 6 KPI tiles for the full (overview) screen. */
export function fillFullKpi(rows: DouyinAccountRow[]): Kpi6[] {
  return [
    { label: "账号总数", value: rows.length, unit: "个" },
    { label: "粉丝总数", value: sum(rows, "fansTotal"), unit: "人" },
    { label: "本周播放", value: sum(rows, "playsInc"), unit: "次" },
    { label: "作品总数", value: sum(rows, "worksTotal"), unit: "条" },
    { label: "新增粉丝", value: sum(rows, "fansInc"), unit: "人" },
    { label: "平均完播率", value: (rows.reduce((a, r) => a + r.rate, 0) / Math.max(1, rows.length) * 100).toFixed(1), unit: "%" },
  ];
}

/** Always 6 KPI tiles for the trend / dept / industry screen. */
export function fillTrendKpi(rows: DouyinAccountRow[]): Kpi6[] {
  // ponytail: trend is dimension-by-dept over the last two captures.
  // Without history rows we fall back to current-snapshot aggregates.
  const byDept = new Map<string, { works: number; plays: number; rate: number; n: number }>();
  for (const r of rows) {
    const d = r.dept ?? "未分类";
    const cur = byDept.get(d) ?? { works: 0, plays: 0, rate: 0, n: 0 };
    cur.works += r.worksTotal;
    cur.plays += r.playsInc;
    cur.rate += r.rate;
    cur.n += 1;
    byDept.set(d, cur);
  }
  const depts = [...byDept.entries()];
  depts.sort((a, b) => b[1].plays - a[1].plays);
  const top = depts[0];
  const total = sum(rows, "playsInc");
  return [
    { label: "覆盖部门", value: depts.length, unit: "个" },
    { label: "部门总播放", value: total, unit: "次" },
    { label: "头部部门", value: top?.[0] ?? "—" },
    { label: "头部占比", value: top ? ((top[1].plays / Math.max(1, total)) * 100).toFixed(1) : "0.0", unit: "%" },
    { label: "平均完播", value: ((depts.reduce((a, [, v]) => a + v.rate / Math.max(1, v.n), 0) / Math.max(1, depts.length)) * 100).toFixed(1), unit: "%" },
    { label: "近 7 日活跃", value: rows.filter((r) => r.status !== "dead").length, unit: "账号" },
  ];
}

/** Always 6 KPI tiles for the geo screen. */
export function fillGeoKpi(rows: DouyinAccountRow[]): Kpi6[] {
  const regions = new Set(rows.map((r) => r.dept ?? "其他")).size;
  const dead = rows.filter((r) => r.status === "dead").length;
  return [
    { label: "覆盖区域", value: regions, unit: "个" },
    { label: "账号总数", value: rows.length, unit: "个" },
    { label: "粉丝总数", value: sum(rows, "fansTotal"), unit: "人" },
    { label: "本周播放", value: sum(rows, "playsInc"), unit: "次" },
    { label: "在播率", value: ((rows.filter((r) => r.status === "live").length / Math.max(1, rows.length)) * 100).toFixed(1), unit: "%", tone: "good" },
    { label: "停播", value: dead, unit: "个", tone: "bad" },
  ];
}