import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { CampaignStatus } from '../campaigns/entities/campaign.entity';
import { CreatorsService } from '../creators/creators.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { BrandsService } from '../brands/brands.service';

describe('ProposalsService', () => {
  let service: ProposalsService;
  let proposalsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let creatorsService: { findByUserId: jest.Mock };
  let campaignsService: { findById: jest.Mock; findOwned: jest.Mock };
  let brandsService: { findByUserId: jest.Mock };

  beforeEach(async () => {
    proposalsRepository = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve(data)),
      findOne: jest.fn(),
    };
    creatorsService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'creator-1' }),
    };
    campaignsService = { findById: jest.fn(), findOwned: jest.fn() };
    brandsService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'brand-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsService,
        {
          provide: getRepositoryToken(Proposal),
          useValue: proposalsRepository,
        },
        { provide: CreatorsService, useValue: creatorsService },
        { provide: CampaignsService, useValue: campaignsService },
        { provide: BrandsService, useValue: brandsService },
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
        campaign: { brandId: 'brand-1' },
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
});
