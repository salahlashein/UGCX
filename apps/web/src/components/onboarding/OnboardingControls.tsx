'use client';

import React from 'react';
import type { Niche } from '@ugcx/shared-types';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { useTranslation } from '../../i18n';
import { PRICE_MAX, PRICE_MIN, PRICE_STEP, clampPrice, pricePercent } from '../../utils/onboarding';

export const NICHES: Niche[] = [
  'beauty_personal_care',
  'fashion',
  'mom_baby',
  'food_fmcg',
  'home_lifestyle',
  'other',
];

const NICHE_ICONS: Record<Niche, IconName> = {
  beauty_personal_care: 'star',
  fashion: 'bag',
  mom_baby: 'user',
  food_fmcg: 'package',
  home_lifestyle: 'home',
  other: 'more-horizontal',
};

export function StepHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(24px, 3vw, 30px)',
          lineHeight: 1.18,
          fontWeight: 600,
          letterSpacing: '-0.015em',
          textWrap: 'balance',
          color: colors.textPrimary,
        }}
      >
        {title}
      </h1>
      {hint ? (
        <AppText variant="body" color="textSecondary">
          {hint}
        </AppText>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        padding: `${spacing.sm}px ${spacing.md}px`,
        borderRadius: radius.md,
        backgroundColor: colors.dangerSurface,
        color: colors.danger,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

/** Back, optional Skip, and the main action. Enter submits the step's form. */
export function StepActions({
  onBack,
  onSkip,
  primaryLabel,
  loading,
  showEnterHint,
}: {
  onBack?: () => void;
  onSkip?: () => void;
  primaryLabel: string;
  loading?: boolean;
  showEnterHint?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
        flexWrap: 'wrap',
        paddingTop: spacing.xs,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
        {onBack ? (
          <Button
            type="button"
            variant="secondary"
            title={t('common.back', 'Back')}
            onClick={onBack}
          />
        ) : null}
        {onSkip ? (
          <Button
            type="button"
            variant="ghost"
            title={t('onboarding.skip', 'Skip for now')}
            onClick={onSkip}
          />
        ) : null}
        {showEnterHint ? (
          <span
            className="ugcx-pointer-only"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textSecondary }}
          >
            {t('onboarding.enterHint', 'Press Enter to continue')}
          </span>
        ) : null}
      </div>
      <Button type="submit" variant="primary" title={primaryLabel} loading={loading} />
    </div>
  );
}

/**
 * Large picture tiles for a category or niche. Single choice for a brand,
 * up to three for a creator. Each tile can show a live count.
 */
export function NicheTiles({
  selected,
  onToggle,
  counts,
  countLabel,
  multi,
  label,
}: {
  selected: Niche[];
  onToggle: (niche: Niche) => void;
  counts?: Partial<Record<Niche, number>>;
  countLabel: (count: number) => string;
  multi: boolean;
  label: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      role={multi ? 'group' : 'radiogroup'}
      aria-label={label}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: spacing.sm,
      }}
    >
      {NICHES.map((niche) => {
        const on = selected.includes(niche);
        return (
          <button
            key={niche}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={on}
            onClick={() => onToggle(niche)}
            style={{
              textAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: on ? 15 : 16,
              borderRadius: radius.card,
              border: on ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
              backgroundColor: on ? '#f3f8f4' : colors.surface,
              cursor: 'pointer',
              color: colors.textPrimary,
              font: 'inherit',
            }}
          >
            <span
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.full,
                  display: 'grid',
                  placeItems: 'center',
                  backgroundColor: colors.accentSoft,
                  color: colors.primary,
                }}
              >
                <Icon name={NICHE_ICONS[niche]} size={17} />
              </span>
              {on ? <Icon name="check-circle" size={18} color="primary" /> : null}
            </span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{t(`niche.${niche}`, niche)}</span>
            {counts ? (
              <span style={{ fontSize: 13, color: colors.textSecondary }}>
                {countLabel(counts[niche] ?? 0)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Starting price: a large number, a slider, and the usual price band drawn on the track. */
export function PriceSlider({
  value,
  onChange,
  band,
  bandLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  band: { low: number; high: number } | null;
  bandLabel: string | null;
}) {
  const { t } = useTranslation();
  const left = band ? pricePercent(band.low) : 0;
  const right = band ? 100 - pricePercent(band.high) : 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <label
        htmlFor="onboarding-price"
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontFamily: 'var(--font-mono)' }}
        dir="ltr"
      >
        <span style={{ fontSize: 18, color: colors.textSecondary }}>EGP</span>
        <input
          id="onboarding-price"
          type="number"
          inputMode="numeric"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={() => onChange(clampPrice(value))}
          aria-label={t('onboarding.creator.priceLabel', 'Starting price in EGP')}
          style={{
            width: '7ch',
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            border: 'none',
            borderBottom: `2px solid ${colors.border}`,
            background: 'transparent',
            color: colors.textPrimary,
            fontFamily: 'var(--font-mono)',
            padding: 0,
          }}
        />
      </label>
      <div style={{ position: 'relative', paddingBlock: 8 }} dir="ltr">
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            insetInline: 0,
            top: '50%',
            height: 8,
            marginTop: -4,
            borderRadius: radius.full,
            backgroundColor: colors.border,
          }}
        >
          {band ? (
            <span
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${left}%`,
                right: `${right}%`,
                borderRadius: radius.full,
                backgroundColor: `${colors.primary}66`,
              }}
            />
          ) : null}
        </div>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={clampPrice(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={t('onboarding.creator.priceSlider', 'Starting price slider')}
          aria-valuetext={`EGP ${clampPrice(value)}`}
          className="ugcx-price-range"
          style={{
            position: 'relative',
            width: '100%',
            accentColor: colors.primary,
            background: 'transparent',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
          flexWrap: 'wrap',
          fontSize: 13,
          color: colors.textSecondary,
        }}
        dir="ltr"
      >
        <span>EGP {PRICE_MIN.toLocaleString('en-US')}</span>
        {bandLabel ? (
          <span
            style={{
              fontSize: 12.5,
              padding: '4px 10px',
              borderRadius: radius.full,
              backgroundColor: colors.accentSoft,
              color: colors.primaryActive,
            }}
          >
            {bandLabel}
          </span>
        ) : null}
        <span>EGP {PRICE_MAX.toLocaleString('en-US')}</span>
      </div>
    </div>
  );
}
