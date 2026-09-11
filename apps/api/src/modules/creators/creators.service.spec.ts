import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { CreatorsService } from './creators.service';
import { Creator } from './entities/creator.entity';
import { CreatorPortfolioItem } from './entities/creator-portfolio-item.entity';
import { CreatorPayoutDetail } from './entities/creator-payout-detail.entity';
import { UserRole } from '../users/entities/user.entity';

describe('CreatorsService', () => {
  let service: CreatorsService;
  let creatorsRepository: { findOne: jest.Mock };
  let payoutRepository: { findOne: jest.Mock };

  beforeEach(async () => {
    creatorsRepository = { findOne: jest.fn() };
    payoutRepository = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        { provide: getRepositoryToken(Creator), useValue: creatorsRepository },
        { provide: getRepositoryToken(CreatorPortfolioItem), useValue: {} },
        {
          provide: getRepositoryToken(CreatorPayoutDetail),
          useValue: payoutRepository,
        },
      ],
    }).compile();

    service = module.get(CreatorsService);
  });

  describe('getPayoutDetails (SEC-004)', () => {
    it('allows the owning creator to read their own payout details', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      payoutRepository.findOne.mockResolvedValue({
        id: 'payout-1',
        creatorId: 'creator-1',
      });

      const result = await service.getPayoutDetails(
        { userId: 'user-1', role: UserRole.CREATOR },
        'creator-1',
      );
      expect(result?.id).toBe('payout-1');
    });

    it('returns 404, not 403, when a different creator requests them (EDGE-P1-002)', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });

      await expect(
        service.getPayoutDetails(
          { userId: 'a-different-user', role: UserRole.CREATOR },
          'creator-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows an admin to read any creator payout details', async () => {
      creatorsRepository.findOne.mockResolvedValue({
        id: 'creator-1',
        userId: 'user-1',
      });
      payoutRepository.findOne.mockResolvedValue({
        id: 'payout-1',
        creatorId: 'creator-1',
      });

      const result = await service.getPayoutDetails(
        { userId: 'admin-1', role: UserRole.ADMIN },
        'creator-1',
      );
      expect(result?.id).toBe('payout-1');
    });
  });
});
