/**
 * MagnetLines — diagonal lines forming a subtle grid. Static.
 */
export function MagnetLines({ color = "rgba(58,160,255,0.10)", size = 24 }: { color?: string; size?: number }) {
  const W = 1920;
  const H = 1080;
  const lines = [];
  for (let x = -H; x < W; x += size) {
    lines.push(<line key={"d"+x} x1={x} y1={0} x2={x + H} y2={H} stroke={color} strokeWidth={0.6} />);
  }
  for (let x = 0; x < W + H; x += size) {
    lines.push(<line key={"u"+x} x1={x} y1={H} x2={x - H} y2={0} stroke={color} strokeWidth={0.6} />);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
         style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden>
      {lines}
    </svg>
  );
}