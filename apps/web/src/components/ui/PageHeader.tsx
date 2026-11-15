'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export interface PageHeaderProps {
  /** Small mono uppercase line above the title. */
  overline?: React.ReactNode;
  title: React.ReactNode;
  /** One line under the title. */
  subtitle?: React.ReactNode;
  /** Badges that sit on the title row, after the title. */
  badges?: React.ReactNode;
  /** Buttons at the inline end. */
  actions?: React.ReactNode;
  /** A back button, placed before everything else. */
  back?: React.ReactNode;
  /** An avatar or an icon tile, placed before the text column. */
  leading?: React.ReactNode;
  size?: 'lg' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * One header for every page.
 *
 * `AppText` renders an inline span. Two of them in a plain div print on one
 * line with no gap, which is why page titles used to collide with their
 * overline. This component keeps the text in a flex column, so the three
 * lines always stack.
 */
export function PageHeader({
  overline,
  title,
  subtitle,
  badges,
  actions,
  back,
  leading,
  size = 'lg',
  className = '',
  style,
}: PageHeaderProps) {
  return (
    <header
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          minWidth: 0,
          flex: '1 1 auto',
        }}
      >
        {back}
        {leading}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            minWidth: 0,
          }}
        >
          {overline ? (
            <AppText variant="overlineMono" tone="muted" as="div">
              {overline}
            </AppText>
          ) : null}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              flexWrap: 'wrap',
              minWidth: 0,
            }}
          >
            <AppText
              variant={size === 'lg' ? 'displayMd' : 'titleLg'}
              weight={500}
              tone="ink"
              as="h1"
            >
              {title}
            </AppText>
            {badges}
          </div>

          {subtitle ? (
            <AppText variant="bodySm" tone="muted" as="div">
              {subtitle}
            </AppText>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/** A dashed rule with an overline label and a count, for grouping sections. */
export function SectionHeading({
  label,
  count,
  action,
}: {
  label: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        minWidth: 0,
      }}
    >
      <AppText variant="overlineMono" tone="ink" as="div">
        {label}
      </AppText>
      {typeof count === 'number' ? (
        <AppText variant="caption" tone="muted" as="div" tabular>
          {count}
        </AppText>
      ) : null}
      <span
        aria-hidden="true"
        style={{
          flex: 1,
          borderTop: `1px dashed ${colors.dashLine}`,
          borderRadius: radius.xs,
        }}
      />
      {action}
    </div>
  );
}
