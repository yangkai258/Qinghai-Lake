import type { ScreenMeta } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/utils";

/**
 * ScreenHeader — 56px tall. Renders title + sub on the left, status tags +
 * capture timestamp + optional alert pill on the right.
 */
export function ScreenHeader({
  meta,
  title,
  sub,
  alertCount,
}: {
  meta: ScreenMeta;
  title: string;
  sub?: string;
  alertCount?: number;
}) {
  const captured = meta.capturedAt ? new Date(meta.capturedAt) : null;
  const stamp = captured
    ? `${captured.getMonth() + 1}/${captured.getDate()} ${captured.getHours().toString().padStart(2, "0")}:${captured.getMinutes().toString().padStart(2, "0")}`
    : "—";
  return (
    <header className="flex items-center justify-between px-6 pt-4" style={{ height: 56 }}>
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold tracking-wide" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        {sub ? (
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--ink-dim)" }}>
            {sub}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-sm">
        {alertCount && alertCount > 0 ? (
          <span
            className="tag bad"
            style={{
              animation: "alert-pulse 1.6s ease-in-out infinite",
            }}
          >
            ● {alertCount} 告警
          </span>
        ) : null}
        <span className="tag good">● LIVE {meta.liveCount}</span>
        <span className="tag warn">{STATUS_LABEL.warn} {meta.warnCount}</span>
        <span className="tag bad">{STATUS_LABEL.dead} {meta.deadCount}</span>
        <span
          className="tag"
          style={{
            background: "rgba(58,160,255,0.18)",
            color: "var(--accent)",
            border: "1px solid var(--panel-border)",
          }}
        >
          抓取 {stamp}
        </span>
      </div>
    </header>
  );
}