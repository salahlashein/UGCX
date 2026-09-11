import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CollaborationsService } from './collaborations.service';
import {
  Collaboration,
  CollaborationStatus,
} from './entities/collaboration.entity';
import { UserRole } from '../users/entities/user.entity';
import { ProposalStatus } from '../proposals/entities/proposal.entity';
import { ProposalsService } from '../proposals/proposals.service';
import { BrandsService } from '../brands/brands.service';
import { CreatorsService } from '../creators/creators.service';
import { UsersService } from '../users/users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymobClient } from '../payments/paymob.client';
import { PaymentProviderError } from '../payments/payment-provider.error';

describe('CollaborationsService', () => {
  let service: CollaborationsService;
  let collaborationsRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    findAndCount: jest.Mock;
  };
  let fakeManager: { getRepository: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let proposalsService: {
    findById: jest.Mock;
    markAccepted: jest.Mock;
  };
  let brandsService: { findByUserId: jest.Mock };
  let creatorsService: { findByUserId: jest.Mock };
  let usersService: { findById: jest.Mock };
  let transactionsService: {
    findByPaymobReference: jest.Mock;
    recordHold: jest.Mock;
  };
  let paymobClient: { createCheckout: jest.Mock };

  beforeEach(async () => {
    collaborationsRepository = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn((data) => Promise.resolve({ id: 'collab-1', ...data })),
      findOne: jest.fn(),
      delete: jest.fn(),
      findAndCount: jest.fn(),
    };
    fakeManager = {
      getRepository: jest.fn().mockReturnValue(collaborationsRepository),
    };
    dataSource = {
      transaction: jest.fn((cb) => cb(fakeManager)),
    };
    proposalsService = {
      findById: jest.fn(),
      markAccepted: jest.fn(),
    };
    brandsService = {
      findByUserId: jest
        .fn()
        .mockResolvedValue({ id: 'brand-1', userId: 'user-brand-1' }),
    };
    creatorsService = {
      findByUserId: jest
        .fn()
        .mockResolvedValue({ id: 'creator-1', userId: 'user-creator-1' }),
    };
    usersService = {
      findById: jest.fn().mockResolvedValue({
        email: 'brand@example.com',
        phone: '+201000000000',
      }),
    };
    transactionsService = {
      findByPaymobReference: jest.fn(),
      recordHold: jest.fn(),
    };
    paymobClient = {
      createCheckout: jest.fn().mockResolvedValue({
        paymobOrderId: 'paymob-order-1',
        checkoutUrl: 'https://accept.paymob.com/iframe/1?payment_token=x',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationsService,
        {
          provide: getRepositoryToken(Collaboration),
          useValue: collaborationsRepository,
        },
        { provide: DataSource, useValue: dataSource },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(0.1) },
        },
        { provide: ProposalsService, useValue: proposalsService },
        { provide: BrandsService, useValue: brandsService },
        { provide: CreatorsService, useValue: creatorsService },
        { provide: UsersService, useValue: usersService },
        { provide: TransactionsService, useValue: transactionsService },
        { provide: PaymobClient, useValue: paymobClient },
      ],
    }).compile();

    service = module.get(CollaborationsService);
  });

  describe('acceptProposal (REQ-001)', () => {
    const appliedProposal = {
      id: 'proposal-1',
      campaignId: 'campaign-1',
      creatorId: 'creator-1',
      price: '1000.00',
      currency: 'EGP',
      status: ProposalStatus.APPLIED,
      campaign: { brandId: 'brand-1' },
    };

    it('computes creatorPrice/platformFee/totalAmount without float drift (GUD-001)', async () => {
      proposalsService.findById.mockResolvedValue(appliedProposal);

      const { collaboration, checkoutUrl } = await service.acceptProposal(
        'user-brand-1',
        'proposal-1',
      );

      expect(collaboration.creatorPrice).toBe('1000.00');
      expect(collaboration.platformFee).toBe('100.00');
      expect(collaboration.totalAmount).toBe('1100.00');
      expect(checkoutUrl).toContain('accept.paymob.com');
      expect(paymobClient.createCheckout).toHaveBeenCalledWith(
        110000,
        expect.any(String),
        expect.any(Object),
      );
    });

    it('rejects a proposal not owned by the accepting brand (404, not 403)', async () => {
      proposalsService.findById.mockResolvedValue({
        ...appliedProposal,
        campaign: { brandId: 'someone-elses-brand' },
      });

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects accepting a proposal that is not applied (422)', async () => {
      proposalsService.findById.mockResolvedValue({
        ...appliedProposal,
        status: ProposalStatus.SHORTLISTED,
      });

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toMatchObject({
        response: { code: 'invalid_state_transition' },
      });
    });

    it('maps a duplicate accept (unique proposal_id) to 409 (EDGE-P1-001)', async () => {
      proposalsService.findById.mockResolvedValue(appliedProposal);
      collaborationsRepository.save.mockRejectedValueOnce({ code: '23505' });

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toMatchObject({
        response: { code: 'collaboration_already_exists' },
      });
    });

    it('maps a Paymob failure to a 502, does not leak provider details, and deletes the orphaned row (GEN-08/H2)', async () => {
      proposalsService.findById.mockResolvedValue(appliedProposal);
      paymobClient.createCheckout.mockRejectedValueOnce(
        new PaymentProviderError('raw provider detail'),
      );

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toMatchObject({ response: { code: 'payment_provider_error' } });
      // H2: the insert happens before the Paymob call now (no open DB
      // transaction spans the network call), so a Paymob failure must
      // compensate by deleting the orphaned pending_payment row instead
      // of relying on a transaction rollback.
      expect(collaborationsRepository.delete).toHaveBeenCalledWith('collab-1');
    });
  });

  describe('applyPaymentWebhook (REQ-002/REQ-003/REQ-005/H1/C2)', () => {
    // Matches collaboration.totalAmount '1100.00' below via toCents().
    const validWebhookFields = {
      amountCents: 110000,
      currency: 'EGP',
      isRefunded: false,
      isVoided: false,
      pending: false,
      errorOccured: false,
    };

    it('funds the collaboration, accepts the proposal, and records one hold transaction', async () => {
      const collaboration = {
        id: 'collab-1',
        proposalId: 'proposal-1',
        status: CollaborationStatus.PENDING_PAYMENT,
        totalAmount: '1100.00',
        currency: 'EGP',
      };
      collaborationsRepository.findOne.mockResolvedValue(collaboration);
      transactionsService.findByPaymobReference.mockResolvedValue(null);

      await service.applyPaymentWebhook({
        paymobOrderId: 'paymob-order-1',
        paymobTransactionId: 'txn_123',
        success: true,
        ...validWebhookFields,
      });

      expect(collaboration.status).toBe(CollaborationStatus.FUNDED);
      expect(proposalsService.markAccepted).toHaveBeenCalledWith(
        'proposal-1',
        fakeManager,
      );
      expect(transactionsService.recordHold).toHaveBeenCalledWith(
        'collab-1',
        '1100.00',
        'EGP',
        'txn_123',
        fakeManager,
      );
    });

    it('does not double-process a replayed webhook (REQ-005)', async () => {
      collaborationsRepository.findOne.mockResolvedValue({
        id: 'collab-1',
        status: CollaborationStatus.FUNDED,
        totalAmount: '1100.00',
        currency: 'EGP',
      });
      transactionsService.findByPaymobReference.mockResolvedValue({
        id: 'txn-row-1',
      });

      await service.applyPaymentWebhook({
        paymobOrderId: 'paymob-order-1',
        paymobTransactionId: 'txn_123',
        success: true,
        ...validWebhookFields,
      });

      expect(proposalsService.markAccepted).not.toHaveBeenCalled();
      expect(transactionsService.recordHold).not.toHaveBeenCalled();
    });

    it('sets payment_failed and leaves the proposal untouched on a failed webhook (REQ-003)', async () => {
      const collaboration = {
        id: 'collab-2',
        proposalId: 'proposal-2',
        status: CollaborationStatus.PENDING_PAYMENT,
        totalAmount: '1100.00',
        currency: 'EGP',
      };
      collaborationsRepository.findOne.mockResolvedValue(collaboration);

      await service.applyPaymentWebhook({
        paymobOrderId: 'paymob-order-2',
        paymobTransactionId: 'txn_456',
        success: false,
        ...validWebhookFields,
      });

      expect(collaboration.status).toBe(CollaborationStatus.PAYMENT_FAILED);
      expect(proposalsService.markAccepted).not.toHaveBeenCalled();
      expect(transactionsService.recordHold).not.toHaveBeenCalled();
    });

    it('logs and no-ops for an unknown paymob_order_id instead of throwing (EDGE-P1-002)', async () => {
      collaborationsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.applyPaymentWebhook({
          paymobOrderId: 'unknown-order',
          paymobTransactionId: 'txn_789',
          success: true,
          ...validWebhookFields,
        }),
      ).resolves.toBeUndefined();
    });

    it('C2: funds a collaboration on a late/retried success after a prior failure, instead of dropping it', async () => {
      const collaboration = {
        id: 'collab-3',
        proposalId: 'proposal-3',
        status: CollaborationStatus.PAYMENT_FAILED,
        totalAmount: '1100.00',
        currency: 'EGP',
      };
      collaborationsRepository.findOne.mockResolvedValue(collaboration);
      transactionsService.findByPaymobReference.mockResolvedValue(null);

      await service.applyPaymentWebhook({
        paymobOrderId: 'paymob-order-3',
        paymobTransactionId: 'txn_retry_1',
        success: true,
        ...validWebhookFields,
      });

      expect(collaboration.status).toBe(CollaborationStatus.FUNDED);
      expect(proposalsService.markAccepted).toHaveBeenCalledWith(
        'proposal-3',
        fakeManager,
      );
      expect(transactionsService.recordHold).toHaveBeenCalledWith(
        'collab-3',
        '1100.00',
        'EGP',
        'txn_retry_1',
        fakeManager,
      );
    });

    it('H1: refuses to fund on an amount/currency mismatch', async () => {
      const collaboration = {
        id: 'collab-4',
        proposalId: 'proposal-4',
        status: CollaborationStatus.PENDING_PAYMENT,
        totalAmount: '1100.00',
        currency: 'EGP',
      };
      collaborationsRepository.findOne.mockResolvedValue(collaboration);
      transactionsService.findByPaymobReference.mockResolvedValue(null);

      await service.applyPaymentWebhook({
        paymobOrderId: 'paymob-order-4',
        paymobTransactionId: 'txn_mismatch',
        success: true,
        ...validWebhookFields,
        amountCents: 1, // signed payload claims a charge of 0.01 EGP
      });

      expect(collaboration.status).toBe(CollaborationStatus.PENDING_PAYMENT);
      expect(proposalsService.markAccepted).not.toHaveBeenCalled();
      expect(transactionsService.recordHold).not.toHaveBeenCalled();
    });

    it('H1: refuses to fund a refunded transaction even when success is true', async () => {
      const collaboration = {
        id: 'collab-5',
        proposalId: 'proposal-5',
        status: CollaborationStatus.PENDING_PAYMENT,
        totalAmount: '1100.00',
        currency: 'EGP',
      };
      collaborationsRepository.findOne.mockResolvedValue(collaboration);
      transactionsService.findByPaymobReference.mockResolvedValue(null);

      await service.applyPaymentWebhook({
        paymobOrderId: 'paymob-order-5',
        paymobTransactionId: 'txn_refunded',
        success: true,
        ...validWebhookFields,
        isRefunded: true,
      });

      expect(collaboration.status).toBe(CollaborationStatus.PENDING_PAYMENT);
      expect(proposalsService.markAccepted).not.toHaveBeenCalled();
      expect(transactionsService.recordHold).not.toHaveBeenCalled();
    });

    it('H1: refuses to fund a voided transaction even when success is true', async () => {
      const collaboration = {
        id: 'collab-6',
        proposalId: 'proposal-6',
        status: CollaborationStatus.PENDING_PAYMENT,
        totalAmount: '1100.00',
        currency: 'EGP',
      };
      collaborationsRepository.findOne.mockResolvedValue(collaboration);
      transactionsService.findByPaymobReference.mockResolvedValue(null);

      await service.applyPaymentWebhook({
        paymobOrderId: 'paymob-order-6',
        paymobTransactionId: 'txn_voided',
        success: true,
        ...validWebhookFields,
        isVoided: true,
      });

      expect(collaboration.status).toBe(CollaborationStatus.PENDING_PAYMENT);
      expect(transactionsService.recordHold).not.toHaveBeenCalled();
    });
  });

  describe('findOwnedByUser (feature_mobile_app_phase1 addendum)', () => {
    it('dispatches to the brand ownership check for a brand user', async () => {
      collaborationsRepository.findOne.mockResolvedValue({ id: 'collab-1' });

      await service.findOwnedByUser(
        { userId: 'user-brand-1', role: UserRole.BRAND },
        'collab-1',
      );

      expect(brandsService.findByUserId).toHaveBeenCalledWith('user-brand-1');
      expect(creatorsService.findByUserId).not.toHaveBeenCalled();
    });

    it('dispatches to the creator ownership check for a creator user', async () => {
      collaborationsRepository.findOne.mockResolvedValue({ id: 'collab-1' });

      await service.findOwnedByUser(
        { userId: 'user-creator-1', role: UserRole.CREATOR },
        'collab-1',
      );

      expect(creatorsService.findByUserId).toHaveBeenCalledWith(
        'user-creator-1',
      );
      expect(brandsService.findByUserId).not.toHaveBeenCalled();
    });

    it('404s when the collaboration is not owned by the requesting user', async () => {
      collaborationsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOwnedByUser(
          { userId: 'user-brand-1', role: UserRole.BRAND },
          'collab-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listMine (feature_mobile_app_phase1 addendum)', () => {
    it('scopes the query to the brand row for a brand user', async () => {
      collaborationsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.listMine(
        { userId: 'user-brand-1', role: UserRole.BRAND },
        1,
        20,
      );

      expect(collaborationsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { brandId: 'brand-1' } }),
      );
    });

    it('scopes the query to the creator row for a creator user', async () => {
      collaborationsRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.listMine(
        { userId: 'user-creator-1', role: UserRole.CREATOR },
        1,
        20,
      );

      expect(collaborationsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { creatorId: 'creator-1' } }),
      );
    });
  });
});
