'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';

export interface ListRowProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  tag?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  tag,
  action,
  onClick,
  className = '',
  style,
}: ListRowProps) {
  const trailingContent =
    trailing ??
    (tag || action ? (
      <div className="flex items-center gap-2">
        {tag}
        {action}
      </div>
    ) : null);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex items-center justify-between gap-3 p-3 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-black/[0.02] active:scale-[0.99]' : ''
      } ${className}`}
      style={{
        borderRadius: `${radius.card}px`,
        borderBottom: `1px dashed ${colors.dashLine}`,
        ...style,
      }}
    >
      {/* flex-1 lets the text claim the free width. Without it the row
          shrinks the title to an ellipsis and gives the space to the action. */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="flex flex-col min-w-0 flex-1">
          {typeof title === 'string' ? (
            <span dir="auto" style={{ minWidth: 0 }}>
              <AppText
                variant="body"
                color="ink"
                style={{ fontWeight: 500, overflowWrap: 'anywhere' }}
                className="line-clamp-2"
              >
                {title}
              </AppText>
            </span>
          ) : (
            title
          )}
          {subtitle ? (
            typeof subtitle === 'string' ? (
              <span dir="auto" style={{ minWidth: 0 }}>
                <AppText variant="caption" color="muted" className="truncate">
                  {subtitle}
                </AppText>
              </span>
            ) : (
              subtitle
            )
          ) : null}
        </div>
      </div>
      {trailingContent ? <div className="shrink-0 text-end">{trailingContent}</div> : null}
    </div>
  );
}
