import { Test, TestingModule } from '@nestjs/testing';
import { ExpoPushClient } from './expo-push.client';

describe('ExpoPushClient (TASK-P4-03)', () => {
  let client: ExpoPushClient;
  let originalFetch: typeof global.fetch;

  beforeEach(async () => {
    originalFetch = global.fetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpoPushClient],
    }).compile();

    client = module.get(ExpoPushClient);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('9. 250 messages produce 3 requests (batches of 100)', async () => {
    const fetchMock = jest.fn().mockImplementation((url, opts) => {
      const body = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: body.map(() => ({ status: 'ok', id: 'ticket-1' })),
          }),
      });
    });
    global.fetch = fetchMock;

    const messages = Array.from({ length: 250 }, (_, i) => ({
      to: `ExponentPushToken[user-${i}]`,
      title: 'Title',
      body: 'Body',
      data: { notificationId: `n-${i}`, deepLink: null },
    }));

    const tickets = await client.send(messages);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(tickets).toHaveLength(250);
  });

  it('10. A timeout logs at warn and returns an error ticket array without throwing', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('AbortError: The operation was aborted'));

    const messages = [
      {
        to: 'ExponentPushToken[timeout-user]',
        title: 'Title',
        body: 'Body',
        data: { notificationId: 'n-1', deepLink: null },
      },
    ];

    const tickets = await client.send(messages);

    expect(tickets).toHaveLength(1);
    expect(tickets[0].status).toBe('error');
    expect(tickets[0].message).toBe('Network error or timeout');
  });

  it('11. The log never contains a push token', async () => {
    const warnSpy = jest
      .spyOn((client as any).logger, 'warn')
      .mockImplementation(() => {});

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const secretToken = 'ExponentPushToken[super_secret_token_value_xyz]';
    await client.send([
      {
        to: secretToken,
        title: 'Title',
        body: 'Body',
        data: { notificationId: 'n-1', deepLink: null },
      },
    ]);

    for (const call of warnSpy.mock.calls) {
      for (const arg of call) {
        expect(String(arg)).not.toContain(secretToken);
      }
    }
  });
});
