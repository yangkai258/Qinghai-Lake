import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import path from "node:path";
import { readFile } from "node:fs/promises";

const RESEED_SQL = path.join(process.cwd(), "packages/db/reseed-mock.sql");

export async function POST(req: NextRequest) {
  try { await requireSession(); } catch { return NextResponse.redirect(new URL("/login", req.url), 303); }

  // Clear existing mock rows
  await db.execute(sql`DELETE FROM account_snapshots WHERE entity_kind = ''douyin_account''`);

  // Load SQL file (relative path)
  let sqlText = "";
  try {
    sqlText = await readFile(RESEED_SQL, "utf8");
  } catch {
    return new NextResponse("reseed-mock.sql not found", { status: 500 });
  }

  // Execute statements one at a time (postgres-js supports simple query)
  await db.execute(sql.raw(sqlText));
  return NextResponse.redirect(new URL("/snapshots", req.url), 303);
}