'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Creator } from '@ugcx/shared-types';
import { AppText, Button, Icon, StatusBadge } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import { formatDateShort, getInitials } from '../../../../utils/format';
import type { Locale } from '../../../../i18n';

interface CreatorHomeHeaderProps {
  creator?: Creator | null;
  unreadCount: number;
  locale: Locale;
}

export function CreatorHomeHeader({ creator, unreadCount, locale }: CreatorHomeHeaderProps) {
  const router = useRouter();
  const isAr = locale === 'ar';
  const todayFormatted = formatDateShort(new Date().toISOString(), locale);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: spacing.md,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.card,
            backgroundColor: colors.accentSoft,
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 500,
            fontSize: 18,
          }}
        >
          {getInitials(creator?.displayName, 'CR')}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
              {creator?.displayName || (isAr ? 'صانع المحتوى' : 'Creator')}
            </AppText>
            {creator?.vettingStatus && (
              <StatusBadge status={creator.vettingStatus} domain="custom" />
            )}
          </div>
          <AppText variant="caption" color={colors.textSecondary}>
            {todayFormatted} · {creator?.city || (isAr ? 'مصر' : 'Egypt')}
          </AppText>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <button
          type="button"
          onClick={() => router.push('/notifications')}
          style={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: radius.button,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textPrimary,
            cursor: 'pointer',
          }}
          aria-label={isAr ? 'الإشعارات' : 'Notifications'}
        >
          <Icon name="bell" size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                insetInlineEnd: -4,
                backgroundColor: colors.danger,
                color: '#fff',
                fontSize: 10,
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 500,
                padding: '1px 5px',
                borderRadius: radius.badge,
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <Button variant="primary" onClick={() => router.push('/creator/discover')}>
          <Icon name="compass" size={16} />
          <span>{isAr ? 'استكشاف البريفات' : 'Discover briefs'}</span>
        </Button>
      </div>
    </div>
  );
}
