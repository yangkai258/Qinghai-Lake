const postgres = require('postgres');

const sql = postgres({ user: 'postgres', password: 'postgres', database: 'dashboard' });

(async () => {
  const r = await sql`SELECT id, email, role, enabled, password_hash FROM users WHERE email = 'admin@local'`;
  console.log('Users:', JSON.stringify(r, null, 2));
  await sql.end();
})().catch(e => { console.error(e); process.exit(1); });
