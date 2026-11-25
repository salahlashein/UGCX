// Finishes the audit seed: payout, a pending-vetting proposal, chat messages.
const { Client } = require('pg');
const API = 'http://localhost:4000/api/v1';
if (!/ep-broad-silence/.test(process.env.DATABASE_URL || '')) { console.error('REFUSING'); process.exit(1); }

async function call(method, path, token, body) {
  const res = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  const j = JSON.parse(text); return j.data !== undefined ? j.data : j;
}
const login = async (email, role) => (await call('POST', '/auth/otp/verify', null, { email, otp: '000000', role })).accessToken;

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL }); await db.connect();
  const admin = await login('admin.audit@example.com', 'creator');
  const brand = await login('brand.audit@example.com', 'brand');
  const mariam = await login('mariam.audit@example.com', 'creator');
  const salma = await login('salma.audit@example.com', 'creator');
  const { rows: collabs } = await db.query(`SELECT c.id, c.status, cr.display_name FROM collaborations c JOIN creators cr ON cr.id=c.creator_id`);
  const { rows: [live] } = await db.query(`SELECT id FROM campaigns WHERE title='Ramadan cold brew launch'`);
  for (const c of collabs) {
    if (c.status === 'approved') await call('POST', `/admin/payouts/${c.id}/mark-paid`, admin, { method: 'instapay', reference: 'PAYOUT-AUDIT-001', paidAt: new Date().toISOString() });
  }
  try { await call('POST', `/campaigns/${live.id}/proposals`, salma, { price: 2500, deliveryDays: 10, pitch: 'Beauty creator but I love coffee content. Happy to try a cosy morning routine angle.' }); } catch (e) { console.log('salma:', e.message.slice(0, 140)); }
  const m = collabs.find((c) => c.display_name === 'Mariam Adel');
  try {
    await call('POST', `/collaborations/${m.id}/messages`, brand, { body: 'Can you keep the label facing the camera?' });
    await call('POST', `/collaborations/${m.id}/messages`, mariam, { body: 'Yes, will do in V2 if needed.' });
  } catch (e) { console.log('messages:', e.message.slice(0, 140)); }
  const { rows } = await db.query(`SELECT c.status, cr.display_name FROM collaborations c JOIN creators cr ON cr.id=c.creator_id`);
  console.log(JSON.stringify(rows));
  await db.end();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
