import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@data-tw/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  const [u] = await db.select().from(users).where(eq(users.email, "admin@local")).limit(1);
  if (!u) return NextResponse.json({ error: "no user" });
  const pw = "admin1234";
  const ok = bcrypt.compareSync(pw, u.passwordHash);
  return NextResponse.json({
    email: u.email,
    hashInDb: u.passwordHash,
    passwordChecked: pw,
    result: ok,
    bcryptVersion: require("bcryptjs/package.json").version,
  });
}
