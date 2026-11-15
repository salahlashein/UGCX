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

/**
 * Validates file size and type against constraints.
 */
export function validateFile(
  file: { size: number; type: string },
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
    const isAccepted = options.accept.some((a) => {
      if (a.endsWith('/*')) {
        const prefix = a.replace('/*', '');
        return file.type.startsWith(prefix);
      }
      return file.type === a;
    });

    if (!isAccepted) {
      return {
        valid: false,
        error: 'This file type is not supported',
      };
    }
  }

  return { valid: true };
}
