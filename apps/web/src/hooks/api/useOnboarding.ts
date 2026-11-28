import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OnboardingInsights, OnboardingStatus } from '@ugcx/shared-types';
import { apiGet, apiPost } from '../../services/apiHelpers';
import { queryKeys } from '../../services/queryKeys';
import { useAuthStore } from '../../store/authStore';

/**
 * Which onboarding flow the user gets, and what they already saved.
 * The cache key holds the user id. Logout keeps the query cache, so a
 * shared key would give the next account in this tab the old answer.
 */
export function useOnboardingStatus(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.onboarding.status(userId),
    queryFn: () => apiGet<OnboardingStatus>('/onboarding/status'),
    enabled: enabled && Boolean(userId),
    // The flag only changes when the user finishes onboarding, which updates this cache.
    staleTime: Infinity,
    retry: 1,
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: () => apiPost<OnboardingStatus>('/onboarding/complete', {}),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.onboarding.status(userId), data),
  });
}

/** Creator and brief counts per niche, and the usual price band, for the onboarding tiles. */
export function useOnboardingInsights(city?: string) {
  return useQuery({
    queryKey: queryKeys.onboarding.insights(city),
    queryFn: () =>
      apiGet<OnboardingInsights>(
        city ? `/onboarding/insights?city=${encodeURIComponent(city)}` : '/onboarding/insights',
      ),
    staleTime: 5 * 60 * 1000,
  });
}
