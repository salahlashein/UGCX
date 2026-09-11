import MockAdapter from 'axios-mock-adapter';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'http://localhost:3000/api/v1' } } },
}));

import { apiClient, refreshClient } from './apiClient';
import { useAuthStore } from '../store/authStore';
import { saveSession, clearSession } from '../store/sessionPersistence';

// A valid-shaped JWT (header.payload.signature) whose payload decodes to
// { sub: 'user-1', role: 'brand' } — decodeAccessToken only reads this
// claim, it never verifies the signature (the API is the source of truth
// for that), so a fixture value here is safe and sufficient.
const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEiLCJyb2xlIjoiYnJhbmQifQ.sig';

describe('apiClient (TASK-P1-001, REQ-002 silent refresh)', () => {
  let mock: MockAdapter;
  let refreshMock: MockAdapter;

  beforeEach(async () => {
    mock = new MockAdapter(apiClient);
    refreshMock = new MockAdapter(refreshClient);
    await saveSession({ accessToken: FAKE_JWT, refreshToken: 'refresh-token' });
  });

  afterEach(async () => {
    mock.restore();
    refreshMock.restore();
    await clearSession();
  });

  it('retries the original request once after a silent refresh succeeds', async () => {
    mock.onGet('/campaigns/mine').replyOnce(401).onGet('/campaigns/mine').reply(200, { data: [] });
    refreshMock.onPost('/auth/refresh').reply(200, {
      data: { accessToken: FAKE_JWT, refreshToken: 'new-refresh-token' },
    });

    const response = await apiClient.get('/campaigns/mine');

    expect(response.status).toBe(200);
    expect(useAuthStore.getState().accessToken).toBe(FAKE_JWT);
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh-token');
  });

  it('clears the session when the refresh itself fails', async () => {
    mock.onGet('/campaigns/mine').reply(401);
    refreshMock.onPost('/auth/refresh').reply(401);

    await expect(apiClient.get('/campaigns/mine')).rejects.toBeTruthy();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('attaches the stored access token to an authenticated request', async () => {
    mock.onGet('/brands/me').reply((config) => {
      expect(config.headers?.Authorization).toBe(`Bearer ${FAKE_JWT}`);
      return [200, { data: {} }];
    });

    await apiClient.get('/brands/me');
  });
});
