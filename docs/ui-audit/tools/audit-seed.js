// Seeds the ui-audit Neon branch through the LOCAL API (dev mode, fixed OTP 000000).
// Refuses to run unless DATABASE_URL points at the audit branch.
const { Client } = require('pg');
const API = 'http://localhost:4000/api/v1';

if (!/ep-broad-silence/.test(process.env.DATABASE_URL || '')) {
  console.error('REFUSING: DATABASE_URL is not the ui-audit branch');
  process.exit(1);
}

async function call(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return json && json.data !== undefined ? json.data : json;
}

async function login(email, role) {
  // Dev mode accepts the fixed code without a send (and send is rate-limited).
  const r = await call('POST', '/auth/otp/verify', null, { email, otp: '000000', role });
  return r.accessToken;
}

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  // Admin: register as a brand-less user via OTP, then promote on the branch.
  const adminEmail = 'admin.audit@example.com';
  await login(adminEmail, 'creator');
  await db.query(`DELETE FROM creators WHERE user_id = (SELECT id FROM users WHERE email=$1)`, [adminEmail]);
  await db.query(`UPDATE users SET role='admin' WHERE email=$1`, [adminEmail]);
  const admin = await login(adminEmail, 'creator');

  // Brand
  const brand = await login('brand.audit@example.com', 'brand');
  await call('PATCH', '/brands/me', brand, { companyName: 'Nile Coffee Co.', category: 'food_fmcg', country: 'EG' });

  // Creators
  const creators = [];
  const people = [
    { email: 'mariam.audit@example.com', displayName: 'Mariam Adel', city: 'Cairo', niches: ['food_fmcg', 'home_lifestyle'], basePrice: 1800 },
    { email: 'youssef.audit@example.com', displayName: 'Youssef Hany', city: 'Alexandria', niches: ['food_fmcg'], basePrice: 1500 },
    { email: 'salma.audit@example.com', displayName: 'Salma Mohamed Abdelrahman El-Sayed', city: 'Giza', niches: ['beauty_personal_care', 'fashion', 'mom_baby'], basePrice: 2400 },
  ];
  for (const p of people) {
    const t = await login(p.email, 'creator');
    const { email, ...profile } = p;
    await call('PATCH', '/creators/me', t, profile);
    await call('PUT', '/creators/me/payout-details', t, { method: 'instapay', accountIdentifier: email.split('.')[0] + '@instapay', holderName: p.displayName });
    const me = await call('GET', '/creators/me', t);
    creators.push({ ...p, token: t, id: me.id });
  }
  // Approve the first two; the third stays pending for the admin queue.
  for (const c of creators.slice(0, 2)) {
    await db.query(`UPDATE creators SET vetting_status='approved' WHERE id=$1`, [c.id]);
  }

  async function brief(fields) {
    const c = await call('POST', '/campaigns', brand, {});
    await call('PATCH', `/campaigns/${c.id}`, brand, fields);
    return c.id;
  }
  async function fund(id, amount, ref, verify = true) {
    await call('POST', `/campaigns/${id}/escrow/manual-payment`, brand, { method: 'instapay', transactionReference: ref, amount });
    if (verify) await call('POST', `/admin/campaigns/${id}/verify-escrow`, admin, { approved: true });
  }

  const live = await brief({
    title: 'Ramadan cold brew launch',
    brief: 'Show our new cold brew bottle at iftar. Natural light, real kitchen, no studio look. Open the bottle in the first 3 seconds.',
    budgetMin: 1500, budgetMax: 2500, slots: 2, niche: 'food_fmcg', language: 'ar', videoType: 'unboxing', durationSeconds: 30,
    talkingPoints: ['No added sugar', 'Ready in the fridge for iftar'], doNotSay: ['Do not mention other coffee brands'], revisionLimit: 2, needsShipping: false,
  });
  await fund(live, 4400, 'IP-AUDIT-001');

  const draft = await brief({ title: 'Skincare unboxing for Eid', budgetMin: 800, budgetMax: 1200, niche: 'beauty_personal_care', language: 'ar', videoType: 'unboxing', durationSeconds: 15 });
  const pending = await brief({ title: 'Back to school snack bundle', brief: 'A parent packs the snack bundle into a lunch box.', budgetMin: 1000, budgetMax: 1600, niche: 'food_fmcg', language: 'ar', videoType: 'demo', durationSeconds: 45 });
  await fund(pending, 1430, 'IP-AUDIT-002', false);

  // Proposals on the live brief
  const [mariam, youssef, salma] = creators;
  const pM = await call('POST', `/campaigns/${live}/proposals`, mariam.token, { price: 2000, deliveryDays: 5, pitch: 'I film at home every iftar; I will open the bottle on camera in the first two seconds and pour it over ice.' });
  const pY = await call('POST', `/campaigns/${live}/proposals`, youssef.token, { price: 1600, deliveryDays: 3, pitch: 'Quick, honest review style. I can deliver in 3 days with two hook variations.' });

  // Accept both (escrow 4400 covers 2200 + 1760)
  const cM = await call('POST', `/proposals/${pM.id}/accept`, brand);
  const cY = await call('POST', `/proposals/${pY.id}/accept`, brand);
  const collabM = cM.collaborationId || cM.id || (cM.collaboration && cM.collaboration.id);
  const collabY = cY.collaborationId || cY.id || (cY.collaboration && cY.collaboration.id);

  // Mariam delivers V1 (waiting for review). Youssef delivers, gets approved and paid.
  async function deliver(c, collabId) {
    const up = await call('POST', `/collaborations/${collabId}/deliverables/upload-url`, c.token, { contentType: 'video/mp4', fileSize: 109765 });
    return call('POST', `/collaborations/${collabId}/deliverables`, c.token, { type: 'ready_ad', fileUrl: up.fileUrl, durationSeconds: 30, note: 'V1 with the bottle opening in the first 2 seconds.' });
  }
  await deliver(mariam, collabM);
  const dY = await deliver(youssef, collabY);
  await call('POST', `/deliverables/${dY.id}/review`, brand, { action: 'approve', feedback: 'Great energy, approved.' });
  await call('POST', `/admin/payouts/${collabY}/mark-paid`, admin, { method: 'instapay', reference: 'PAYOUT-AUDIT-001' });

  // Salma applies to the live brief too (stays applied; she is pending vetting)
  try {
    await call('POST', `/campaigns/${live}/proposals`, salma.token, { price: 2500, deliveryDays: 10, pitch: 'Beauty creator but I love coffee content.' });
  } catch (e) { console.log('salma proposal:', e.message.slice(0, 120)); }

  // A chat message
  try {
    await call('POST', `/collaborations/${collabM}/messages`, brand, { body: 'Can you keep the label facing the camera?' });
    await call('POST', `/collaborations/${collabM}/messages`, mariam.token, { body: 'Yes, will do in V2 if needed.' });
  } catch (e) { console.log('messages:', e.message.slice(0, 120)); }

  console.log(JSON.stringify({ live, draft, pending, collabM, collabY }, null, 1));
  await db.end();
})().catch((e) => { console.error('SEED FAILED:', e.message); process.exit(1); });
