import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/configuration';
import { PaymentProviderError } from './payment-provider.error';

const PAYMOB_BASE_URL = 'https://accept.paymob.com/api';
// H2: every Paymob call gets a hard timeout. Without one, a hung
// connection blocks whatever holds it (a DB pool connection, an HTTP
// worker) for the OS TCP timeout, and enough concurrent accepts exhaust
// shared resources unrelated to payments.
const REQUEST_TIMEOUT_MS = 10_000;

export interface PaymobBillingData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface PaymobCheckout {
  paymobOrderId: string;
  checkoutUrl: string;
}

/**
 * TASK-P1-003: encapsulates Paymob's Accept API auth-token ->
 * order-registration -> payment-key flow (SEC-003: credentials come only
 * from ConfigService, never hard-coded or logged). Every network error is
 * wrapped into PaymentProviderError so the raw Paymob response never
 * reaches a client.
 */
@Injectable()
export class PaymobClient {
  private readonly logger = new Logger(PaymobClient.name);

  constructor(private readonly configService: ConfigService<AppConfig>) {}

  /**
   * Registers an order and requests a payment key in one call, returning
   * the hosted checkout iframe URL (REQ-001).
   */
  async createCheckout(
    amountCents: number,
    merchantOrderId: string,
    billingData: PaymobBillingData,
  ): Promise<PaymobCheckout> {
    const authToken = await this.requestAuthToken();
    const orderId = await this.registerOrder(
      authToken,
      amountCents,
      merchantOrderId,
    );
    const paymentKey = await this.requestPaymentKey(
      authToken,
      orderId,
      amountCents,
      billingData,
    );

    const iframeId = this.configService.get('paymob.iframeId', {
      infer: true,
    });
    return {
      paymobOrderId: orderId,
      checkoutUrl: `${PAYMOB_BASE_URL}/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`,
    };
  }

  /**
   * REQ-210. Calls Paymob's void/refund endpoint against an existing
   * transaction id. Wraps every failure in PaymentProviderError, matching
   * the rest of this client.
   */
  async refundTransaction(
    paymobTransactionId: string,
    amountCents: number,
  ): Promise<{ paymobRefundTransactionId: string }> {
    const authToken = await this.requestAuthToken();
    const body = (await this.post('/acceptance/void_refund/refund', {
      auth_token: authToken,
      transaction_id: paymobTransactionId,
      amount_cents: amountCents,
    })) as { id?: number | string };

    if (body.id === undefined || body.id === null) {
      throw new PaymentProviderError('Paymob refund response malformed');
    }
    return { paymobRefundTransactionId: String(body.id) };
  }

  private async requestAuthToken(): Promise<string> {
    const apiKey = this.configService.get('paymob.apiKey', { infer: true });
    const body = (await this.post('/auth/tokens', { api_key: apiKey })) as {
      token?: string;
    };
    if (!body.token) {
      throw new PaymentProviderError('Paymob auth-token response malformed');
    }
    return body.token;
  }

  private async registerOrder(
    authToken: string,
    amountCents: number,
    merchantOrderId: string,
  ): Promise<string> {
    const body = (await this.post('/ecommerce/orders', {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantOrderId,
      items: [],
    })) as { id?: number | string };
    if (body.id === undefined || body.id === null) {
      throw new PaymentProviderError(
        'Paymob order-registration response malformed',
      );
    }
    return String(body.id);
  }

  private async requestPaymentKey(
    authToken: string,
    orderId: string,
    amountCents: number,
    billingData: PaymobBillingData,
  ): Promise<string> {
    const integrationId = this.configService.get('paymob.integrationId', {
      infer: true,
    });
    const body = (await this.post('/acceptance/payment_keys', {
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      currency: 'EGP',
      integration_id: integrationId,
      billing_data: {
        first_name: billingData.firstName,
        last_name: billingData.lastName,
        email: billingData.email,
        phone_number: billingData.phoneNumber,
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        city: 'NA',
        state: 'NA',
        country: 'EG',
        postal_code: 'NA',
        shipping_method: 'NA',
      },
    })) as { token?: string };
    if (!body.token) {
      throw new PaymentProviderError('Paymob payment-key response malformed');
    }
    return body.token;
  }

  private async post(
    path: string,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${PAYMOB_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      // SEC-003: never log the payload (it may carry auth tokens).
      const reason =
        error instanceof Error && error.name === 'AbortError'
          ? `timed out after ${REQUEST_TIMEOUT_MS}ms`
          : 'network error';
      this.logger.error(`Paymob request to ${path} failed: ${reason}`);
      throw new PaymentProviderError('Unable to reach payment provider');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      this.logger.error(
        `Paymob request to ${path} failed with status ${response.status}`,
      );
      throw new PaymentProviderError(
        `Payment provider rejected the request (${response.status})`,
      );
    }

    try {
      return await response.json();
    } catch {
      throw new PaymentProviderError(
        'Payment provider returned an unreadable response',
      );
    }
  }
}
