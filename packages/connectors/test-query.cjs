const postgres = require('postgres');

const sql = postgres({ user: 'postgres', password: 'postgres', database: 'dashboard' });

(async () => {
  // Test the exact query from the page
  const r = await sql`SELECT COUNT(DISTINCT entity_id)::int AS accounts, MAX(captured_at) AS captured_at FROM account_snapshots WHERE entity_kind=''douyin_account''`;
  console.log('Result:', JSON.stringify(r));
  await sql.end();
})().catch(e => { console.error(e.message); process.exit(1); });
