import { AxiosError } from 'axios';
import type { ApiErrorDetail, ApiErrorResponse } from '@ugcx/shared-types';
import i18n from '../i18n';

export interface ParsedApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

/**
 * REQ-004: surfaces field-level `details` from a 422 when the API sends
 * them. The API's own error `message` is server-authored English text
 * (the backend does not localize it) and is shown as-is, matching how
 * every other Influee-style marketplace API's error text renders — full
 * client-side translation of arbitrary server strings is out of scope for
 * this plan. Generic/network fallbacks use the app's own translated copy.
 */
export function parseApiError(error: unknown): ParsedApiError {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorResponse | undefined;
    if (body?.error) {
      return {
        code: body.error.code,
        message: body.error.message,
        details: body.error.details,
      };
    }
    if (error.code === 'ERR_NETWORK') {
      return { code: 'network_error', message: i18n.t('errors.network') };
    }
  }
  return { code: 'unknown_error', message: i18n.t('common.error.generic') };
}
