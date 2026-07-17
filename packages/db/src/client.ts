import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const url = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/dashboard';

// 单例 pool. 多个进程会各自建一个 pool（Next.js / ingestion runner），是 OK 的。
const queryClient = postgres(url, { max: 8, prepare: false });
export const db = drizzle(queryClient, { schema });
export type DB = typeof db;
export { schema };
