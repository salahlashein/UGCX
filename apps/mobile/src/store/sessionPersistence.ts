import { getItem, removeItem, setItem, StorageKeys } from '../services/secureStorage';
import { decodeAccessToken } from '../services/jwt';
import { logger } from '../services/logger';
import { useAuthStore, type SessionUser } from './authStore';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function buildUser(accessToken: string, fallback?: SessionUser): SessionUser | null {
  const payload = decodeAccessToken(accessToken);
  if (payload) {
    return { id: payload.sub, role: payload.role };
  }
  return fallback ?? null;
}

/**
 * TASK-P1-002: persists tokens to expo-secure-store (SEC-001) and updates
 * the in-memory Zustand store together, so the two never drift apart.
 * `user` is optional because register/login only return tokens on the
 * wire (except register's response, which already carries userId/role) —
 * the role is otherwise read from the access token's own payload.
 */
export async function saveSession(tokens: TokenPair, user?: SessionUser): Promise<void> {
  const resolvedUser = user ?? buildUser(tokens.accessToken);
  if (!resolvedUser) {
    throw new Error('Could not resolve the signed-in user from the access token');
  }

  await setItem(StorageKeys.ACCESS_TOKEN, tokens.accessToken);
  await setItem(StorageKeys.REFRESH_TOKEN, tokens.refreshToken);
  await setItem(StorageKeys.SESSION_USER, JSON.stringify(resolvedUser));
  useAuthStore.getState().setSession({ ...tokens, user: resolvedUser });
}

/** Used after TASK-P1-001's silent refresh; the user's identity does not change. */
export async function updateTokens(tokens: TokenPair): Promise<void> {
  await setItem(StorageKeys.ACCESS_TOKEN, tokens.accessToken);
  await setItem(StorageKeys.REFRESH_TOKEN, tokens.refreshToken);
  useAuthStore.getState().setTokens(tokens);
}

export async function clearSession(): Promise<void> {
  await removeItem(StorageKeys.ACCESS_TOKEN);
  await removeItem(StorageKeys.REFRESH_TOKEN);
  await removeItem(StorageKeys.SESSION_USER);
  useAuthStore.getState().clearSession();
}

/** Boot-time rehydration (TASK-P1-002); never throws. */
export async function hydrateSession(): Promise<void> {
  try {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      getItem(StorageKeys.ACCESS_TOKEN),
      getItem(StorageKeys.REFRESH_TOKEN),
      getItem(StorageKeys.SESSION_USER),
    ]);

    if (accessToken && refreshToken) {
      const storedUser = userJson ? (JSON.parse(userJson) as SessionUser) : undefined;
      const user = buildUser(accessToken, storedUser);
      if (user) {
        useAuthStore.getState().setSession({ user, accessToken, refreshToken });
      }
    }
  } catch (error) {
    logger.error('Failed to rehydrate session', error);
  } finally {
    useAuthStore.getState().setLoading(false);
  }
}
