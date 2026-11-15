import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AdminPayoutsService } from './admin-payouts.service';
import {
  Collaboration,
  CollaborationStatus,
} from '../collaborations/entities/collaboration.entity';
import { PayoutRequest } from '../creators/entities/payout-request.entity';
import { PayoutMethod } from '../transactions/entities/transaction.entity';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

describe('AdminPayoutsService (TASK-P1-010, TASK-P4-04)', () => {
  let service: AdminPayoutsService;
  let dataSource: any;
  let collaborationsService: any;
  let transactionsService: any;
  let notificationsService: any;
  let mockEntityManager: any;
  let collaborationRepo: any;
  let payoutRequestRepo: any;

  beforeEach(async () => {
    collaborationRepo = {
      findOne: jest.fn(),
    };
    payoutRequestRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((r) => Promise.resolve(r)),
    };

    mockEntityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === Collaboration) return collaborationRepo;
        if (entity === PayoutRequest) return payoutRequestRepo;
        return {};
      }),
    };

    dataSource = {
      transaction: jest.fn((cb) => cb(mockEntityManager)),
    };

    collaborationsService = {
      listApprovedAwaitingPayout: jest.fn(),
      markPaid: jest.fn((c) =>
        Promise.resolve({ ...c, status: CollaborationStatus.PAID }),
      ),
    };

    transactionsService = {
      recordPayout: jest.fn().mockResolvedValue({ id: 'tx-payout-1' }),
    };

    notificationsService = {
      record: jest.fn().mockResolvedValue([{ id: 'notif-1' }]),
      push: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPayoutsService,
        { provide: DataSource, useValue: dataSource },
        { provide: CollaborationsService, useValue: collaborationsService },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(AdminPayoutsService);
  });

  describe('markPaid', () => {
    it('throws 404 when collaboration is not found', async () => {
      collaborationRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.markPaid('admin-1', 'collab-1', {
          method: PayoutMethod.INSTAPAY,
          reference: 'REF123',
          paidAt: new Date().toISOString(),
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 409 when collaboration is already paid', async () => {
      collaborationRepo.findOne.mockResolvedValueOnce({
        id: 'collab-1',
        status: CollaborationStatus.PAID,
      });

      await expect(
        service.markPaid('admin-1', 'collab-1', {
          method: PayoutMethod.INSTAPAY,
          reference: 'REF123',
          paidAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(DomainErrorException);
    });

    it('throws 422 when collaboration is not approved', async () => {
      collaborationRepo.findOne.mockResolvedValueOnce({
        id: 'collab-1',
        status: CollaborationStatus.DELIVERED,
      });

      await expect(
        service.markPaid('admin-1', 'collab-1', {
          method: PayoutMethod.INSTAPAY,
          reference: 'REF123',
          paidAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(DomainErrorException);
    });

    it('records payout transaction, marks paid, and records payout_sent notification (TASK-P4-04)', async () => {
      collaborationRepo.findOne
        .mockResolvedValueOnce({
          id: 'collab-1',
          status: CollaborationStatus.APPROVED,
          creatorPrice: '2500.00',
          currency: 'EGP',
          campaignId: 'camp-1',
        })
        .mockResolvedValueOnce({
          id: 'collab-1',
          creator: { userId: 'creator-user-1' },
        });

      const res = await service.markPaid('admin-1', 'collab-1', {
        method: PayoutMethod.BANK_TRANSFER,
        reference: 'TXN999',
        paidAt: '2026-09-19T10:00:00Z',
      });

      expect(res.transactionId).toBe('tx-payout-1');
      expect(res.collaborationStatus).toBe(CollaborationStatus.PAID);
      expect(transactionsService.recordPayout).toHaveBeenCalledWith(
        'collab-1',
        '2500.00',
        'EGP',
        'admin-1',
        expect.objectContaining({
          method: 'bank_transfer',
          reference: 'TXN999',
        }),
        mockEntityManager,
      );
      expect(collaborationsService.markPaid).toHaveBeenCalledTimes(1);

      expect(notificationsService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'payout_sent',
          params: {
            amount: '2500.00',
            currency: 'EGP',
            method: 'bank_transfer',
          },
          creatorUserId: 'creator-user-1',
        }),
        mockEntityManager,
      );
      expect(notificationsService.push).toHaveBeenCalledTimes(1);
    });
  });
});
