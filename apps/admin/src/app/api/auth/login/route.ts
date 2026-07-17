import { NextResponse, type NextRequest } from "next/server";
import { login } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const email = String(fd.get("email") || "");
  const password = String(fd.get("password") || "");
  const s = await login(email, password);
  if (!s) return new NextResponse("账号或密码错误", { status: 401 });
  return NextResponse.json({ ok: true, session: s });
}