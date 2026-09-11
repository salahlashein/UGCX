import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Ably from 'ably';
import type { AppConfig } from '../../config/configuration';
import { ChatProviderError } from './chat-provider.error';

const TOKEN_TTL_MS = 60 * 60 * 1000; // TASK-P1-009: 1 hour

/**
 * DES-P1-004/TASK-P1-009: issues a capability-scoped Ably TokenRequest
 * (never the raw ABLY_API_KEY, SEC-003) restricted to publish+subscribe on
 * exactly one collaboration's channel.
 */
@Injectable()
export class AblyTokenService {
  private readonly logger = new Logger(AblyTokenService.name);
  private client: Ably.Rest | undefined;

  constructor(private readonly configService: ConfigService<AppConfig>) {}

  /**
   * ASM-P1-001: constructed lazily, not in the constructor. Ably.Rest
   * validates its key's format synchronously and throws if it is missing
   * or malformed; building it eagerly would crash the whole app's
   * bootstrap (this module is wired into AppModule unconditionally)
   * before a real ABLY_API_KEY exists.
   */
  private getClient(): Ably.Rest {
    if (!this.client) {
      const apiKey = this.configService.get('ably.apiKey', { infer: true });
      this.client = new Ably.Rest({ key: apiKey });
    }
    return this.client;
  }

  async createTokenForCollaboration(
    userId: string,
    collaborationId: string,
  ): Promise<Ably.TokenRequest> {
    try {
      return await this.getClient().auth.createTokenRequest({
        clientId: userId,
        ttl: TOKEN_TTL_MS,
        capability: JSON.stringify({
          [`collaboration:${collaborationId}`]: ['publish', 'subscribe'],
        }),
      });
    } catch {
      this.logger.error(
        `Failed to issue Ably token for collaboration ${collaborationId}`,
      );
      throw new ChatProviderError('Unable to issue a chat token');
    }
  }
}
