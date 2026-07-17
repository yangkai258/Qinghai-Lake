"use client";
import { useEffect, useRef, useState } from "react";
import { Aurora, Threads } from "@/components/rb";

const CHANNELS: Array<{ key: string; title: string; path: string }> = [
  { key: "exec",    title: "高层决策屏",   path: "/screen/exec" },
  { key: "ops",     title: "运营作战屏",   path: "/screen/ops" },
  { key: "content", title: "内容生产屏",   path: "/screen/content" },
  { key: "full",    title: "全量账号屏",   path: "/screen/full" },
  { key: "trend",   title: "部门趋势屏",   path: "/screen/trend" },
  { key: "geo",     title: "地域分布屏",   path: "/screen/geo" },
];

const ROTATE_MS = 30_000;

/**
 * HomeRotator — auto-rotates 6 channels at 30s each. q? → pause toggle.
 * Bottom strip shows channel # / countdown / clock / paused state.
 */
export default function HomeRotator() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(ROTATE_MS);
  const [now, setNow] = useState<string>("");
  const last = useRef(Date.now());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q" || e.key === "?") {
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const dt = Date.now() - last.current;
      last.current = Date.now();
      setNow(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
      if (!paused) {
        setRemaining((r) => {
          const next = r - dt;
          if (next <= 0) {
            setIdx((i) => (i + 1) % CHANNELS.length);
            return ROTATE_MS;
          }
          return next;
        });
      }
    }, 250);
    return () => clearInterval(t);
  }, [paused]);

  const ch = CHANNELS[idx];

  return (
    <div className="tv-bg fixed inset-0 flex flex-col" style={{ background: "var(--bg-0)", position: "relative" }}>
      <Aurora intensity={0.30} speed={28} colors={["#3aa0ff", "#66e6c1", "#7c3aed"]} />
      <Threads density={22} />
      <div className="flex-1 relative">
        <iframe
          key={ch.key}
          src={ch.path}
          className="absolute inset-0 w-full h-full"
          style={{ border: 0, position: "relative", zIndex: 1 }}
          title={ch.title}
        />
      </div>
      <div
        className="flex items-center justify-between px-6"
        style={{
          height: 56,
          background: "rgba(5,11,24,0.86)",
          borderTop: "1px solid rgba(56,132,255,0.35)",
          color: "var(--ink)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--ink-dim)" }}>
            CH {idx + 1}/{CHANNELS.length}
          </span>
          <span className="text-xl font-bold tracking-wide">{ch.title}</span>
          {paused ? <span className="tag warn">已暂停</span> : <span className="tag good">自动轮播</span>}
        </div>
        <div className="flex items-center gap-6">
          <span className="kpi-num">
            下一屏 {Math.ceil(remaining / 1000)}s
          </span>
          <span className="kpi-num">{now}</span>
          <span className="text-xs" style={{ color: "var(--ink-dim)" }}>按 Q 暂停</span>
        </div>
      </div>
    </div>
  );
}