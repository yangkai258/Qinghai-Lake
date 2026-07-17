import { STATUS_LABEL } from "@/lib/utils";
import type { DouyinAccountRow } from "@/lib/types";

const tagFor = (s: string) =>
  s === "live" ? "tag good" : s === "warn" ? "tag warn" : "tag bad";

/**
 * DataTable — dense account table. tvMode=true hides search bar and
 * pagination, shows a static LIVE pill + row count instead. Used on
 * full / ops screens (TV displays cannot be clicked).
 */
export function DataTable({
  rows,
  tvMode,
  maxHeight,
}: {
  rows: DouyinAccountRow[];
  tvMode?: boolean;
  maxHeight?: number;
}) {
  if (tvMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-1 pb-2 text-xs" style={{ color: "var(--ink-dim)" }}>
          <span className="tag good">● LIVE · {rows.length} 行</span>
          <span className="uppercase tracking-[0.3em]">account table</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ background: "rgba(12,22,44,0.92)" }}>
              <tr className="text-left" style={{ color: "var(--ink-dim)" }}>
                <th className="py-2 pl-2">账号</th>
                <th>部门</th>
                <th>负责人</th>
                <th className="text-right">本周播放</th>
                <th className="text-right">粉丝</th>
                <th className="text-right">新增</th>
                <th className="text-right">作品</th>
                <th className="text-right">完播</th>
                <th className="text-right pr-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.accountName} className="border-t" style={{ borderColor: "rgba(56,132,255,0.18)" }}>
                  <td className="py-2 pl-2 font-semibold" style={{ color: "var(--ink)" }}>
                    {r.accountName}
                  </td>
                  <td style={{ color: "var(--ink-dim)" }}>{r.dept ?? "—"}</td>
                  <td style={{ color: "var(--ink-dim)" }}>{r.person ?? "—"}</td>
                  <td className="text-right kpi-num">{r.playsInc.toLocaleString()}</td>
                  <td className="text-right kpi-num">{r.fansTotal.toLocaleString()}</td>
                  <td className="text-right kpi-num" style={{ color: r.fansInc >= 0 ? "var(--good)" : "var(--bad)" }}>
                    {r.fansInc.toLocaleString()}
                  </td>
                  <td className="text-right kpi-num">{r.worksTotal.toLocaleString()}</td>
                  <td className="text-right kpi-num">{(r.rate * 100).toFixed(1)}%</td>
                  <td className="text-right pr-2">
                    <span className={tagFor(r.status)}>{STATUS_LABEL[r.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  // non-tvMode fallback: scrollable container with optional maxHeight.
  return (
    <div className="overflow-auto" style={{ maxHeight }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left" style={{ color: "var(--ink-dim)" }}>
            <th className="py-2">账号</th>
            <th>部门</th>
            <th>负责人</th>
            <th className="text-right">本周播放</th>
            <th className="text-right">粉丝</th>
            <th className="text-right">作品</th>
            <th className="text-right">状态</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.accountName} className="border-t" style={{ borderColor: "rgba(56,132,255,0.18)" }}>
              <td className="py-2 font-semibold">{r.accountName}</td>
              <td>{r.dept ?? "—"}</td>
              <td>{r.person ?? "—"}</td>
              <td className="text-right kpi-num">{r.playsInc.toLocaleString()}</td>
              <td className="text-right kpi-num">{r.fansTotal.toLocaleString()}</td>
              <td className="text-right kpi-num">{r.worksTotal.toLocaleString()}</td>
              <td className="text-right"><span className={tagFor(r.status)}>{STATUS_LABEL[r.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}