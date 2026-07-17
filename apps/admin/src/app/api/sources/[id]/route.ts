import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sources } from "@data-tw/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try { await requireSession(); } catch { return new NextResponse("unauthorized", { status: 401 }); }
  const { id } = await ctx.params;
  const fd = await req.formData();
  const patch: Record<string, unknown> = {};
  if (fd.has("enabled")) patch.enabled = fd.get("enabled") === "true";
  if (fd.has("cronExpr")) patch.cronExpr = String(fd.get("cronExpr") || null);
  if (fd.has("displayName")) patch.displayName = String(fd.get("displayName"));
  if (fd.has("config")) {
    const raw = String(fd.get("config") || "{}");
    try { patch.config = JSON.parse(raw); } catch { return new NextResponse("config 不是合法 JSON", { status: 400 }); }
  }
  patch.updatedAt = new Date();
  await db.update(sources).set(patch).where(eq(sources.id, id));
  return NextResponse.json({ ok: true });
}