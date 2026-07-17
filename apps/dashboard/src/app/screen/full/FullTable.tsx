import type { DouyinAccountRow } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/utils";

const tagFor = (s: string) =>
  s === "live" ? "tag good" : s === "warn" ? "tag warn" : "tag bad";

/**
 * FullTable — full enumeration. tvMode=true → static LIVE pill + count,
 * no search/sort/pagination controls.
 */
export function FullTable({ rows, tvMode }: { rows: DouyinAccountRow[]; tvMode?: boolean }) {
  if (!tvMode) return null;
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-2 text-xs" style={{ color: "var(--ink-dim)" }}>
        <span className="tag good">● LIVE · 共 {rows.length} 行</span>
        <span className="uppercase tracking-[0.3em]">FULL</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="sticky top-0" style={{ background: "rgba(12,22,44,0.92)" }}>
            <tr className="text-left" style={{ color: "var(--ink-dim)" }}>
              <th className="py-2 pl-2">#</th>
              <th>账号</th>
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
            {rows.map((r, i) => (
              <tr key={r.accountName} className="border-t" style={{ borderColor: "rgba(56,132,255,0.18)" }}>
                <td className="py-2 pl-2" style={{ color: "var(--ink-dim)" }}>{i + 1}</td>
                <td className="font-semibold">{r.accountName}</td>
                <td style={{ color: "var(--ink-dim)" }}>{r.dept ?? "—"}</td>
                <td style={{ color: "var(--ink-dim)" }}>{r.person ?? "—"}</td>
                <td className="text-right kpi-num">{r.playsInc.toLocaleString()}</td>
                <td className="text-right kpi-num">{r.fansTotal.toLocaleString()}</td>
                <td className="text-right kpi-num" style={{ color: r.fansInc >= 0 ? "var(--good)" : "var(--bad)" }}>
                  {r.fansInc.toLocaleString()}
                </td>
                <td className="text-right kpi-num">{r.worksTotal.toLocaleString()}</td>
                <td className="text-right kpi-num">{(r.rate * 100).toFixed(1)}%</td>
                <td className="text-right pr-2"><span className={tagFor(r.status)}>{STATUS_LABEL[r.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}