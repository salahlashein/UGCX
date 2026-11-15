import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CampaignsService, toCreatorView } from './campaigns.service';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { BrandsService } from '../brands/brands.service';
import { ProductsService } from '../products/products.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Niche } from '../../common/enums/niche.enum';
import { Language } from '../../common/enums/language.enum';
import { VideoType } from './entities/campaign.entity';
import { ConfigService } from '@nestjs/config';
import { EscrowService } from '../escrow/escrow.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymobClient } from '../payments/paymob.client';
import { PaymentProviderError } from '../payments/payment-provider.error';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { ProposalsService } from '../proposals/proposals.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let campaignsRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
    update: jest.Mock;
  };
  let usersRepository: {
    findOne: jest.Mock;
  };
  let brandsService: { findByUserId: jest.Mock };
  let productsService: { findByIdAndBrandId: jest.Mock };
  let escrowService: {
    applyFunding: jest.Mock;
    getBalance: jest.Mock;
    applyRefund: jest.Mock;
  };
  let transactionsService: {
    findByPaymobReference: jest.Mock;
    findLatestChargeForCampaign: jest.Mock;
  };
  let proposalsService: { declineAllOpenForCampaign: jest.Mock };
  let paymobClient: { createCheckout: jest.Mock; refundTransaction: jest.Mock };
  let configService: { get: jest.Mock };
  let dataSource: { query: jest.Mock; transaction: jest.Mock };

  function makeDraftCampaign(overrides: Partial<Campaign> = {}): Campaign {
    const campaign = new Campaign();
    Object.assign(campaign, {
      id: 'campaign-1',
      brandId: 'brand-1',
      title: 'Draft Brief',
      status: CampaignStatus.DRAFT,
      niche: null,
      videoType: null,
      durationSeconds: null,
      language: null,
      budgetMin: null,
      budgetMax: null,
      currency: 'EGP',
      escrowFundedAmount: '0.00',
      escrowAllocatedAmount: '0.00',
      escrowRefundedAmount: '0.00',
      fundingPaymobOrderId: null,
      fundingRequestedAmount: null,
      ...overrides,
    });
    return campaign;
  }

  beforeEach(async () => {
    campaignsRepository = {
      findOne: jest.fn(),
      save: jest.fn((c) => Promise.resolve(c)),
      create: jest.fn((c) => c),
      createQueryBuilder: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    usersRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'user-1',
        phoneVerifiedAt: new Date(),
        email: 'brand@ugcx.com',
        phone: '+201000000001',
      }),
    };
    brandsService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'brand-1' }),
    };
    productsService = {
      findByIdAndBrandId: jest.fn().mockResolvedValue({ id: 'product-1' }),
    };
    escrowService = {
      applyFunding: jest.fn().mockResolvedValue(undefined),
      applyRefund: jest.fn().mockResolvedValue(undefined),
      getBalance: jest.fn().mockResolvedValue({
        funded: '3200.00',
        allocated: '0.00',
        refunded: '0.00',
        available: '3200.00',
        currency: 'EGP',
        fundingInProgress: false,
        refundPending: false,
      }),
    };
    transactionsService = {
      findByPaymobReference: jest.fn().mockResolvedValue(null),
      findLatestChargeForCampaign: jest.fn().mockResolvedValue({
        id: 'txn-charge-1',
        paymobReference: 'paymob-ref-1',
      }),
    };
    proposalsService = {
      declineAllOpenForCampaign: jest.fn().mockResolvedValue(7),
    };
    paymobClient = {
      createCheckout: jest.fn().mockResolvedValue({
        paymobOrderId: 'paymob-order-999',
        checkoutUrl:
          'https://accept.paymob.com/api/acceptance/iframes/123?payment_token=tok',
      }),
      refundTransaction: jest.fn().mockResolvedValue({
        paymobRefundTransactionId: 'refund-tx-123',
      }),
    };
    configService = {
      get: jest.fn().mockReturnValue(14),
    };
    dataSource = {
      query: jest.fn().mockResolvedValue([]),
      transaction: jest.fn((cb) =>
        cb({
          getRepository: (entity: any) => {
            if (entity && entity.name === 'Collaboration') {
              return {
                createQueryBuilder: () => ({
                  where: jest.fn().mockReturnThis(),
                  andWhere: jest.fn().mockReturnThis(),
                  getCount: jest.fn().mockResolvedValue(0),
                }),
              };
            }
            return campaignsRepository;
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: campaignsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        { provide: BrandsService, useValue: brandsService },
        { provide: ProductsService, useValue: productsService },
        { provide: EscrowService, useValue: escrowService },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: ProposalsService, useValue: proposalsService },
        { provide: PaymobClient, useValue: paymobClient },
        { provide: ConfigService, useValue: configService },
        { provide: DataSource, useValue: dataSource },
        {
          provide: NotificationsService,
          useValue: {
            record: jest.fn().mockResolvedValue([]),
            push: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(CampaignsService);
  });

  describe('create', () => {
    it('succeeds with no productId', async () => {
      const result = await service.create('user-1', {
        title: 'New Brief Without Product',
      });

      expect(result.productId).toBeNull();
      expect(result.title).toBe('New Brief Without Product');
      expect(result.status).toBe(CampaignStatus.DRAFT);
      expect(productsService.findByIdAndBrandId).not.toHaveBeenCalled();
    });

    it('throws phone_not_verified when the user has a null phoneVerifiedAt', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 'user-unverified',
        phoneVerifiedAt: null,
      });

      await expect(
        service.create('user-unverified', { title: 'Test' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'phone_not_verified' }),
      });
    });

    it('succeeds with full brief fields and saves them', async () => {
      const result = await service.create('user-1', {
        title: 'running shoe',
        videoType: VideoType.TRY_ON,
        durationSeconds: 60,
        language: Language.AR,
        budgetMin: 500,
        budgetMax: 1500,
        needsShipping: true,
      });

      expect(result.title).toBe('running shoe');
      expect(result.videoType).toBe(VideoType.TRY_ON);
      expect(result.durationSeconds).toBe(60);
      expect(result.language).toBe(Language.AR);
      expect(result.budgetMin).toBe('500.00');
      expect(result.budgetMax).toBe('1500.00');
      expect(result.needsShipping).toBe(true);
      expect(result.status).toBe(CampaignStatus.DRAFT);
    });

    it('throws validation_error with field budgetMax when maximum is below minimum on create', async () => {
      await expect(
        service.create('user-1', {
          title: 'running shoe',
          budgetMin: 2000,
          budgetMax: 1000,
        }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'validation_error',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'budgetMax' }),
          ]),
        }),
      });
    });
  });

  describe('update', () => {
    it('throws validation_error with field budgetMax when maximum is below minimum', async () => {
      campaignsRepository.findOne.mockResolvedValue(
        makeDraftCampaign({
          id: 'campaign-1',
          brandId: 'brand-1',
          budgetMin: '4000.00',
        }),
      );

      await expect(
        service.update('user-1', 'campaign-1', { budgetMax: 2500 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'validation_error',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'budgetMax' }),
          ]),
        }),
      });
    });
  });

  describe('pause and resume', () => {
    it('pause on a draft throws invalid_state_transition', async () => {
      campaignsRepository.findOne.mockResolvedValue(
        makeDraftCampaign({ status: CampaignStatus.DRAFT }),
      );

      await expect(service.pause('user-1', 'campaign-1')).rejects.toMatchObject(
        {
          response: expect.objectContaining({
            code: 'invalid_state_transition',
          }),
        },
      );
    });

    it('pause on a paused brief returns the same row with no save call', async () => {
      const pausedCampaign = makeDraftCampaign({
        status: CampaignStatus.PAUSED,
      });
      campaignsRepository.findOne.mockResolvedValue(pausedCampaign);

      const result = await service.pause('user-1', 'campaign-1');
      expect(result).toBe(pausedCampaign);
      expect(campaignsRepository.save).not.toHaveBeenCalled();
    });

    it('resume on a paused brief sets live', async () => {
      const pausedCampaign = makeDraftCampaign({
        status: CampaignStatus.PAUSED,
      });
      campaignsRepository.findOne.mockResolvedValue(pausedCampaign);

      const result = await service.resume('user-1', 'campaign-1');
      expect(result.status).toBe(CampaignStatus.LIVE);
      expect(campaignsRepository.save).toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('rejects publish with 422-style error listing missing fields (REQ-006)', async () => {
      campaignsRepository.findOne.mockResolvedValue(
        makeDraftCampaign({ title: '' }),
      );

      await expect(
        service.publish('user-1', 'campaign-1'),
      ).rejects.toMatchObject({
        response: {
          code: 'validation_error',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'title' }),
          ]),
        },
      });
    });

    it('publishes when every required field is set', async () => {
      campaignsRepository.findOne.mockResolvedValue(
        makeDraftCampaign({
          title: 'Serum Haul',
          budgetMin: '100.00',
          budgetMax: '500.00',
          niche: Niche.BEAUTY_PERSONAL_CARE,
          videoType: VideoType.UNBOXING,
          durationSeconds: 30,
          language: Language.EN,
          escrowFundedAmount: '100.00',
        }),
      );

      const result = await service.publish('user-1', 'campaign-1');
      expect(result.status).toBe(CampaignStatus.LIVE);
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(result.closesAt).toBeInstanceOf(Date);
    });

    it('missingPublishFields names title, budgetMin, and budgetMax on a bare draft', () => {
      const draft = makeDraftCampaign({ title: '' });
      const fields = draft.missingPublishFields().map((f) => f.field);
      expect(fields).toContain('title');
      expect(fields).toContain('budgetMin');
      expect(fields).toContain('budgetMax');
    });

    it('missingPublishFields returns an empty array when all fields and escrow are set', () => {
      const complete = makeDraftCampaign({
        title: 'Title',
        budgetMin: '100.00',
        budgetMax: '200.00',
        niche: Niche.BEAUTY_PERSONAL_CARE,
        videoType: VideoType.UNBOXING,
        durationSeconds: 30,
        language: Language.EN,
        escrowFundedAmount: '100.00',
      });
      expect(complete.missingPublishFields()).toEqual([]);
    });

    it('publish does not overwrite a closes_at the brand already set', async () => {
      const existingClosesAt = new Date('2026-10-01T00:00:00Z');
      campaignsRepository.findOne.mockResolvedValue(
        makeDraftCampaign({
          title: 'Serum Haul',
          budgetMin: '100.00',
          budgetMax: '500.00',
          niche: Niche.BEAUTY_PERSONAL_CARE,
          videoType: VideoType.UNBOXING,
          durationSeconds: 30,
          language: Language.EN,
          escrowFundedAmount: '100.00',
          closesAt: existingClosesAt,
        }),
      );

      const result = await service.publish('user-1', 'campaign-1');
      expect(result.closesAt).toEqual(existingClosesAt);
    });

    it('canPause returns false for draft and true for live', () => {
      const draft = makeDraftCampaign({ status: CampaignStatus.DRAFT });
      const live = makeDraftCampaign({ status: CampaignStatus.LIVE });
      expect(draft.canPause()).toBe(false);
      expect(live.canPause()).toBe(true);
    });
  });

  describe('listMine', () => {
    it('with status=open queries live and paused statuses', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      campaignsRepository.createQueryBuilder.mockReturnValue(mockQb);
      dataSource.query.mockResolvedValueOnce([
        { all: 10, draft: 2, open: 5, completed: 3 },
      ]);

      const result = await service.listMine('user-1', {
        status: 'open',
        page: 1,
        perPage: 20,
      });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'campaign.status IN (:...statuses)',
        { statuses: [CampaignStatus.LIVE, CampaignStatus.PAUSED] },
      );
      expect(result.counts).toEqual({
        all: 10,
        draft: 2,
        open: 5,
        completed: 3,
      });
    });

    it('TASK-W4-04: splits proposal counts, lowest price, hired creators, and fundedAt', async () => {
      const mockCampaign = {
        id: 'camp-1',
        title: 'Spring Campaign',
        status: CampaignStatus.LIVE,
      };
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockCampaign], 1]),
      };
      campaignsRepository.createQueryBuilder.mockReturnValue(mockQb);

      // 1. counts
      dataSource.query.mockResolvedValueOnce([{ all: 1, draft: 0, open: 1, completed: 0 }]);
      // 2. proposal counts & lowestPrice
      dataSource.query.mockResolvedValueOnce([
        {
          campaign_id: 'camp-1',
          appliedCount: '2',
          shortlistedCount: '1',
          totalProposals: '4',
          lowestPrice: '150.00',
        },
      ]);
      // 3. collaborations / hired creators
      dataSource.query.mockResolvedValueOnce([
        {
          campaign_id: 'camp-1',
          status: 'approved',
          creator_id: 'cr-1',
          display_name: 'Creator One',
          email: 'cr1@example.com',
        },
        {
          campaign_id: 'camp-1',
          status: 'shipped',
          creator_id: 'cr-2',
          display_name: 'Creator Two',
          email: 'cr2@example.com',
        },
        {
          campaign_id: 'camp-1',
          status: 'funded',
          creator_id: 'cr-3',
          display_name: 'Creator Three',
          email: 'cr3@example.com',
        },
        {
          campaign_id: 'camp-1',
          status: 'delivered',
          creator_id: 'cr-4',
          display_name: 'Creator Four',
          email: 'cr4@example.com',
        },
        {
          campaign_id: 'camp-1',
          status: 'delivered',
          creator_id: 'cr-5',
          display_name: 'Creator Five',
          email: 'cr5@example.com',
        },
      ]);
      // 4. fundedAt
      dataSource.query.mockResolvedValueOnce([
        { campaign_id: 'camp-1', funded_at: '2026-10-01T12:00:00.000Z' },
      ]);

      const result = await service.listMine('user-1', {
        page: 1,
        perPage: 20,
        q: 'spring',
      });

      expect(mockQb.andWhere).toHaveBeenCalledWith('campaign.title ILIKE :q', {
        q: '%spring%',
      });
      const item = result.items[0];
      expect(item.appliedCount).toBe(2);
      expect(item.shortlistedCount).toBe(1);
      expect(item.totalProposals).toBe(4);
      expect(item.proposalCount).toBe(3);
      expect(item.lowestPrice).toBe('150.00');
      expect(item.hiredCount).toBe(5);
      expect(item.hired).toHaveLength(4);
      expect(item.fundedAt).toBe('2026-10-01T12:00:00.000Z');
    });
  });

  describe('listLive (creator feed)', () => {
    it('TASK-W4-05: sort=match throws BadRequestException', async () => {
      await expect(
        service.listLive({ page: 1, perPage: 20, sort: 'match' }),
      ).rejects.toThrow(BadRequestException);
    });
    it('excludes paused campaigns by filtering on status=live', async () => {
      const mockQb = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      campaignsRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.listLive({ page: 1, perPage: 20 });

      expect(mockQb.where).toHaveBeenCalledWith('campaign.status = :status', {
        status: CampaignStatus.LIVE,
      });
    });

    it('selects only public brand columns for the creator feed', async () => {
      const mockQb = {
        leftJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      campaignsRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.listLive({ page: 1, perPage: 20 });

      const selected = mockQb.addSelect.mock.calls[0][0] as string[];
      expect(selected).toContain('brand.companyName');
      expect(selected).not.toContain('brand.businessDocumentUrl');
      expect(selected).not.toContain('brand.userId');
    });
  });

  describe('findOne (EDGE-P1-002)', () => {
    it('returns 404, not 403, when a brand reads a campaign it does not own', async () => {
      campaignsRepository.findOne.mockResolvedValue({
        id: 'campaign-1',
        brandId: 'someone-elses-brand',
        status: CampaignStatus.DRAFT,
      });
      brandsService.findByUserId.mockResolvedValue({ id: 'brand-1' });

      await expect(
        service.findOne(
          { userId: 'user-1', role: UserRole.BRAND },
          'campaign-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('hides a draft campaign from a creator (only live campaigns are visible)', async () => {
      campaignsRepository.findOne.mockResolvedValue({
        id: 'campaign-1',
        brandId: 'brand-1',
        status: CampaignStatus.DRAFT,
      });

      await expect(
        service.findOne(
          { userId: 'creator-user-1', role: UserRole.CREATOR },
          'campaign-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('Campaign escrow entity methods (TASK-P2-01)', () => {
    it('availableEscrowCents returns 12000 for funded 320.00, allocated 200.00, refunded 0.00', () => {
      const campaign = makeDraftCampaign({
        escrowFundedAmount: '320.00',
        escrowAllocatedAmount: '200.00',
        escrowRefundedAmount: '0.00',
      });
      expect(campaign.availableEscrowCents()).toBe(12000);
    });

    it('canPublishWithEscrow returns false for funded 0.00 and a budgetMin of 2500.00', () => {
      const campaign = makeDraftCampaign({
        escrowFundedAmount: '0.00',
        escrowAllocatedAmount: '0.00',
        escrowRefundedAmount: '0.00',
        budgetMin: '2500.00',
      });
      expect(campaign.canPublishWithEscrow()).toBe(false);
    });

    it('missingPublishFields names escrow for an unfunded brief with every other field set', () => {
      const campaign = makeDraftCampaign({
        title: 'Ready brief',
        budgetMin: '2500.00',
        budgetMax: '4000.00',
        niche: Niche.BEAUTY_PERSONAL_CARE,
        videoType: VideoType.DEMO,
        durationSeconds: 30,
        language: Language.AR,
        escrowFundedAmount: '0.00',
        escrowAllocatedAmount: '0.00',
        escrowRefundedAmount: '0.00',
      });
      const missing = campaign.missingPublishFields();
      expect(missing).toEqual([
        { field: 'escrow', message: 'fund the brief before publishing' },
      ]);
      expect(campaign.canPublish()).toBe(false);
    });
  });

  describe('applyEscrowWebhook (TASK-P2-05)', () => {
    it('6. a replayed transaction id leaves escrow_funded_amount unchanged and inserts no row', async () => {
      const campaign = makeDraftCampaign({
        fundingPaymobOrderId: 'paymob-order-1',
        fundingRequestedAmount: '3200.00',
        escrowFundedAmount: '3200.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);
      transactionsService.findByPaymobReference.mockResolvedValue({
        id: 'existing-tx',
      });

      await service.applyEscrowWebhook({
        paymobOrderId: 'paymob-order-1',
        paymobTransactionId: 'paymob-tx-1',
        success: true,
        amountCents: 320000,
        currency: 'EGP',
        isRefunded: false,
        isVoided: false,
        pending: false,
        errorOccured: false,
      });

      expect(escrowService.applyFunding).not.toHaveBeenCalled();
      expect(campaign.escrowFundedAmount).toBe('3200.00');
    });

    it('7. an amount mismatch leaves escrow_funded_amount at zero', async () => {
      const campaign = makeDraftCampaign({
        fundingPaymobOrderId: 'paymob-order-1',
        fundingRequestedAmount: '3200.00',
        escrowFundedAmount: '0.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);
      transactionsService.findByPaymobReference.mockResolvedValue(null);

      await service.applyEscrowWebhook({
        paymobOrderId: 'paymob-order-1',
        paymobTransactionId: 'paymob-tx-1',
        success: true,
        amountCents: 100000, // Expected 320000
        currency: 'EGP',
        isRefunded: false,
        isVoided: false,
        pending: false,
        errorOccured: false,
      });

      expect(escrowService.applyFunding).not.toHaveBeenCalled();
      expect(campaign.escrowFundedAmount).toBe('0.00');
    });

    it('8. a concurrent replay that raises a unique violation resolves without throwing', async () => {
      const campaign = makeDraftCampaign({
        fundingPaymobOrderId: 'paymob-order-1',
        fundingRequestedAmount: '3200.00',
        escrowFundedAmount: '0.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);
      transactionsService.findByPaymobReference.mockResolvedValue(null);

      const uniqueViolationError = new Error('duplicate key');
      (uniqueViolationError as any).code = '23505';
      escrowService.applyFunding.mockRejectedValue(uniqueViolationError);

      await expect(
        service.applyEscrowWebhook({
          paymobOrderId: 'paymob-order-1',
          paymobTransactionId: 'paymob-tx-1',
          success: true,
          amountCents: 320000,
          currency: 'EGP',
          isRefunded: false,
          isVoided: false,
          pending: false,
          errorOccured: false,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('fundEscrow and getEscrowBalance (TASK-P2-06)', () => {
    it('1. fundEscrow with no amount uses the midpoint, rounded to the whole unit', async () => {
      // 2500 to 4000: midpoint (2500+4000)/2 = 3250
      const campaign = makeDraftCampaign({
        budgetMin: '2500.00',
        budgetMax: '4000.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);

      const result = await service.fundEscrow('user-1', 'campaign-1', {});

      expect(result.amount).toBe('3250.00');
      expect(paymobClient.createCheckout).toHaveBeenCalledWith(
        325000,
        'cmp_campaign-1',
        expect.any(Object),
      );
      expect(campaign.fundingPaymobOrderId).toBe('paymob-order-999');
    });

    it('2. fundEscrow with an amount below budgetMin throws validation_error naming amount', async () => {
      const campaign = makeDraftCampaign({
        budgetMin: '2500.00',
        budgetMax: '4000.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);

      await expect(
        service.fundEscrow('user-1', 'campaign-1', { amount: 2000 }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'validation_error',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'amount' }),
          ]),
        }),
      });
    });

    it('3. fundEscrow clears funding_requested_amount when Paymob throws and rethrows 502', async () => {
      const campaign = makeDraftCampaign({
        budgetMin: '2500.00',
        budgetMax: '4000.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);
      paymobClient.createCheckout.mockRejectedValue(
        new PaymentProviderError('Paymob down'),
      );

      await expect(
        service.fundEscrow('user-1', 'campaign-1', {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'payment_provider_error',
        }),
      });

      expect(campaign.fundingRequestedAmount).toBeNull();
    });

    it('4. fundEscrow on a campaign with a fresh funding_paymob_order_id throws funding_in_progress', async () => {
      const campaign = makeDraftCampaign({
        budgetMin: '2500.00',
        budgetMax: '4000.00',
        fundingPaymobOrderId: 'active-order-123',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);

      await expect(
        service.fundEscrow('user-1', 'campaign-1', {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'funding_in_progress',
        }),
      });
    });

    it('5. getEscrowBalance returns the derived available amount as a two decimal string', async () => {
      const campaign = makeDraftCampaign({ id: 'campaign-1' });
      campaignsRepository.findOne.mockResolvedValue(campaign);

      const balance = await service.getEscrowBalance('user-1', 'campaign-1');

      expect(escrowService.getBalance).toHaveBeenCalledWith('campaign-1');
      expect(balance).toEqual(
        expect.objectContaining({
          funded: '3200.00',
          available: '3200.00',
        }),
      );
    });

    describe('BG-14 fund amount rules (TASK-W3-01)', () => {
      it('1. slots = 1: budgetMax passes, budgetMax + 0.01 fails', async () => {
        const campaign = makeDraftCampaign({
          slots: 1,
          budgetMin: '2000.00',
          budgetMax: '3000.00',
        });
        campaignsRepository.findOne.mockResolvedValue(campaign);

        const passRes = await service.fundEscrow('user-1', 'campaign-1', { amount: 3000.0 });
        expect(passRes.amount).toBe('3000.00');

        await expect(
          service.fundEscrow('user-1', 'campaign-1', { amount: 3000.01 }),
        ).rejects.toMatchObject({
          response: expect.objectContaining({ code: 'validation_error' }),
        });
      });

      it('2. slots = 3, range 2000 to 3000: 7500.00 passes, 9000.01 fails', async () => {
        const campaign = makeDraftCampaign({
          slots: 3,
          budgetMin: '2000.00',
          budgetMax: '3000.00',
        });
        campaignsRepository.findOne.mockResolvedValue(campaign);

        const passRes = await service.fundEscrow('user-1', 'campaign-1', { amount: 7500.0 });
        expect(passRes.amount).toBe('7500.00');

        await expect(
          service.fundEscrow('user-1', 'campaign-1', { amount: 9000.01 }),
        ).rejects.toMatchObject({
          response: expect.objectContaining({ code: 'validation_error' }),
        });
      });

      it('3. slots = 3, range 2000 to 3000: 1999.99 fails (lower bound)', async () => {
        const campaign = makeDraftCampaign({
          slots: 3,
          budgetMin: '2000.00',
          budgetMax: '3000.00',
        });
        campaignsRepository.findOne.mockResolvedValue(campaign);

        await expect(
          service.fundEscrow('user-1', 'campaign-1', { amount: 1999.99 }),
        ).rejects.toMatchObject({
          response: expect.objectContaining({ code: 'validation_error' }),
        });
      });

      it('4. slots = 3, no amount: default is 2500 x 3 = 7500.00', async () => {
        const campaign = makeDraftCampaign({
          slots: 3,
          budgetMin: '2000.00',
          budgetMax: '3000.00',
        });
        campaignsRepository.findOne.mockResolvedValue(campaign);

        const result = await service.fundEscrow('user-1', 'campaign-1', {});
        expect(result.amount).toBe('7500.00');
        expect(paymobClient.createCheckout).toHaveBeenCalledWith(
          750000,
          'cmp_campaign-1',
          expect.any(Object),
        );
      });

      it('5. slots = 1, no amount: default is old midpoint', async () => {
        const campaign = makeDraftCampaign({
          slots: 1,
          budgetMin: '2000.00',
          budgetMax: '3000.00',
        });
        campaignsRepository.findOne.mockResolvedValue(campaign);

        const result = await service.fundEscrow('user-1', 'campaign-1', {});
        expect(result.amount).toBe('2500.00');
        expect(paymobClient.createCheckout).toHaveBeenCalledWith(
          250000,
          'cmp_campaign-1',
          expect.any(Object),
        );
      });

      it('6. 19.99 as a JS number converts to 1999 cents, not 1998 (no float step)', async () => {
        const campaign = makeDraftCampaign({
          slots: 1,
          budgetMin: '10.00',
          budgetMax: '30.00',
        });
        campaignsRepository.findOne.mockResolvedValue(campaign);

        const result = await service.fundEscrow('user-1', 'campaign-1', { amount: 19.99 });
        expect(result.amount).toBe('19.99');
        expect(paymobClient.createCheckout).toHaveBeenCalledWith(
          1999,
          'cmp_campaign-1',
          expect.any(Object),
        );
      });
    });
  });

  describe('close (TASK-P2-09, REQ-210, REQ-211)', () => {
    it('1. close on a draft throws invalid_state_transition', async () => {
      const campaign = makeDraftCampaign({ status: CampaignStatus.DRAFT });
      campaignsRepository.findOne.mockResolvedValue(campaign);

      await expect(
        service.close('user-1', 'campaign-1', {}),
      ).rejects.toMatchObject({
        response: { code: 'invalid_state_transition' },
      });
    });

    it('2. close with an in-flight collaboration throws collaboration_in_flight', async () => {
      const campaign = makeDraftCampaign({ status: CampaignStatus.LIVE });
      campaignsRepository.findOne.mockResolvedValue(campaign);

      dataSource.transaction.mockImplementationOnce(async (cb: any) =>
        cb({
          getRepository: (entity: any) => {
            if (entity && entity.name === 'Collaboration') {
              return {
                createQueryBuilder: () => ({
                  where: jest.fn().mockReturnThis(),
                  andWhere: jest.fn().mockReturnThis(),
                  getCount: jest.fn().mockResolvedValue(1),
                }),
              };
            }
            return campaignsRepository;
          },
        }),
      );

      await expect(
        service.close('user-1', 'campaign-1', {}),
      ).rejects.toMatchObject({
        response: { code: 'collaboration_in_flight' },
      });
    });

    it('3. close with 120.00 available calls refundTransaction with 12000 cents', async () => {
      const campaign = makeDraftCampaign({
        status: CampaignStatus.LIVE,
        escrowFundedAmount: '3200.00',
        escrowAllocatedAmount: '3080.00',
        escrowRefundedAmount: '0.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);

      const result = await service.close('user-1', 'campaign-1', {});

      expect(paymobClient.refundTransaction).toHaveBeenCalledWith(
        'paymob-ref-1',
        12000,
      );
      expect(escrowService.applyRefund).toHaveBeenCalledWith(
        'campaign-1',
        '120.00',
        'EGP',
        'refund-tx-123',
        'txn-charge-1',
        expect.anything(),
      );
      expect(result.status).toBe(CampaignStatus.CANCELLED);
      expect(result.refundedAmount).toBe('120.00');
      expect(result.refundPending).toBe(false);
    });

    it('4. close with 0.00 available never calls Paymob', async () => {
      const campaign = makeDraftCampaign({
        status: CampaignStatus.LIVE,
        escrowFundedAmount: '3080.00',
        escrowAllocatedAmount: '3080.00',
        escrowRefundedAmount: '0.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);

      const result = await service.close('user-1', 'campaign-1', {});

      expect(paymobClient.refundTransaction).not.toHaveBeenCalled();
      expect(result.refundedAmount).toBe('0.00');
      expect(result.refundPending).toBe(false);
    });

    it('5. a Paymob refund failure sets refund_pending and still returns status cancelled', async () => {
      const campaign = makeDraftCampaign({
        status: CampaignStatus.LIVE,
        escrowFundedAmount: '3200.00',
        escrowAllocatedAmount: '3080.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);
      paymobClient.refundTransaction.mockRejectedValueOnce(
        new Error('Paymob timeout'),
      );

      const result = await service.close('user-1', 'campaign-1', {});

      expect(result.status).toBe(CampaignStatus.CANCELLED);
      expect(result.refundPending).toBe(true);
      expect(result.refundedAmount).toBe('0.00');
    });

    it('6. close declines every applied and shortlisted proposal and returns the count', async () => {
      const campaign = makeDraftCampaign({
        status: CampaignStatus.LIVE,
        escrowFundedAmount: '3080.00',
        escrowAllocatedAmount: '3080.00',
      });
      campaignsRepository.findOne.mockResolvedValue(campaign);
      proposalsService.declineAllOpenForCampaign.mockResolvedValueOnce(7);

      const result = await service.close('user-1', 'campaign-1', {
        reason: 'budget_cut',
      });

      expect(proposalsService.declineAllOpenForCampaign).toHaveBeenCalledWith(
        'campaign-1',
        'budget_cut',
        expect.anything(),
      );
      expect(result.declinedProposalCount).toBe(7);
    });
  });

  describe('completeIfAllSlotsDone (TASK-P3-05, REQ-312)', () => {
    it('1. a one slot brief with one approved collaboration becomes completed', async () => {
      const campaign = makeDraftCampaign({
        id: 'cmp-1',
        status: CampaignStatus.LIVE,
        slots: 1,
      });

      const mockCampaignRepo = {
        findOne: jest.fn().mockResolvedValue(campaign),
        save: jest.fn().mockImplementation((c) => Promise.resolve(c)),
      };
      const mockCollabRepo = {
        count: jest.fn().mockResolvedValue(1),
      };

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity && entity.name === 'Collaboration') return mockCollabRepo;
          return mockCampaignRepo;
        }),
      } as any;

      const status = await service.completeIfAllSlotsDone('cmp-1', mockManager);

      expect(mockCampaignRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'cmp-1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockCampaignRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CampaignStatus.COMPLETED }),
      );
      expect(status).toBe(CampaignStatus.COMPLETED);
    });

    it('2. a three slot brief with two approved collaborations stays live', async () => {
      const campaign = makeDraftCampaign({
        id: 'cmp-2',
        status: CampaignStatus.LIVE,
        slots: 3,
      });

      const mockCampaignRepo = {
        findOne: jest.fn().mockResolvedValue(campaign),
        save: jest.fn(),
      };
      const mockCollabRepo = {
        count: jest.fn().mockResolvedValue(2),
      };

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity && entity.name === 'Collaboration') return mockCollabRepo;
          return mockCampaignRepo;
        }),
      } as any;

      const status = await service.completeIfAllSlotsDone('cmp-2', mockManager);

      expect(mockCampaignRepo.save).not.toHaveBeenCalled();
      expect(status).toBe(CampaignStatus.LIVE);
    });

    it('3. an already cancelled brief never becomes completed', async () => {
      const campaign = makeDraftCampaign({
        id: 'cmp-3',
        status: CampaignStatus.CANCELLED,
        slots: 1,
      });

      const mockCampaignRepo = {
        findOne: jest.fn().mockResolvedValue(campaign),
        save: jest.fn(),
      };
      const mockCollabRepo = {
        count: jest.fn().mockResolvedValue(1),
      };

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity && entity.name === 'Collaboration') return mockCollabRepo;
          return mockCampaignRepo;
        }),
      } as any;

      const status = await service.completeIfAllSlotsDone('cmp-3', mockManager);

      expect(mockCollabRepo.count).not.toHaveBeenCalled();
      expect(mockCampaignRepo.save).not.toHaveBeenCalled();
      expect(status).toBe(CampaignStatus.CANCELLED);
    });
  });

  describe('toCreatorView and email verification', () => {
    it('allows campaign creation when emailVerifiedAt is set and phoneVerifiedAt is null', async () => {
      usersRepository.findOne.mockResolvedValueOnce({
        id: 'user-1',
        phoneVerifiedAt: null,
        emailVerifiedAt: new Date(),
        email: 'brand@ugcx.com',
        phone: '+201000000001',
      });

      const campaign = await service.create('user-1', {
        title: 'New Campaign',
        brief: 'Brief text',
        niche: Niche.BEAUTY_PERSONAL_CARE,
        videoType: VideoType.TESTIMONIAL,
        durationSeconds: 30,
        language: Language.AR,
        budgetMin: 1000,
        budgetMax: 2000,
      });

      expect(campaign).toBeDefined();
      expect(campaign.title).toBe('New Campaign');
    });

    it('toCreatorView strips internal escrow fields', () => {
      const campaign = makeDraftCampaign({
        id: 'cmp-cre',
        budgetMin: '1000.00',
        budgetMax: '2000.00',
        escrowFundedAmount: '5000.00',
        escrowAllocatedAmount: '2000.00',
        escrowRefundedAmount: '0.00',
        fundingPaymobOrderId: 'paymob-123',
      });

      const creatorView = toCreatorView(campaign);

      expect(creatorView.id).toBe('cmp-cre');
      expect((creatorView as any).escrowFundedAmount).toBeUndefined();
      expect((creatorView as any).escrowAllocatedAmount).toBeUndefined();
      expect((creatorView as any).fundingPaymobOrderId).toBeUndefined();
    });
  });
});
