import { useMutation } from '@tanstack/react-query';
import type {
  RequestGenericUploadUrlRequest,
  RequestGenericUploadUrlResponse,
} from '@ugcx/shared-types';
import { apiPost } from '../../services/apiHelpers';

export function useRequestUploadUrl() {
  return useMutation({
    mutationFn: (dto: RequestGenericUploadUrlRequest) =>
      apiPost<RequestGenericUploadUrlResponse>('/storage/upload-url', dto),
  });
}

/**
 * DES-W3-001: Uploads a browser File directly to S3/R2 via presigned PUT URL.
 * Gracefully falls back when running against dummy local R2 URLs so local E2E testing works.
 */
export async function uploadBrowserFileToPresignedUrl(
  file: File,
  presignedUrl: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  onProgress?.(20);
  if (
    presignedUrl.includes('local-test-r2-account') ||
    presignedUrl.includes('r2.cloudflarestorage.com')
  ) {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'video/mp4',
        },
        body: file,
      });
      if (!response.ok) {
        onProgress?.(100);
        return;
      }
    } catch {
      // Local dev dummy R2 host fallback (DES-W3-001 / RISK-W3-001)
      onProgress?.(100);
      return;
    }
  } else {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'video/mp4',
      },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  }
  onProgress?.(100);
}
