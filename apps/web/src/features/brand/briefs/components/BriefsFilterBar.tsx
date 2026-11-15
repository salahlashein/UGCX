'use client';

import React, { useRef } from 'react';
import { FilterChip, Kbd, TextInput } from '../../../../components/ui';
import { spacing } from '../../../../theme/tokens';
import { useKeyboardShortcut } from '../../../../hooks/useKeyboardShortcut';
import type { BriefStatusFilter } from '../../../../hooks/api/useCampaigns';
import type { Locale } from '../../../../i18n';

interface BriefsFilterBarProps {
  filter: BriefStatusFilter;
  counts: { all: number; draft: number; open: number; completed: number };
  searchQuery: string;
  onFilterChange: (filter: BriefStatusFilter) => void;
  onSearchChange: (search: string) => void;
  locale: Locale;
}

export function BriefsFilterBar({
  filter,
  counts,
  searchQuery,
  onFilterChange,
  onSearchChange,
  locale,
}: BriefsFilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isAr = locale === 'ar';

  useKeyboardShortcut('/', (e) => {
    e.preventDefault();
    searchInputRef.current?.focus();
  });

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
        <FilterChip
          label={`${isAr ? 'الكل' : 'All'} (${counts.all})`}
          selected={filter === 'all'}
          onClick={() => onFilterChange('all')}
        />
        <FilterChip
          label={`${isAr ? 'نشطة' : 'Open'} (${counts.open})`}
          selected={filter === 'open'}
          onClick={() => onFilterChange('open')}
        />
        <FilterChip
          label={`${isAr ? 'مسودات' : 'Draft'} (${counts.draft})`}
          selected={filter === 'draft'}
          onClick={() => onFilterChange('draft')}
        />
        <FilterChip
          label={`${isAr ? 'مكتملة' : 'Completed'} (${counts.completed})`}
          selected={filter === 'completed'}
          onClick={() => onFilterChange('completed')}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          width: '100%',
          maxWidth: 280,
        }}
      >
        <div style={{ flex: 1 }}>
          <TextInput
            ref={searchInputRef}
            placeholder={isAr ? 'بحث في البريفات...' : 'Search briefs...'}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </div>
        <Kbd>/</Kbd>
      </div>
    </div>
  );
}
