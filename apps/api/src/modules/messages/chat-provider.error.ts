/** Thrown by AblyTokenService when Ably token issuance fails (GEN-08). */
export class ChatProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatProviderError';
  }
}
