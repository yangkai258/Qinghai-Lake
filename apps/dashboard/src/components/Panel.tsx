import { cn } from "@/lib/utils";
import { MagnetLines } from "@/components/rb";

export function Panel({
  title,
  sub,
  height,
  className,
  children,
  extra,
  alertCount,
}: {
  title: string;
  sub?: string;
  /** fixed pixel height (the screen layout is 1920x1080 — heights are precomputed) */
  height: number;
  className?: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
  alertCount?: number;
}) {
  return (
    <section
      className={cn("panel tv-screen flex flex-col", className)}
      style={{ height }}
    >
      <span className="panel-corner tl" />
      <span className="panel-corner tr" />
      <span className="panel-corner bl" />
      <span className="panel-corner br" />
      <MagnetLines color="rgba(58,160,255,0.06)" size={20} />
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <span className="inline-block h-3 w-1 rounded-sm" style={{ background: "var(--accent)" }} />
          <h2 className="text-base font-semibold tracking-wide" style={{ color: "var(--ink)" }}>{title}</h2>
          {sub ? (
            <span className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--ink-dim)" }}>{sub}</span>
          ) : null}
        </div>
        {extra}
      </header>
      <div className="mx-4 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--panel-border), transparent)" }} />
      <div className="flex-1 min-h-0 px-4 pb-4 pt-3">{children}</div>
    </section>
  );
}