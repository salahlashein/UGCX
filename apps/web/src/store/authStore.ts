'use client';

import { create } from 'zustand';
import type { UserRole } from '@ugcx/shared-types';

export interface AuthUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  locale?: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokensFromResponse: (payload: {
    accessToken: string;
    refreshToken: string;
    userId?: string;
    role?: UserRole;
    email?: string | null;
    phone?: string | null;
  }) => AuthUser;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = 'ugcx_auth_session';
export const SESSION_COOKIE = 'ugcx_session';

export function setSessionCookie(user: AuthUser | null, token: string | null) {
  if (typeof document === 'undefined') return;
  if (!user || !token) {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  const payload = JSON.stringify({ token, role: user.role, userId: user.id });
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(payload)}; path=/; max-age=2592000; SameSite=Lax`;
}

export function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function decodeJwtPayload(token: string): { sub?: string; role?: UserRole } {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof window !== 'undefined'
        ? window.atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json) as { sub?: string; role?: UserRole };
  } catch {
    return {};
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken, refreshToken }));
      setSessionCookie(user, accessToken);
    }
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setTokensFromResponse: ({ accessToken, refreshToken, userId, role, email, phone }) => {
    const decoded = decodeJwtPayload(accessToken);
    const resolvedUser: AuthUser = {
      id: userId ?? decoded.sub ?? 'unknown',
      role: role ?? decoded.role ?? 'creator',
      email: email ?? null,
      phone: phone ?? null,
    };
    get().setAuth(resolvedUser, accessToken, refreshToken);
    return resolvedUser;
  },

  updateTokens: (accessToken, refreshToken) => {
    const current = get().user;
    const decoded = decodeJwtPayload(accessToken);
    const updatedUser: AuthUser | null = current
      ? {
          ...current,
          id: current.id || decoded.sub || 'unknown',
          role: current.role || decoded.role || 'creator',
        }
      : decoded.sub && decoded.role
        ? { id: decoded.sub, role: decoded.role }
        : null;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: updatedUser, accessToken, refreshToken }),
      );
      setSessionCookie(updatedUser, accessToken);
    }
    set({
      user: updatedUser,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken && updatedUser),
    });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    const { accessToken, refreshToken } = get();
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user: updated, accessToken, refreshToken }),
      );
      setSessionCookie(updated, accessToken);
    }
    set({ user: updated });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      clearSessionCookie();
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  hydrate: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ isLoading: false });
        return;
      }
      const parsed = JSON.parse(raw) as {
        user?: AuthUser | null;
        accessToken?: string | null;
        refreshToken?: string | null;
      };
      if (parsed.accessToken && parsed.user) {
        setSessionCookie(parsed.user, parsed.accessToken);
        set({
          user: parsed.user,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken ?? null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
