'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { StatusBadge } from './StatusBadge';
import { DataTable, type Column } from './DataTable';
import { signedAmount } from '../../utils/dataHelpers';
import { centsToAmount } from '../../utils/money';
import { formatMoney } from '../../utils/format';

export interface LedgerRow {
  id: string;
  date: string;
  title?: string;
  description?: string;
  subtitle?: string;
  ref?: string;
  reference?: string;
  status?: string;
  statusLabel?: string;
  amountCents?: number;
  direction?: 'in' | 'out' | 'hold';
  inAmount?: string;
  outAmount?: string;
  /** Money moved inside escrow (allocated, or a transfer being checked). */
  holdAmount?: string;
  balance?: string;
  balanceCents?: number;
}

export type LedgerTableRow = LedgerRow;

export interface LedgerTableProps {
  rows: LedgerRow[];
  showBalance?: boolean;
}

export function LedgerTable({ rows, showBalance = true }: LedgerTableProps) {
  // Drop a column no row fills.
  const anyStatus = rows.some((r) => Boolean(r.status));
  const anyBalance = rows.some(
    (r) => r.balance !== undefined && r.balance !== null && r.balance !== '-',
  );
  const columns: Column<LedgerRow>[] = [
    {
      key: 'icon',
      header: '',
      hideOnMobile: true,
      render: (r) => {
        const dir = r.direction ?? (r.outAmount ? 'out' : r.inAmount ? 'in' : 'hold');
        const isIn = dir === 'in';
        const isHold = dir === 'hold';
        return (
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: `${radius.full}px`,
              backgroundColor: isIn
                ? colors.accentSoft
                : isHold
                  ? colors.surfaceSoft
                  : colors.signatureCream,
            }}
          >
            <Icon
              name={isIn ? 'arrow-in' : isHold ? 'lock' : 'arrow-up'}
              size={16}
              color={isIn ? 'primary' : 'ink'}
            />
          </div>
        );
      },
    },
    {
      key: 'date',
      header: 'Date',
      mobileLabel: 'Date',
      render: (r) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: colors.muted,
          }}
        >
          {r.date}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      mobileLabel: 'Description',
      render: (r) => {
        const displayTitle = r.title ?? r.description ?? '';
        const displayRef = r.ref ?? r.reference;
        return (
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <AppText variant="body" color="ink" style={{ fontWeight: 500 }}>
                {displayTitle}
              </AppText>
              {displayRef ? (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: colors.muted,
                    paddingInline: '4px',
                    paddingBlock: '1px',
                    border: `1px solid ${colors.hairline}`,
                    borderRadius: `${radius.badge}px`,
                    // A reference is one token. It never breaks across lines.
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {displayRef}
                </span>
              ) : null}
            </div>
            {r.subtitle ? (
              <AppText variant="caption" color="muted">
                {r.subtitle}
              </AppText>
            ) : null}
          </div>
        );
      },
    },
    ...(anyStatus
      ? [
          {
            key: 'status',
            header: 'Status',
            mobileLabel: 'Status',
            render: (r: LedgerRow) =>
              r.status ? <StatusBadge status={r.status} label={r.statusLabel} /> : null,
          },
        ]
      : []),
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      mobileLabel: 'Amount',
      render: (r) => {
        const dir = r.direction ?? (r.outAmount ? 'out' : r.inAmount ? 'in' : 'hold');
        const isIn = dir === 'in';
        const formatted =
          r.amountCents !== undefined
            ? signedAmount(r.amountCents, dir)
            : (r.inAmount ?? r.outAmount ?? r.holdAmount ?? '');

        return (
          <span
            dir="ltr"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              fontWeight: 500,
              color: isIn ? colors.primary : dir === 'hold' ? colors.textSecondary : colors.ink,
            }}
          >
            {formatted}
          </span>
        );
      },
    },
  ];

  if (showBalance && anyBalance) {
    columns.push({
      key: 'balance',
      header: 'Balance',
      align: 'end',
      mobileLabel: 'Balance',
      render: (r) => {
        const displayBalance =
          r.balance ??
          (r.balanceCents !== undefined ? formatMoney(centsToAmount(r.balanceCents)) : undefined);

        return displayBalance !== undefined && displayBalance !== '-' ? (
          <span
            dir="ltr"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: colors.muted,
            }}
          >
            {displayBalance}
          </span>
        ) : (
          <span style={{ color: colors.muted }}>—</span>
        );
      },
    });
  }

  return <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} minWidth={680} />;
}
