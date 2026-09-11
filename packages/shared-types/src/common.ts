// Shared response envelope shapes, mirroring the api-patterns skill and
// AllExceptionsFilter in apps/api. Not part of the plan's explicit file
// list, but every other file here depends on it, so it lives in the
// barrel's shared primitives rather than being duplicated six times.

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface PaginationLinks {
  self: string;
  next: string | null;
  last: string;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type Niche =
  'beauty_personal_care' | 'fashion' | 'mom_baby' | 'food_fmcg' | 'home_lifestyle' | 'other';

export type Language = 'ar' | 'en';
