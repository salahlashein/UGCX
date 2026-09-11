import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * SEC-001: the only place tokens are persisted. Never logs a token value.
 *
 * expo-secure-store has no Keychain/Keystore equivalent on web, so
 * getItemAsync/setItemAsync/deleteItemAsync throw there. Web has no
 * secure-storage primitive at all, so this falls back to localStorage
 * for local browser testing only - it is NOT a secure substitute and
 * must not be relied on for a real web deployment.
 */
export const StorageKeys = {
  ACCESS_TOKEN: 'ugcx.accessToken',
  REFRESH_TOKEN: 'ugcx.refreshToken',
  SESSION_USER: 'ugcx.sessionUser',
  LOCALE: 'ugcx.locale',
} as const;

const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
