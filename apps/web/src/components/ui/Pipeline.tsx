'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { Icon } from './Icon';

export interface PipelineStageItem {
  id: string;
  label: string;
  hot?: boolean;
}

export interface PipelineStage {
  key?: string;
  id?: string;
  label?: string;
  name?: string;
  count?: number;
  items?: (PipelineStageItem | string)[];
  isHot?: boolean;
}

export interface PipelineProps {
  stages: PipelineStage[];
  /** How many names to show in a column before "+N more". */
  maxItems?: number;
  onStageClick?: (stage: PipelineStage) => void;
  className?: string;
}

function normalizeItem(item: PipelineStageItem | string, idx: number): PipelineStageItem {
  if (typeof item === 'string') return { id: `${idx}-${item}`, label: item };
  return item;
}

/**
 * One column per stage, each listing the work that sits in it.
 *
 * A count alone does not say which brief is stuck, so every column names its
 * briefs. The arrow between columns mirrors in a right to left page.
 */
export function Pipeline({ stages, maxItems = 4, onStageClick, className = '' }: PipelineProps) {
  return (
    <div
      className={`ugcx-pipeline w-full ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(1, stages.length)}, minmax(0, 1fr))`,
        border: `1px dashed ${colors.dashLine}`,
        borderRadius: `${radius.card}px`,
        backgroundColor: colors.surface,
        overflow: 'hidden',
      }}
    >
      {stages.map((stage, idx) => {
        const stageKey = stage.key ?? stage.id ?? String(idx);
        const stageLabel = stage.label ?? stage.name ?? '';
        const rawItems = stage.items ?? [];
        const count = stage.count ?? rawItems.length;
        const items = rawItems.map(normalizeItem);
        const shown = items.slice(0, maxItems);
        const hidden = items.length - shown.length;
        const isLast = idx === stages.length - 1;
        const clickable = Boolean(onStageClick);

        return (
          <div
            key={stageKey}
            onClick={clickable ? () => onStageClick?.(stage) : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            className={clickable ? 'cursor-pointer hover:bg-black/[0.02]' : undefined}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              padding: spacing.md,
              minWidth: 0,
              borderInlineEnd: isLast ? undefined : `1px dashed ${colors.dashLine}`,
            }}
          >
            <span
              className="mono-caps"
              data-mono-caps="true"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                lineHeight: '14px',
                letterSpacing: '0.6px',
                fontWeight: 500,
                color: colors.muted,
                textTransform: 'uppercase',
                overflowWrap: 'anywhere',
              }}
            >
              {stageLabel}
            </span>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '26px',
                lineHeight: '30px',
                fontWeight: 500,
                letterSpacing: '-1px',
                color: count > 0 ? colors.ink : colors.muted,
              }}
            >
              {count}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              {shown.map((item) => (
                <span
                  key={item.id}
                  title={item.label}
                  style={{
                    fontSize: '12px',
                    lineHeight: '16px',
                    color: colors.body,
                    padding: '5px 7px',
                    borderRadius: `${radius.sm}px`,
                    backgroundColor: colors.surfaceSoft,
                    border: `1px solid ${item.hot || stage.isHot ? colors.signatureCoral : colors.hairline}`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                    maxWidth: '100%',
                  }}
                >
                  {item.label}
                </span>
              ))}
              {hidden > 0 ? (
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: colors.muted,
                    paddingInline: '2px',
                  }}
                >
                  {`+${hidden}`}
                </span>
              ) : null}
            </div>

            {!isLast ? (
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: spacing.md,
                  insetInlineEnd: -9,
                  width: 18,
                  height: 18,
                  borderRadius: `${radius.pill}px`,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.hairline}`,
                  display: 'grid',
                  placeItems: 'center',
                  color: colors.muted,
                  zIndex: 1,
                }}
              >
                <Icon name="arrow-right" size={11} color="muted" directional />
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
