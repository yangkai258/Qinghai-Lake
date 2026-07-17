const { Client } = require('postgres');
const bcrypt = require('bcryptjs');
(async () => {
  const c = new Client({ user: 'postgres', password: 'postgres', database: 'dashboard' });
  await c.connect();
  const r = await c.query("SELECT password_hash FROM users WHERE email='admin@local'");
  const h = r.rows[0].password_hash;
  console.log('DB hash:', JSON.stringify(h));
  console.log('bcrypt check admin1234:', bcrypt.compareSync('admin1234', h));
  await c.end();
})().catch(e => { console.error(e); process.exit(1); });
