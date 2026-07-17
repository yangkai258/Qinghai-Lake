import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "data_tw_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow login + setup + api/auth + static
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/debug") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) return NextResponse.next();

  const tok = req.cookies.get(COOKIE)?.value;
  if (!tok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon).*)"],
};