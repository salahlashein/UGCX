import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AdminCampaignsService } from './admin-campaigns.service';
import {
  Campaign,
  CampaignStatus,
} from '../campaigns/entities/campaign.entity';
import { EscrowService } from '../escrow/escrow.service';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

describe('AdminCampaignsService.verifyEscrow (manual payments)', () => {
  let service: AdminCampaignsService;
  let campaignRepo: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
  };
  let escrowService: { applyFunding: jest.Mock };
  let stored: Partial<Campaign> | null;

  const campaign = (overrides: Partial<Campaign> = {}): Partial<Campaign> => ({
    id: 'camp-1',
    status: CampaignStatus.DRAFT,
    currency: 'EGP',
    budgetMin: '3000.00',
    escrowFundedAmount: '0.00',
    fundingRequestedAmount: null,
    fundingPaymobOrderId: null,
    ...overrides,
  });

  beforeEach(async () => {
    stored = null;
    campaignRepo = {
      findOne: jest.fn(() => Promise.resolve(stored)),
      findOneOrFail: jest.fn(() => Promise.resolve({ ...stored })),
      save: jest.fn((c) => Promise.resolve(c)),
    };
    escrowService = { applyFunding: jest.fn().mockResolvedValue(undefined) };
    const manager = { getRepository: jest.fn(() => campaignRepo) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCampaignsService,
        {
          provide: DataSource,
          useValue: { transaction: jest.fn((cb) => cb(manager)) },
        },
        { provide: getRepositoryToken(Campaign), useValue: campaignRepo },
        { provide: EscrowService, useValue: escrowService },
      ],
    }).compile();

    service = module.get(AdminCampaignsService);
  });

  const expectConflict = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DomainErrorException);
    expect((error as DomainErrorException).getStatus()).toBe(
      HttpStatus.CONFLICT,
    );
    expect((error as DomainErrorException).getResponse()).toMatchObject({
      code: 'no_pending_manual_payment',
    });
    expect(escrowService.applyFunding).not.toHaveBeenCalled();
  };

  it('throws 404 when the campaign does not exist', async () => {
    await expect(
      service.verifyEscrow('admin-1', 'missing', { approved: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a verify when the brand submitted no payment', async () => {
    stored = campaign();
    await expectConflict(
      service.verifyEscrow('admin-1', 'camp-1', { approved: true }),
    );
  });

  it('rejects a second verify of the same payment', async () => {
    stored = campaign({
      fundingRequestedAmount: '5000.00',
      fundingPaymobOrderId: 'manual:instapay:IP-1',
    });
    await service.verifyEscrow('admin-1', 'camp-1', { approved: true });
    // The first verify cleared the pending fields.
    stored = campaign({ status: CampaignStatus.LIVE });
    escrowService.applyFunding.mockClear();
    await expectConflict(
      service.verifyEscrow('admin-1', 'camp-1', { approved: true }),
    );
  });

  it('rejects a pending Paymob checkout, which the webhook settles', async () => {
    stored = campaign({
      fundingRequestedAmount: '5000.00',
      fundingPaymobOrderId: '987654',
    });
    await expectConflict(
      service.verifyEscrow('admin-1', 'camp-1', { approved: true }),
    );
  });

  it('funds the submitted amount, not the budget, and publishes the brief', async () => {
    stored = campaign({
      fundingRequestedAmount: '5000.00',
      fundingPaymobOrderId: 'manual:vodafone_cash:VC-42',
    });
    const result = await service.verifyEscrow('admin-1', 'camp-1', {
      approved: true,
    });

    expect(escrowService.applyFunding).toHaveBeenCalledWith(
      'camp-1',
      '5000.00',
      'EGP',
      'manual:vodafone_cash:VC-42',
      expect.anything(),
      'manual_instapay_vodafone',
    );
    expect(result.status).toBe(CampaignStatus.LIVE);
    const saved = campaignRepo.save.mock.calls.at(-1)[0];
    expect(saved.fundingRequestedAmount).toBeNull();
    expect(saved.fundingPaymobOrderId).toBeNull();
    expect(saved.publishedAt).toBeInstanceOf(Date);
  });

  it('clears a rejected payment without funding', async () => {
    stored = campaign({
      fundingRequestedAmount: '5000.00',
      fundingPaymobOrderId: 'manual:instapay:IP-2',
    });
    const result = await service.verifyEscrow('admin-1', 'camp-1', {
      approved: false,
    });

    expect(escrowService.applyFunding).not.toHaveBeenCalled();
    expect(result.status).toBe(CampaignStatus.DRAFT);
    const saved = campaignRepo.save.mock.calls.at(-1)[0];
    expect(saved.fundingRequestedAmount).toBeNull();
    expect(saved.fundingPaymobOrderId).toBeNull();
  });
});
