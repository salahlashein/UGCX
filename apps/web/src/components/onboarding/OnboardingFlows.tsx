'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Niche, OnboardingStatus } from '@ugcx/shared-types';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { Dropzone } from '../ui/Dropzone';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../i18n';
import { useUpdateMe } from '../../hooks/api/useMe';
import { useUpdateBrandProfile } from '../../hooks/api/useBrand';
import { useAddPortfolioItem, useUpdateCreatorProfile } from '../../hooks/api/useCreator';
import { useRequestUploadUrl, uploadBrowserFileToPresignedUrl } from '../../hooks/api/useStorage';
import { useCompleteOnboarding, useOnboardingInsights } from '../../hooks/api/useOnboarding';
import { extractErrorMessage } from '../../services/apiHelpers';
import { resolveVideoContentType } from '../../utils/inputHelpers';
import {
  clampPrice,
  initialsFrom,
  resumeStepIndex,
  toggleNiche,
  MAX_NICHES,
} from '../../utils/onboarding';
import { Avatar, OnboardingLayout, PreviewCard } from './OnboardingLayout';
import { FormError, NicheTiles, PriceSlider, StepActions, StepHeading } from './OnboardingControls';

const COUNTRIES = ['EG', 'SA', 'AE', 'KW', 'QA'] as const;

/** A step is a form, so Enter submits it and the browser checks required fields. */
function StepForm({ onSubmit, children }: { onSubmit: () => void; children: React.ReactNode }) {
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
    >
      {children}
    </form>
  );
}

// ---------------------------------------------------------------- Brand owner

