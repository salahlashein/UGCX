'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../i18n';
import { interpolate } from '../../i18n';
import {
  FOUNDING_BRAND_LOGOS,
  FOUNDING_BRAND_SPOTS,
  PLATFORM_FEE_PERCENT,
  landingCopy,
  type LandingCopy,
  type LandingQuestion,
} from './content';
import './landing.css';

const BRAND_SIGNUP = '/login?role=brand';
const CREATOR_SIGNUP = '/login?role=creator';

/** Public home page for visitors who are not logged in. */
export function LandingPage() {
  const { locale, toggleLocale } = useTranslation();
  const c = landingCopy[locale];

  return (
    <div className="rp">
      <Hero c={c} onToggleLocale={toggleLocale} />
      <ProofStrip c={c} />
      <HowItWorks c={c} />
      <VideoReel c={c} />
      <Compare c={c} />
      <ForCreators c={c} />
      <Pricing c={c} />
      <Founding c={c} />
      <Faq c={c} />
      <FinalCta c={c} onToggleLocale={toggleLocale} />
    </div>
  );
}

interface SectionProps {
  c: LandingCopy;
}

function Money({ children }: { children: React.ReactNode }) {
  return <span className="rp-mono ltr-num">{children}</span>;
}

function Hero({ c, onToggleLocale }: SectionProps & { onToggleLocale: () => void }) {
  return (
    <header className="rp-paper">
      <div className="rp-wrap">
        <nav className="rp-nav" aria-label="Main">
          <a href="/" className="rp-logo">
            <i aria-hidden="true" />
            ReelPal
          </a>
          <div className="rp-nav-links">
            <a href="#how">{c.nav.how}</a>
            <a href="#creators">{c.nav.creators}</a>
            <a href="#pricing">{c.nav.pricing}</a>
            <a href="#faq">{c.nav.faq}</a>
          </div>
          <div className="rp-spacer" />
          <button type="button" className="rp-link" onClick={onToggleLocale}>
            {c.nav.language}
          </button>
          <Link href="/login" className="rp-btn rp-btn--ghost rp-btn--sm rp-nav-login">
            {c.nav.login}
          </Link>
          <Link href={BRAND_SIGNUP} className="rp-btn rp-btn--mint rp-btn--sm">
            {c.cta.postBrief}
          </Link>
        </nav>

        <div className="rp-hero-grid">
          <div className="rp-hero-copy">
            <span className="rp-badge rp-badge--dark">{c.hero.badge}</span>
            <h1 className="rp-h-big">{c.hero.title}</h1>
            <p className="rp-lead">{c.hero.lead}</p>
            <div className="rp-row">
              <Link href={BRAND_SIGNUP} className="rp-btn rp-btn--mint">
                {c.cta.postBrief}
              </Link>
              <Link href={CREATOR_SIGNUP} className="rp-btn rp-btn--ghost">
                {c.cta.joinCreator}
              </Link>
            </div>
          </div>

          <div className="rp-receipt" aria-label={c.hero.receiptTitle}>
            <span className="rp-stamp">{c.hero.receiptStamp}</span>
            <span className="rp-over">{c.hero.receiptTitle}</span>
            <div style={{ marginTop: 12 }}>
              <div className="rp-line">
                <span>{c.hero.lineFunded}</span>
                <Money>4,500.00</Money>
              </div>
              <div className="rp-line">
                <span>{c.hero.lineReleased}</span>
                <Money>-1,500.00</Money>
              </div>
              <div className="rp-line">
                <span>{c.hero.lineAllocated}</span>
                <Money>-3,000.00</Money>
              </div>
            </div>
            <div className="rp-total">
              <span>{c.hero.available}</span>
              <Money>EGP 0.00</Money>
            </div>
            <p className="rp-muted" style={{ fontSize: 13, marginTop: 12 }}>
              {c.hero.receiptNote}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Logo row once real founding brands agree to show their name. Until then
 * the strip shows product facts, so the page never shows invented brands.
 */
function ProofStrip({ c }: SectionProps) {
  return (
    <section className="rp-proof" aria-label={c.proof.logosTitle}>
      <div className="rp-wrap" style={{ paddingBlock: 32 }}>
        {FOUNDING_BRAND_LOGOS.length > 0 ? (
          <div style={{ textAlign: 'center' }}>
            <p className="rp-over">{c.proof.logosTitle}</p>
            <div className="rp-logos">
              {FOUNDING_BRAND_LOGOS.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="rp-facts">
            {c.proof.facts.map((fact) => (
              <div key={fact.label} className="rp-fact">
                <b className="ltr-num">{fact.value}</b>
                <span className="rp-muted" style={{ fontSize: 14 }}>
                  {fact.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks({ c }: SectionProps) {
  const [audience, setAudience] = useState<'brands' | 'creators'>('brands');
  const steps = audience === 'brands' ? c.how.brands : c.how.creators;

  return (
    <section className="rp-section" id="how">
      <div className="rp-wrap">
        <div className="rp-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="rp-over">{c.how.overline}</span>
            <h2 className="rp-h-mid" style={{ marginTop: 6 }}>
              {c.how.title}
            </h2>
          </div>
          <div className="rp-tabs" role="tablist" aria-label={c.how.title}>
            <button
              type="button"
              role="tab"
              id="how-tab-brands"
              aria-selected={audience === 'brands'}
              aria-controls="how-panel"
              className="rp-tab"
              onClick={() => setAudience('brands')}
            >
              {c.how.tabBrands}
            </button>
            <button
              type="button"
              role="tab"
              id="how-tab-creators"
              aria-selected={audience === 'creators'}
              aria-controls="how-panel"
              className="rp-tab"
              onClick={() => setAudience('creators')}
            >
              {c.how.tabCreators}
            </button>
          </div>
        </div>

        <div className="rp-how-grid">
          <ol
            id="how-panel"
            role="tabpanel"
            aria-labelledby={`how-tab-${audience}`}
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {steps.map((step, i) => (
              <li key={step.title} className="rp-step">
                <span className="rp-step-n ltr-num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <b style={{ fontWeight: 500 }}>{step.title}</b>
                  <div className="rp-muted" style={{ fontSize: 14.5 }}>
                    {step.body}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="rp-card" style={{ padding: 22 }} aria-hidden="true">
            <span className="rp-over">{c.how.previewOverline}</span>
            <h3 style={{ fontSize: 18, margin: '10px 0' }}>{c.how.previewTitle}</h3>
            <div className="rp-row" style={{ gap: 6 }}>
              <span className="rp-badge">{c.how.previewStatus}</span>
              <span className="rp-badge">{c.how.previewShips}</span>
            </div>
            <p style={{ fontSize: 14.5, marginTop: 14, color: 'var(--color-body)' }}>
              {c.how.previewBody}
            </p>
            <div
              className="rp-row"
              style={{
                justifyContent: 'space-between',
                marginTop: 16,
                paddingTop: 12,
                borderTop: 'var(--dash-line)',
                fontSize: 14,
              }}
            >
              <span className="rp-muted">{c.how.previewBudget}</span>
              <span className="rp-mono">{c.how.previewBudgetValue}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoReel({ c }: SectionProps) {
  // The list is rendered twice so the loop has no gap. The copy is hidden from screen readers.
  const tiles = (hidden: boolean) =>
    c.reel.items.map((item, i) => (
      <div
        key={`${hidden ? 'b' : 'a'}-${item.niche}`}
        className={`rp-vid rp-g${i % 8}`}
        aria-hidden={hidden || undefined}
      >
        <span className="rp-vid-play" />
        <div className="rp-vid-meta">
          <b>{item.niche}</b>
          {item.format}
        </div>
      </div>
    ));

  return (
    <section className="rp-section" style={{ paddingTop: 0 }}>
      <div className="rp-wrap" style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 className="rp-h-mid">{c.reel.title}</h2>
        <p className="rp-muted" style={{ marginTop: 8 }}>
          {c.reel.lead}
        </p>
      </div>
      <div className="rp-reel">
        <div className="rp-reel-track">
          {tiles(false)}
          {tiles(true)}
        </div>
      </div>
      <p className="rp-wrap rp-muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 14 }}>
        {c.reel.note}
      </p>
    </section>
  );
}

function Compare({ c }: SectionProps) {
  const last = c.compare.columns.length - 1;
  return (
    <section className="rp-section" style={{ background: 'var(--color-surface)' }}>
      <div className="rp-wrap">
        <h2 className="rp-h-mid">{c.compare.title}</h2>
        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                {c.compare.columns.map((col, i) => (
                  <th
                    key={col || 'blank'}
                    scope="col"
                    className={i === last ? 'rp-col-us' : undefined}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.compare.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th
                        key={cell}
                        scope="row"
                        style={{ fontWeight: 400, color: 'var(--color-muted)' }}
                      >
                        {cell}
                      </th>
                    ) : (
                      <td key={`${row[0]}-${i}`} className={i === last ? 'rp-col-us' : undefined}>
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ForCreators({ c }: SectionProps) {
  return (
    <section className="rp-paper rp-section" id="creators">
      <div className="rp-wrap rp-split">
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}
        >
          <span className="rp-badge rp-badge--dark">{c.creators.badge}</span>
          <h2 className="rp-h-mid">{c.creators.title}</h2>
          <p className="rp-lead">{c.creators.lead}</p>
          <Link href={CREATOR_SIGNUP} className="rp-btn rp-btn--mint">
            {c.cta.joinCreator}
          </Link>
        </div>
        <div className="rp-receipt">
          <span className="rp-over">{c.creators.statementTitle}</span>
          <div style={{ marginTop: 10 }}>
            {c.creators.rows.map((row) => (
              <div key={row.label} className="rp-line">
                <span>
                  {row.label}{' '}
                  <span className="rp-badge" style={{ marginInlineStart: 4 }}>
                    {row.dir === 'in' ? c.creators.inLabel : c.creators.outLabel}
                  </span>
                </span>
                <Money>{row.amount}</Money>
              </div>
            ))}
          </div>
          <div className="rp-total">
            <span>{c.creators.available}</span>
            <Money>{c.creators.availableValue}</Money>
          </div>
          <p className="rp-muted" style={{ fontSize: 13, marginTop: 12 }}>
            {c.creators.payouts}
          </p>
        </div>
      </div>
    </section>
  );
}

function Pricing({ c }: SectionProps) {
  return (
    <section className="rp-section" id="pricing" style={{ textAlign: 'center' }}>
      <div className="rp-wrap">
        <h2 className="rp-h-mid">{c.pricing.title}</h2>
        <p className="rp-muted" style={{ marginTop: 8 }}>
          {c.pricing.lead}
        </p>
        <div className="rp-card rp-price">
          <div className="rp-row" style={{ justifyContent: 'space-between' }}>
            <span className="rp-over">{c.pricing.overline}</span>
            <span className="rp-badge">{c.pricing.badge}</span>
          </div>
          <div style={{ margin: '14px 0 16px' }}>
            <span className="rp-mono ltr-num" style={{ fontSize: 44, fontWeight: 500 }}>
              {PLATFORM_FEE_PERCENT}%
            </span>{' '}
            <span className="rp-muted">{c.pricing.feeLabel}</span>
          </div>
          {c.pricing.points.map((point) => (
            <div key={point} className="rp-check">
              {point}
            </div>
          ))}
          <Link href={BRAND_SIGNUP} className="rp-btn" style={{ width: '100%', marginTop: 16 }}>
            {c.cta.postBrief}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Founding({ c }: SectionProps) {
  return (
    <section className="rp-section" style={{ paddingTop: 0 }}>
      <div className="rp-wrap">
        <div className="rp-founding">
          <div>
            <span className="rp-over">{c.founding.overline}</span>
            <h2 className="rp-h-mid" style={{ margin: '8px 0' }}>
              {interpolate(c.founding.title, { spots: FOUNDING_BRAND_SPOTS })}
            </h2>
            <p style={{ color: 'var(--color-body)' }}>{c.founding.body}</p>
          </div>
          <Link href={BRAND_SIGNUP} className="rp-btn">
            {c.founding.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Faq({ c }: SectionProps) {
  const [tab, setTab] = useState<'brands' | 'creators' | 'payments'>('brands');
  const lists: Record<typeof tab, LandingQuestion[]> = {
    brands: c.faq.brands,
    creators: c.faq.creators,
    payments: c.faq.payments,
  };

  return (
    <section className="rp-section" id="faq" style={{ background: 'var(--color-surface)' }}>
      <div className="rp-wrap rp-faq">
        <h2 className="rp-h-mid" style={{ textAlign: 'center' }}>
          {c.faq.title}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0 8px' }}>
          <div className="rp-tabs" role="tablist" aria-label={c.faq.title}>
            {(Object.keys(lists) as (typeof tab)[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`faq-tab-${key}`}
                aria-selected={tab === key}
                aria-controls="faq-panel"
                className="rp-tab"
                onClick={() => setTab(key)}
              >
                {c.faq.tabs[key]}
              </button>
            ))}
          </div>
        </div>
        <div id="faq-panel" role="tabpanel" aria-labelledby={`faq-tab-${tab}`}>
          {lists[tab].map((item, i) => (
            <details key={`${tab}-${item.q}`} open={i === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ c, onToggleLocale }: SectionProps & { onToggleLocale: () => void }) {
  return (
    <footer>
      <div className="rp-paper">
        <div className="rp-wrap rp-section" style={{ textAlign: 'center' }}>
          <h2 className="rp-h-mid" style={{ maxWidth: '20ch', marginInline: 'auto' }}>
            {c.final.title}
          </h2>
          <p className="rp-soft" style={{ margin: '12px 0 24px' }}>
            {c.final.lead}
          </p>
          <div className="rp-row" style={{ justifyContent: 'center' }}>
            <Link href={BRAND_SIGNUP} className="rp-btn rp-btn--mint">
              {c.cta.postBrief}
            </Link>
            <Link href={CREATOR_SIGNUP} className="rp-btn rp-btn--ghost">
              {c.cta.joinCreator}
            </Link>
          </div>
        </div>
      </div>
      <div className="rp-wrap rp-footer">
        <b style={{ color: 'var(--color-ink)', fontWeight: 500 }}>ReelPal</b>
        <div className="rp-row" style={{ gap: 18 }}>
          <a href="#how">{c.nav.how}</a>
          <a href="#pricing">{c.nav.pricing}</a>
          <a href="#faq">{c.nav.faq}</a>
          <button
            type="button"
            className="rp-link"
            style={{ color: 'var(--color-primary)' }}
            onClick={onToggleLocale}
          >
            {c.nav.language}
          </button>
        </div>
        <span className="rp-mono">{c.footer.rights}</span>
      </div>
    </footer>
  );
}
