import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DeliverablesService } from './deliverables.service';
import { Deliverable } from './entities/deliverable.entity';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BrandsService } from '../brands/brands.service';
import { R2StorageClient } from '../storage/r2-storage.client';
import { UserRole } from '../users/entities/user.entity';

describe('DeliverablesService', () => {
  let service: DeliverablesService;
  let deliverablesRepository: { find: jest.Mock };
  let collaborationsService: { findOwnedByUser: jest.Mock };

  beforeEach(async () => {
    deliverablesRepository = { find: jest.fn().mockResolvedValue([]) };
    collaborationsService = {
      findOwnedByUser: jest.fn().mockResolvedValue({ id: 'collab-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliverablesService,
        {
          provide: getRepositoryToken(Deliverable),
          useValue: deliverablesRepository,
        },
        { provide: DataSource, useValue: {} },
        { provide: CollaborationsService, useValue: collaborationsService },
        { provide: TransactionsService, useValue: {} },
        { provide: BrandsService, useValue: {} },
        { provide: R2StorageClient, useValue: {} },
      ],
    }).compile();

    service = module.get(DeliverablesService);
  });

  describe('listForCollaboration (feature_mobile_app_phase1 addendum)', () => {
    it('checks ownership before listing and scopes the query to the collaboration', async () => {
      await service.listForCollaboration(
        { userId: 'user-1', role: UserRole.BRAND },
        'collab-1',
      );

      expect(collaborationsService.findOwnedByUser).toHaveBeenCalledWith(
        { userId: 'user-1', role: UserRole.BRAND },
        'collab-1',
      );
      expect(deliverablesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { collaborationId: 'collab-1' } }),
      );
    });
  });
});
