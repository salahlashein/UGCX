'use client';

import React from 'react';
import { spacing } from '../../../../theme/tokens';
import { ActionListCard } from './ActionListCard';
import { ShortcutTiles } from './ShortcutTiles';
import type { Locale } from '../../../../i18n';

export interface QuickActionGridProps {
  totalActionItems: number;
  proposalsAlert: number;
  deliverablesAlert: number;
  unfundedDrafts: Array<{ id: string; title: string }>;
  isViewer: boolean;
  canCreateBrief: boolean;
  canFundEscrow: boolean;
  canViewBilling: boolean;
  locale: Locale;
}

export function QuickActionGrid({
  totalActionItems,
  proposalsAlert,
  deliverablesAlert,
  unfundedDrafts,
  isViewer,
  canCreateBrief,
  canFundEscrow,
  canViewBilling,
  locale,
}: QuickActionGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
        gap: spacing.lg,
        alignItems: 'start',
      }}
      className="ugcx-action-grid"
    >
      <ActionListCard
        totalActionItems={totalActionItems}
        proposalsAlert={proposalsAlert}
        deliverablesAlert={deliverablesAlert}
        unfundedDrafts={unfundedDrafts}
        isViewer={isViewer}
        canFundEscrow={canFundEscrow}
        locale={locale}
      />
      <ShortcutTiles
        isViewer={isViewer}
        canCreateBrief={canCreateBrief}
        canViewBilling={canViewBilling}
        proposalsAlert={proposalsAlert}
        deliverablesAlert={deliverablesAlert}
        locale={locale}
      />
    </div>
  );
}
