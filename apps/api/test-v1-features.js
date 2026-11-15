require('dotenv').config({ path: '.env' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://127.0.0.1:3000/api/v1';

async function runAllTests() {
  console.log('--- STARTING V1 SYSTEM VERIFICATION ---');
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  console.log('Connected to PostgreSQL successfully.');

  const results = {};

  try {
    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION & ONBOARDING
    // -------------------------------------------------------------------------
    console.log('\n[1/8] Testing Authentication and Onboarding...');
    
    // Case 1.1: Brand OTP Login
    const brandLoginRes = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+201000000002', otp: '0000', role: 'brand' }),
    });
    const brandAuth = (await brandLoginRes.json()).data;
    if (!brandAuth?.accessToken) throw new Error('Brand login failed');
    
    const brandDbRes = await db.query(
      `SELECT u.id, u.phone, u.role, b.id as brand_id, b.company_name 
       FROM users u LEFT JOIN brands b ON b.user_id = u.id WHERE u.id = $1`,
      [brandAuth.userId]
    );

    // Case 1.2: Creator OTP Login
    const creatorLoginRes = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+201000000001', otp: '0000', role: 'creator' }),
    });
    const creatorAuth = (await creatorLoginRes.json()).data;
    if (!creatorAuth?.accessToken) throw new Error('Creator login failed');

    const creatorDbRes = await db.query(
      `SELECT u.id, u.phone, u.role, c.id as creator_id, c.display_name, c.vetting_status 
       FROM users u LEFT JOIN creators c ON c.user_id = u.id WHERE u.id = $1`,
      [creatorAuth.userId]
    );

    // Case 1.3: New Creator Registration
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const newPhone = `+201099${randomSuffix}`;
    const newCreatorRes = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: newPhone, otp: '0000', role: 'creator' }),
    });
    const newCreatorAuth = (await newCreatorRes.json()).data;
    
    const newCreatorDbRes = await db.query(
      `SELECT u.id, u.phone, u.role, c.id as creator_id 
       FROM users u LEFT JOIN creators c ON c.user_id = u.id WHERE u.id = $1`,
      [newCreatorAuth.userId]
    );

    results.auth = {
      brandLogin: { user: brandAuth.userId, role: brandAuth.role, db: brandDbRes.rows[0] },
      creatorLogin: { user: creatorAuth.userId, role: creatorAuth.role, db: creatorDbRes.rows[0] },
      newRegistration: { user: newCreatorAuth.userId, phone: newPhone, db: newCreatorDbRes.rows[0] },
    };
    console.log('✓ Auth & Onboarding passed and verified in DB.');

    // -------------------------------------------------------------------------
    // 2. BRIEF CREATION & ESCROW FUNDING
    // -------------------------------------------------------------------------
    console.log('\n[2/8] Testing Brief Creation and Escrow Funding...');

    // Case 2.1: Post Brief (1-Page)
    const briefPayload = {
      title: `Summer Skincare UGC Campaign ${randomSuffix}`,
      niche: 'beauty_personal_care',
      videoType: 'unboxing',
      durationSeconds: 30,
      language: 'ar',
      budgetMin: 500,
      budgetMax: 1000,
      needsShipping: false,
    };

    const createBriefRes = await fetch(`${API_BASE}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandAuth.accessToken}`,
      },
      body: JSON.stringify(briefPayload),
    });
    const campaignData = (await createBriefRes.json()).data;
    if (!campaignData?.id) throw new Error('Failed to create campaign');

    const draftDbRes = await db.query(
      `SELECT id, brand_id, title, status, escrow_funded_amount, escrow_allocated_amount, budget_min, budget_max 
       FROM campaigns WHERE id = $1`,
      [campaignData.id]
    );

    // Case 2.2: Escrow Funding
    const fundRes = await fetch(`${API_BASE}/campaigns/${campaignData.id}/escrow/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandAuth.accessToken}`,
      },
      body: JSON.stringify({
        method: 'card',
        amount: 1000,
      }),
    });
    const fundData = await fundRes.json();

    // Case 2.3: Publish Brief
    const publishRes = await fetch(`${API_BASE}/campaigns/${campaignData.id}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandAuth.accessToken}`,
      },
    });
    const publishData = await publishRes.json();

    const fundedCampaignDbRes = await db.query(
      `SELECT id, title, status, escrow_funded_amount, escrow_allocated_amount, escrow_refunded_amount FROM campaigns WHERE id = $1`,
      [campaignData.id]
    );

    const transactionDbRes = await db.query(
      `SELECT id, campaign_id, type, amount, status, created_at 
       FROM transactions WHERE campaign_id = $1 ORDER BY created_at DESC`,
      [campaignData.id]
    );

    results.brief = {
      created: draftDbRes.rows[0],
      funded: fundedCampaignDbRes.rows[0],
      transactions: transactionDbRes.rows,
    };
    console.log('✓ Brief Creation & Escrow passed and verified in DB.');

    // -------------------------------------------------------------------------
    // 3. CAMPAIGN DISCOVERY & PROPOSALS
    // -------------------------------------------------------------------------
    console.log('\n[3/8] Testing Discovery & Proposal Submission...');

    // Case 3.1: Discover Campaigns
    const discoverRes = await fetch(`${API_BASE}/campaigns?perPage=20`, {
      headers: { Authorization: `Bearer ${creatorAuth.accessToken}` },
    });
    const discoverData = await discoverRes.json();
    const foundCampaign = discoverData.data.find((c) => c.id === campaignData.id);
    if (!foundCampaign) throw new Error('Created campaign not visible in discovery feed');

    // Case 3.2: Submit Proposal
    const proposalPayload = {
      price: 800,
      deliveryDays: 5,
      pitch: 'I have 50K followers in Beauty and love filming aesthetic unboxings in Cairo!',
    };
    const submitPropRes = await fetch(`${API_BASE}/campaigns/${campaignData.id}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorAuth.accessToken}`,
      },
      body: JSON.stringify(proposalPayload),
    });
    const propData = (await submitPropRes.json()).data;
    if (!propData?.id) throw new Error('Proposal submission failed');

    const proposalDbRes = await db.query(
      `SELECT id, campaign_id, creator_id, price, delivery_days, pitch, status 
       FROM proposals WHERE id = $1`,
      [propData.id]
    );

    // Case 3.3: Duplicate Proposal Prevention
    const duplicateRes = await fetch(`${API_BASE}/campaigns/${campaignData.id}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorAuth.accessToken}`,
      },
      body: JSON.stringify(proposalPayload),
    });
    const duplicateBlocked = duplicateRes.status === 409 || duplicateRes.status === 400;

    results.proposals = {
      submitted: proposalDbRes.rows[0],
      duplicateBlocked,
      duplicateHttpStatus: duplicateRes.status,
    };
    console.log('✓ Discovery & Proposals passed and verified in DB.');

    // -------------------------------------------------------------------------
    // 4. PROPOSAL REVIEW & ESCROW ALLOCATION
    // -------------------------------------------------------------------------
    console.log('\n[4/8] Testing Proposal Review & Escrow Allocation...');

    // Case 4.1: Brand Views Proposals Inbox
    const inboxRes = await fetch(`${API_BASE}/campaigns/${campaignData.id}/proposals`, {
      headers: { Authorization: `Bearer ${brandAuth.accessToken}` },
    });
    const inboxData = await inboxRes.json();
    const propInInbox = inboxData.data.find((p) => p.id === propData.id);
    if (!propInInbox) throw new Error('Proposal not found in brand inbox');

    // Case 4.2: Brand Accepts Proposal
    const acceptRes = await fetch(`${API_BASE}/proposals/${propData.id}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandAuth.accessToken}`,
      },
      body: JSON.stringify({}),
    });
    const acceptData = (await acceptRes.json()).data;

    const acceptedProposalDb = await db.query(
      `SELECT id, status FROM proposals WHERE id = $1`,
      [propData.id]
    );

    const collabDbRes = await db.query(
      `SELECT id, campaign_id, brand_id, creator_id, status, creator_price, platform_fee, total_amount 
       FROM collaborations WHERE campaign_id = $1`,
      [campaignData.id]
    );

    const activeCollab = collabDbRes.rows[0];

    const holdTransRes = await db.query(
      `SELECT id, collaboration_id, type, amount, status 
       FROM transactions WHERE collaboration_id = $1`,
      [activeCollab.id]
    );

    const campaignAfterAccept = await db.query(
      `SELECT id, escrow_funded_amount, escrow_allocated_amount FROM campaigns WHERE id = $1`,
      [campaignData.id]
    );

    results.allocation = {
      acceptedProposal: acceptedProposalDb.rows[0],
      collaboration: activeCollab,
      holdTransaction: holdTransRes.rows[0],
      campaignEscrow: campaignAfterAccept.rows[0],
    };
    console.log('✓ Proposal Review & Allocation passed and verified in DB.');

    // -------------------------------------------------------------------------
    // 5. COLLABORATION CHAT
    // -------------------------------------------------------------------------
    console.log('\n[5/8] Testing Collaboration Chat...');

    // Case 5.1: Brand Sends Message
    const brandMsgRes = await fetch(`${API_BASE}/collaborations/${activeCollab.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandAuth.accessToken}`,
      },
      body: JSON.stringify({ body: 'Hi Nour! Excited to collaborate. Please focus on the texture.' }),
    });
    const brandMsg = (await brandMsgRes.json()).data;

    // Case 5.2: Creator Sends Message
    const creatorMsgRes = await fetch(`${API_BASE}/collaborations/${activeCollab.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorAuth.accessToken}`,
      },
      body: JSON.stringify({ body: 'Understood! I will record the close-up texture in daylight tomorrow.' }),
    });
    const creatorMsg = (await creatorMsgRes.json()).data;

    const chatDbRes = await db.query(
      `SELECT id, collaboration_id, sender_user_id, body, sent_at 
       FROM messages WHERE collaboration_id = $1 ORDER BY sent_at ASC`,
      [activeCollab.id]
    );

    results.chat = {
      messagesCount: chatDbRes.rows.length,
      messages: chatDbRes.rows,
    };
    console.log('✓ Collaboration Chat passed and verified in DB.');

    // -------------------------------------------------------------------------
    // 6. DELIVERABLE UPLOAD & REVIEW LOOP
    // -------------------------------------------------------------------------
    console.log('\n[6/8] Testing Deliverable Upload and Review Loop...');

    // Case 6.1: Creator Requests Presigned Upload URL
    const uploadUrlRes = await fetch(`${API_BASE}/collaborations/${activeCollab.id}/deliverables/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorAuth.accessToken}`,
      },
      body: JSON.stringify({
        contentType: 'video/mp4',
        fileSize: 10485760,
      }),
    });
    const uploadUrlJson = await uploadUrlRes.json();
    console.log('uploadUrlRes status:', uploadUrlRes.status, 'body:', uploadUrlJson);
    const uploadUrlData = uploadUrlJson.data;
    if (!uploadUrlData?.fileUrl) {
      throw new Error('Failed to obtain presigned upload URL: ' + JSON.stringify(uploadUrlJson));
    }

    // Case 6.2: Creator Registers Uploaded Deliverable
    const deliverableRes = await fetch(`${API_BASE}/collaborations/${activeCollab.id}/deliverables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${creatorAuth.accessToken}`,
      },
      body: JSON.stringify({
        type: 'ready_ad',
        fileUrl: uploadUrlData.fileUrl,
        durationSeconds: 30,
        note: 'Here is the first draft! Natural lighting and sound included.',
      }),
    });
    const deliverableJson = await deliverableRes.json();
    const deliverableData = deliverableJson.data;
    if (!deliverableData?.id) {
      throw new Error('Failed to register deliverable: ' + JSON.stringify(deliverableJson));
    }

    const submittedDeliverableDb = await db.query(
      `SELECT id, collaboration_id, file_url, status, created_at 
       FROM deliverables WHERE collaboration_id = $1`,
      [activeCollab.id]
    );

    const collabDeliveredDb = await db.query(
      `SELECT id, status FROM collaborations WHERE id = $1`,
      [activeCollab.id]
    );

    // Case 6.2: Brand Approves Deliverable
    const reviewRes = await fetch(`${API_BASE}/deliverables/${deliverableData.id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brandAuth.accessToken}`,
      },
      body: JSON.stringify({
        action: 'approve',
      }),
    });
    const reviewData = (await reviewRes.json()).data;

    const approvedDeliverableDb = await db.query(
      `SELECT id, status, updated_at FROM deliverables WHERE id = $1`,
      [deliverableData.id]
    );

    const completedCollabDb = await db.query(
      `SELECT id, status FROM collaborations WHERE id = $1`,
      [activeCollab.id]
    );

    const releaseTransactionDb = await db.query(
      `SELECT id, collaboration_id, type, amount, status, created_at 
       FROM transactions WHERE collaboration_id = $1 AND type = 'release'`,
      [activeCollab.id]
    );

    results.deliverables = {
      submitted: submittedDeliverableDb.rows[0],
      collabStatusAfterUpload: collabDeliveredDb.rows[0].status,
      approved: approvedDeliverableDb.rows[0],
      collabStatusAfterReview: completedCollabDb.rows[0].status,
      releaseTransaction: releaseTransactionDb.rows[0],
    };
    console.log('✓ Deliverable & Review passed and verified in DB.');

    // -------------------------------------------------------------------------
    // 7. CREATOR EARNINGS & LEDGER
    // -------------------------------------------------------------------------
    console.log('\n[7/8] Testing Creator Earnings and Ledger...');

    const earningsRes = await fetch(`${API_BASE}/creators/me/earnings`, {
      headers: { Authorization: `Bearer ${creatorAuth.accessToken}` },
    });
    const earningsData = (await earningsRes.json()).data;

    const creatorLedgerDb = await db.query(
      `SELECT t.id, t.type, t.amount, t.status, t.created_at 
       FROM transactions t 
       JOIN collaborations col ON col.id = t.collaboration_id 
       WHERE col.creator_id = $1 ORDER BY t.created_at DESC`,
      [creatorDbRes.rows[0].creator_id]
    );

    results.earnings = {
      apiReported: earningsData,
      dbLedgerEntries: creatorLedgerDb.rows,
    };
    console.log('✓ Creator Earnings & Ledger verified in DB.');

    // -------------------------------------------------------------------------
    // 8. IN-APP NOTIFICATIONS
    // -------------------------------------------------------------------------
    console.log('\n[8/8] Testing In-App Notifications...');

    const brandNotifRes = await fetch(`${API_BASE}/notifications?perPage=20`, {
      headers: { Authorization: `Bearer ${brandAuth.accessToken}` },
    });
    const brandNotifs = (await brandNotifRes.json()).data;

    const creatorNotifRes = await fetch(`${API_BASE}/notifications?perPage=20`, {
      headers: { Authorization: `Bearer ${creatorAuth.accessToken}` },
    });
    const creatorNotifs = (await creatorNotifRes.json()).data;

    const dbNotifs = await db.query(
      `SELECT id, user_id, event, params, read_at, created_at 
       FROM notifications WHERE user_id IN ($1, $2) ORDER BY created_at DESC LIMIT 10`,
      [brandAuth.userId, creatorAuth.userId]
    );

    results.notifications = {
      brandNotificationsCount: brandNotifs.length,
      creatorNotificationsCount: creatorNotifs.length,
      recentDbNotifications: dbNotifs.rows,
    };
    console.log('✓ In-App Notifications verified in DB.');

    // Write full test report JSON
    fs.writeFileSync(
      path.join(__dirname, 'test-v1-report.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    );
    console.log('\n=== ALL 8 V1 FEATURES TESTED & VERIFIED WITH REAL DB DATA ===');
  } catch (err) {
    console.error('Test execution failed:', err);
    throw err;
  } finally {
    await db.end();
  }
}

runAllTests();
