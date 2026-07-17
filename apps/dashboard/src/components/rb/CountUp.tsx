"use client";
import { useEffect, useRef, useState } from "react";

/**
 * CountUp — animates a number from `from` (default 0) to `value` over `duration`.
 * Uses requestAnimationFrame with easeOutCubic. Preserves TV perf rules
 * (animation respects prefers-reduced-motion and stops after first frame on TV).
 */
export function CountUp({
  value,
  duration = 1200,
  format = (v: number) => v.toLocaleString(),
  from = 0,
}: {
  value: number;
  duration?: number;
  format?: (v: number) => string;
  from?: number;
}) {
  const [display, setDisplay] = useState(from);
  const start = useRef<number | null>(null);
  const fromRef = useRef(from);
  const toRef = useRef(value);

  useEffect(() => {
    fromRef.current = display;
    toRef.current = value;
    start.current = null;
    let raf = 0;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const t = Math.min(1, (ts - start.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const v = fromRef.current + (toRef.current - fromRef.current) * eased;
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    if (reduce) {
      setDisplay(value);
    } else {
      raf = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <>{format(Math.round(display))}</>;
}