import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { hydrateSession } from '../store/sessionPersistence';

/**
 * TASK-P1-002: runs boot-time session rehydration once and exposes the
 * session slice navigators use to pick a stack (REQ-001, REQ-003).
 */
export function useAuthSession() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    hydrateSession();
  }, []);

  return { user, isLoading };
}
