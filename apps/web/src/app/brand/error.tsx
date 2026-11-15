'use client';

import React, { useEffect } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { ErrorState } from '../../components/ui';
import { useTranslation } from '../../i18n';

export default function BrandError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useTranslation();

  useEffect(() => {
    console.error('Brand segment error:', error);
  }, [error]);

  return (
    <AppShell requiredRole="brand">
      <div style={{ maxWidth: 540, margin: '60px auto' }}>
        <ErrorState
          title={locale === 'ar' ? 'حدث خطأ في تحميل الصفحة' : 'Failed to load page'}
          message={
            error.message ||
            (locale === 'ar'
              ? 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.'
              : 'An unexpected error occurred. Please try again.')
          }
          retryTitle={locale === 'ar' ? 'إعادة المحاولة' : 'Try again'}
          onRetry={reset}
        />
      </div>
    </AppShell>
  );
}
