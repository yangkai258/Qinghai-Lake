import { ScreenHeader } from "./ScreenHeader";
import type { ScreenMeta } from "@/lib/types";

/**
 * TvScreen: 1920x1080 frame. Header = 56px, optional strip = 30px,
 * tags (live/warn/dead) inline in header, main hugs the rest.
 * No scroll. No clickable controls.
 */
export function TvScreen({
  meta,
  title,
  sub,
  strip,
  alertCount, // kept for future use, read from meta for now
  children,
}: {
  meta: ScreenMeta;
  title: string;
  sub?: string;
  strip?: React.ReactNode;
  alertCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="tv-screen absolute inset-0 flex flex-col" style={{ width: 1920, height: 1080 }}>
      <ScreenHeader meta={meta} title={title} sub={sub} />
      {strip ? <div className="px-6 pt-2">{strip}</div> : null}
      <main className="flex-1 px-6 pb-6 pt-3">{children}</main>
    </div>
  );
}