export function BrandOwnerFlow({ status }: { status: OnboardingStatus }) {
  const { t } = useTranslation();
  const router = useRouter();
  const updateMe = useUpdateMe();
  const updateBrand = useUpdateBrandProfile();
  const requestUploadUrl = useRequestUploadUrl();
  const complete = useCompleteOnboarding();
  const insights = useOnboardingInsights();

  const [step, setStep] = useState(() => resumeStepIndex(status));
  const [displayName, setDisplayName] = useState(status.displayName ?? '');
  const [brandName, setBrandName] = useState(status.brand?.name ?? '');
  const [category, setCategory] = useState<Niche | null>(status.brand?.category ?? null);
  const [country, setCountry] = useState(status.brand?.country ?? 'EG');
  const [logoUrl, setLogoUrl] = useState<string | null>(status.brand?.logoUrl ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const categoryLabel = category ? t(`niche.${category}`, category) : null;
  const countryLabel = t(`onboarding.countries.${country}`, country);
  const steps = [
    {
      label: t('onboarding.brand.steps.name', 'Your brand'),
      detail:
        step > 0
          ? `${displayName} · ${brandName}`
          : t('onboarding.brand.steps.nameDetail', 'Your name and brand name'),
    },
    {
      label: t('onboarding.brand.steps.category', 'Category'),
      detail:
        step > 1 && categoryLabel
          ? `${categoryLabel} · ${countryLabel}`
          : t('onboarding.brand.steps.categoryDetail', 'What you sell, where'),
    },
    {
      label: t('onboarding.brand.steps.logo', 'Logo'),
      detail:
        step > 2
          ? logoUrl
            ? t('onboarding.brand.logoAdded', 'Logo added')
            : t('onboarding.brand.logoSkipped', 'Using initials')
          : t('onboarding.optional', 'Optional'),
    },
    {
      label: t('onboarding.brand.steps.ready', 'Ready'),
      detail: t('onboarding.brand.steps.readyDetail', 'Post your first brief'),
    },
  ];

  const run = async (work: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(extractErrorMessage(err));
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  const saveName = () => {
    const errors: Record<string, string> = {};
    if (!displayName.trim())
      errors.displayName = t('onboarding.errors.yourName', 'Enter your name.');
    if (!brandName.trim())
      errors.brandName = t('onboarding.errors.brandName', 'Enter your brand name.');
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    void run(async () => {
      await updateMe.mutateAsync({ displayName: displayName.trim() });
      await updateBrand.mutateAsync({ companyName: brandName.trim() });
      setStep(1);
    });
  };

  const saveCategory = () => {
    if (!category) {
      setFieldErrors({
        category: t('onboarding.errors.category', 'Choose what your brand sells.'),
      });
      return;
    }
    setFieldErrors({});
    void run(async () => {
      await updateBrand.mutateAsync({ category, country });
      setStep(2);
    });
  };

  const finishLogo = (withLogo: boolean) =>
    void run(async () => {
      if (withLogo && logoFile && !logoUrl) {
        setProgress(1);
        const { uploadUrl, fileUrl } = await requestUploadUrl.mutateAsync({
          module: 'brand_logo',
          contentType: logoFile.type,
          fileSize: logoFile.size,
        });
        await uploadBrowserFileToPresignedUrl(logoFile, uploadUrl, setProgress, logoFile.type);
        await updateBrand.mutateAsync({ logoUrl: fileUrl });
        setLogoUrl(fileUrl);
      }
      setProgress(null);
      await complete.mutateAsync();
      setStep(3);
    });

  const preview = (
    <PreviewCard
      initials={initialsFrom(brandName, 'B')}
      logoUrl={logoUrl}
      name={brandName.trim() || t('onboarding.brand.previewName', 'Your brand')}
      meta={`${countryLabel} · ${t('onboarding.brand.previewMeta', 'Brand on ReelPal')}`}
      tags={[categoryLabel ?? t('onboarding.brand.noCategory', 'Category: not set yet')]}
    />
  );

  return (
    <OnboardingLayout
      steps={steps}
      current={step}
      preview={preview}
      previewLabel={t('onboarding.brand.previewLabel', 'What creators will see')}
    >
      {step === 0 && (
        <StepForm onSubmit={saveName}>
          <StepHeading
            title={t('onboarding.brand.nameTitle', 'Welcome! Who are we working with?')}
            hint={t(
              'onboarding.brand.nameHint',
              'Creators see your brand name on every brief and message.',
            )}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing.md,
            }}
          >
            <TextInput
              label={t('onboarding.yourName', 'Your name')}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Salma Ibrahim"
              error={fieldErrors.displayName}
              required
            />
            <TextInput
              label={t('onboarding.brand.brandName', 'Brand name')}
              value={brandName}
              onChangeText={setBrandName}
              placeholder="Glow Lab"
              error={fieldErrors.brandName}
              required
            />
          </div>
          <FormError message={error} />
          <StepActions
            primaryLabel={t('common.continue', 'Continue')}
            loading={busy}
            showEnterHint
          />
        </StepForm>
      )}

      {step === 1 && (
        <StepForm onSubmit={saveCategory}>
          <StepHeading
            title={t('onboarding.brand.categoryTitle', 'What does {{brand}} sell?', {
              brand: brandName.trim() || t('onboarding.brand.yourBrand', 'your brand'),
            })}
            hint={t(
              'onboarding.brand.categoryHint',
              'We use this to suggest creators who know your category.',
            )}
          />
          <NicheTiles
            label={t('onboarding.brand.steps.category', 'Category')}
            selected={category ? [category] : []}
            onToggle={(n) => setCategory(n)}
            multi={false}
            counts={insights.data?.creatorsByNiche}
            countLabel={(n) =>
              n === 1
                ? t('onboarding.brand.creatorCountOne', '1 creator')
                : t('onboarding.brand.creatorCount', '{{count}} creators', { count: n })
            }
          />
          {fieldErrors.category ? (
            <div role="alert">
              <AppText variant="bodySm" color="danger">
                {fieldErrors.category}
              </AppText>
            </div>
          ) : null}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: colors.textPrimary }}>
              {t('onboarding.brand.country', 'Country')}
            </span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                padding: '12px 13px',
                borderRadius: radius.md,
                border: `1px solid ${colors.borderStrong}`,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                font: 'inherit',
              }}
            >
              {COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {t(`onboarding.countries.${code}`, code)}
                </option>
              ))}
            </select>
          </label>
          <FormError message={error} />
          <StepActions
            onBack={() => setStep(0)}
            primaryLabel={t('common.continue', 'Continue')}
            loading={busy}
          />
        </StepForm>
      )}

      {step === 2 && (
        <StepForm onSubmit={() => finishLogo(true)}>
          <StepHeading
            title={t('onboarding.brand.logoTitle', 'Add your logo')}
            hint={t(
              'onboarding.brand.logoHint',
              'Optional. Briefs with a logo get more proposals.',
            )}
          />
          {logoUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Avatar initials={initialsFrom(brandName, 'B')} logoUrl={logoUrl} size={64} />
              <Button
                type="button"
                variant="secondary"
                title={t('onboarding.brand.replaceLogo', 'Replace logo')}
                onClick={() => setLogoUrl(null)}
              />
            </div>
          ) : (
            <Dropzone
              accept="image/png,image/jpeg"
              maxSizeMB={5}
              file={logoFile}
              onFileSelect={setLogoFile}
              progress={progress ?? undefined}
            />
          )}
          <FormError message={error} />
          <StepActions
            onBack={() => setStep(1)}
            onSkip={() => finishLogo(false)}
            primaryLabel={t('common.continue', 'Continue')}
            loading={busy}
          />
        </StepForm>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <Avatar initials={initialsFrom(brandName, 'B')} logoUrl={logoUrl} size={64} />
            <StepHeading
              title={t('onboarding.brand.readyTitle', '{{brand}} is ready, {{name}}', {
                brand: brandName.trim(),
                name: displayName.trim().split(/\s+/)[0] ?? '',
              })}
            />
          </div>
          <AppText variant="body" color="textSecondary">
            {t('onboarding.brand.readyHint', 'Post a brief and creators can send proposals today.')}
          </AppText>
          <dl style={{ margin: 0 }}>
            {[
              [t('onboarding.brand.brandName', 'Brand name'), brandName],
              [t('onboarding.brand.steps.category', 'Category'), categoryLabel ?? ''],
              [t('onboarding.brand.country', 'Country'), countryLabel],
            ].map(([k, v], i) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: spacing.sm,
                  padding: '10px 0',
                  borderTop: i ? `1px solid ${colors.border}` : 'none',
                  fontSize: 14,
                }}
              >
                <dt style={{ color: colors.textSecondary }}>{k}</dt>
                <dd style={{ margin: 0, fontWeight: 500 }}>{v}</dd>
              </div>
            ))}
          </dl>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="secondary"
              title={t('onboarding.goDashboard', 'Go to dashboard')}
              onClick={() => router.replace('/brand/dashboard')}
            />
            <Button
              variant="primary"
              icon="plus"
              title={t('onboarding.brand.postBrief', 'Post a brief')}
              onClick={() => router.replace('/brand/briefs/new')}
            />
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}

