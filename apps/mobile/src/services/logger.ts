/**
 * Single wrapper around console so call sites can be swapped for a
 * crash-reporting SDK later without touching every call site (Code
 * Guidelines, `clean-code`). Never logs token values (SEC-001).
 */
export const logger = {
  debug: (message: string, ...args: unknown[]): void => {
    if (__DEV__) {
      console.debug(`[UGCX] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]): void => {
    console.log(`[UGCX] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[UGCX] ${message}`, ...args);
  },
  error: (message: string, error?: unknown): void => {
    console.error(`[UGCX] ${message}`, error);
  },
};
