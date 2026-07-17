/**
 * Aurora — three radial gradients drifting in a slow infinite loop.
 * Uses pure CSS animation (no canvas) for TV perf.
 */
export function Aurora({
  colors = ["#3aa0ff", "#66e6c1", "#a855f7"],
  intensity = 0.18,
  speed = 18,
}: {
  colors?: string[];
  intensity?: number;
  speed?: number;
}) {
  const style = `
    @keyframes rb-aurora-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,-40px) scale(1.15); } }
    @keyframes rb-aurora-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,30px) scale(0.9); } }
    @keyframes rb-aurora-c { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,40px) scale(1.1); } }
    .rb-aurora { position:absolute; pointer-events:none; border-radius:50%; filter: blur(80px); mix-blend-mode: screen; opacity: ${intensity}; }
    .rb-aurora-a { width:520px; height:520px; background:${colors[0] ?? "#3aa0ff"}; animation: rb-aurora-a ${speed}s ease-in-out infinite; }
    .rb-aurora-b { width:560px; height:560px; background:${colors[1] ?? "#66e6c1"}; animation: rb-aurora-b ${Math.round(speed * 1.13)}s ease-in-out infinite; }
    .rb-aurora-c { width:480px; height:480px; background:${colors[2] ?? "#a855f7"}; animation: rb-aurora-c ${Math.round(speed * 0.87)}s ease-in-out infinite; }
  `;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <style>{style}</style>
      <span className="rb-aurora rb-aurora-a" style={{ top: "-10%", left: "10%" }} />
      <span className="rb-aurora rb-aurora-b" style={{ bottom: "-15%", right: "10%" }} />
      <span className="rb-aurora rb-aurora-c" style={{ top: "30%", left: "55%" }} />
    </div>
  );
}