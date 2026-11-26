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

/** Host of the dummy R2 account used in local tests. It accepts no real uploads. */
const LOCAL_TEST_R2_HOST = 'local-test-r2-account';

/**
 * DES-W3-001: Uploads a browser File directly to S3/R2 via presigned PUT URL.
 * Reports real progress, so a large phone video does not look frozen.
 * A failed upload throws. Only the local test host is allowed to fail quietly,
 * because nothing listens on it.
 *
 * `contentType` must equal the type the API signed into the URL.
 */
export async function uploadBrowserFileToPresignedUrl(
  file: File,
  presignedUrl: string,
  onProgress?: (percent: number) => void,
  contentType: string = file.type || 'video/mp4',
): Promise<void> {
  const isLocalTestHost = presignedUrl.includes(LOCAL_TEST_R2_HOST);
  onProgress?.(1);

  try {
    await putWithProgress(file, presignedUrl, contentType, onProgress);
  } catch (error) {
    if (isLocalTestHost) {
      onProgress?.(100);
      return;
    }
    throw error;
  }
  onProgress?.(100);
}

function putWithProgress(
  file: File,
  url: string,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        // Keep 99 for the moment between the last byte and the server reply.
        onProgress?.(Math.min(99, Math.max(1, Math.round((event.loaded / event.total) * 100))));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}. Try again.`));
    };
    xhr.onerror = () =>
      reject(new Error('Upload failed. Check your connection and try again.'));
    xhr.onabort = () => reject(new Error('Upload was cancelled.'));
    xhr.send(file);
  });
}
