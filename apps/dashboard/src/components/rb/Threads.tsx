/**
 * Threads — animated lines using stroke-dasharray keyframes.
 * Pure SVG, no JS, TV-safe.
 */
export function Threads({ density = 14, color = "rgba(58,160,255,0.18)" }: { density?: number; color?: string }) {
  const W = 1920;
  const H = 1080;
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number; delay: number; dur: number }> = [];
  for (let i = 0; i < density; i++) {
    const x1 = Math.random() * W;
    const y1 = Math.random() * H;
    const ang = Math.random() * Math.PI * 2;
    const len = 100 + Math.random() * 300;
    const x2 = Math.min(W, Math.max(0, x1 + Math.cos(ang) * len));
    const y2 = Math.min(H, Math.max(0, y1 + Math.sin(ang) * len));
    lines.push({ x1, y1, x2, y2, delay: Math.random() * 4, dur: 4 + Math.random() * 6 });
  }
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      aria-hidden
    >
      <style>{`
        @keyframes rb-thread-dash { 0% { stroke-dashoffset: 1000; opacity: 0.05; } 30% { opacity: 0.6; } 70% { opacity: 0.6; } 100% { stroke-dashoffset: 0; opacity: 0.05; } }
      `}</style>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="6 8"
          style={{
            animation: `rb-thread-dash ${l.dur}s ease-out ${l.delay}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}