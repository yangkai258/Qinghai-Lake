import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@data-tw/db/schema";

const url = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/dashboard";
const client = postgres(url, { max: 4, prepare: false });
export const db = drizzle(client, { schema });