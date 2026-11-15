'use client';

import React from 'react';
import { colors, radius } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { useTranslation } from '../../i18n';
import { statusTone, type StatusTone } from '../../utils/statusTone';

export type BadgeDomain = 'campaign' | 'proposal' | 'collaboration' | 'deliverable' | 'custom';

export interface StatusBadgeProps {
  status: string;
  domain?: BadgeDomain;
  label?: string;
  tone?: StatusTone;
}

const TONE_COLORS: Record<StatusTone, { bg: string; fg: string }> = {
  ok: { bg: colors.accentSoft, fg: colors.primary },
  pend: { bg: colors.signatureCream, fg: colors.ink },
  info: { bg: colors.infoSurface, fg: colors.info },
  bad: { bg: colors.dangerSurface, fg: colors.danger },
  neu: { bg: colors.surfaceStrong, fg: colors.muted },
};

export function StatusBadge({ status, domain = 'campaign', label, tone }: StatusBadgeProps) {
  const { t } = useTranslation();

  const normalized = (status || '').toLowerCase();
  // A status value that has no copy key must still read as words, never as a
  // raw enum such as "IN_PRODUCTION".
  const humanized = normalized.replace(/_/g, ' ');
  const displayLabel =
    label ?? (domain !== 'custom' ? t(`status.${domain}.${normalized}`, humanized) : status);

  const effectiveTone = tone ?? statusTone(domain, status);
  const { bg, fg } = TONE_COLORS[effectiveTone];

  return (
    <span
      className="inline-flex items-center whitespace-nowrap mono-caps"
      data-mono-caps="true"
      style={{
        backgroundColor: bg,
        color: fg,
        paddingInline: '8px',
        paddingBlock: '3px',
        borderRadius: `${radius.badge}px`,
        fontSize: `${typography.badgeMono.fontSize}px`,
        lineHeight: `${typography.badgeMono.lineHeight}px`,
        fontWeight: typography.badgeMono.weight,
        letterSpacing: `${typography.badgeMono.letterSpacing}px`,
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
      }}
    >
      {displayLabel}
    </span>
  );
}
