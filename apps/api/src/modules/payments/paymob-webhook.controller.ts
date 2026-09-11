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
import type { PaymobWebhookPayload } from './dto/paymob-webhook.dto';
import { isValidPaymobSignature } from './paymob-signature';

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

    // H1: pass every signed field the fraud/correctness check needs -
    // amount/currency and the refund/void/pending/error flags - not just
    // order id + success.
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
