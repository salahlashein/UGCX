import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { Campaign, CampaignStatus } from './entities/campaign.entity';
import { BrandsService } from '../brands/brands.service';
import { ProductsService } from '../products/products.service';
import { UserRole } from '../users/entities/user.entity';
import { Niche } from '../../common/enums/niche.enum';
import { Language } from '../../common/enums/language.enum';
import { VideoType } from './entities/campaign.entity';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let campaignsRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let brandsService: { findByUserId: jest.Mock };
  let productsService: { findByIdAndBrandId: jest.Mock };

  beforeEach(async () => {
    campaignsRepository = {
      findOne: jest.fn(),
      save: jest.fn((c) => c),
      create: jest.fn((c) => c),
    };
    brandsService = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'brand-1' }),
    };
    productsService = {
      findByIdAndBrandId: jest.fn().mockResolvedValue({ id: 'product-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: campaignsRepository,
        },
        { provide: BrandsService, useValue: brandsService },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    service = module.get(CampaignsService);
  });

  describe('publish', () => {
    function makeDraftCampaign(overrides: Partial<Campaign> = {}): Campaign {
      const campaign = new Campaign();
      Object.assign(campaign, {
        id: 'campaign-1',
        brandId: 'brand-1',
        status: CampaignStatus.DRAFT,
        niche: null,
        videoType: null,
        durationSeconds: null,
        language: null,
        ...overrides,
      });
      return campaign;
    }

    it('rejects publish with 422-style error listing missing fields (REQ-006)', async () => {
      campaignsRepository.findOne.mockResolvedValue(makeDraftCampaign());

      await expect(
        service.publish('user-1', 'campaign-1'),
      ).rejects.toMatchObject({
        response: {
          code: 'validation_error',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'niche' }),
          ]),
        },
      });
    });

    it('publishes when every required field is set', async () => {
      campaignsRepository.findOne.mockResolvedValue(
        makeDraftCampaign({
          niche: Niche.BEAUTY_PERSONAL_CARE,
          videoType: VideoType.UNBOXING,
          durationSeconds: 30,
          language: Language.EN,
        }),
      );

      const result = await service.publish('user-1', 'campaign-1');
      expect(result.status).toBe(CampaignStatus.LIVE);
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
});
