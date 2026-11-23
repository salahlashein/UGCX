import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import {
  User,
  UserRole,
  UserLocale,
} from '../src/modules/users/entities/user.entity';
import { PaymobClient } from '../src/modules/payments/paymob.client';
import { R2StorageClient } from '../src/modules/storage/r2-storage.client';
import { AblyTokenService } from '../src/modules/messages/ably-token.service';
import { computePaymobHmac } from '../src/modules/payments/paymob-signature';
import type { PaymobWebhookTransaction } from '../src/modules/payments/dto/paymob-webhook.dto';

/**
 * Escrow and payments against a real Postgres instance.
 *
 * The model (DEC-001): a brand funds escrow on the brief (campaign), by
 * Paymob or by a manual transfer that an admin confirms. A brief goes live
 * only with funded escrow. Accepting a proposal allocates from the brief's
 * escrow and creates a funded collaboration. It raises no second charge.
 *
 * PaymobClient, R2StorageClient, and AblyTokenService are mocks, so no
 * request reaches an external provider. Accounts are registered once in
 * beforeAll, because AuthController is rate-limited (SEC-003).
 */
describe('Escrow & payments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const runId = Date.now();
  const hmacSecret =
    process.env.PAYMOB_HMAC_SECRET ??
    'local-dev-only-hmac-secret-do-not-use-in-prod';

  let brandToken: string;
  let creatorToken: string;
  let outsiderToken: string;
  let adminToken: string;
  let adminUserId: string;

  // A creator price of 1000.00 plus the 10% fee makes a total of 1100.00.
  const CREATOR_PRICE = 1000;
  const TOTAL_CENTS = 110000;

  const mockPaymobClient = {
    createCheckout: jest.fn(
      async (_amountCents: number, merchantOrderId: string) => ({
        paymobOrderId: `paymob-order-${merchantOrderId}-${Math.random()}`,
        checkoutUrl: `https://accept.paymob.com/api/acceptance/iframes/1?payment_token=mock-${merchantOrderId}`,
      }),
    ),
  };

  const mockR2StorageClient = {
    collaborationUrlPrefix: (collaborationId: string) =>
      `https://mock-r2.example.com/collaborations/${collaborationId}/`,
    createUploadUrl: jest.fn(
      async (
        collaborationId: string,
        _contentType: string,
        extension: string,
      ) => ({
        uploadUrl: `https://mock-r2.example.com/upload/${collaborationId}`,
        fileUrl: `https://mock-r2.example.com/collaborations/${collaborationId}/test-file.${extension}`,
      }),
    ),
  };

  const mockAblyTokenService = {
    createTokenForCollaboration: jest.fn(async () => ({
      keyName: 'mock-key-name',
      ttl: 3600000,
      capability: '{}',
      timestamp: Date.now(),
      nonce: 'mock-nonce',
      mac: 'mock-mac',
    })),
  };

  const server = () => app.getHttpServer();

  function buildTransaction(
    overrides: Partial<PaymobWebhookTransaction>,
  ): PaymobWebhookTransaction {
    return {
      id: `txn_${Math.random()}`,
      amount_cents: TOTAL_CENTS,
      created_at: new Date().toISOString(),
      currency: 'EGP',
      error_occured: false,
      has_parent_transaction: false,
      integration_id: 12345,
      is_3d_secure: true,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: { id: 'order_default' },
      owner: 1,
      pending: false,
      success: true,
      ...overrides,
    };
  }

  async function postWebhook(
    transaction: PaymobWebhookTransaction,
    hmac?: string,
  ) {
    const signature = hmac ?? computePaymobHmac(transaction, hmacSecret);
    return request(server())
      .post(`/api/v1/webhooks/paymob?hmac=${signature}`)
      .send({ type: 'TRANSACTION', obj: transaction });
  }

  async function escrowOf(campaignId: string) {
    const [row] = await dataSource.query(
      `SELECT status, escrow_funded_amount AS funded,
              escrow_allocated_amount AS allocated,
              funding_paymob_order_id AS "orderId"
         FROM campaigns WHERE id = $1`,
      [campaignId],
    );
    return row as {
      status: string;
      funded: string;
      allocated: string;
      orderId: string | null;
    };
  }

  async function chargeCount(campaignId: string): Promise<number> {
    const [row] = await dataSource.query(
      `SELECT count(*)::int AS n FROM transactions
        WHERE campaign_id = $1 AND type = 'charge'`,
      [campaignId],
    );
    return row.n;
  }

  /** A draft brief with every field that publish needs, without escrow. */
  async function createDraftBrief(): Promise<string> {
    const created = await request(server())
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${brandToken}`)
      .send({});
    expect(created.status).toBe(201);
    const campaignId = created.body.data.id;

    const patched = await request(server())
      .patch(`/api/v1/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        title: `Escrow test brief ${Math.random()}`,
        budgetMin: 1100,
        budgetMax: 1100,
        niche: 'fashion',
        language: 'en',
        videoType: 'demo',
        durationSeconds: 20,
        slots: 1,
      });
    expect(patched.status).toBe(200);
    return campaignId;
  }

  /** Starts a Paymob checkout for the brief and returns the Paymob order id. */
  async function startCheckout(campaignId: string): Promise<string> {
    const res = await request(server())
      .post(`/api/v1/campaigns/${campaignId}/escrow/checkout`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({ amount: TOTAL_CENTS / 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.checkoutUrl).toContain('accept.paymob.com');
    return res.body.data.paymobOrderId;
  }

  function escrowTransaction(
    campaignId: string,
    paymobOrderId: string,
    overrides: Partial<PaymobWebhookTransaction> = {},
  ): PaymobWebhookTransaction {
    return buildTransaction({
      order: { id: paymobOrderId, merchant_order_id: `cmp_${campaignId}` },
      ...overrides,
    });
  }

  /** A live brief with 1100.00 in escrow, funded through Paymob. */
  async function createLiveFundedBrief(): Promise<string> {
    const campaignId = await createDraftBrief();
    const orderId = await startCheckout(campaignId);
    const hook = await postWebhook(escrowTransaction(campaignId, orderId));
    expect(hook.status).toBe(200);

    const published = await request(server())
      .post(`/api/v1/campaigns/${campaignId}/publish`)
      .set('Authorization', `Bearer ${brandToken}`);
    expect(published.status).toBe(200);
    return campaignId;
  }

  async function applyTo(campaignId: string, token = creatorToken) {
    const res = await request(server())
      .post(`/api/v1/campaigns/${campaignId}/proposals`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        price: CREATOR_PRICE,
        deliveryDays: 5,
        pitch: 'escrow test pitch',
      });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  }

  async function accept(proposalId: string) {
    return request(server())
      .post(`/api/v1/proposals/${proposalId}/accept`)
      .set('Authorization', `Bearer ${brandToken}`);
  }

  async function register(
    role: 'brand' | 'creator',
    label: string,
    phone: string,
  ) {
    const res = await request(server())
      .post('/api/v1/auth/register')
      .send({
        role,
        email: `escrow-${label}-${runId}@example.com`,
        phone,
        password: 'Passw0rd1',
        locale: 'en',
      });
    expect(res.status).toBe(201);
    return res.body.data.accessToken as string;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PaymobClient)
      .useValue(mockPaymobClient)
      .overrideProvider(R2StorageClient)
      .useValue(mockR2StorageClient)
      .overrideProvider(AblyTokenService)
      .useValue(mockAblyTokenService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = app.get(DataSource);

    brandToken = await register('brand', 'brand', '+201100000001');
    creatorToken = await register('creator', 'creator', '+201100000002');
    outsiderToken = await register('creator', 'outsider', '+201100000003');

    // A brand must verify its email or phone before it creates a brief.
    // Password sign-up does not verify, and the OTP route is rate-limited.
    await dataSource.query(
      'UPDATE users SET email_verified_at = now() WHERE email = $1',
      [`escrow-brand-${runId}@example.com`],
    );

    // Admins are created out of band. Self sign-up cannot make one.
    const adminEmail = `escrow-admin-${runId}@example.com`;
    const passwordHash = await bcrypt.hash('AdminPass1', 4);
    const adminUser = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        email: adminEmail,
        phone: '+201100000004',
        passwordHash,
        role: UserRole.ADMIN,
        locale: UserLocale.EN,
      }),
    );
    adminUserId = adminUser.id;
    const adminLogin = await request(server())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'AdminPass1' });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Feature: Funding a brief through Paymob', () => {
    it('refuses to publish a brief before escrow is funded', async () => {
      const campaignId = await createDraftBrief();
      const res = await request(server())
        .post(`/api/v1/campaigns/${campaignId}/publish`)
        .set('Authorization', `Bearer ${brandToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error.details).toEqual([
        expect.objectContaining({ field: 'escrow' }),
      ]);
    });

    it('a signed success webhook funds escrow once, and the brief can publish', async () => {
      const campaignId = await createDraftBrief();
      const orderId = await startCheckout(campaignId);
      expect((await escrowOf(campaignId)).orderId).toBe(orderId);

      const hook = await postWebhook(escrowTransaction(campaignId, orderId));
      expect(hook.status).toBe(200);

      const escrow = await escrowOf(campaignId);
      expect(escrow.funded).toBe('1100.00');
      expect(escrow.orderId).toBeNull();
      expect(await chargeCount(campaignId)).toBe(1);

      const published = await request(server())
        .post(`/api/v1/campaigns/${campaignId}/publish`)
        .set('Authorization', `Bearer ${brandToken}`);
      expect(published.status).toBe(200);
      expect(published.body.data.status).toBe('live');
    });

    it('ignores a replay of the same webhook (one charge only)', async () => {
      const campaignId = await createDraftBrief();
      const orderId = await startCheckout(campaignId);
      const transaction = escrowTransaction(campaignId, orderId);

      await postWebhook(transaction);
      const replay = await postWebhook(transaction);

      expect(replay.status).toBe(200);
      expect((await escrowOf(campaignId)).funded).toBe('1100.00');
      expect(await chargeCount(campaignId)).toBe(1);
    });

    it('rejects a webhook with an invalid signature and changes nothing (REQ-004/RISK-003)', async () => {
      const campaignId = await createDraftBrief();
      const orderId = await startCheckout(campaignId);

      const res = await postWebhook(
        escrowTransaction(campaignId, orderId),
        'f'.repeat(128),
      );

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('invalid_signature');
      const escrow = await escrowOf(campaignId);
      expect(escrow.funded).toBe('0.00');
      expect(escrow.orderId).toBe(orderId);
    });

    it('a failed webhook clears the checkout and funds nothing', async () => {
      const campaignId = await createDraftBrief();
      const orderId = await startCheckout(campaignId);

      await postWebhook(
        escrowTransaction(campaignId, orderId, { success: false }),
      );

      const escrow = await escrowOf(campaignId);
      expect(escrow.funded).toBe('0.00');
      expect(escrow.orderId).toBeNull();
      expect(await chargeCount(campaignId)).toBe(0);
    });

    it('H1: refuses to fund on an amount mismatch with the requested amount', async () => {
      const campaignId = await createDraftBrief();
      const orderId = await startCheckout(campaignId);

      await postWebhook(
        escrowTransaction(campaignId, orderId, {
          amount_cents: TOTAL_CENTS - 100,
        }),
      );

      expect((await escrowOf(campaignId)).funded).toBe('0.00');
      expect(await chargeCount(campaignId)).toBe(0);
    });

    it('H1: refuses to fund a refunded transaction even when success is true', async () => {
      const campaignId = await createDraftBrief();
      const orderId = await startCheckout(campaignId);

      await postWebhook(
        escrowTransaction(campaignId, orderId, { is_refunded: true }),
      );

      expect((await escrowOf(campaignId)).funded).toBe('0.00');
      expect(await chargeCount(campaignId)).toBe(0);
    });
  });

  describe('Feature: Funding a brief by manual transfer (V1)', () => {
    it('an admin confirm funds the submitted amount once and puts the brief live', async () => {
      const campaignId = await createDraftBrief();
      const submit = await request(server())
        .post(`/api/v1/campaigns/${campaignId}/escrow/manual-payment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          method: 'vodafone_cash',
          transactionReference: `VC-${runId}-1`,
          amount: 1100,
        });
      expect(submit.status).toBe(200);

      const queue = await request(server())
        .get('/api/v1/admin/campaigns/pending-escrow?perPage=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(queue.status).toBe(200);
      expect(
        queue.body.data.some((c: { id: string }) => c.id === campaignId),
      ).toBe(true);

      const verify = await request(server())
        .post(`/api/v1/admin/campaigns/${campaignId}/verify-escrow`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true });
      expect(verify.status).toBe(201);
      expect(verify.body.data.status).toBe('live');
      expect(verify.body.data.fundedAmount).toBe('1100.00');

      const again = await request(server())
        .post(`/api/v1/admin/campaigns/${campaignId}/verify-escrow`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true });
      expect(again.status).toBe(409);
      expect(again.body.error.code).toBe('no_pending_manual_payment');
      expect(await chargeCount(campaignId)).toBe(1);
    });

    it('refuses a transaction reference that already funded a brief (one transfer, one brief)', async () => {
      const reference = `IP-${runId}-reuse`;
      const first = await createDraftBrief();
      await request(server())
        .post(`/api/v1/campaigns/${first}/escrow/manual-payment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          method: 'instapay',
          transactionReference: reference,
          amount: 1100,
        });

      // While the first submission waits, a second brief cannot use it.
      const second = await createDraftBrief();
      const whilePending = await request(server())
        .post(`/api/v1/campaigns/${second}/escrow/manual-payment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          method: 'instapay',
          transactionReference: reference,
          amount: 1100,
        });
      expect(whilePending.status).toBe(409);
      expect(whilePending.body.error.code).toBe(
        'duplicate_transaction_reference',
      );

      // After the admin confirms it, it still cannot fund another brief.
      const verify = await request(server())
        .post(`/api/v1/admin/campaigns/${first}/verify-escrow`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true });
      expect(verify.status).toBe(201);

      const afterFunding = await request(server())
        .post(`/api/v1/campaigns/${second}/escrow/manual-payment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          method: 'instapay',
          transactionReference: reference,
          amount: 1100,
        });
      expect(afterFunding.status).toBe(409);
      expect(afterFunding.body.error.code).toBe(
        'duplicate_transaction_reference',
      );
      expect((await escrowOf(second)).funded).toBe('0.00');
    });

    it('a brand cannot confirm its own manual payment', async () => {
      const campaignId = await createDraftBrief();
      await request(server())
        .post(`/api/v1/campaigns/${campaignId}/escrow/manual-payment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          method: 'instapay',
          transactionReference: `IP-${runId}-2`,
          amount: 1100,
        });

      const res = await request(server())
        .post(`/api/v1/admin/campaigns/${campaignId}/verify-escrow`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ approved: true });

      expect(res.status).toBe(403);
      expect((await escrowOf(campaignId)).funded).toBe('0.00');
    });
  });

  describe('Feature: Accepting a proposal allocates from the brief escrow', () => {
    it('creates a funded collaboration without a second charge', async () => {
      const campaignId = await createLiveFundedBrief();
      const proposalId = await applyTo(campaignId);

      const res = await accept(proposalId);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('funded');
      expect(res.body.data.checkoutUrl).toBeNull();
      expect(res.body.data.totalAmount).toBe('1100.00');
      expect((await escrowOf(campaignId)).allocated).toBe('1100.00');
      expect(await chargeCount(campaignId)).toBe(1);

      const holds = await dataSource.query(
        `SELECT amount FROM transactions WHERE collaboration_id = $1 AND type = 'hold'`,
        [res.body.data.collaborationId],
      );
      expect(holds).toEqual([{ amount: '1100.00' }]);
    });

    it('rejects a second accept of the same proposal (EDGE-P1-001)', async () => {
      const campaignId = await createLiveFundedBrief();
      const proposalId = await applyTo(campaignId);
      expect((await accept(proposalId)).status).toBe(201);

      const second = await accept(proposalId);

      expect(second.status).toBeGreaterThanOrEqual(409);
      expect(second.status).toBeLessThan(500);
      expect((await escrowOf(campaignId)).allocated).toBe('1100.00');
    });

    it('refuses an accept that the remaining escrow cannot cover', async () => {
      const campaignId = await createLiveFundedBrief();
      const first = await applyTo(campaignId);
      const second = await applyTo(campaignId, outsiderToken);
      expect((await accept(first)).status).toBe(201);

      const res = await accept(second);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
      expect((await escrowOf(campaignId)).allocated).toBe('1100.00');
    });
  });

  describe('Full flow: fund -> accept -> ship -> deliver -> approve -> payout -> chat', () => {
    it('walks a collaboration through the entire escrow lifecycle', async () => {
      const campaignId = await createLiveFundedBrief();
      const proposalId = await applyTo(campaignId);
      const acceptRes = await accept(proposalId);
      expect(acceptRes.status).toBe(201);
      const collaborationId = acceptRes.body.data.collaborationId;

      // REQ-006: confirm shipment.
      const shipRes = await request(server())
        .post(`/api/v1/collaborations/${collaborationId}/confirm-shipment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ carrier: 'Aramex', trackingNumber: 'TRACK123' });
      expect(shipRes.status).toBe(201);
      expect(shipRes.body.data.status).toBe('shipped');

      // REQ-011: a participant gets a chat token, a third party does not.
      const chatTokenRes = await request(server())
        .post(`/api/v1/collaborations/${collaborationId}/chat-token`)
        .set('Authorization', `Bearer ${creatorToken}`);
      expect(chatTokenRes.status).toBe(200);
      expect(chatTokenRes.body.data.keyName).toBe('mock-key-name');

      const outsiderChat = await request(server())
        .post(`/api/v1/collaborations/${collaborationId}/chat-token`)
        .set('Authorization', `Bearer ${outsiderToken}`);
      expect(outsiderChat.status).toBe(403);

      const postMessage = await request(server())
        .post(`/api/v1/collaborations/${collaborationId}/messages`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ body: 'Looking forward to the video!' });
      expect(postMessage.status).toBe(201);

      // TASK-P1-007: presigned upload URL, then register the deliverable.
      const uploadUrlRes = await request(server())
        .post(
          `/api/v1/collaborations/${collaborationId}/deliverables/upload-url`,
        )
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ contentType: 'video/mp4', fileSize: 10 * 1024 * 1024 });
      expect(uploadUrlRes.status).toBe(201);
      const fileUrl = uploadUrlRes.body.data.fileUrl;

      const registerRes = await request(server())
        .post(`/api/v1/collaborations/${collaborationId}/deliverables`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ type: 'ready_ad', fileUrl, durationSeconds: 30 });
      expect(registerRes.status).toBe(201);
      const deliverableId = registerRes.body.data.id;

      const [afterDelivery] = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(afterDelivery.status).toBe('delivered');

      // REQ-008: approving records a release and the platform fee.
      const reviewRes = await request(server())
        .post(`/api/v1/deliverables/${deliverableId}/review`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ action: 'approve' });
      expect(reviewRes.status).toBe(201);
      expect(reviewRes.body.data.collaborationStatus).toBe('approved');

      const release = await dataSource.query(
        `SELECT amount FROM transactions WHERE collaboration_id = $1 AND type = 'release'`,
        [collaborationId],
      );
      expect(release).toEqual([{ amount: '1100.00' }]);
      const fee = await dataSource.query(
        `SELECT amount FROM transactions WHERE collaboration_id = $1 AND type = 'fee'`,
        [collaborationId],
      );
      expect(fee).toEqual([{ amount: '100.00' }]);

      // TASK-P1-010: the payout queue lists it with the creator.
      const queueRes = await request(server())
        .get('/api/v1/admin/payouts?perPage=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(queueRes.status).toBe(200);
      const queued = queueRes.body.data.find(
        (c: { id: string }) => c.id === collaborationId,
      );
      expect(queued).toBeDefined();
      expect(queued.creator).toEqual(
        expect.objectContaining({ id: expect.any(String) }),
      );
      expect(queued.campaign).toEqual(
        expect.objectContaining({ id: campaignId }),
      );

      // REQ-010: admin marks it paid, once.
      const markPaidRes = await request(server())
        .post(`/api/v1/admin/payouts/${collaborationId}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          method: 'bank_transfer',
          reference: 'BANKREF-1',
          paidAt: new Date().toISOString(),
        });
      expect(markPaidRes.status).toBe(201);
      expect(markPaidRes.body.data.collaborationStatus).toBe('paid');

      const payout = await dataSource.query(
        `SELECT amount, recorded_by_user_id FROM transactions
          WHERE collaboration_id = $1 AND type = 'payout'`,
        [collaborationId],
      );
      expect(payout).toEqual([
        { amount: '1000.00', recorded_by_user_id: adminUserId },
      ]);
      // M3: payout + fee reconciles exactly against release.
      expect(Number(payout[0].amount) + Number(fee[0].amount)).toBeCloseTo(
        Number(release[0].amount),
        2,
      );

      const secondMarkPaid = await request(server())
        .post(`/api/v1/admin/payouts/${collaborationId}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          method: 'bank_transfer',
          reference: 'BANKREF-2',
          paidAt: new Date().toISOString(),
        });
      expect(secondMarkPaid.status).toBe(409);
      expect(secondMarkPaid.body.error.code).toBe('already_paid');
    });

    it('SEC-002: never exposes creator payout details to the brand', async () => {
      const campaignId = await createLiveFundedBrief();
      const proposalId = await applyTo(campaignId);
      const collaborationId = (await accept(proposalId)).body.data
        .collaborationId;

      const shipRes = await request(server())
        .post(`/api/v1/collaborations/${collaborationId}/confirm-shipment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ carrier: 'Aramex', trackingNumber: 'TRACK456' });
      const detail = await request(server())
        .get(`/api/v1/collaborations/${collaborationId}`)
        .set('Authorization', `Bearer ${brandToken}`);

      expect(JSON.stringify(shipRes.body)).not.toMatch(
        /payoutDetail|account_?identifier/i,
      );
      expect(JSON.stringify(detail.body)).not.toMatch(
        /payoutDetail|account_?identifier/i,
      );
    });
  });
});
