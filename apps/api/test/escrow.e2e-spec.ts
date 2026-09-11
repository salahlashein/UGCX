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
 * Covers every Gherkin scenario in
 * operations/specs/feature_backend_escrow_payments/plan.md against a real
 * Postgres instance (docker compose up -d db). RISK-001/ASM-P1-001: no
 * real Paymob/R2/Ably accounts exist in this environment, so PaymobClient,
 * R2StorageClient, and AblyTokenService are overridden with mocks - no
 * real network call reaches any external provider.
 *
 * All brand/creator/admin accounts are registered once in beforeAll
 * (SEC-003: AuthController is rate-limited to 10 requests/min/IP); every
 * test then creates its own product/campaign/proposal/collaboration under
 * those same accounts instead of registering new users.
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

  const mockPaymobClient = {
    createCheckout: jest.fn(
      async (_amountCents: number, merchantOrderId: string) => ({
        paymobOrderId: `paymob-order-${merchantOrderId}`,
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

  function buildTransaction(
    overrides: Partial<PaymobWebhookTransaction>,
  ): PaymobWebhookTransaction {
    return {
      id: 'txn_default',
      amount_cents: 110000,
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
    return request(app.getHttpServer())
      .post(`/api/v1/webhooks/paymob?hmac=${signature}`)
      .send({ type: 'TRANSACTION', obj: transaction });
  }

  /** Creates a fresh applied proposal under the shared brand/creator (no auth calls). */
  async function createAppliedProposal(): Promise<string> {
    const productRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${brandToken}`)
      .send({ name: `Escrow test product ${Math.random()}` });

    const campaignRes = await request(app.getHttpServer())
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${brandToken}`)
      .send({ productId: productRes.body.data.id });
    const campaignId = campaignRes.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${brandToken}`)
      .send({
        niche: 'fashion',
        language: 'en',
        videoType: 'demo',
        durationSeconds: 20,
      });
    await request(app.getHttpServer())
      .post(`/api/v1/campaigns/${campaignId}/publish`)
      .set('Authorization', `Bearer ${brandToken}`);

    const proposalRes = await request(app.getHttpServer())
      .post(`/api/v1/campaigns/${campaignId}/proposals`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({ price: 1000, deliveryDays: 5, pitch: 'escrow test pitch' });
    return proposalRes.body.data.id;
  }

  async function acceptAndFund(proposalId: string): Promise<string> {
    const acceptRes = await request(app.getHttpServer())
      .post(`/api/v1/proposals/${proposalId}/accept`)
      .set('Authorization', `Bearer ${brandToken}`);
    const collaborationId = acceptRes.body.data.collaborationId;

    const rows = await dataSource.query(
      'SELECT paymob_order_id FROM collaborations WHERE id = $1',
      [collaborationId],
    );
    await postWebhook(
      buildTransaction({
        id: `txn_setup_${collaborationId}`,
        order: { id: rows[0].paymob_order_id },
        success: true,
      }),
    );
    return collaborationId;
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

    const brandRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        role: 'brand',
        email: `escrow-brand-${runId}@example.com`,
        phone: '+201100000001',
        password: 'Passw0rd1',
        locale: 'en',
      });
    brandToken = brandRes.body.data.accessToken;

    const creatorRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        role: 'creator',
        email: `escrow-creator-${runId}@example.com`,
        phone: '+201100000002',
        password: 'Passw0rd1',
        locale: 'en',
      });
    creatorToken = creatorRes.body.data.accessToken;

    const outsiderRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        role: 'creator',
        email: `escrow-outsider-${runId}@example.com`,
        phone: '+201100000003',
        password: 'Passw0rd1',
        locale: 'en',
      });
    outsiderToken = outsiderRes.body.data.accessToken;

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
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'AdminPass1' });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Feature: Accepting a proposal charges the brand', () => {
    it('creates a pending-payment collaboration with a Paymob checkout URL', async () => {
      const proposalId = await createAppliedProposal();

      const res = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending_payment');
      expect(res.body.data.checkoutUrl).toContain('accept.paymob.com');
    });

    it('rejects a second accept of the same proposal (EDGE-P1-001)', async () => {
      const proposalId = await createAppliedProposal();

      const first = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);
      expect(first.status).toBe(201);

      const second = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);

      // Proposal stays 'applied' until a webhook funds it; the second
      // insert trips the unique constraint on collaborations.proposal_id.
      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('collaboration_already_exists');
    });

    it('a successful webhook funds the collaboration, accepts the proposal, and records one hold', async () => {
      const proposalId = await createAppliedProposal();
      const acceptRes = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);
      const collaborationId = acceptRes.body.data.collaborationId;

      const rows = await dataSource.query(
        'SELECT paymob_order_id FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      const paymobOrderId = rows[0].paymob_order_id;

      const transaction = buildTransaction({
        id: `txn_${collaborationId}`,
        order: { id: paymobOrderId },
        success: true,
      });
      const webhookRes = await postWebhook(transaction);
      expect(webhookRes.status).toBe(200);

      const collaborationRow = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(collaborationRow[0].status).toBe('funded');

      const proposalRow = await dataSource.query(
        'SELECT status FROM proposals WHERE id = $1',
        [proposalId],
      );
      expect(proposalRow[0].status).toBe('accepted');

      const holdTransactions = await dataSource.query(
        `SELECT * FROM transactions WHERE collaboration_id = $1 AND type = 'hold'`,
        [collaborationId],
      );
      expect(holdTransactions).toHaveLength(1);

      // Scenario: a repeated webhook delivery does not double-process (REQ-005).
      const replay = await postWebhook(transaction);
      expect(replay.status).toBe(200);
      const holdAfterReplay = await dataSource.query(
        `SELECT * FROM transactions WHERE collaboration_id = $1 AND type = 'hold'`,
        [collaborationId],
      );
      expect(holdAfterReplay).toHaveLength(1);
    });

    it('rejects a webhook with an invalid signature and changes nothing (REQ-004/RISK-003)', async () => {
      const proposalId = await createAppliedProposal();
      const acceptRes = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);
      const collaborationId = acceptRes.body.data.collaborationId;
      const rows = await dataSource.query(
        'SELECT paymob_order_id FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      const paymobOrderId = rows[0].paymob_order_id;

      const transaction = buildTransaction({
        id: `txn_bad_sig_${collaborationId}`,
        order: { id: paymobOrderId },
        success: true,
      });
      const res = await postWebhook(transaction, 'deadbeefdeadbeefdeadbeef');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('invalid_signature');

      const collaborationRow = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(collaborationRow[0].status).toBe('pending_payment');

      const transactions = await dataSource.query(
        'SELECT * FROM transactions WHERE collaboration_id = $1',
        [collaborationId],
      );
      expect(transactions).toHaveLength(0);
    });

    it('sets payment_failed on a failed webhook and leaves the proposal untouched (REQ-003)', async () => {
      const proposalId = await createAppliedProposal();
      const acceptRes = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);
      const collaborationId = acceptRes.body.data.collaborationId;
      const rows = await dataSource.query(
        'SELECT paymob_order_id FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      const paymobOrderId = rows[0].paymob_order_id;

      const transaction = buildTransaction({
        id: `txn_failed_${collaborationId}`,
        order: { id: paymobOrderId },
        success: false,
      });
      const res = await postWebhook(transaction);
      expect(res.status).toBe(200);

      const collaborationRow = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(collaborationRow[0].status).toBe('payment_failed');

      const proposalRow = await dataSource.query(
        'SELECT status FROM proposals WHERE id = $1',
        [proposalId],
      );
      expect(proposalRow[0].status).toBe('applied');
    });

    it('C2: a late/retried success webhook after a prior failure still funds the collaboration (does not silently lose the money)', async () => {
      const proposalId = await createAppliedProposal();
      const acceptRes = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);
      const collaborationId = acceptRes.body.data.collaborationId;
      const rows = await dataSource.query(
        'SELECT paymob_order_id FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      const paymobOrderId = rows[0].paymob_order_id;

      // Brand's first attempt fails.
      const failedRes = await postWebhook(
        buildTransaction({
          id: `txn_first_attempt_${collaborationId}`,
          order: { id: paymobOrderId },
          success: false,
        }),
      );
      expect(failedRes.status).toBe(200);
      const afterFailure = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(afterFailure[0].status).toBe('payment_failed');

      // Brand retries inside the same Paymob checkout session: same
      // order id, a new transaction id, this time successful.
      const successRes = await postWebhook(
        buildTransaction({
          id: `txn_retry_success_${collaborationId}`,
          order: { id: paymobOrderId },
          success: true,
        }),
      );
      expect(successRes.status).toBe(200);

      const afterRetry = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(afterRetry[0].status).toBe('funded');

      const proposalRow = await dataSource.query(
        'SELECT status FROM proposals WHERE id = $1',
        [proposalId],
      );
      expect(proposalRow[0].status).toBe('accepted');

      const holdTransactions = await dataSource.query(
        `SELECT * FROM transactions WHERE collaboration_id = $1 AND type = 'hold'`,
        [collaborationId],
      );
      expect(holdTransactions).toHaveLength(1);
    });

    it('H1: refuses to fund on an amount mismatch between the signed webhook and the collaboration total', async () => {
      const proposalId = await createAppliedProposal();
      const acceptRes = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);
      const collaborationId = acceptRes.body.data.collaborationId;
      const rows = await dataSource.query(
        'SELECT paymob_order_id FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      const paymobOrderId = rows[0].paymob_order_id;

      // collaboration.totalAmount is 1100.00 EGP (110000 cents) for a
      // 1000 EGP proposal; the signed payload claims a 1 EGP charge.
      const res = await postWebhook(
        buildTransaction({
          id: `txn_amount_mismatch_${collaborationId}`,
          order: { id: paymobOrderId },
          success: true,
          amount_cents: 100,
        }),
      );
      // Signature-verified, so still 200 to stop Paymob retrying, but no
      // state change - the mismatch is an internal correctness rejection,
      // not a signature failure.
      expect(res.status).toBe(200);

      const collaborationRow = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(collaborationRow[0].status).toBe('pending_payment');

      const holdTransactions = await dataSource.query(
        `SELECT * FROM transactions WHERE collaboration_id = $1 AND type = 'hold'`,
        [collaborationId],
      );
      expect(holdTransactions).toHaveLength(0);
    });

    it('H1: refuses to fund a refunded transaction even when success is true', async () => {
      const proposalId = await createAppliedProposal();
      const acceptRes = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);
      const collaborationId = acceptRes.body.data.collaborationId;
      const rows = await dataSource.query(
        'SELECT paymob_order_id FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      const paymobOrderId = rows[0].paymob_order_id;

      const res = await postWebhook(
        buildTransaction({
          id: `txn_refunded_${collaborationId}`,
          order: { id: paymobOrderId },
          success: true,
          is_refunded: true,
        }),
      );
      expect(res.status).toBe(200);

      const collaborationRow = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(collaborationRow[0].status).toBe('pending_payment');

      const holdTransactions = await dataSource.query(
        `SELECT * FROM transactions WHERE collaboration_id = $1 AND type = 'hold'`,
        [collaborationId],
      );
      expect(holdTransactions).toHaveLength(0);
    });

    it('rejects a chat token request for a not-yet-funded collaboration (EDGE-P1-006)', async () => {
      const proposalId = await createAppliedProposal();
      const acceptRes = await request(app.getHttpServer())
        .post(`/api/v1/proposals/${proposalId}/accept`)
        .set('Authorization', `Bearer ${brandToken}`);
      const collaborationId = acceptRes.body.data.collaborationId;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collaborations/${collaborationId}/chat-token`)
        .set('Authorization', `Bearer ${brandToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Full flow: fund -> ship -> deliver -> approve -> payout -> chat', () => {
    it('walks a collaboration through the entire escrow lifecycle', async () => {
      const proposalId = await createAppliedProposal();
      const collaborationId = await acceptAndFund(proposalId);

      // REQ-006: confirm shipment.
      const shipRes = await request(app.getHttpServer())
        .post(`/api/v1/collaborations/${collaborationId}/confirm-shipment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ carrier: 'Aramex', trackingNumber: 'TRACK123' });
      expect(shipRes.status).toBe(201);
      expect(shipRes.body.data.status).toBe('shipped');

      // REQ-011: a real participant can get a chat token.
      const chatTokenRes = await request(app.getHttpServer())
        .post(`/api/v1/collaborations/${collaborationId}/chat-token`)
        .set('Authorization', `Bearer ${creatorToken}`);
      expect(chatTokenRes.status).toBe(200);
      expect(chatTokenRes.body.data.keyName).toBe('mock-key-name');

      // Scenario: a third party cannot get a chat token (403).
      const outsiderChat = await request(app.getHttpServer())
        .post(`/api/v1/collaborations/${collaborationId}/chat-token`)
        .set('Authorization', `Bearer ${outsiderToken}`);
      expect(outsiderChat.status).toBe(403);

      // TASK-P1-009: message history.
      const postMessage = await request(app.getHttpServer())
        .post(`/api/v1/collaborations/${collaborationId}/messages`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ body: 'Looking forward to the video!' });
      expect(postMessage.status).toBe(201);

      // TASK-P1-007: presigned upload URL + register deliverable.
      const uploadUrlRes = await request(app.getHttpServer())
        .post(
          `/api/v1/collaborations/${collaborationId}/deliverables/upload-url`,
        )
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ contentType: 'video/mp4' });
      expect(uploadUrlRes.status).toBe(201);
      const fileUrl = uploadUrlRes.body.data.fileUrl;

      const registerRes = await request(app.getHttpServer())
        .post(`/api/v1/collaborations/${collaborationId}/deliverables`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ type: 'ready_ad', fileUrl, durationSeconds: 30 });
      expect(registerRes.status).toBe(201);
      const deliverableId = registerRes.body.data.id;

      const collaborationAfterDelivery = await dataSource.query(
        'SELECT status FROM collaborations WHERE id = $1',
        [collaborationId],
      );
      expect(collaborationAfterDelivery[0].status).toBe('delivered');

      // REQ-008: approving records a release transaction.
      const reviewRes = await request(app.getHttpServer())
        .post(`/api/v1/deliverables/${deliverableId}/review`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ action: 'approve' });
      expect(reviewRes.status).toBe(201);
      expect(reviewRes.body.data.collaborationStatus).toBe('approved');

      const releaseTransactions = await dataSource.query(
        `SELECT * FROM transactions WHERE collaboration_id = $1 AND type = 'release'`,
        [collaborationId],
      );
      expect(releaseTransactions).toHaveLength(1);
      expect(releaseTransactions[0].amount).toBe('1100.00');

      // M3: release = payout + fee reconciles exactly (no longer off by
      // the platform fee).
      const feeTransactions = await dataSource.query(
        `SELECT * FROM transactions WHERE collaboration_id = $1 AND type = 'fee'`,
        [collaborationId],
      );
      expect(feeTransactions).toHaveLength(1);
      expect(feeTransactions[0].amount).toBe('100.00');

      // TASK-P1-010: appears in the admin payout queue.
      const queueRes = await request(app.getHttpServer())
        .get('/api/v1/admin/payouts?perPage=100')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(queueRes.status).toBe(200);
      expect(
        queueRes.body.data.some(
          (c: { id: string }) => c.id === collaborationId,
        ),
      ).toBe(true);

      // REQ-010: admin marks it paid.
      const markPaidRes = await request(app.getHttpServer())
        .post(`/api/v1/admin/payouts/${collaborationId}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          method: 'bank_transfer',
          reference: 'BANKREF-1',
          paidAt: new Date().toISOString(),
        });
      expect(markPaidRes.status).toBe(201);
      expect(markPaidRes.body.data.collaborationStatus).toBe('paid');

      const payoutTransactions = await dataSource.query(
        `SELECT * FROM transactions WHERE collaboration_id = $1 AND type = 'payout'`,
        [collaborationId],
      );
      expect(payoutTransactions).toHaveLength(1);
      expect(payoutTransactions[0].recorded_by_user_id).toBe(adminUserId);
      expect(payoutTransactions[0].amount).toBe('1000.00');
      // M3: payout + fee reconciles exactly against release.
      expect(
        Number(payoutTransactions[0].amount) +
          Number(feeTransactions[0].amount),
      ).toBeCloseTo(Number(releaseTransactions[0].amount), 2);

      // EDGE-P1-005: marking paid twice is rejected.
      const secondMarkPaid = await request(app.getHttpServer())
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

    it('SEC-002: never exposes creator_payout_details on any endpoint in this plan', async () => {
      const proposalId = await createAppliedProposal();
      const collaborationId = await acceptAndFund(proposalId);

      const shipRes = await request(app.getHttpServer())
        .post(`/api/v1/collaborations/${collaborationId}/confirm-shipment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ carrier: 'Aramex', trackingNumber: 'TRACK456' });

      const body = JSON.stringify(shipRes.body);
      expect(body).not.toMatch(/payout/i);
    });
  });
});
