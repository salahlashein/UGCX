import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AdminCreatorsService } from './admin-creators.service';
import { Creator, VettingStatus } from '../creators/entities/creator.entity';
import { ProposalsService } from '../proposals/proposals.service';

describe('AdminCreatorsService', () => {
  let service: AdminCreatorsService;
  let creatorsRepository: { findAndCount: jest.Mock };
  let proposalsService: { declineAllOpenForCreator: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  const creatorRepoFindOne = jest.fn();
  const creatorRepoSave = jest.fn((c) => Promise.resolve(c));
  const manager = {
    getRepository: jest.fn(() => ({
      findOne: creatorRepoFindOne,
      save: creatorRepoSave,
    })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    creatorsRepository = { findAndCount: jest.fn() };
    proposalsService = {
      declineAllOpenForCreator: jest.fn().mockResolvedValue(undefined),
    };
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCreatorsService,
        { provide: getRepositoryToken(Creator), useValue: creatorsRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: ProposalsService, useValue: proposalsService },
      ],
    }).compile();

    service = module.get(AdminCreatorsService);
  });

  describe('list', () => {
    it('adds the account email and nothing else from the user row', async () => {
      creatorsRepository.findAndCount.mockResolvedValue([
        [
          {
            id: 'c1',
            displayName: null,
            user: {
              id: 'u1',
              email: 'new@creator.test',
              phone: '+201000000000',
              role: 'creator',
            },
          },
          { id: 'c2', displayName: 'Mona' },
        ],
        2,
      ]);

      const [items, total] = await service.list(VettingStatus.PENDING, 1, 20);

      expect(total).toBe(2);
      expect(items[0].user).toEqual({ id: 'u1', email: 'new@creator.test' });
      expect(items[1].user).toBeUndefined();
      expect(creatorsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { user: true } }),
      );
    });
  });

  describe('vet', () => {
    it('throws 404 for an unknown creator', async () => {
      creatorRepoFindOne.mockResolvedValue(null);

      await expect(
        service.vet('admin-1', 'missing-creator', {
          status: VettingStatus.APPROVED,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('records the reviewer and timestamp on approval (REQ-010)', async () => {
      creatorRepoFindOne.mockResolvedValue({
        id: 'creator-1',
        vettingStatus: VettingStatus.PENDING,
      });

      const result = await service.vet('admin-1', 'creator-1', {
        status: VettingStatus.APPROVED,
      });

      expect(result.vettingStatus).toBe(VettingStatus.APPROVED);
      expect(result.reviewedByUserId).toBe('admin-1');
      expect(result.reviewedAt).toBeInstanceOf(Date);
      expect(proposalsService.declineAllOpenForCreator).not.toHaveBeenCalled();
    });

    it('cascades to decline open proposals on rejection (EDGE-P1-005)', async () => {
      creatorRepoFindOne.mockResolvedValue({
        id: 'creator-1',
        vettingStatus: VettingStatus.PENDING,
      });

      await service.vet('admin-1', 'creator-1', {
        status: VettingStatus.REJECTED,
      });

      expect(proposalsService.declineAllOpenForCreator).toHaveBeenCalledWith(
        'creator-1',
        manager,
      );
    });
  });
});
