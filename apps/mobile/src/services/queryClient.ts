import { QueryClient } from '@tanstack/react-query';

/** CON-P1-001: default retry/backoff absorbs brief drops; no offline queue in Phase 1. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});
