"use client";
import { motion } from "framer-motion";

export function BlurText({
  text,
  className,
  delay = 0,
  stagger = 0.04,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const chars = [...text];
  return (
    <span className={className} style={{ display: "inline-flex", flexWrap: "wrap" }}>
      {chars.map((c, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(8px)", opacity: 0, y: 6 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: delay + i * stagger }}
          style={{ display: "inline-block", whiteSpace: c === " " ? "pre" : "normal" }}
        >
          {c}
        </motion.span>
      ))}
    </span>
  );
}