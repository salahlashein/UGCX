'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { formatMoney } from '../../utils/format';
import { centsToAmount } from '../../utils/money';

export type EquationPart =
  | { label: string; valueCents: number; tone?: 'primary' | 'muted' | 'ink' }
  | { op: '-' | '+' | '=' };

export type EquationItem = {
  label: string;
  value?: string | number;
  highlight?: boolean;
};

export interface EquationProps {
  parts?: EquationPart[];
  items?: EquationItem[];
  currency?: string;
  className?: string;
}

/** Formats a raw amount. A string that already holds a currency or a separator
 *  is left as it is, so a value never gets formatted twice. */
function formatEquationValue(value: string | number | null | undefined, currency: string): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string' && /[^\d.\-−\s]/.test(value)) return value;
  return formatMoney(value, currency);
}

export function Equation({ parts = [], items, currency = 'EGP', className = '' }: EquationProps) {
  return (
    <div
      className={`flex items-center flex-wrap gap-2 md:gap-3 p-3 ${className}`}
      style={{
        borderRadius: `${radius.card}px`,
        backgroundColor: colors.surfaceSoft,
        border: `1px dashed ${colors.dashLine}`,
      }}
    >
      {items
        ? items.map((it, idx) => {
            const isOp = it.label === '-' || it.label === '+' || it.label === '=';
            if (isOp) {
              return (
                <span
                  key={idx}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '18px',
                    fontWeight: 500,
                    color: colors.muted,
                    width: 24,
                  }}
                >
                  {it.label === '-' ? '\u2212' : it.label}
                </span>
              );
            }
            return (
              <div
                key={idx}
                className="flex flex-col"
                style={{
                  padding: '6px 10px',
                  borderRadius: `${radius.md}px`,
                  backgroundColor: it.highlight ? colors.accentSoft : 'transparent',
                }}
              >
                <span
                  className="mono-caps"
                  data-mono-caps="true"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: it.highlight ? colors.primary : colors.muted,
                    textTransform: 'uppercase',
                  }}
                >
                  {it.label}
                </span>
                <span
                  className="tabular-nums ltr-num"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: it.highlight ? colors.primary : colors.ink,
                  }}
                >
                  {/* A raw amount prints through the formatter, so the
                      equation never shows "25150.00". A value a caller already
                      formatted passes through untouched. */}
                  {formatEquationValue(it.value, currency)}
                </span>
              </div>
            );
          })
        : parts.map((p, idx) => {
            if ('op' in p) {
              return (
                <span
                  key={idx}
                  className="flex items-center justify-center shrink-0"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '18px',
                    fontWeight: 500,
                    color: colors.muted,
                    width: 24,
                  }}
                >
                  {p.op === '-' ? '\u2212' : p.op}
                </span>
              );
            }

            const isResult =
              idx > 0 && 'op' in parts[idx - 1] && (parts[idx - 1] as { op: string }).op === '=';

            return (
              <div
                key={idx}
                className="flex flex-col p-2.5 shrink-0"
                style={{
                  backgroundColor: isResult ? colors.accentSoft : colors.surface,
                  borderRadius: `${radius.button}px`,
                  border: `1px solid ${isResult ? colors.primary : colors.hairline}`,
                }}
              >
                <span
                  className="mono-caps"
                  data-mono-caps="true"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.6px',
                    color: colors.muted,
                    textTransform: 'uppercase',
                  }}
                >
                  {p.label}
                </span>
                <span
                  dir="ltr"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '15px',
                    fontWeight: 500,
                    color:
                      p.tone === 'primary' || isResult
                        ? colors.primary
                        : p.tone === 'muted'
                          ? colors.muted
                          : colors.ink,
                  }}
                >
                  {formatMoney(centsToAmount(p.valueCents), currency)}
                </span>
              </div>
            );
          })}
    </div>
  );
}
