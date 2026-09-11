/**
 * TASK-P1-010/REQ-006. Mirrors the escrow/payments plan's presigned-URL
 * allow-list (apps/api ALLOWED_UPLOAD_CONTENT_TYPES) so an unsupported
 * file is rejected client-side before a presigned URL is even requested.
 * No server-side max size is defined in that plan; 200MB is a provisional
 * client-side guard against an obviously-oversized upload on a mobile
 * network, not a value mirrored from the API.
 */
export const ALLOWED_CONTENT_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

export interface LocalFile {
  uri: string;
  contentType: string;
  sizeBytes: number | null;
}

export function validateFile(file: LocalFile): string | null {
  if (!ALLOWED_CONTENT_TYPES.includes(file.contentType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    return 'creator.upload.unsupportedType';
  }
  if (file.sizeBytes != null && file.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    return 'creator.upload.fileTooLarge';
  }
  return null;
}

/**
 * FUN-01: resolves once the PUT itself succeeds, rejects otherwise — no
 * partial side effect. The caller (DeliverableUploadScreen) only calls
 * the register-deliverable endpoint after this promise resolves
 * (EDGE-P1-001), never before.
 */
export function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: LocalFile,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed'));

    // React Native's XHR polyfill treats a { uri, type, name } object as
    // the file's binary content (no FormData/multipart wrapper needed for
    // a raw presigned PUT) — a RN-specific shape the DOM lib's XHR types
    // don't know about, hence the cast.
    xhr.send({
      uri: file.uri,
      type: file.contentType,
      name: 'deliverable',
    } as unknown as XMLHttpRequestBodyInit);
  });
}
