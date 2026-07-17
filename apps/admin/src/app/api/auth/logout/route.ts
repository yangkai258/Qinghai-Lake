import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  await logout();
  return NextResponse.redirect(new URL("/login", "http://localhost:3004"), 303);
}
export async function GET() { return POST(); }