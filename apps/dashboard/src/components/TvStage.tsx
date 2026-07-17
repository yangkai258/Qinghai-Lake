"use client";
import { useEffect, useState } from "react";

/**
 * TvStage: 1920x1080 lock. Scales proportionally to viewport while
 * preserving 16:9. Letterboxes on >16:9, pillarboxes on <16:9.
 */
export function TvStage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      const s = Math.min(sw / 1920, sh / 1080);
      setScale(s);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  return (
    <div className="tv-bg fixed inset-0 flex items-center justify-center" style={{ overflow: "hidden" }}>
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}