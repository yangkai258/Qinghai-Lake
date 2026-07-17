import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { alertRules } from "@data-tw/db/schema";

const DEFAULTS = [
  { id: "dead_ge_5",  name: "停播账号超过 5 个", kind: "dead_count_ge",     threshold: "5",   severity: "bad",  scope: "all" },
  { id: "warn_ge_10", name: "预警账号超过 10 个", kind: "warn_count_ge",     threshold: "10",  severity: "warn", scope: "all" },
  { id: "rate_lt_20", name: "平均完播率低于 20%",  kind: "rate_avg_lt",       threshold: "0.20",severity: "warn", scope: "all" },
];

export async function POST(req: NextRequest) {
  try { await requireSession(); } catch { return new NextResponse("unauthorized", { status: 401 }); }
  await db.insert(alertRules).values(DEFAULTS).onConflictDoNothing();
  return NextResponse.redirect(new URL("/alerts", req.url), 303);
}