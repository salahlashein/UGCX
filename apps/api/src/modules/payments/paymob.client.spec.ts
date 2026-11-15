import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymobClient } from './paymob.client';
import { PaymentProviderError } from './payment-provider.error';

describe('PaymobClient', () => {
  let client: PaymobClient;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymobClient,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'paymob.apiKey') return 'mock-api-key';
              if (key === 'paymob.integrationId') return '12345';
              if (key === 'paymob.iframeId') return '67890';
              return null;
            }),
          },
        },
      ],
    }).compile();

    client = module.get<PaymobClient>(PaymobClient);
  });

  it('1. refundTransaction posts to the refund path with amount_cents', async () => {
    const mockFetch = jest
      .fn()
      // First call: /auth/tokens
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-auth-token' }),
      } as Response)
      // Second call: /acceptance/void_refund/refund
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '998877' }),
      } as Response);

    global.fetch = mockFetch;

    const result = await client.refundTransaction('paymob-tx-123', 12000);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://accept.paymob.com/api/acceptance/void_refund/refund',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_token: 'mock-auth-token',
          transaction_id: 'paymob-tx-123',
          amount_cents: 12000,
        }),
      }),
    );
    expect(result).toEqual({ paymobRefundTransactionId: '998877' });
  });

  it('2. a non-ok response throws PaymentProviderError', async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-auth-token' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

    global.fetch = mockFetch;

    await expect(
      client.refundTransaction('tx-bad', 5000),
    ).rejects.toBeInstanceOf(PaymentProviderError);
  });

  it('3. an abort throws PaymentProviderError and logs a timeout with no payload in log', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';

    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-auth-token' }),
      } as Response)
      .mockRejectedValueOnce(abortError);

    global.fetch = mockFetch;

    const errorSpy = jest.spyOn((client as any).logger, 'error');

    await expect(
      client.refundTransaction('tx-timeout', 5000),
    ).rejects.toBeInstanceOf(PaymentProviderError);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('timed out after 10000ms'),
    );
    // Ensure payload or token is never in log
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('mock-auth-token'),
    );
  });
});
