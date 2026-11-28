'use client';

import React from 'react';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from '../ui/AppText';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../i18n';

export interface OnboardingStepItem {
  label: string;
  /** Shown under the label. For a finished step, the saved answer. */
  detail: string;
}

interface Props {
  steps: OnboardingStepItem[];
  current: number;
  /** The card that shows what other people will see. Laptop only. */
  preview?: React.ReactNode;
  previewLabel?: string;
  children: React.ReactNode;
}

/**
 * First sign-up onboarding frame ("R1 side panel"). Laptops get a dark panel
 * with the steps and a live preview. Below 1024px the steps become a strip
 * above the form and the preview is left out.
 */
export function OnboardingLayout({ steps, current, preview, previewLabel, children }: Props) {
  const { t, locale, toggleLocale } = useTranslation();
  const total = steps.length;

  return (
    <div
      className="min-h-screen lg:grid lg:grid-cols-[360px_minmax(0,1fr)]"
      style={{ backgroundColor: colors.canvas }}
    >
      {/* Laptop side panel */}
      <aside
        className="hidden lg:flex flex-col"
        style={{
          backgroundColor: colors.surfaceDark,
          color: '#e9ede8',
          padding: `${spacing.xl}px ${spacing.lg}px`,
          gap: spacing.xl,
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <Wordmark dark />
        <ol
          aria-label={t('onboarding.stepsLabel', 'Setup steps')}
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {steps.map((step, index) => {
            const done = index < current;
            const now = index === current;
            return (
              <li
                key={step.label}
                aria-current={now ? 'step' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: radius.lg,
                  backgroundColor: now ? colors.surfaceDarkElevated : 'transparent',
                  color: now ? '#ffffff' : done ? '#cfe3d6' : '#a8b4ab',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: radius.full,
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    border: `1.5px solid ${done ? colors.primary : now ? colors.accentSoft : '#4a5d51'}`,
                    backgroundColor: done ? colors.primary : 'transparent',
                    color: '#ffffff',
                  }}
                >
                  {done ? <Icon name="check" size={13} /> : index + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 500 }}>
                    {step.label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      color: '#8fa196',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {step.detail}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        {preview ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#8fa196',
              }}
            >
              {previewLabel}
            </span>
            {preview}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <span style={{ fontSize: 13, color: '#8fa196' }}>
            {t('onboarding.changeLater', 'You can change all of this later from Profile.')}
          </span>
          <button
            type="button"
            onClick={toggleLocale}
            style={{
              background: 'transparent',
              border: '1px solid #4a5d51',
              color: '#e9ede8',
              borderRadius: radius.md,
              padding: '5px 10px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </aside>

      {/* Tablet and phone: steps as a strip */}
      <div
        className="lg:hidden flex flex-col"
        style={{
          backgroundColor: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          padding: `${spacing.md}px`,
          gap: spacing.sm,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          }}
        >
          <Wordmark />
          <button
            type="button"
            onClick={toggleLocale}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: '5px 10px',
              fontSize: 13,
              cursor: 'pointer',
              color: colors.textPrimary,
            }}
          >
            {locale === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.label}
              style={{
                flex: 1,
                height: 4,
                borderRadius: radius.full,
                backgroundColor: index <= current ? colors.primary : colors.border,
              }}
            />
          ))}
        </div>
        <AppText variant="bodySm" color="textSecondary">
          {t('onboarding.stepOf', 'Step {{step}} of {{total}}', { step: current + 1, total })} ·{' '}
          {steps[current]?.label}
        </AppText>
      </div>

      <main
        className="flex justify-center items-start lg:items-center"
        style={{ padding: `${spacing.xl}px ${spacing.md}px` }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 580,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: 'clamp(20px, 4vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
          }}
        >
          <span
            className="hidden lg:block"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: colors.textSecondary }}
          >
            {t('onboarding.stepOf', 'Step {{step}} of {{total}}', { step: current + 1, total })}
          </span>
          {children}
        </div>
      </main>
    </div>
  );
}

function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        fontWeight: 600,
        fontSize: 16,
        color: dark ? '#ffffff' : colors.textPrimary,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          display: 'grid',
          placeItems: 'center',
          fontSize: 13,
          backgroundColor: dark ? colors.accentSoft : colors.primary,
          color: dark ? colors.surfaceDark : '#ffffff',
        }}
      >
        R
      </span>
      ReelPal
    </span>
  );
}

/** The white card in the side panel that shows the live profile. */
export function PreviewCard({
  initials,
  logoUrl,
  name,
  meta,
  tags,
}: {
  initials: string;
  logoUrl?: string | null;
  name: string;
  meta: string;
  tags: string[];
}) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        color: colors.textPrimary,
        borderRadius: radius.card,
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <Avatar initials={initials} logoUrl={logoUrl} size={42} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{name}</div>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>{meta}</div>
        </div>
      </div>
      {tags.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: radius.full,
                backgroundColor: colors.accentSoft,
                color: colors.primaryActive,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Avatar({
  initials,
  logoUrl,
  size,
}: {
  initials: string;
  logoUrl?: string | null;
  size: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        backgroundColor: colors.primary,
        color: '#ffffff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 600,
        fontSize: Math.round(size * 0.34),
        flex: 'none',
        overflow: 'hidden',
      }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </span>
  );
}
