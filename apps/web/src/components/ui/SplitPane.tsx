'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { Button } from './Button';

export interface SplitPaneProps {
  list?: React.ReactNode;
  detail?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  minLeftWidth?: number;
  selectedId?: string | null;
  onClearSelection?: () => void;
  backLabel?: string;
  className?: string;
}

export function SplitPane({
  list,
  detail,
  left,
  right,
  minLeftWidth: _minLeftWidth,
  selectedId,
  onClearSelection,
  backLabel = 'Back to list',
  className = '',
}: SplitPaneProps) {
  const listContent = list ?? left;
  const detailContent = detail ?? right;
  const hasSelection = Boolean(selectedId);

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Two-Column Layout (>= 1080px) */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 w-full items-start">
        <div className="lg:col-span-5 flex flex-col">{listContent}</div>
        <div
          className="lg:col-span-7 flex flex-col"
          style={{
            borderInlineStart: `1px dashed ${colors.dashLine}`,
            paddingInlineStart: '24px',
            minHeight: '400px',
          }}
        >
          {detailContent}
        </div>
      </div>

      {/* Mobile / Tablet Responsive Layout (< 1080px) */}
      <div className="block lg:hidden w-full">
        {hasSelection ? (
          <div className="flex flex-col gap-4">
            {onClearSelection ? (
              <Button
                title={backLabel}
                variant="ghost"
                size="sm"
                icon="arrow-left"
                onClick={onClearSelection}
              />
            ) : null}
            <div>{detailContent}</div>
          </div>
        ) : (
          <div>{listContent}</div>
        )}
      </div>
    </div>
  );
}
