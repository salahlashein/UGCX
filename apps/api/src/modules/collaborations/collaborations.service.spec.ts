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

import { EscrowService } from '../escrow/escrow.service';
import { InsufficientEscrowError } from '../escrow/escrow.errors';
import { CampaignStatus } from '../campaigns/entities/campaign.entity';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { computeDueAt } from './due-at';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

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
  let escrowService: {
    quote: jest.Mock;
    allocate: jest.Mock;
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
    escrowService = {
      quote: jest.fn().mockReturnValue({
        priceCents: 100000,
        feeCents: 10000,
        totalCents: 110000,
      }),
      allocate: jest.fn().mockResolvedValue({
        holdTransactionId: 'txn-hold-1',
        allocatedAmount: '1100.00',
      }),
    };
    paymobClient = {
      createCheckout: jest.fn().mockResolvedValue({
        paymobOrderId: 'paymob-order-1',
        checkoutUrl: 'https://accept.paymob.com/iframe/1?payment_token=x',
      }),
    };
    const messagesService = {
      createSystemMessage: jest.fn().mockResolvedValue({ id: 'msg-sys' }),
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
        { provide: EscrowService, useValue: escrowService },
        { provide: PaymobClient, useValue: paymobClient },
        { provide: MessagesService, useValue: messagesService },
        {
          provide: NotificationsService,
          useValue: {
            record: jest.fn().mockResolvedValue([]),
            push: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(CollaborationsService);
  });

  describe('acceptProposal (TASK-P2-08, REQ-207)', () => {
    const liveAppliedProposal = {
      id: 'proposal-1',
      campaignId: 'campaign-1',
      creatorId: 'creator-1',
      price: '1000.00',
      currency: 'EGP',
      status: ProposalStatus.APPLIED,
      campaign: {
        id: 'campaign-1',
        brandId: 'brand-1',
        status: CampaignStatus.LIVE,
      },
    };

    it('1. a successful accept creates a collaboration with status funded and checkoutUrl null', async () => {
      proposalsService.findById.mockResolvedValue(liveAppliedProposal);

      const { collaboration, checkoutUrl } = await service.acceptProposal(
        'user-brand-1',
        'proposal-1',
      );

      expect(collaboration.status).toBe(CollaborationStatus.FUNDED);
      expect(collaboration.creatorPrice).toBe('1000.00');
      expect(collaboration.platformFee).toBe('100.00');
      expect(collaboration.totalAmount).toBe('1100.00');
      expect(checkoutUrl).toBeNull();
    });

    it('2. a successful accept calls escrowService.allocate exactly once', async () => {
      proposalsService.findById.mockResolvedValue(liveAppliedProposal);

      await service.acceptProposal('user-brand-1', 'proposal-1');

      expect(escrowService.allocate).toHaveBeenCalledTimes(1);
      expect(escrowService.allocate).toHaveBeenCalledWith(
        'campaign-1',
        'collab-1',
        '1000.00',
        'EGP',
        fakeManager,
      );
    });

    it('3. a successful accept calls paymobClient.createCheckout zero times', async () => {
      proposalsService.findById.mockResolvedValue(liveAppliedProposal);

      await service.acceptProposal('user-brand-1', 'proposal-1');

      expect(paymobClient.createCheckout).toHaveBeenCalledTimes(0);
    });

    it('4. a successful accept calls proposalsService.markAccepted once with the same manager', async () => {
      proposalsService.findById.mockResolvedValue(liveAppliedProposal);

      await service.acceptProposal('user-brand-1', 'proposal-1');

      expect(proposalsService.markAccepted).toHaveBeenCalledTimes(1);
      expect(proposalsService.markAccepted).toHaveBeenCalledWith(
        'proposal-1',
        fakeManager,
      );
    });

    it('5. accepts a shortlisted proposal (previously threw, now allowed)', async () => {
      proposalsService.findById.mockResolvedValue({
        ...liveAppliedProposal,
        status: ProposalStatus.SHORTLISTED,
      });

      const { collaboration } = await service.acceptProposal(
        'user-brand-1',
        'proposal-1',
      );

      expect(collaboration.status).toBe(CollaborationStatus.FUNDED);
    });

    it('6. a declined proposal throws invalid_state_transition', async () => {
      proposalsService.findById.mockResolvedValue({
        ...liveAppliedProposal,
        status: ProposalStatus.DECLINED,
      });

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toMatchObject({
        response: { code: 'invalid_state_transition' },
      });
    });

    it('7. a campaign in paused throws campaign_not_open', async () => {
      proposalsService.findById.mockResolvedValue({
        ...liveAppliedProposal,
        campaign: {
          id: 'campaign-1',
          brandId: 'brand-1',
          status: CampaignStatus.PAUSED,
        },
      });

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toMatchObject({
        response: { code: 'campaign_not_open' },
      });
    });

    it('8. InsufficientEscrowError propagates with code insufficient_escrow', async () => {
      proposalsService.findById.mockResolvedValue(liveAppliedProposal);
      escrowService.allocate.mockRejectedValueOnce(
        new InsufficientEscrowError({
          requiredCents: 308000,
          availableCents: 100000,
          shortfallCents: 208000,
        }),
      );

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toMatchObject({
        response: { code: 'insufficient_escrow' },
      });
    });

    it('9. a unique violation on proposal_id maps to 409 collaboration_already_exists', async () => {
      proposalsService.findById.mockResolvedValue(liveAppliedProposal);
      collaborationsRepository.save.mockRejectedValueOnce({ code: '23505' });

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toMatchObject({
        response: { code: 'collaboration_already_exists' },
      });
    });

    it('10. rejects a proposal not owned by the accepting brand with 404', async () => {
      proposalsService.findById.mockResolvedValue({
        ...liveAppliedProposal,
        campaign: {
          id: 'campaign-1',
          brandId: 'someone-elses-brand',
          status: CampaignStatus.LIVE,
        },
      });

      await expect(
        service.acceptProposal('user-brand-1', 'proposal-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
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

  describe('findOwnedByCreator', () => {
    it('loads the campaign and brand names, and hides private brand fields', async () => {
      collaborationsRepository.findOne.mockResolvedValue({
        id: 'collab-1',
        campaign: { needsShipping: false },
        brand: {
          id: 'brand-1',
          userId: 'user-brand-1',
          companyName: 'Glow Lab',
          logoUrl: null,
          country: 'EG',
          businessDocumentUrl: 'https://private.example/doc.pdf',
        },
      });

      const result = await service.findOwnedByCreator(
        'user-creator-1',
        'collab-1',
      );

      expect(result.campaign.needsShipping).toBe(false);
      expect(result.brand.companyName).toBe('Glow Lab');
      expect(result.brand).not.toHaveProperty('businessDocumentUrl');
      expect(result.brand).not.toHaveProperty('userId');
      expect(collaborationsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'collab-1', creatorId: 'creator-1' },
        relations: { campaign: { product: true }, brand: true, proposal: true },
      });
    });
  });

  describe('TASK-W4-02: computeDueAt', () => {
    it('computeDueAt with needsShipping false uses createdAt', () => {
      const createdAt = new Date('2026-11-01T10:00:00Z');
      const due = computeDueAt(
        { createdAt, receivedAt: null },
        { needsShipping: false },
        { deliveryDays: 5 },
      );
      expect(due).toBe(new Date('2026-11-06T10:00:00Z').toISOString());
    });

    it('computeDueAt with needsShipping true and no receipt returns null', () => {
      const due = computeDueAt(
        { createdAt: new Date('2026-11-01T10:00:00Z'), receivedAt: null },
        { needsShipping: true },
        { deliveryDays: 5 },
      );
      expect(due).toBeNull();
    });

    it('computeDueAt with a receipt adds deliveryDays days', () => {
      const receivedAt = new Date('2026-11-03T12:00:00Z');
      const due = computeDueAt(
        { createdAt: new Date('2026-11-01T10:00:00Z'), receivedAt },
        { needsShipping: true },
        { deliveryDays: 7 },
      );
      expect(due).toBe(new Date('2026-11-10T12:00:00Z').toISOString());
    });
  });

  describe('TASK-W4-02: confirmReceipt', () => {
    it('creator confirms receipt on a shipped collaboration', async () => {
      const shippedCollab = {
        id: 'collab-1',
        creatorId: 'creator-1',
        brandId: 'brand-1',
        campaignId: 'camp-1',
        status: CollaborationStatus.SHIPPED,
        receivedAt: null,
        campaign: { title: 'Test Brief', needsShipping: true },
        creator: { displayName: 'Creator One' },
        brand: { companyName: 'Brand Inc' },
      };
      collaborationsRepository.findOne.mockResolvedValue(shippedCollab);
      collaborationsRepository.save.mockImplementation(async (c: any) => c);

      const result = await service.confirmReceipt('user-creator-1', 'collab-1');
      expect(result.receivedAt).toBeInstanceOf(Date);
      expect(result.status).toBe(CollaborationStatus.SHIPPED);
    });

    it('second confirm returns 422 already_received', async () => {
      const alreadyReceivedCollab = {
        id: 'collab-1',
        creatorId: 'creator-1',
        status: CollaborationStatus.SHIPPED,
        receivedAt: new Date(),
        campaign: { needsShipping: true },
        brand: {},
      };
      collaborationsRepository.findOne.mockResolvedValue(alreadyReceivedCollab);

      await expect(
        service.confirmReceipt('user-creator-1', 'collab-1'),
      ).rejects.toThrow(DomainErrorException);
    });

    it('creator who does not own the collaboration gets 404', async () => {
      collaborationsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.confirmReceipt('user-creator-2', 'collab-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('confirm on non-shipped status returns 422 invalid_state_transition', async () => {
      const fundedCollab = {
        id: 'collab-1',
        creatorId: 'creator-1',
        status: CollaborationStatus.FUNDED,
        receivedAt: null,
        campaign: { needsShipping: true },
        brand: {},
      };
      collaborationsRepository.findOne.mockResolvedValue(fundedCollab);

      await expect(
        service.confirmReceipt('user-creator-1', 'collab-1'),
      ).rejects.toThrow(DomainErrorException);
    });
  });
});
