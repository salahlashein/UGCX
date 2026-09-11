import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import type { RefreshRequest, TokenPairResponse } from '@ugcx/shared-types';
import { useAuthStore } from '../store/authStore';
import { clearSession, updateTokens } from '../store/sessionPersistence';
import { logger } from './logger';

const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'http://localhost:3000/api/v1';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

/** TASK-P1-001: the one Axios instance every hooks/api/* call goes through. */
export const apiClient = axios.create({ baseURL: API_BASE_URL });

// A separate instance (not `apiClient`, not the raw `axios` default) for
// the refresh call itself: reusing `apiClient` would recurse back into
// this same response interceptor if a refresh ever 401s; using the raw
// `axios` module directly is untestable in isolation from every other
// consumer of that module. This one is small, mockable on its own, and
// carries no interceptors of its own.
export const refreshClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => config.url?.includes(path));
  if (accessToken && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retried?: boolean;
  }
}

// REQ-002: concurrent 401s share one refresh call instead of each racing
// their own, and each retried request waits on the same promise.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const body: RefreshRequest = { refreshToken };
  const response = await refreshClient.post<{ data: TokenPairResponse }>('/auth/refresh', body);
  const tokens = response.data.data;
  await updateTokens(tokens);
  return tokens.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => original?.url?.includes(path));

    if (error.response?.status !== 401 || !original || original._retried || isAuthEndpoint) {
      throw error;
    }

    original._retried = true;
    try {
      refreshPromise ??= refreshAccessToken();
      const newAccessToken = await refreshPromise;
      refreshPromise = null;
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      refreshPromise = null;
      logger.warn('Silent token refresh failed; logging out');
      await clearSession();
      throw refreshError;
    }
  },
);
