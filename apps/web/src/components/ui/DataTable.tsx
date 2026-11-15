'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { AppText } from './AppText';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'start' | 'end';
  render: (row: T) => React.ReactNode;
  mobileLabel?: string;
  hideOnMobile?: boolean;
}

export type DataTableColumn<T> = Column<T>;

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows?: T[];
  data?: T[];
  rowKey?: (row: T) => string;
  keyExtractor?: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  minWidth?: number;
}

export function DataTable<T>({
  columns,
  rows,
  data,
  rowKey,
  keyExtractor,
  onRowClick,
  emptyState,
  minWidth = 600,
}: DataTableProps<T>) {
  const tableRows = rows ?? data ?? [];
  const getRowKey = rowKey ?? keyExtractor ?? ((r: any) => r.id ?? String(r));

  if (tableRows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block w-full min-w-0 max-w-full overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${minWidth}px` }}>
          <thead>
            <tr style={{ borderBottom: `1px dashed ${colors.dashLine}` }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="mono-caps"
                  data-mono-caps="true"
                  style={{
                    paddingInline: `${spacing.md}px`,
                    paddingBlock: `${spacing.sm}px`,
                    textAlign: col.align ?? 'start',
                    fontSize: `${typography.tableHead.fontSize}px`,
                    lineHeight: `${typography.tableHead.lineHeight}px`,
                    letterSpacing: `${typography.tableHead.letterSpacing}px`,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: typography.tableHead.weight,
                    color: colors.muted,
                    textTransform: 'uppercase',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick ? 'cursor-pointer hover:bg-black/[0.02] transition-colors' : undefined
                }
                style={{ borderBottom: `1px dashed ${colors.dashLine}` }}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      paddingInline: `${spacing.md}px`,
                      paddingBlock: `${spacing.md}px`,
                      textAlign: col.align ?? 'start',
                      fontSize: `${typography.body.fontSize}px`,
                      lineHeight: `${typography.body.lineHeight}px`,
                      color: colors.ink,
                    }}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< 768px) */}
      <div className="flex md:hidden flex-col gap-3">
        {tableRows.map((row) => (
          <div
            key={getRowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={`flex flex-col gap-2 p-4 ${
              onRowClick ? 'cursor-pointer active:scale-[0.99]' : ''
            }`}
            style={{
              backgroundColor: colors.surface,
              borderRadius: `${radius.card}px`,
              border: `1px solid ${colors.hairline}`,
            }}
          >
            {columns
              .filter((c) => !c.hideOnMobile)
              .map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-2">
                  <AppText
                    variant="caption"
                    color="muted"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                    }}
                  >
                    {col.mobileLabel ?? col.header}
                  </AppText>
                  <div className="text-end">{col.render(row)}</div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
