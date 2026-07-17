import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sources } from "@data-tw/db/schema";
import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Drop a small mock-feigua JSON file into the source's inbox so you can
 * click "立即执行" and watch real fetcher logic trigger a real ingest into PG.
 * Configure: sources.config.inbox (defaults to ./inbox/feigua).
 */
const TEMPLATE = (capturedAt: string) => JSON.stringify({
  capturedAt,
  source: "feigua",
  accounts: [
    { id: "卓小宝官方", douyin_name: "卓小宝官方", dept: "总部", person: "运营A", status: "live", plays_inc: 120000, like_count: 38000, fans_total: 528000, fans_inc: 1200, works_total: 230, rate: 0.42 },
    { id: "卓宝华南",   douyin_name: "卓宝华南",   dept: "华南", person: "运营B", status: "warn", plays_inc:  45000, like_count: 12000, fans_total:  86000, fans_inc:  -50, works_total: 100, rate: 0.18 },
    { id: "卓宝华东",   douyin_name: "卓宝华东",   dept: "华东", person: "运营C", status: "dead", plays_inc:  0,     like_count:     0, fans_total:  42000, fans_inc: -200, works_total:  60, rate: 0.05 },
  ],
}, null, 2);

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try { await requireSession(); } catch { return new NextResponse("unauthorized", { status: 401 }); }
  const { id } = await ctx.params;
  const [s] = await db.select().from(sources).where(eq(sources.id, id)).limit(1);
  if (!s) return new NextResponse("source not found", { status: 404 });
  if (s.kind !== "feigua") return new NextResponse("only feigua supports the built-in fixture for now", { status: 400 });

  const cfg = (s.config as Record<string, unknown> | null) ?? {};
  const inbox = String(cfg.inbox ?? path.join(process.cwd(), "inbox", "feigua"));
  await mkdir(inbox, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(inbox, `sample-${stamp}.json`);
  await writeFile(file, TEMPLATE(new Date().toISOString()), "utf8");
  return NextResponse.json({ ok: true, file });
}