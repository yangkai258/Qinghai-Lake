import { useMemo } from "react";

export function Sparkline({
  values,
  height = 48,
  width = 220,
  stroke = "var(--accent)",
}: {
  values: number[];
  height?: number;
  width?: number;
  stroke?: string;
}) {
  const { d, area, max } = useMemo(() => {
    if (values.length === 0) return { d: "", area: "", max: 0 };
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    const stepX = width / Math.max(1, values.length - 1);
    const pts = values.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return [x, y];
    });
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
    const area = `${d} L${width},${height} L0,${height} Z`;
    return { d, area, max };
  }, [values, width, height]);

  if (values.length === 0) return null;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.55" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}