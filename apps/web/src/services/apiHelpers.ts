import type { AxiosError, AxiosRequestConfig } from 'axios';
import type { ApiErrorResponse, ApiPaginatedResponse } from '@ugcx/shared-types';
import { apiClient } from './apiClient';

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<{ data: T }>(url, config);
  return res.data.data;
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await apiClient.post<{ data: T }>(url, body);
  return res.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const res = await apiClient.patch<{ data: T }>(url, body);
  return res.data.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const res = await apiClient.put<{ data: T }>(url, body);
  return res.data.data;
}

export async function apiDelete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.delete<{ data: T }>(url, config);
  return res.data?.data as T;
}

export async function apiPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<ApiPaginatedResponse<T>> {
  const res = await apiClient.get<ApiPaginatedResponse<T>>(url, { params });
  return res.data;
}

export function extractErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!err) return fallback;
  const axiosErr = err as AxiosError<
    ApiErrorResponse & { message?: string | string[]; error?: string | { message?: string } }
  >;
  const data = axiosErr?.response?.data;
  if (data) {
    if (typeof data.error === 'object' && data.error?.message) {
      if (Array.isArray(data.error.details) && data.error.details.length > 0) {
        return data.error.details.map((d) => d.message).join('. ');
      }
      return data.error.message;
    }
    if (Array.isArray(data.message)) {
      return data.message.join('. ');
    }
    if (typeof data.message === 'string') {
      return data.message;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}
