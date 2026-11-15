'use client';

import React from 'react';
import Link from 'next/link';
import { AppText, Button, Card, Icon } from '../components/ui';
import { colors, radius, spacing } from '../theme/tokens';
import { useTranslation } from '../i18n';

export default function NotFound() {
  const { locale } = useTranslation();
  const isAr = locale === 'ar';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.canvas,
        padding: spacing.xl,
      }}
    >
      <Card
        elevation="card"
        style={{
          maxWidth: 480,
          width: '100%',
          padding: spacing.xxl,
          borderRadius: radius.card,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.card,
            backgroundColor: colors.accentSoft,
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="search" size={28} />
        </div>

        <span
          style={{
            fontSize: 48,
            fontWeight: 500,
            fontFamily: 'var(--font-mono, monospace)',
            color: colors.primary,
            letterSpacing: -1,
          }}
        >
          404
        </span>

        <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
          {isAr ? 'الصفحة غير موجودة' : 'Page not found'}
        </AppText>

        <AppText variant="bodySmall" color={colors.textSecondary}>
          {isAr
            ? 'عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها.'
            : 'Sorry, we could not find the page you are looking for. It might have been moved or deleted.'}
        </AppText>

        <div style={{ marginTop: spacing.md }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              <span>{isAr ? 'العودة إلى الرئيسية' : 'Back to home'}</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
