'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStatus } from '../../hooks/api/useOnboarding';
import { ErrorState, LoadingState } from '../../components/ui/AsyncStates';
import {
  BrandMemberFlow,
  BrandOwnerFlow,
  CreatorFlow,
} from '../../components/onboarding/OnboardingFlows';
import { extractErrorMessage } from '../../services/apiHelpers';
import { useTranslation } from '../../i18n';

function homeFor(role: string | undefined): string {
  if (role === 'brand') return '/brand/dashboard';
  if (role === 'admin') return '/admin';
  return '/creator/home';
}

/**
 * First sign-up onboarding. Only a user whose onboarding flag is empty stays
 * here. Everyone else goes to their home screen.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const statusQuery = useOnboardingStatus(Boolean(isAuthenticated && user));
  const status = statusQuery.data;
  // True once this visit shows the flow. The last step marks onboarding
  // complete, and the user must still see the final screen after that.
  const [inFlow, setInFlow] = useState(false);

  useEffect(() => {
    if (status && !status.completed) setInFlow(true);
  }, [status]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (status?.completed && !inFlow) router.replace(homeFor(user.role));
  }, [isLoading, isAuthenticated, user, status, inFlow, router]);

  if (statusQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState
          title={t('onboarding.loadErrorTitle', 'We could not load your setup')}
          message={extractErrorMessage(statusQuery.error)}
          onRetry={() => statusQuery.refetch()}
        />
      </div>
    );
  }

  if (isLoading || !user || !status || (status.completed && !inFlow)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (status.kind === 'creator') return <CreatorFlow status={status} />;
  if (status.kind === 'brand_member') return <BrandMemberFlow status={status} />;
  return <BrandOwnerFlow status={status} />;
}
