import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setSessionCookie, clearSessionCookie, SESSION_COOKIE } from '../store/authStore';

describe('Edge Middleware & Session Cookie Suite (TASK-WAR5-001, 002)', () => {
  beforeEach(() => {
    // Reset simulated document cookie if running in Node
    (globalThis as any).document = {
      cookie: '',
    };
  });

  it('synchronizes session to ugcx_session cookie on setSessionCookie', () => {
    const user = { id: 'usr-123', role: 'brand' as const };
    const token = 'jwt-mock-token-abc';

    setSessionCookie(user, token);

    const cookieStr = (globalThis as any).document.cookie;
    assert.ok(cookieStr.includes(`${SESSION_COOKIE}=`));

    const encodedValue = cookieStr.split(';')[0].split('=')[1];
    const parsed = JSON.parse(decodeURIComponent(encodedValue));

    assert.equal(parsed.token, token);
    assert.equal(parsed.role, 'brand');
    assert.equal(parsed.userId, 'usr-123');
  });

  it('clears ugcx_session cookie on clearSessionCookie', () => {
    (globalThis as any).document.cookie = `${SESSION_COOKIE}=some-val; path=/`;

    clearSessionCookie();

    const cookieStr = (globalThis as any).document.cookie;
    assert.ok(cookieStr.includes(`${SESSION_COOKIE}=;`));
    assert.ok(cookieStr.includes('max-age=0'));
  });

  it('parses JSON payload from encoded cookie string', () => {
    const payload = { token: 'tok-999', role: 'creator', userId: 'cr-456' };
    const raw = encodeURIComponent(JSON.stringify(payload));

    const decoded = JSON.parse(decodeURIComponent(raw));
    assert.equal(decoded.token, 'tok-999');
    assert.equal(decoded.role, 'creator');
    assert.equal(decoded.userId, 'cr-456');
  });

  it('parses raw JWT payload from token string', () => {
    const jwtPayload = { sub: 'usr-789', role: 'brand' };
    const b64 = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
    const rawToken = `header.${b64}.signature`;

    const parts = rawToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    assert.equal(decodedPayload.sub, 'usr-789');
    assert.equal(decodedPayload.role, 'brand');
  });
});
