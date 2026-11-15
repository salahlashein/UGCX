'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { AppText } from './AppText';

export interface KpiCellItem {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'primary' | 'ink' | 'muted' | 'danger';
}

export interface KpiCellsProps {
  items?: KpiCellItem[];
  cells?: KpiCellItem[];
  /** Cap the columns on a wide screen. The default is 4. */
  maxColumns?: number;
  className?: string;
}

/**
 * A dashed grid of labelled numbers.
 *
 * The column count follows the number of items, so three items never leave a
 * fourth cell empty.
 */
export function KpiCells({ items, cells, maxColumns = 4, className = '' }: KpiCellsProps) {
  const list = items ?? cells ?? [];
  if (list.length === 0) return null;

  const columns = Math.max(1, Math.min(list.length, maxColumns));
  const rows = Math.ceil(list.length / columns);

  return (
    <div
      className={`w-full overflow-hidden ugcx-kpi-cells ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        border: `1px dashed ${colors.dashLine}`,
        borderRadius: `${radius.card}px`,
        backgroundColor: colors.surface,
      }}
    >
      {list.map((item, idx) => {
        const column = idx % columns;
        const row = Math.floor(idx / columns);
        const isLastColumn = column === columns - 1;
        const isLastRow = row === rows - 1;

        return (
          <div
            key={idx}
            className="flex flex-col gap-1 p-4"
            style={{
              minWidth: 0,
              borderInlineEnd: isLastColumn ? undefined : `1px dashed ${colors.dashLine}`,
              borderBottom: isLastRow ? undefined : `1px dashed ${colors.dashLine}`,
            }}
          >
            <span
              className="mono-caps"
              data-mono-caps="true"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                lineHeight: '14px',
                fontWeight: 500,
                letterSpacing: '0.6px',
                color: colors.muted,
                textTransform: 'uppercase',
                // A long label wraps inside its own cell instead of painting
                // over the cell beside it.
                overflowWrap: 'anywhere',
                minWidth: 0,
              }}
            >
              {item.label}
            </span>
            <div
              className="ltr-num"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '24px',
                lineHeight: '30px',
                fontWeight: 500,
                minWidth: 0,
                overflowWrap: 'anywhere',
                color:
                  item.tone === 'primary'
                    ? colors.primary
                    : item.tone === 'danger'
                      ? colors.danger
                      : item.tone === 'muted'
                        ? colors.muted
                        : colors.ink,
              }}
            >
              {item.value}
            </div>
            {item.hint ? (
              <AppText variant="caption" color="muted">
                {item.hint}
              </AppText>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
