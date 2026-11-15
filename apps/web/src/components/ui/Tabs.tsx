'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { typography } from '../../theme/typography';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, active, onChange, className = '' }: TabsProps) {
  return (
    <div
      className={`flex items-center gap-1 sm:gap-2 overflow-x-auto w-full ${className}`}
      style={{
        borderBottom: `1px dashed ${colors.dashLine}`,
      }}
    >
      {items.map((tab) => {
        const isActive = tab.key === active;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className="flex items-center gap-2 px-3 py-2.5 transition-colors cursor-pointer shrink-0 relative"
            style={{
              color: isActive ? colors.primary : colors.muted,
              fontWeight: isActive ? 500 : 400,
              fontSize: `${typography.bodySm.fontSize}px`,
              lineHeight: `${typography.bodySm.lineHeight}px`,
              borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: '14px',
                  paddingInline: '5px',
                  paddingBlock: '1px',
                  borderRadius: `${radius.pill}px`,
                  backgroundColor: isActive ? colors.accentSoft : colors.surfaceSoft,
                  color: isActive ? colors.primary : colors.muted,
                }}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
