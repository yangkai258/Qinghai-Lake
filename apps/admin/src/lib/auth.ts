import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { users } from "@data-tw/db/schema";
import { eq } from "drizzle-orm";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? "data-tw-admin-dev-secret-please-change-in-prod"
);
const COOKIE = "data_tw_session";
const TTL = "12h";

export interface AdminSession {
  uid: string;
  email: string;
  role: "superadmin" | "admin";
}

export async function login(email: string, password: string): Promise<AdminSession | null> {
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || !u.enabled) return null;
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return null;
  await db.update(users).set({ lastLoginAt: new Date() } as any).where(eq(users.id, u.id));
  const session: AdminSession = { uid: u.id, email: u.email, role: u.role as AdminSession["role"] };
  const token = await new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(SECRET);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 12, path: "/",
  });
  return session;
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const tok = jar.get(COOKIE)?.value;
  if (!tok) return null;
  try {
    const { payload } = await jwtVerify(tok, SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<AdminSession> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

/** Creates a user with bcrypt-hashed password. */
export async function createUser(id: string, email: string, password: string, role: "superadmin" | "admin") {
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ id, email, passwordHash, role } as any).onConflictDoNothing();
}

export async function countUsers(): Promise<number> {
  const r = await db.select({ id: users.id }).from(users);
  return r.length;
}

export function newUserId() {
  return "u_" + Math.random().toString(36).slice(2, 12);
}