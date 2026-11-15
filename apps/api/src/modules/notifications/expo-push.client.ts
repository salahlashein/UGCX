import { Injectable, Logger } from '@nestjs/common';
import type { NotificationDeepLink } from '@ugcx/shared-types';

export interface ExpoPushMessage {
  to: string; // The Expo push token
  title: string;
  body: string;
  data: { notificationId: string; deepLink: NotificationDeepLink | null };
  sound?: 'default';
}

export interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * PAT-401: ExpoPushClient. POSTs to https://exp.host/--/api/v2/push/send
 * in batches of up to 100 with a 10s abort timeout. Never throws.
 */
@Injectable()
export class ExpoPushClient {
  private readonly logger = new Logger(ExpoPushClient.name);
  private readonly url = 'https://exp.host/--/api/v2/push/send';

  async send(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    if (messages.length === 0) return [];

    const tickets: ExpoPushTicket[] = [];
    const batchSize = 100;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchTickets = await this.sendBatch(batch);
      tickets.push(...batchTickets);
    }

    return tickets;
  }

  private async sendBatch(batch: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`Expo push send returned status ${response.status}`);
        return batch.map(() => ({
          status: 'error',
          message: `HTTP ${response.status}`,
        }));
      }

      const json = (await response.json()) as { data?: ExpoPushTicket[] };
      return (
        json.data ??
        batch.map(() => ({ status: 'error', message: 'No data returned' }))
      );
    } catch (err) {
      this.logger.warn(
        `Expo push send failed: ${(err as Error)?.message ?? 'network timeout'}`,
      );
      return batch.map(() => ({
        status: 'error',
        message: 'Network error or timeout',
      }));
    } finally {
      clearTimeout(timer);
    }
  }
}
