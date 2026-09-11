import { create } from 'zustand';
import type { UserRole } from '@ugcx/shared-types';

export interface SessionUser {
  id: string;
  role: UserRole;
}

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** True until TASK-P1-002's boot-time rehydration finishes. */
  isLoading: boolean;
  setSession: (session: { user: SessionUser; accessToken: string; refreshToken: string }) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
}

/**
 * TASK-P1-002: client-only session state. Tokens are mirrored to
 * expo-secure-store by useAuthSession/services/apiClient, never logged
 * (SEC-001). Server data (campaigns, proposals, etc.) never lives here —
 * that is TanStack Query's job (DES-P1-001).
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  setSession: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
  setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
  clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));
