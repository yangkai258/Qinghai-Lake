import type { DouyinAccountRow } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/utils";

/** RankList — top-N ranking with bar (current vs max). Used on full screen. */
export function RankList({
  rows,
  metric,
  limit = 8,
}: {
  rows: DouyinAccountRow[];
  metric: "playsInc" | "fansInc" | "fansTotal" | "worksTotal";
  limit?: number;
}) {
  const sorted = [...rows].sort((a, b) => b[metric] - a[metric]).slice(0, limit);
  const max = Math.max(1, ...sorted.map((r) => r[metric]));
  return (
    <ol className="space-y-2">
      {sorted.map((r, i) => {
        const v = r[metric];
        const pct = Math.max(2, Math.round((v / max) * 100));
        return (
          <li key={r.accountName} className="flex items-center gap-3 text-sm">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold"
              style={{ background: i < 3 ? "rgba(58,160,255,0.25)" : "rgba(58,160,255,0.10)", color: "var(--ink)" }}
            >
              {i + 1}
            </span>
            <span className="w-40 truncate" style={{ color: "var(--ink)" }}>{r.accountName}</span>
            <div className="flex-1 h-2 rounded" style={{ background: "rgba(56,132,255,0.10)" }}>
              <div className="h-2 rounded" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
            </div>
            <span className="kpi-num w-24 text-right">{v.toLocaleString()}</span>
            <span
              className={r.status === "live" ? "tag good" : r.status === "warn" ? "tag warn" : "tag bad"}
              style={{ minWidth: 36, justifyContent: "center" }}
            >
              {STATUS_LABEL[r.status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}