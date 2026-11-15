import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymobWebhookController } from './paymob-webhook.controller';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { computePaymobHmac } from './paymob-signature';
import type { PaymobWebhookPayload } from './dto/paymob-webhook.dto';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';

describe('PaymobWebhookController', () => {
  let controller: PaymobWebhookController;
  let collaborationsService: { applyPaymentWebhook: jest.Mock };
  let campaignsService: { applyEscrowWebhook: jest.Mock };
  const secret = 'test-webhook-secret';

  const baseTx = {
    id: 12345,
    amount_cents: 320000,
    created_at: '2026-09-18T00:00:00Z',
    currency: 'EGP',
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 9999,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 7777, merchant_order_id: 'cmp_campaign-uuid-1' },
    owner: 888,
    pending: false,
    source_data: { pan: '4471', sub_type: 'MasterCard', type: 'card' },
    success: true,
  };

  beforeEach(async () => {
    collaborationsService = {
      applyPaymentWebhook: jest.fn().mockResolvedValue(undefined),
    };
    campaignsService = {
      applyEscrowWebhook: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymobWebhookController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(secret),
          },
        },
        {
          provide: CollaborationsService,
          useValue: collaborationsService,
        },
        {
          provide: CampaignsService,
          useValue: campaignsService,
        },
      ],
    }).compile();

    controller = module.get<PaymobWebhookController>(PaymobWebhookController);
  });

  it('1. a missing HMAC throws invalid_signature with status 400 and no service call', async () => {
    const payload: PaymobWebhookPayload = { obj: baseTx as any };

    await expect(controller.handle(payload, undefined)).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      response: expect.objectContaining({ code: 'invalid_signature' }),
    });

    expect(campaignsService.applyEscrowWebhook).not.toHaveBeenCalled();
    expect(collaborationsService.applyPaymentWebhook).not.toHaveBeenCalled();
  });

  it('2. a valid signature with a cmp_ order id calls applyEscrowWebhook once', async () => {
    const tx = {
      ...baseTx,
      order: { id: 7777, merchant_order_id: 'cmp_camp-1' },
    };
    const hmac = computePaymobHmac(tx as any, secret);
    const payload: PaymobWebhookPayload = { obj: tx as any };

    await controller.handle(payload, hmac);

    expect(campaignsService.applyEscrowWebhook).toHaveBeenCalledTimes(1);
    expect(campaignsService.applyEscrowWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        paymobOrderId: '7777',
        paymobTransactionId: '12345',
        amountCents: 320000,
        currency: 'EGP',
        success: true,
        paymentMethodLabel: 'MASTERCARD •• 4471',
      }),
    );
    expect(collaborationsService.applyPaymentWebhook).not.toHaveBeenCalled();
  });

  it('3. a valid signature with a col_ order id calls applyPaymentWebhook once', async () => {
    const tx = {
      ...baseTx,
      order: { id: 7777, merchant_order_id: 'col_collab-1' },
    };
    const hmac = computePaymobHmac(tx as any, secret);
    const payload: PaymobWebhookPayload = { obj: tx as any };

    await controller.handle(payload, hmac);

    expect(collaborationsService.applyPaymentWebhook).toHaveBeenCalledTimes(1);
    expect(campaignsService.applyEscrowWebhook).not.toHaveBeenCalled();
  });

  it('4. a valid signature with a bare UUID calls applyPaymentWebhook once', async () => {
    const tx = {
      ...baseTx,
      order: {
        id: 7777,
        merchant_order_id: '123e4567-e89b-12d3-a456-426614174000',
      },
    };
    const hmac = computePaymobHmac(tx as any, secret);
    const payload: PaymobWebhookPayload = { obj: tx as any };

    await controller.handle(payload, hmac);

    expect(collaborationsService.applyPaymentWebhook).toHaveBeenCalledTimes(1);
    expect(campaignsService.applyEscrowWebhook).not.toHaveBeenCalled();
  });

  it('5. the controller answers 200 (resolves void) when the service resolves', async () => {
    const hmac = computePaymobHmac(baseTx as any, secret);
    const payload: PaymobWebhookPayload = { obj: baseTx as any };

    await expect(controller.handle(payload, hmac)).resolves.toBeUndefined();
  });
});
