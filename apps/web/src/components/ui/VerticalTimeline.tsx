'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { formatDateShort } from '../../utils/format';
import { useTranslation } from '../../i18n';

export interface TimelineStep {
  id?: string;
  icon?: IconName;
  title: string;
  detail?: string;
  description?: string;
  date?: string;
  state: 'done' | 'current' | 'todo';
  action?: React.ReactNode;
}

export interface VerticalTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function VerticalTimeline({ steps, className = '' }: VerticalTimelineProps) {
  const { locale } = useTranslation();

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {steps.map((step, idx) => {
        const isDone = step.state === 'done';
        const isCurrent = step.state === 'current';
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className="flex gap-3.5 relative">
            {/* Left Column: Icon/Dot + Connecting Line */}
            <div className="flex flex-col items-center">
              <div
                className="flex items-center justify-center shrink-0 z-10"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: `${radius.full}px`,
                  backgroundColor: isDone
                    ? colors.primary
                    : isCurrent
                      ? colors.accentSoft
                      : colors.surfaceSoft,
                  border: isCurrent ? `1.5px solid ${colors.primary}` : undefined,
                }}
              >
                {step.icon ? (
                  <Icon
                    name={step.icon}
                    size={14}
                    color={isDone ? 'onPrimary' : isCurrent ? 'primary' : 'muted'}
                  />
                ) : isDone ? (
                  <Icon name="check" size={14} color="onPrimary" />
                ) : (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: `${radius.full}px`,
                      backgroundColor: isCurrent ? colors.primary : colors.borderStrong,
                    }}
                  />
                )}
              </div>

              {!isLast ? (
                <div
                  className="w-px grow my-1"
                  style={{
                    borderInlineStart: isDone
                      ? `2px solid ${colors.primary}`
                      : `1px dashed ${colors.dashLine}`,
                    minHeight: 24,
                  }}
                />
              ) : null}
            </div>

            {/* Right Column: Title, Date, Detail, Action */}
            <div className="flex flex-col grow pb-5 pt-0.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <AppText variant="body" color="ink" style={{ fontWeight: isCurrent ? 500 : 400 }}>
                  {step.title}
                </AppText>
                {step.date ? (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: colors.muted,
                    }}
                  >
                    {/* A caller may pass an ISO date. Never print one raw. */}
                    {formatDateShort(step.date, locale) || step.date}
                  </span>
                ) : null}
              </div>
              {step.detail || step.description ? (
                <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
                  {step.detail || step.description}
                </AppText>
              ) : null}
              {step.action ? (
                <div style={{ marginTop: `${spacing.xs}px` }}>{step.action}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
