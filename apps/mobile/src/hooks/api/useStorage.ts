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
 */
export async function uploadFileToPresignedUrl(
  localUri: string,
  presignedUrl: string,
  contentType: string,
): Promise<void> {
  // DEV-ONLY: If we are pointing to the mock local-test-r2-account which doesn't actually exist
  // in DNS, we bypass the actual upload so the user can continue testing the flow.
  if (presignedUrl.includes('local-test-r2-account')) {
    console.log('Skipping actual upload because S3 is mocked locally', presignedUrl);
    // Simulate a network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  }

  if (Platform.OS === 'web') {
    // For web, we must fetch the local blob and PUT it directly
    const res = await fetch(localUri);
    const blob = await res.blob();
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
    return;
  }

  const result = await FileSystem.uploadAsync(presignedUrl, localUri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.UploadType.BINARY_CONTENT as any,
    headers: {
      'Content-Type': contentType,
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed with status ${result.status}: ${result.body}`);
  }
}
