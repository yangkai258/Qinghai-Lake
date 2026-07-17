"use client";
import { useEffect, useRef } from "react";

/**
 * ElectricBorder — a glowing border around its children that "traces" the perimeter
 * using an SVG path with stroke-dashoffset keyframes.
 */
export function ElectricBorder({
  children,
  color = "rgba(58,160,255,0.55)",
  width = 1,
}: {
  children: React.ReactNode;
  color?: string;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    if (!ref.current || !pathRef.current) return;
    const el = ref.current;
    const path = pathRef.current;
    const update = () => {
      const r = el.getBoundingClientRect();
      path.setAttribute("d", `M0,0 H${r.width} V${r.height} H0 Z`);
      path.style.strokeDasharray = String(2 * (r.width + r.height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", borderRadius: 14 }}>
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        aria-hidden
      >
        <path
          ref={pathRef}
          fill="none"
          stroke={color}
          strokeWidth={width}
          style={{
            filter: "drop-shadow(0 0 6px " + color + ")",
            strokeDasharray: 0,
            strokeDashoffset: 0,
            animation: "rb-electric 4s linear infinite",
          }}
        />
      </svg>
      <style>{`
        @keyframes rb-electric {
          0%   { stroke-dashoffset: 0;    opacity: 0.4; }
          50%  { stroke-dashoffset: -200; opacity: 0.9; }
          100% { stroke-dashoffset: -400; opacity: 0.4; }
        }
      `}</style>
      {children}
    </div>
  );
}