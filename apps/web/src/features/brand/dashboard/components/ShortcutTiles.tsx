'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppText, Card, Icon, type IconName, Kbd } from '../../../../components/ui';
import { colors, radius, spacing } from '../../../../theme/tokens';
import type { Locale } from '../../../../i18n';

interface ShortcutTilesProps {
  isViewer: boolean;
  canCreateBrief: boolean;
  canViewBilling: boolean;
  proposalsAlert: number;
  deliverablesAlert: number;
  locale: Locale;
}

function Tile({
  icon,
  label,
  kbd,
  badge,
  onClick,
}: {
  icon: IconName;
  label: string;
  kbd: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <Card elevation="card" style={{ padding: spacing.md, borderRadius: radius.card, cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.chip,
            backgroundColor: colors.accentSoft,
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={18} />
        </div>
        {badge && badge > 0 ? (
          <span
            style={{
              backgroundColor: colors.danger,
              color: '#fff',
              borderRadius: radius.badge,
              padding: '0 6px',
              fontSize: 11,
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 500,
            }}
          >
            {badge}
          </span>
        ) : (
          <Kbd>{kbd}</Kbd>
        )}
      </div>
      <AppText variant="bodySmall" style={{ fontWeight: 500, color: colors.textPrimary }}>
        {label}
      </AppText>
    </Card>
  );
}

export function ShortcutTiles({
  isViewer,
  canCreateBrief,
  canViewBilling,
  proposalsAlert,
  deliverablesAlert,
  locale,
}: ShortcutTilesProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md }}>
      {!isViewer && canCreateBrief && (
        <Tile icon="plus" label={isAr ? 'بريف جديد' : 'New brief'} kbd="N" onClick={() => router.push('/brand/briefs/new')} />
      )}
      <Tile
        icon="inbox"
        label={isAr ? 'العروض' : 'Proposals'}
        kbd="P"
        badge={proposalsAlert}
        onClick={() => router.push('/brand/proposals')}
      />
      <Tile
        icon="video"
        label={isAr ? 'مراجعة المخرجات' : 'Review'}
        kbd="R"
        badge={deliverablesAlert}
        onClick={() => router.push('/brand/briefs')}
      />
      {canViewBilling && (
        <Tile
          icon="credit-card"
          label={isAr ? 'المحفظة والفواتير' : 'Wallet'}
          kbd="W"
          onClick={() => router.push('/brand/billing')}
        />
      )}
    </div>
  );
}
