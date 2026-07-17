import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@data-tw/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let s;
  try { s = await requireSession(); } catch { return new NextResponse("unauthorized", { status: 401 }); }
  const fd = await req.formData();
  const oldPw = String(fd.get("oldPassword") || "");
  const newPw = String(fd.get("newPassword") || "");
  if (newPw.length < 8) return new NextResponse("新密码太短", { status: 400 });

  const [u] = await db.select().from(users).where(eq(users.id, s.uid));
  if (!u) return new NextResponse("账号不存在", { status: 404 });

  const ok = await bcrypt.compare(oldPw, u.passwordHash);
  if (!ok) return new NextResponse("当前密码错", { status: 401 });

  const passwordHash = await bcrypt.hash(newPw, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, u.id));
  return new NextResponse(null, { status: 303, headers: { Location: "/settings?ok=1" } });
}