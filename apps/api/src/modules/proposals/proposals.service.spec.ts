import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { CampaignStatus } from '../campaigns/entities/campaign.entity';
import { CreatorsService } from '../creators/creators.service';
import { CreatorStatsService } from '../creators/creator-stats.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { BrandsService } from '../brands/brands.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EscrowService } from '../escrow/escrow.service';

describe('ProposalsService', () => {
  let service: ProposalsService;
  let proposalsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
  };
  let creatorsService: { findByUserId: jest.Mock };
  let campaignsService: { findById: jest.Mock; findOwned: jest.Mock };
  let brandsService: { findByUserId: jest.Mock };
  let escrowService: { quote: jest.Mock };
  let dataSource: { getRepository: jest.Mock; transaction: jest.Mock };

  beforeEach(async () => {
    proposalsRepository = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
    };
    creatorsService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'creator-1' }),
    };
    campaignsService = { findById: jest.fn(), findOwned: jest.fn() };
    brandsService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'brand-1' }),
    };
    escrowService = {
      quote: jest.fn((priceStr: string) => {
        const priceCents = 320000;
        const feeCents = 32000;
        return {
          priceCents,
          feeCents,
          totalCents: priceCents + feeCents,
        };
      }),
    };
    dataSource = {
      getRepository: jest.fn(),
      transaction: jest.fn((cb) =>
        cb({
          getRepository: jest.fn().mockReturnValue(proposalsRepository),
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsService,
        {
          provide: getRepositoryToken(Proposal),
          useValue: proposalsRepository,
        },
        { provide: CreatorsService, useValue: creatorsService },
        CreatorStatsService,
        { provide: CampaignsService, useValue: campaignsService },
        { provide: BrandsService, useValue: brandsService },
        { provide: EscrowService, useValue: escrowService },
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

    service = module.get(ProposalsService);
  });

  describe('create', () => {
    it('rejects applying to a campaign that is not live (EDGE-P1-003)', async () => {
      campaignsService.findById.mockResolvedValue({
        id: 'campaign-1',
        status: CampaignStatus.DRAFT,
      });

      await expect(
        service.create('user-1', 'campaign-1', {
          price: 100,
          deliveryDays: 3,
          pitch: 'hi',
        }),
      ).rejects.toMatchObject({ response: { code: 'campaign_not_open' } });
    });

    it('maps a duplicate-proposal DB conflict to a friendly 409 (REQ-008)', async () => {
      campaignsService.findById.mockResolvedValue({
        id: 'campaign-1',
        status: CampaignStatus.LIVE,
      });
      proposalsRepository.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.create('user-1', 'campaign-1', {
          price: 100,
          deliveryDays: 3,
          pitch: 'hi',
        }),
      ).rejects.toMatchObject({ response: { code: 'duplicate_proposal' } });
    });

    it('creates a proposal with status applied on a live campaign', async () => {
      campaignsService.findById.mockResolvedValue({
        id: 'campaign-1',
        status: CampaignStatus.LIVE,
      });

      const result = await service.create('user-1', 'campaign-1', {
        price: 100,
        deliveryDays: 3,
        pitch: 'hi',
      });

      expect(result.status).toBe(ProposalStatus.APPLIED);
    });
  });

  describe('updateStatus (REQ-009)', () => {
    it('returns 404, not 403, when the brand does not own the campaign', async () => {
      proposalsRepository.findOne.mockResolvedValue({
        id: 'proposal-1',
        campaign: { brandId: 'someone-elses-brand' },
      });

      await expect(
        service.updateStatus(
          'user-1',
          'proposal-1',
          ProposalStatus.SHORTLISTED,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows shortlisting an owned proposal', async () => {
      proposalsRepository.findOne.mockResolvedValue({
        id: 'proposal-1',
        campaign: { id: 'campaign-1', brandId: 'brand-1', title: 'Brief' },
        creator: { userId: 'user-creator-1' },
        status: ProposalStatus.APPLIED,
      });

      const result = await service.updateStatus(
        'user-1',
        'proposal-1',
        ProposalStatus.SHORTLISTED,
      );
      expect(result.status).toBe(ProposalStatus.SHORTLISTED);
    });
  });

  describe('declineAllOpenForCampaign (REQ-211)', () => {
    it('sets decline_reason to brief_closed and targets only open proposals', async () => {
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };
      const manager = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
        getRepository: jest.fn().mockReturnValue({
          find: jest.fn().mockResolvedValue([]),
        }),
      } as any;

      const affected = await service.declineAllOpenForCampaign(
        'campaign-1',
        'brief_closed',
        manager,
      );

      expect(affected).toBe(3);
      expect(qb.set).toHaveBeenCalledWith({
        status: ProposalStatus.DECLINED,
        declineReason: 'brief_closed',
      });
      expect(qb.where).toHaveBeenCalledWith('campaign_id = :campaignId', {
        campaignId: 'campaign-1',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('status IN (:...statuses)', {
        statuses: [ProposalStatus.APPLIED, ProposalStatus.SHORTLISTED],
      });
    });
  });

  describe('getCreatorProfilePreview (TASK-P2-11, REQ-213)', () => {
    const mockProposal = {
      id: 'proposal-1',
      price: '2800.00',
      currency: 'EGP',
      deliveryDays: 3,
      pitch: 'Pitch video ready',
      creatorId: 'creator-1',
      creator: {
        id: 'creator-1',
        displayName: 'Nour H.',
        city: 'Cairo',
        niches: ['beauty_personal_care'],
      },
      campaign: {
        id: 'campaign-1',
        brandId: 'brand-1',
      },
    };

    function setupMocks(
      stats: { status: string; count: string }[],
      revCount: string = '0',
    ) {
      const portfolioRepo = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'port-1',
            mediaUrl: 'https://r2.ugcx.com/video1.mp4',
            mediaType: 'video',
          },
        ]),
      };

      const collabQb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(stats),
      };
      const collabRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(collabQb),
      };

      const deliverableQb = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ revCount }),
      };
      const deliverableRepo = {
        createQueryBuilder: jest.fn().mockReturnValue(deliverableQb),
      };

      dataSource.getRepository.mockImplementation((entity: any) => {
        if (entity && entity.name === 'CreatorPortfolioItem')
          return portfolioRepo;
        if (entity && entity.name === 'Collaboration') return collabRepo;
        if (entity && entity.name === 'Deliverable') return deliverableRepo;
        return {};
      });
    }

    it('1. a creator with 32 approved and 0 cancelled collaborations returns an approval rate of 100', async () => {
      proposalsRepository.findOne.mockResolvedValue(mockProposal);
      setupMocks([{ status: 'approved', count: '32' }]);

      const result = await service.getCreatorProfilePreview(
        'user-1',
        'proposal-1',
      );

      expect(result.approvalRate).toBe(100);
      expect(result.jobsDone).toBe(32);
      expect(result.displayName).toBe('Nour H.');
      expect(result.portfolio.length).toBe(1);
    });

    it('2. a creator with 49 approved and 1 cancelled returns 98', async () => {
      proposalsRepository.findOne.mockResolvedValue(mockProposal);
      setupMocks([
        { status: 'approved', count: '49' },
        { status: 'cancelled', count: '1' },
      ]);

      const result = await service.getCreatorProfilePreview(
        'user-1',
        'proposal-1',
      );

      expect(result.approvalRate).toBe(98);
      expect(result.jobsDone).toBe(49);
    });

    it('3. a creator with no finished collaboration returns 100 and 0', async () => {
      proposalsRepository.findOne.mockResolvedValue(mockProposal);
      setupMocks([]);

      const result = await service.getCreatorProfilePreview(
        'user-1',
        'proposal-1',
      );

      expect(result.approvalRate).toBe(100);
      expect(result.jobsDone).toBe(0);
      expect(result.averageRevisions).toBe(0);
    });

    it('4. averageRevisions rounds 1.24 to 1.2', async () => {
      proposalsRepository.findOne.mockResolvedValue(mockProposal);
      // 50 finished approved, 62 revisions => 62 / 50 = 1.24 => rounded to 1.2
      setupMocks([{ status: 'approved', count: '50' }], '62');

      const result = await service.getCreatorProfilePreview(
        'user-1',
        'proposal-1',
      );

      expect(result.averageRevisions).toBe(1.2);
    });

    it('5. a cross brand proposal returns 404', async () => {
      proposalsRepository.findOne.mockResolvedValue({
        ...mockProposal,
        campaign: { brandId: 'someone-elses-brand' },
      });

      await expect(
        service.getCreatorProfilePreview('user-1', 'proposal-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getAcceptQuote (BG-22, TASK-W3-05)', () => {
    it('1. 3,200.00 price with 10% fee returns fee 320.00 and total 3520.00', async () => {
      const mockCampaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        availableEscrowCents: jest.fn().mockReturnValue(500000), // 5000.00
      };
      const mockProposal = {
        id: 'prop-1',
        price: '3200.00',
        currency: 'EGP',
        status: ProposalStatus.APPLIED,
        campaign: mockCampaign,
      };
      proposalsRepository.findOne.mockResolvedValue(mockProposal);

      const quote = await service.getAcceptQuote('user-1', 'prop-1');

      expect(quote.creatorPrice).toBe('3200.00');
      expect(quote.platformFee).toBe('320.00');
      expect(quote.totalAmount).toBe('3520.00');
      expect(quote.available).toBe('5000.00');
      expect(quote.availableAfter).toBe('1480.00');
      expect(quote.sufficient).toBe(true);
      expect(quote.shortfall).toBe('0.00');
      expect(proposalsRepository.save).not.toHaveBeenCalled();
    });

    it('2. availableAfter can be negative with sufficient: false and positive shortfall', async () => {
      const mockCampaign = {
        id: 'camp-1',
        brandId: 'brand-1',
        availableEscrowCents: jest.fn().mockReturnValue(300000), // 3000.00 available vs 3520.00 total
      };
      const mockProposal = {
        id: 'prop-1',
        price: '3200.00',
        currency: 'EGP',
        status: ProposalStatus.SHORTLISTED,
        campaign: mockCampaign,
      };
      proposalsRepository.findOne.mockResolvedValue(mockProposal);

      const quote = await service.getAcceptQuote('user-1', 'prop-1');

      expect(quote.availableAfter).toBe('-520.00');
      expect(quote.sufficient).toBe(false);
      expect(quote.shortfall).toBe('520.00');
    });

    it('3. cross-brand proposal returns 404', async () => {
      const mockProposal = {
        id: 'prop-1',
        price: '3200.00',
        status: ProposalStatus.APPLIED,
        campaign: { brandId: 'other-brand' },
      };
      proposalsRepository.findOne.mockResolvedValue(mockProposal);

      await expect(
        service.getAcceptQuote('user-1', 'prop-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('4. accepted proposal returns 422 proposal_not_open', async () => {
      const mockProposal = {
        id: 'prop-1',
        price: '3200.00',
        status: ProposalStatus.ACCEPTED,
        campaign: { brandId: 'brand-1', availableEscrowCents: jest.fn() },
      };
      proposalsRepository.findOne.mockResolvedValue(mockProposal);

      await expect(
        service.getAcceptQuote('user-1', 'prop-1'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'proposal_not_open' }),
      });
    });
  });
});
