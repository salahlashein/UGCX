'use client';

import React from 'react';
import { Card, DataTable } from '../../../../components/ui';
import { radius, spacing } from '../../../../theme/tokens';
import type { BriefListItem } from '../../../../hooks/api/useCampaigns';
import { useBriefsColumns } from './useBriefsColumns';
import type { Locale } from '../../../../i18n';

export interface BriefsDataTableProps {
  briefs: BriefListItem[];
  locale: Locale;
  onRowClick: (brief: BriefListItem) => void;
}

export function BriefsDataTable({ briefs, locale, onRowClick }: BriefsDataTableProps) {
  const columns = useBriefsColumns(locale);

  return (
    <Card elevation="card" style={{ padding: spacing.md, borderRadius: radius.card }}>
      <DataTable<BriefListItem>
        columns={columns}
        data={briefs}
        keyExtractor={(b) => b.id}
        onRowClick={onRowClick}
      />
    </Card>
  );
}
