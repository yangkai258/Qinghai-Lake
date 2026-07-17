export const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

export function fmt(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + "亿";
  if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(2) + "万";
  return n.toLocaleString("zh-CN", { maximumFractionDigits: digits });
}

export function pct(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return (n * 100).toFixed(digits) + "%";
}

export const STATUS_LABEL: Record<string, string> = {
  live: "在播",
  warn: "预警",
  dead: "停播",
};