import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import type { RequestGenericUploadUrlRequest, RequestGenericUploadUrlResponse } from '@ugcx/shared-types';
import { apiPost } from '../../services/apiHelpers';

export function useRequestUploadUrl() {
  return useMutation({
    mutationFn: (dto: RequestGenericUploadUrlRequest) =>
      apiPost<RequestGenericUploadUrlResponse>('/storage/upload-url', dto),
  });
}

/**
 * Uploads a local file (e.g. from ImagePicker) directly to S3 via the presigned URL.
 * Bypasses the Axios client to stream the file natively using expo-file-system.
 * Supports progress callback for real percent updates.
 */
export async function uploadFileToPresignedUrl(
  localUri: string,
  presignedUrl: string,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (Platform.OS === 'web') {
    // For web, we must fetch the local blob and PUT it directly
    const res = await fetch(localUri);
    const blob = await res.blob();
    onProgress?.(50);
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
    });
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
    }
    onProgress?.(100);
    return;
  }

  // Use createUploadTask if available for progress updates
  if (typeof (FileSystem as any).createUploadTask === 'function') {
    const uploadTask = (FileSystem as any).createUploadTask(
      presignedUrl,
      localUri,
      {
        httpMethod: 'PUT',
        uploadType: (FileSystem.UploadType?.BINARY_CONTENT ?? 1) as any,
        headers: {
          'Content-Type': contentType,
        },
      },
      (data: { totalBytesSent: number; totalBytesExpectedToSend: number }) => {
        if (data.totalBytesExpectedToSend > 0) {
          const percent = Math.round((data.totalBytesSent / data.totalBytesExpectedToSend) * 100);
          onProgress?.(percent);
        }
      },
    );

    const result = await uploadTask.uploadAsync();
    if (!result || result.status < 200 || result.status >= 300) {
      throw new Error(`Upload failed with status ${result?.status ?? 'unknown'}: ${result?.body ?? ''}`);
    }
    onProgress?.(100);
    return;
  }

  const result = await FileSystem.uploadAsync(presignedUrl, localUri, {
    httpMethod: 'PUT',
    uploadType: (FileSystem.UploadType?.BINARY_CONTENT ?? 1) as any,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed with status ${result.status}: ${result.body}`);
  }
  onProgress?.(100);
}
