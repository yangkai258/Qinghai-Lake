import { NextResponse, type NextRequest } from "next/server";
import { createUser, newUserId, login, countUsers } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if ((await countUsers()) > 0) {
    return new NextResponse("管理员已存在", { status: 403 });
  }
  const fd = await req.formData();
  const email = String(fd.get("email") || "");
  const password = String(fd.get("password") || "");
  if (!email.includes("@") || password.length < 8) {
    return new NextResponse("email 或密码格式错误", { status: 400 });
  }
  await createUser(newUserId(), email, password, "superadmin");
  const s = await login(email, password);
  if (!s) return new NextResponse("创建后无法登录", { status: 500 });
  return NextResponse.redirect(new URL("/", req.url), 303);
}