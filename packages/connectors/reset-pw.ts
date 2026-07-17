import { db } from '@data-tw/db';
import { users } from '@data-tw/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'C:/Users/YKing/Documents/data-tw/apps/admin/node_modules/bcryptjs';

const hash = bcrypt.hashSync('admin1234', 10);
console.log('Hash:', hash);
console.log('Check:', bcrypt.compareSync('admin1234', hash));

// Delete old and insert new
await db.delete(users).where(eq(users.email, 'admin@local'));
await db.insert(users).values({
  id: 'u_admin2',
  email: 'admin@local',
  passwordHash: hash,
  role: 'superadmin',
  enabled: true,
} as any);

const r = await db.select({ h: users.passwordHash }).from(users).where(eq(users.email, 'admin@local')).limit(1);
console.log('Stored:', r[0]?.h);
console.log('Verify stored:', bcrypt.compareSync('admin1234', r[0]?.h ?? ''));
