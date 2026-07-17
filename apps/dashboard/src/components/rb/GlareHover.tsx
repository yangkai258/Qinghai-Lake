"use client";
import { useRef } from "react";

export function GlareHover({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      style={{
        position: "relative", overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(160px 160px at var(--mx,50%) var(--my,50%), rgba(102,230,193,0.25), transparent 70%)",
          transition: "opacity 200ms",
        }}
      />
      {children}
    </div>
  );
}