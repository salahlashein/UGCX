'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

export interface ChecklistItem {
  id: string;
  label: string;
  state: 'met' | 'missing' | 'unchecked';
  hint?: string;
}

export interface ChecklistProps {
  items: ChecklistItem[];
  onToggle?: (id: string) => void;
  className?: string;
}

export function Checklist({ items, onToggle, className = '' }: ChecklistProps) {
  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {items.map((item) => {
        const isInteractive = Boolean(onToggle);

        const renderIcon = () => {
          if (item.state === 'met') {
            return (
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: `${radius.badge}px`,
                  backgroundColor: colors.accentSoft,
                }}
              >
                <Icon name="check" size={14} color="primary" />
              </div>
            );
          }
          if (item.state === 'missing') {
            return (
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: `${radius.badge}px`,
                  backgroundColor: colors.dangerSurface,
                }}
              >
                <Icon name="x" size={14} color="danger" />
              </div>
            );
          }
          return (
            <div
              className="shrink-0"
              style={{
                width: 22,
                height: 22,
                borderRadius: `${radius.badge}px`,
                border: `1.5px solid ${colors.borderStrong}`,
                backgroundColor: colors.surface,
              }}
            />
          );
        };

        return (
          <div
            key={item.id}
            onClick={isInteractive ? () => onToggle?.(item.id) : undefined}
            role={isInteractive ? 'checkbox' : undefined}
            aria-checked={item.state === 'met'}
            className={`flex items-start gap-3 p-3 transition-colors ${
              isInteractive ? 'cursor-pointer hover:bg-black/[0.02] active:scale-[0.99]' : ''
            }`}
            style={{
              backgroundColor: colors.surface,
              borderRadius: `${radius.button}px`,
              border: `1px dashed ${colors.dashLine}`,
            }}
          >
            {renderIcon()}
            <div className="flex flex-col min-w-0">
              <AppText
                variant="body"
                color={item.state === 'missing' ? 'danger' : 'ink'}
                style={{
                  fontWeight: 400,
                  textDecoration: item.state === 'met' ? 'line-through' : undefined,
                  opacity: item.state === 'met' ? 0.75 : 1,
                }}
              >
                {item.label}
              </AppText>
              {item.hint ? (
                <AppText variant="caption" color="muted">
                  {item.hint}
                </AppText>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
