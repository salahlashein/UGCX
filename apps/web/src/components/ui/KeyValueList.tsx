'use client';

import React from 'react';
import { colors } from '../../theme/tokens';
import { AppText } from './AppText';
import { useTranslation } from '../../i18n';

export type KeyValueItem =
  [string, React.ReactNode] | { key?: string; label?: string; value: React.ReactNode };

export interface KeyValueListProps {
  items: KeyValueItem[];
  className?: string;
  style?: React.CSSProperties;
}

export function KeyValueList({ items, className = '', style }: KeyValueListProps) {
  const { locale } = useTranslation();
  const isAr = locale === 'ar';

  const normalized = items.map((item) =>
    Array.isArray(item) ? item : [item.key ?? item.label ?? '', item.value],
  ) as Array<[string, React.ReactNode]>;

  return (
    <div className={`flex flex-col w-full ${className}`} style={style}>
      {normalized.map(([key, value], idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 py-2.5"
          style={{
            borderBottom: idx < normalized.length - 1 ? `1px dashed ${colors.dashLine}` : undefined,
          }}
        >
          <span
            className="mono-caps shrink-0"
            data-mono-caps="true"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.6px',
              color: colors.muted,
              textTransform: 'uppercase',
            }}
          >
            {key}
          </span>
          <div
            style={{
              textAlign: isAr ? 'left' : 'right',
              minWidth: 0,
            }}
          >
            {typeof value === 'string' || typeof value === 'number' ? (
              <AppText variant="body" color="ink" style={{ fontWeight: 500 }}>
                {value}
              </AppText>
            ) : (
              value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
