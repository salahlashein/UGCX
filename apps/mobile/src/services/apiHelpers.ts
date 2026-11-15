import type { AxiosRequestConfig } from 'axios';
import type { ApiPaginatedResponse } from '@ugcx/shared-types';
import { apiClient } from './apiClient';

/** Thin unwrap helpers so hooks/api/* never repeat `res.data.data` (FUN-01: no side effects, pure mapping). */

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
