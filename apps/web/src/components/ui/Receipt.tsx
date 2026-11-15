'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export interface ReceiptProps {
  header?: React.ReactNode;
  lines: Array<[string, React.ReactNode]>;
  total: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Receipt({ header, lines, total, footer, className = '', style }: ReceiptProps) {
  return (
    <div
      className={`flex flex-col p-5 w-full ${className}`}
      style={{
        backgroundColor: colors.surface,
        borderRadius: `${radius.card}px`,
        border: `1px dashed ${colors.dashLine}`,
        boxShadow: '0 1px 4px rgba(23, 36, 28, 0.04)',
        ...style,
      }}
    >
      {header ? (
        <div
          className="pb-3 mb-3 text-center"
          style={{ borderBottom: `1px dashed ${colors.dashLine}` }}
        >
          {typeof header === 'string' ? (
            <span
              className="mono-caps"
              data-mono-caps="true"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.8px',
                color: colors.muted,
                textTransform: 'uppercase',
              }}
            >
              {header}
            </span>
          ) : (
            header
          )}
        </div>
      ) : null}

      {/* Line items */}
      <div className="flex flex-col gap-2 py-1">
        {lines.map(([label, val], idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-sm">
            <AppText variant="bodySm" color="muted">
              {label}
            </AppText>
            <span
              dir="ltr"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: colors.ink,
              }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* Total row */}
      <div
        className="flex items-center justify-between gap-3 pt-3 mt-3"
        style={{ borderTop: `1px solid ${colors.ink}` }}
      >
        <span
          className="mono-caps"
          data-mono-caps="true"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.6px',
            color: colors.ink,
            textTransform: 'uppercase',
          }}
        >
          Total
        </span>
        <span
          dir="ltr"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '18px',
            fontWeight: 500,
            color: colors.primary,
          }}
        >
          {total}
        </span>
      </div>

      {footer ? (
        <div
          className="pt-3 mt-3 text-center"
          style={{ borderTop: `1px dashed ${colors.dashLine}` }}
        >
          {typeof footer === 'string' ? (
            <AppText variant="caption" color="muted">
              {footer}
            </AppText>
          ) : (
            footer
          )}
        </div>
      ) : null}
    </div>
  );
}
