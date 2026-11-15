require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

const API_BASE = 'http://127.0.0.1:3000/api/v1';

async function verifyManualFlow() {
  console.log('=== STARTING MANUAL ESCROW & EMAIL OTP VERIFICATION ===\n');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  try {
    // 1. Email OTP Auth for Brand
    console.log('[1/4] Testing Email OTP Auth (Brand)...');
    const brandEmail = 'brand@example.com';
    const sendOtpRes = await fetch(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: brandEmail, role: 'brand' }),
    });
    const sendOtpData = await sendOtpRes.json();
    console.log('Send OTP response:', sendOtpData);

    const verifyOtpRes = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: brandEmail, otp: '0000', role: 'brand' }),
    });
    const verifyOtpData = await verifyOtpRes.json();
    console.log('Verify OTP status:', verifyOtpRes.status, 'User ID:', verifyOtpData.data?.userId);
    if (!verifyOtpData.data?.accessToken) {
      throw new Error('Email OTP Verification failed');
    }
    const brandToken = verifyOtpData.data.accessToken;

    // 2. Admin Auth
    console.log('\n[2/4] Authenticating Platform Admin...');
    const adminVerifyRes = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ugcx.com', otp: '0000', role: 'admin' }),
    });
    const adminData = await adminVerifyRes.json();
    const adminToken = adminData.data?.accessToken;
    console.log('Admin Auth Status:', adminVerifyRes.status, 'Admin ID:', adminData.data?.userId);

    // 3. Brand Creates Brief & Submits Manual Payment Proof (InstaPay)
    console.log('\n[3/4] Creating Brief & Submitting InstaPay Payment Proof...');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const campaignRes = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandToken}`,
      },
      body: JSON.stringify({
        title: `Manual Escrow Test Campaign ${randomSuffix}`,
        niche: 'beauty_personal_care',
        videoType: 'unboxing',
        durationSeconds: 30,
        language: 'ar',
        budgetMin: 800,
        budgetMax: 1500,
        needsShipping: false,
      }),
    });
    const campaign = (await campaignRes.json()).data;
    console.log('Created Campaign ID:', campaign.id, 'Status:', campaign.status);

    const manualPayRes = await fetch(`${API_BASE}/campaigns/${campaign.id}/escrow/manual-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandToken}`,
      },
      body: JSON.stringify({
        method: 'instapay',
        transactionReference: `INSTA-REF-${randomSuffix}`,
        senderAccount: 'brand_ceo@instapay',
        amount: 1150,
      }),
    });
    const manualPayData = await manualPayRes.json();
    console.log('Manual payment submission response:', manualPayData);

    // Verify DB state before admin approval
    const preVerifyDb = await db.query(
      `SELECT id, status, escrow_funded_amount, funding_paymob_order_id, funding_requested_amount
       FROM campaigns WHERE id = $1`,
      [campaign.id]
    );
    console.log('DB State (Pending Admin):', preVerifyDb.rows[0]);

    // 4. Admin Verifies Escrow Payment
    console.log('\n[4/4] Admin Verifying Escrow Payment...');
    const adminVerifyEscrowRes = await fetch(`${API_BASE}/admin/campaigns/${campaign.id}/verify-escrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        approved: true,
        reference: `INSTA-REF-${randomSuffix}`,
        note: 'Confirmed on InstaPay bank account statement',
      }),
    });
    const adminVerifyEscrowJson = await adminVerifyEscrowRes.json();
    console.log('Admin Verification Response:', adminVerifyEscrowJson);

    // Verify DB state after admin approval
    const postVerifyDb = await db.query(
      `SELECT id, title, status, escrow_funded_amount, funding_paymob_order_id, funding_requested_amount, published_at
       FROM campaigns WHERE id = $1`,
      [campaign.id]
    );
    console.log('DB State (Live & Funded):', postVerifyDb.rows[0]);

    const txDb = await db.query(
      `SELECT id, campaign_id, type, amount, status, payment_method_label, paymob_reference, created_at
       FROM transactions WHERE campaign_id = $1 ORDER BY created_at DESC`,
      [campaign.id]
    );
    console.log('Transaction Ledger Row:', txDb.rows[0]);

    if (postVerifyDb.rows[0].status !== 'live') {
      throw new Error(`Campaign status should be 'live', got '${postVerifyDb.rows[0].status}'`);
    }
    if (parseFloat(postVerifyDb.rows[0].escrow_funded_amount) !== 1150) {
      throw new Error(`Funded amount should be 1150.00, got '${postVerifyDb.rows[0].escrow_funded_amount}'`);
    }
    if (!txDb.rows[0] || txDb.rows[0].type !== 'charge') {
      throw new Error('Transaction charge row not found');
    }

    console.log('\n=== ALL MANUAL ESCROW & EMAIL OTP VERIFICATIONS PASSED SUCCESSFULLY ===');
  } finally {
    await db.end();
  }
}

verifyManualFlow().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
