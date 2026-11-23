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

/**
 * Covers every Gherkin scenario in
 * operations/specs/feature_backend_core_domain/plan.md against a real
 * Postgres instance (docker compose up -d db). Each run uses a unique
 * email suffix so it is safe to re-run without a DB reset.
 */
describe('Backend core domain (e2e)', () => {
  let app: INestApplication;
  const runId = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
  });

  afterAll(async () => {
    await app.close();
  });

  /** Admins are created out of band (self sign-up cannot make one). */
  async function createAdminToken(
    label: string,
    phone: string,
  ): Promise<string> {
    const dataSource = app.get(DataSource);
    const email = `${label}-admin-${runId}@example.com`;
    const passwordHash = await bcrypt.hash('AdminPass1', 4);
    await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        email,
        phone,
        passwordHash,
        role: UserRole.ADMIN,
        locale: UserLocale.EN,
      }),
    );
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'AdminPass1' });
    return login.body.data.accessToken;
  }

  describe('Feature: Registration and login', () => {
    const email = `brand-${runId}@example.com`;

    it('registers a brand successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          role: 'brand',
          email,
          phone: '+201000000010',
          password: 'Passw0rd1',
          locale: 'en',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('brand');
      expect(res.body.data.accessToken).toEqual(expect.any(String));
    });

    it('does not reveal account existence on a wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword1' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid credentials');
    });
  });

  describe('Feature: Campaign publishing and proposals', () => {
    const brandEmail = `pub-brand-${runId}@example.com`;
    const creatorEmail = `pub-creator-${runId}@example.com`;
    let brandToken: string;
    let creatorToken: string;
    let campaignId: string;

    beforeAll(async () => {
      const brandRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          role: 'brand',
          email: brandEmail,
          phone: '+201000000011',
          password: 'Passw0rd1',
          locale: 'en',
        });
      brandToken = brandRes.body.data.accessToken;

      const creatorRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          role: 'creator',
          email: creatorEmail,
          phone: '+201000000012',
          password: 'Passw0rd1',
          locale: 'en',
        });
      creatorToken = creatorRes.body.data.accessToken;

      // A brand must verify its email or phone before it creates a brief
      // (CampaignsService.create). Password sign-up does not verify, and the
      // OTP route is rate-limited, so the test marks the email verified.
      await app
        .get(DataSource)
        .query('UPDATE users SET email_verified_at = now() WHERE email = $1', [
          brandEmail,
        ]);

      const productRes = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ name: 'Test product' });

      const campaignRes = await request(app.getHttpServer())
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${brandToken}`)
        .send({ productId: productRes.body.data.id });
      campaignId = campaignRes.body.data.id;
    });

    it('rejects publish when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/campaigns/${campaignId}/publish`)
        .set('Authorization', `Bearer ${brandToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'niche' })]),
      );
    });

    it('rejects publish while escrow is not funded, even with all fields set', async () => {
      const patch = await request(app.getHttpServer())
        .patch(`/api/v1/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          title: 'Gherkin test brief',
          budgetMin: 200,
          budgetMax: 400,
          niche: 'fashion',
          language: 'en',
          videoType: 'demo',
          durationSeconds: 20,
        });
      expect(patch.status).toBe(200);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/campaigns/${campaignId}/publish`)
        .set('Authorization', `Bearer ${brandToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error.details).toEqual([
        expect.objectContaining({ field: 'escrow' }),
      ]);
    });

    it('goes live when an admin confirms the manual payment (V1 flow)', async () => {
      const submit = await request(app.getHttpServer())
        .post(`/api/v1/campaigns/${campaignId}/escrow/manual-payment`)
        .set('Authorization', `Bearer ${brandToken}`)
        .send({
          method: 'instapay',
          transactionReference: `IP-GHERKIN-${runId}`,
          amount: 300,
        });
      expect(submit.status).toBe(200);

      const adminToken = await createAdminToken('pub', '+201000000015');
      const verify = await request(app.getHttpServer())
        .post(`/api/v1/admin/campaigns/${campaignId}/verify-escrow`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true });

      expect(verify.status).toBe(201);
      expect(verify.body.data.status).toBe('live');
      expect(verify.body.data.fundedAmount).toBe('300.00');
    });

    it('rejects a second proposal from the same creator to the same campaign', async () => {
      const first = await request(app.getHttpServer())
        .post(`/api/v1/campaigns/${campaignId}/proposals`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ price: 200, deliveryDays: 5, pitch: 'first application' });
      expect(first.status).toBe(201);

      const second = await request(app.getHttpServer())
        .post(`/api/v1/campaigns/${campaignId}/proposals`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ price: 250, deliveryDays: 5, pitch: 'second application' });

      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('duplicate_proposal');
    });
  });

  describe('Feature: Creator vetting', () => {
    // Admins are provisioned out of band (not self-registered), so this
    // seeds one directly through the DataSource, same as a real deploy.
    it('admin approves a pending creator and the decision is recorded', async () => {
      const creatorEmail = `vet-creator-${runId}@example.com`;
      const creatorRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          role: 'creator',
          email: creatorEmail,
          phone: '+201000000013',
          password: 'Passw0rd1',
          locale: 'en',
        });
      const creatorUserId = creatorRes.body.data.userId;

      const dataSource = app.get(DataSource);
      const adminEmail = `vet-admin-${runId}@example.com`;
      const passwordHash = await bcrypt.hash('AdminPass1', 4);
      const adminUser = await dataSource.getRepository(User).save(
        dataSource.getRepository(User).create({
          email: adminEmail,
          phone: '+201000000014',
          passwordHash,
          role: UserRole.ADMIN,
          locale: UserLocale.EN,
        }),
      );

      const adminLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: 'AdminPass1' });
      const adminToken = adminLogin.body.data.accessToken;

      const creatorRow = await dataSource.query(
        'SELECT id FROM creators WHERE user_id = $1',
        [creatorUserId],
      );
      const creatorId = creatorRow[0].id;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/creators/${creatorId}/vetting`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.vettingStatus).toBe('approved');
      expect(res.body.data.reviewedByUserId).toBe(adminUser.id);
      expect(res.body.data.reviewedAt).toEqual(expect.any(String));
    });
  });
});
