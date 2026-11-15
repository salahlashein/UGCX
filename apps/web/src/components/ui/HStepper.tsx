'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { Icon } from './Icon';
import { formatDateShort } from '../../utils/format';
import { useTranslation } from '../../i18n';

export interface StepItem {
  label: string;
  date?: string;
  state: 'done' | 'current' | 'todo';
}

export type HStep = StepItem;

export interface HStepperProps {
  steps: StepItem[];
  tone?: 'light' | 'dark';
  className?: string;
}

export function HStepper({ steps, tone = 'light', className = '' }: HStepperProps) {
  const isDark = tone === 'dark';
  const { locale } = useTranslation();

  return (
    <div className={`flex items-start justify-between w-full relative ${className}`}>
      {steps.map((step, idx) => {
        const isDone = step.state === 'done';
        const isCurrent = step.state === 'current';
        const isLast = idx === steps.length - 1;

        const dotBg = isDone
          ? isDark
            ? colors.signatureMint
            : colors.primary
          : isCurrent
            ? isDark
              ? colors.onDark
              : colors.primary
            : isDark
              ? 'rgba(255,255,255,0.2)'
              : colors.surfaceStrong;

        const textColor = isDark
          ? isDone || isCurrent
            ? colors.onDark
            : 'rgba(255,255,255,0.5)'
          : isDone || isCurrent
            ? colors.ink
            : colors.muted;

        return (
          <div key={idx} className="flex-1 flex flex-col items-center relative text-center">
            {/* Connecting Line to next step */}
            {!isLast ? (
              <div
                className="absolute top-3.5 start-1/2 w-full z-0"
                style={{
                  borderTop: isDone
                    ? `2px solid ${isDark ? colors.signatureMint : colors.primary}`
                    : `1px dashed ${isDark ? 'rgba(255,255,255,0.2)' : colors.dashLine}`,
                }}
              />
            ) : null}

            {/* Step Dot */}
            <div
              className="flex items-center justify-center relative z-10 shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: `${radius.full}px`,
                backgroundColor: dotBg,
                color: isDone ? (isDark ? colors.surfaceDark : colors.onPrimary) : undefined,
                boxShadow: isCurrent
                  ? `0 0 0 3px ${isDark ? 'rgba(168,216,196,0.3)' : colors.accentSoft}`
                  : undefined,
              }}
            >
              {isDone ? (
                <Icon name="check" size={14} color={isDark ? 'ink' : 'onPrimary'} />
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: isCurrent
                      ? isDark
                        ? colors.surfaceDark
                        : colors.onPrimary
                      : isDark
                        ? 'rgba(255,255,255,0.6)'
                        : colors.muted,
                  }}
                >
                  {idx + 1}
                </span>
              )}
            </div>

            {/* Label & Date */}
            <div className="flex flex-col items-center mt-2 px-1">
              <span
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: isCurrent ? 500 : 400,
                  color: textColor,
                }}
              >
                {step.label}
              </span>
              {step.date ? (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: isDark ? 'rgba(255,255,255,0.4)' : colors.muted,
                    marginTop: 2,
                  }}
                >
                  {/* A caller may pass an ISO date. Never print one raw. */}
                  {formatDateShort(step.date, locale) || step.date}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
