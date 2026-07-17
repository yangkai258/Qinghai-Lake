import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@data-tw/db/schema";

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/dashboard";

// ponytail: postgres-js pools per process are fine for Next.js (single process).
// In dev with HMR the pool may leak; small max keeps the leak tiny.
const client = postgres(url, { max: 4, prepare: false });
export const db = drizzle(client, { schema });
export { schema };