/**
 * Splits pasted OTP text into an array of single digits up to length.
 */
export function splitPaste(raw: string, length: number): string[] {
  const digits = raw.replace(/\D/g, '').slice(0, length);
  return digits.split('');
}

/**
 * Clamps a range pair to ensure min <= low <= high <= max.
 */
export function clampRange(
  low: number,
  high: number,
  min: number,
  max: number,
): { low: number; high: number } {
  let safeLow = Math.max(min, Math.min(max, low));
  const safeHigh = Math.max(min, Math.min(max, high));

  if (safeLow > safeHigh) {
    safeLow = safeHigh;
  }

  return { low: safeLow, high: safeHigh };
}

export interface FileValidationOptions {
  maxBytes?: number;
  accept?: string[];
}

/** The three video types the API signs upload links for, by file extension. */
const VIDEO_TYPE_BY_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  webm: 'video/webm',
};

/**
 * Returns the upload content type for a video, or null when the API cannot take it.
 * iPhone Safari can report an empty type or `video/x-m4v`, so the file extension
 * decides when the reported type is not one of the three supported types.
 */
export function resolveVideoContentType(file: { type: string; name?: string }): string | null {
  const type = file.type.toLowerCase();
  if (type === 'video/mp4' || type === 'video/quicktime' || type === 'video/webm') return type;
  if (type === 'video/x-m4v') return 'video/mp4';
  const extension = file.name?.split('.').pop()?.toLowerCase() ?? '';
  return VIDEO_TYPE_BY_EXTENSION[extension] ?? null;
}

/**
 * Validates file size and type against constraints.
 */
export function validateFile(
  file: { size: number; type: string; name?: string },
  options: FileValidationOptions,
): { valid: boolean; error?: string } {
  const maxBytes = options.maxBytes ?? 250 * 1024 * 1024;
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      error: `This file is larger than ${maxMb} MB`,
    };
  }

  if (options.accept && options.accept.length > 0) {
    const acceptsType = (type: string) =>
      options.accept!.some((a) => {
        if (a.endsWith('/*')) {
          return type.startsWith(a.replace('/*', ''));
        }
        return type === a;
      });
    // A video with a missing or unusual type still passes when its extension maps to an accepted type.
    const videoType = resolveVideoContentType(file);
    const isAccepted = acceptsType(file.type) || (videoType !== null && acceptsType(videoType));

    if (!isAccepted) {
      return {
        valid: false,
        error: 'This file type is not supported',
      };
    }
  }

  return { valid: true };
}
