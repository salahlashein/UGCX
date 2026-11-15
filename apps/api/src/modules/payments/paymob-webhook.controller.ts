import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/configuration';
import { DomainErrorException } from '../../common/exceptions/domain-error.exception';
import { CollaborationsService } from '../collaborations/collaborations.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import type { PaymobWebhookPayload } from './dto/paymob-webhook.dto';
import { isValidPaymobSignature } from './paymob-signature';
import { decodeMerchantOrderId } from './merchant-order-id';

/**
 * TASK-P1-005. nestjs skill: this is the one controller in this plan not
 * guarded by JwtAuthGuard. Do not add auth here in a future refactor —
 * Paymob's callback cannot authenticate as a platform user; the HMAC check
 * below (REQ-004) is this endpoint's authentication.
 */
@Controller('webhooks/paymob')
export class PaymobWebhookController {
  private readonly logger = new Logger(PaymobWebhookController.name);

  constructor(
    private readonly configService: ConfigService<AppConfig>,
    private readonly collaborationsService: CollaborationsService,
    private readonly campaignsService: CampaignsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Body() payload: PaymobWebhookPayload,
    @Query('hmac') hmac?: string,
  ): Promise<void> {
    const transaction = payload?.obj;
    const secret =
      this.configService.get('paymob.hmacSecret', { infer: true }) ?? '';

    // REQ-004: verify before touching any state. No Collaboration or
    // Transaction is read or written until the signature is confirmed.
    if (!transaction || !isValidPaymobSignature(transaction, hmac, secret)) {
      this.logger.warn('Rejected Paymob webhook with invalid signature');
      throw new DomainErrorException(
        HttpStatus.BAD_REQUEST,
        'invalid_signature',
        'Webhook signature verification failed',
      );
    }

    const merchantOrderId = transaction.order?.merchant_order_id;
    const decoded = merchantOrderId
      ? decodeMerchantOrderId(merchantOrderId)
      : null;

    const sourcePan = transaction.source_data?.pan;
    const subType = transaction.source_data?.sub_type;
    const paymentMethodLabel = sourcePan
      ? `${subType ? subType.toUpperCase() + ' ' : ''}•• ${sourcePan.slice(-4)}`
      : null;

    // Route based on decoded intent
    if (decoded?.intent === 'campaign_escrow') {
      await this.campaignsService.applyEscrowWebhook({
        paymobOrderId: String(transaction.order.id),
        paymobTransactionId: String(transaction.id),
        success: transaction.success,
        amountCents: transaction.amount_cents,
        currency: transaction.currency,
        isRefunded: transaction.is_refunded,
        isVoided: transaction.is_voided,
        pending: transaction.pending,
        errorOccured: transaction.error_occured,
        paymentMethodLabel,
      });
      return;
    }

    // Default to collaboration top up / legacy path
    await this.collaborationsService.applyPaymentWebhook({
      paymobOrderId: String(transaction.order.id),
      paymobTransactionId: String(transaction.id),
      success: transaction.success,
      amountCents: transaction.amount_cents,
      currency: transaction.currency,
      isRefunded: transaction.is_refunded,
      isVoided: transaction.is_voided,
      pending: transaction.pending,
      errorOccured: transaction.error_occured,
    });
  }
}
