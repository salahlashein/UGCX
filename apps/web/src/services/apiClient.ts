import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { RefreshRequest, TokenPairResponse } from '@ugcx/shared-types';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/v1';

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/otp/send',
  '/auth/otp/verify',
];

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const refreshClient = axios.create({
  baseURL: API_BASE_URL,
});

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

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, updateTokens } = useAuthStore.getState();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const body: RefreshRequest = { refreshToken };
  const response = await refreshClient.post<{ data: TokenPairResponse }>('/auth/refresh', body);
  const tokens = response.data.data;
  updateTokens(tokens.accessToken, tokens.refreshToken);
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
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw refreshError;
    }
  },
);