// ---------------------------------------------------------------- Invited teammate

export function BrandMemberFlow({ status }: { status: OnboardingStatus }) {
  const { t } = useTranslation();
  const router = useRouter();
  const updateMe = useUpdateMe();
  const complete = useCompleteOnboarding();
  const [displayName, setDisplayName] = useState(status.displayName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const brandName = status.brand?.name || t('onboarding.member.theBrand', 'the brand');
  const role = status.brand?.memberRole ?? 'viewer';
  const roleLabel = t(`onboarding.member.roles.${role}`, role);

  const submit = async () => {
    if (!displayName.trim()) {
      setFieldError(t('onboarding.errors.yourName', 'Enter your name.'));
      return;
    }
    setFieldError(undefined);
    setError(null);
    setBusy(true);
    try {
      await updateMe.mutateAsync({ displayName: displayName.trim() });
      await complete.mutateAsync();
      router.replace('/brand/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err));
      setBusy(false);
    }
  };

  const preview = (
    <PreviewCard
      initials={initialsFrom(status.brand?.name, 'B')}
      logoUrl={status.brand?.logoUrl}
      name={brandName}
      meta={
        status.brand?.ownerName
          ? t('onboarding.member.addedBy', 'Added by {{name}}', { name: status.brand.ownerName })
          : t('onboarding.brand.previewMeta', 'Brand on ReelPal')
      }
      tags={[t('onboarding.member.roleTag', 'Role: {{role}}', { role: roleLabel })]}
    />
  );

  return (
    <OnboardingLayout
      steps={[
        {
          label: t('onboarding.member.step', 'Your name'),
          detail: t('onboarding.member.stepDetail', 'Then open {{brand}}', { brand: brandName }),
        },
      ]}
      current={0}
      preview={preview}
      previewLabel={t('onboarding.member.previewLabel', 'You are joining')}
    >
      <StepForm onSubmit={submit}>
        <StepHeading
          title={t('onboarding.member.title', 'Welcome to {{brand}}', { brand: brandName })}
          hint={t(`onboarding.member.roleHint.${role}`, 'Tell the team your name.')}
        />
        <TextInput
          label={t('onboarding.yourName', 'Your name')}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Omar Khaled"
          error={fieldError}
          required
        />
        <FormError message={error} />
        <StepActions
          primaryLabel={t('onboarding.member.open', 'Open {{brand}}', { brand: brandName })}
          loading={busy}
          showEnterHint
        />
      </StepForm>
    </OnboardingLayout>
  );
}

// ---------------------------------------------------------------- Creator

export function CreatorFlow({ status }: { status: OnboardingStatus }) {
  const { t } = useTranslation();
  const router = useRouter();
  const updateMe = useUpdateMe();
  const updateCreator = useUpdateCreatorProfile();
  const addPortfolio = useAddPortfolioItem();
  const requestUploadUrl = useRequestUploadUrl();
  const complete = useCompleteOnboarding();

  const c = status.creator;
  const [step, setStep] = useState(() => resumeStepIndex(status));
  const [displayName, setDisplayName] = useState(c?.displayName ?? status.displayName ?? '');
  const [city, setCity] = useState(c?.city ?? '');
  const [niches, setNiches] = useState<Niche[]>(c?.niches ?? []);
  const [price, setPrice] = useState(c?.basePrice ? Math.round(Number(c.basePrice)) : 1000);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [sampleAdded, setSampleAdded] = useState((c?.portfolioCount ?? 0) > 0);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sentAt] = useState(() => new Date());

  const insights = useOnboardingInsights(city.trim() || undefined);
  const band = insights.data?.priceBand ?? null;

  const nicheLabels = niches.map((n) => t(`niche.${n}`, n));
  const steps = [
    {
      label: t('onboarding.creator.steps.name', 'About you'),
      detail:
        step > 0
          ? `${displayName} · ${city}`
          : t('onboarding.creator.steps.nameDetail', 'Name and city'),
    },
    {
      label: t('onboarding.creator.steps.niches', 'Niches'),
      detail:
        step > 1
          ? nicheLabels.join(', ')
          : t('onboarding.creator.steps.nichesDetail', 'What you film best'),
    },
    {
      label: t('onboarding.creator.steps.price', 'Price'),
      detail:
        step > 2
          ? `EGP ${clampPrice(price).toLocaleString('en-US')}`
          : t('onboarding.creator.steps.priceDetail', 'Your starting price'),
    },
    {
      label: t('onboarding.creator.steps.sample', 'Sample video'),
      detail:
        step > 3
          ? sampleAdded
            ? t('onboarding.creator.sampleAdded', '1 sample video')
            : t('onboarding.creator.sampleSkipped', 'Skipped')
          : t('onboarding.optional', 'Optional'),
    },
    {
      label: t('onboarding.creator.steps.review', 'Review'),
      detail: t('onboarding.creator.steps.reviewDetail', 'We check your profile'),
    },
  ];

  const run = async (work: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(extractErrorMessage(err));
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  const saveName = () => {
    const errors: Record<string, string> = {};
    if (!displayName.trim())
      errors.displayName = t('onboarding.errors.creatorName', 'Enter the name brands should see.');
    if (!city.trim()) errors.city = t('onboarding.errors.city', 'Enter your city.');
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    void run(async () => {
      await updateCreator.mutateAsync({ displayName: displayName.trim(), city: city.trim() });
      await updateMe.mutateAsync({ displayName: displayName.trim() });
      setStep(1);
    });
  };

  const saveNiches = () => {
    if (niches.length === 0) {
      setFieldErrors({ niches: t('onboarding.errors.niches', 'Choose at least one niche.') });
      return;
    }
    setFieldErrors({});
    void run(async () => {
      await updateCreator.mutateAsync({ niches });
      setStep(2);
    });
  };

  const savePrice = () =>
    void run(async () => {
      const value = clampPrice(price);
      setPrice(value);
      await updateCreator.mutateAsync({ basePrice: value });
      setStep(3);
    });

  const finishSample = (withSample: boolean) =>
    void run(async () => {
      if (withSample && sampleFile) {
        const contentType = resolveVideoContentType(sampleFile);
        if (!contentType) {
          throw new Error(
            t(
              'onboarding.errors.videoType',
              'This file type is not supported. Use MP4, MOV or WEBM.',
            ),
          );
        }
        setProgress(1);
        const presigned = await requestUploadUrl.mutateAsync({
          module: 'portfolio',
          contentType,
          fileSize: sampleFile.size,
        });
        await uploadBrowserFileToPresignedUrl(
          sampleFile,
          presigned.uploadUrl,
          setProgress,
          contentType,
        );
        await addPortfolio.mutateAsync({ mediaUrl: presigned.fileUrl, mediaType: 'video' });
        setSampleAdded(true);
      }
      setProgress(null);
      await complete.mutateAsync();
      setStep(4);
    });

  const bandLabel = band
    ? band.basis === 'city'
      ? t('onboarding.creator.bandCity', 'Most creators in {{city}}: EGP {{low}}–{{high}}', {
          city: band.city ?? city,
          low: band.low.toLocaleString('en-US'),
          high: band.high.toLocaleString('en-US'),
        })
      : t('onboarding.creator.bandAll', 'Most creators on ReelPal: EGP {{low}}–{{high}}', {
          low: band.low.toLocaleString('en-US'),
          high: band.high.toLocaleString('en-US'),
        })
    : null;

  const preview = (
    <PreviewCard
      initials={initialsFrom(displayName, 'C')}
      name={displayName.trim() || t('onboarding.creator.previewName', 'Your name')}
      meta={
        [
          city.trim(),
          step > 2 || c?.basePrice
            ? t('onboarding.creator.fromPrice', 'from EGP {{price}}', {
                price: clampPrice(price).toLocaleString('en-US'),
              })
            : null,
        ]
          .filter(Boolean)
          .join(' · ') || t('onboarding.creator.previewMeta', 'Creator on ReelPal')
      }
      tags={nicheLabels}
    />
  );

  return (
    <OnboardingLayout
      steps={steps}
      current={step}
      preview={preview}
      previewLabel={t('onboarding.creator.previewLabel', 'What brands will see')}
    >
      {step === 0 && (
        <StepForm onSubmit={saveName}>
          <StepHeading
            title={t('onboarding.creator.nameTitle', 'Welcome! What should brands call you?')}
            hint={t(
              'onboarding.creator.nameHint',
              'This name shows on your proposals, chats and profile.',
            )}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing.md,
            }}
          >
            <TextInput
              label={t('onboarding.creator.creatorName', 'Creator name')}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Mariam Adel"
              error={fieldErrors.displayName}
              required
            />
            <TextInput
              label={t('onboarding.creator.city', 'City')}
              value={city}
              onChangeText={setCity}
              placeholder={t('onboarding.creator.cityPlaceholder', 'Cairo')}
              error={fieldErrors.city}
              required
            />
          </div>
          <FormError message={error} />
          <StepActions
            primaryLabel={t('common.continue', 'Continue')}
            loading={busy}
            showEnterHint
          />
        </StepForm>
      )}

      {step === 1 && (
        <StepForm onSubmit={saveNiches}>
          <StepHeading
            title={t('onboarding.creator.nichesTitle', 'What do you film best?')}
            hint={t(
              'onboarding.creator.nichesHint',
              'Pick up to {{max}}. Discover shows these briefs first.',
              { max: MAX_NICHES },
            )}
          />
          <NicheTiles
            label={t('onboarding.creator.steps.niches', 'Niches')}
            selected={niches}
            onToggle={(n) => setNiches((current) => toggleNiche(current, n))}
            multi
            counts={insights.data?.openBriefsByNiche}
            countLabel={(n) =>
              n === 1
                ? t('onboarding.creator.briefCountOne', '1 open brief')
                : t('onboarding.creator.briefCount', '{{count}} open briefs', { count: n })
            }
          />
          <div role={fieldErrors.niches ? 'alert' : undefined}>
            <AppText variant="bodySm" color={fieldErrors.niches ? 'danger' : 'textSecondary'}>
              {fieldErrors.niches ??
                t('onboarding.creator.nichesChosen', '{{count}} of {{max}} chosen', {
                  count: niches.length,
                  max: MAX_NICHES,
                })}
            </AppText>
          </div>
          <FormError message={error} />
          <StepActions
            onBack={() => setStep(0)}
            primaryLabel={t('common.continue', 'Continue')}
            loading={busy}
          />
        </StepForm>
      )}

      {step === 2 && (
        <StepForm onSubmit={savePrice}>
          <StepHeading
            title={t('onboarding.creator.priceTitle', 'Your starting price per video')}
            hint={t(
              'onboarding.creator.priceHint',
              'Your proposals start from this. You can change it on every brief.',
            )}
          />
          <PriceSlider value={price} onChange={setPrice} band={band} bandLabel={bandLabel} />
          <FormError message={error} />
          <StepActions
            onBack={() => setStep(1)}
            primaryLabel={t('common.continue', 'Continue')}
            loading={busy}
          />
        </StepForm>
      )}

      {step === 3 && (
        <StepForm onSubmit={() => finishSample(true)}>
          <StepHeading
            title={t('onboarding.creator.sampleTitle', 'Show us your work')}
            hint={t(
              'onboarding.creator.sampleHint',
              'Optional, but approval is faster with one sample video.',
            )}
          />
          {sampleAdded ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                borderRadius: radius.card,
                backgroundColor: colors.accentSoft,
              }}
            >
              <Icon name="check-circle" size={20} color="primary" />
              <AppText variant="body">
                {t('onboarding.creator.sampleSaved', 'Your sample video is saved.')}
              </AppText>
            </div>
          ) : (
            <Dropzone
              accept="video/mp4,video/quicktime,video/webm"
              maxSizeMB={500}
              file={sampleFile}
              onFileSelect={setSampleFile}
              progress={progress ?? undefined}
            />
          )}
          <FormError message={error} />
          <StepActions
            onBack={() => setStep(2)}
            onSkip={sampleAdded ? undefined : () => finishSample(false)}
            primaryLabel={t('common.continue', 'Continue')}
            loading={busy}
          />
        </StepForm>
      )}

      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <StepHeading
            title={t(
              'onboarding.creator.reviewTitle',
              'Thanks, {{name}}. Here is what happens next',
              { name: displayName.trim().split(/\s+/)[0] ?? '' },
            )}
          />
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {[
              {
                state: 'done',
                title: t('onboarding.creator.tlSent', 'Profile sent'),
                body: sentAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
              },
              {
                state: 'now',
                title: t('onboarding.creator.tlReview', 'We review your profile'),
                body: t(
                  'onboarding.creator.tlReviewBody',
                  'Usually within 2 working days. We email you either way.',
                ),
              },
              {
                state: 'next',
                title: t('onboarding.creator.tlPropose', 'You send proposals'),
                body: t(
                  'onboarding.creator.tlProposeBody',
                  'Brands pay into escrow before you start.',
                ),
              },
            ].map((item, i, all) => (
              <li
                key={item.title}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr',
                  gap: spacing.sm,
                  paddingBottom: i < all.length - 1 ? 18 : 0,
                  position: 'relative',
                }}
              >
                {i < all.length - 1 ? (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      insetInlineStart: 12,
                      top: 26,
                      bottom: 0,
                      width: 2,
                      backgroundColor: colors.border,
                    }}
                  />
                ) : null}
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: radius.full,
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 1,
                    border: `2px solid ${item.state === 'done' ? colors.primary : item.state === 'now' ? '#b8892b' : colors.borderStrong}`,
                    backgroundColor:
                      item.state === 'done'
                        ? colors.primary
                        : item.state === 'now'
                          ? '#fff3d1'
                          : colors.surface,
                    color: '#ffffff',
                  }}
                >
                  {item.state === 'done' ? <Icon name="check" size={13} /> : null}
                </span>
                <div>
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  <AppText variant="bodySm" color="textSecondary">
                    {item.body}
                  </AppText>
                </div>
              </li>
            ))}
          </ol>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="secondary"
              title={t('onboarding.creator.editProfile', 'Edit profile')}
              onClick={() => router.replace('/creator/profile')}
            />
            <Button
              variant="primary"
              title={t('onboarding.creator.browse', 'Browse briefs')}
              onClick={() => router.replace('/creator/discover')}
            />
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
