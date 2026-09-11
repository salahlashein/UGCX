const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * A minimal base64url decoder with no dependency on a global `atob`
 * (not guaranteed present on Hermes) or Node's `Buffer` (not guaranteed
 * polyfilled). Only used to read the non-secret `role` claim out of the
 * access token payload for navigation (TASK-P1-002); the token itself is
 * never re-encoded or trusted for anything security-sensitive here — the
 * API is the source of truth for every authorization decision.
 */
function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of padded) {
    if (char === '=') break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export interface AccessTokenPayload {
  sub: string;
  role: 'brand' | 'creator' | 'admin';
}

/** Returns null on any malformed token instead of throwing. */
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = JSON.parse(base64UrlDecode(payload));
    if (typeof json.sub === 'string' && typeof json.role === 'string') {
      return { sub: json.sub, role: json.role };
    }
    return null;
  } catch {
    return null;
  }
}
