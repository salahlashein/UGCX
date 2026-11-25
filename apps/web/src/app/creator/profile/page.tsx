'use client';

import React, { useEffect, useState } from 'react';
import type { Niche, PortfolioMediaType } from '@ugcx/shared-types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  Dropzone,
  FilterChip,
  Icon,
  QueryStateView,
  StatusBadge,
  Tag,
  TextInput,
} from '../../../components/ui';
import { colors, radius, spacing } from '../../../theme/tokens';
import {
  useAddPortfolioItem,
  useCreatorProfile,
  useCreatorStats,
  useDeletePortfolioItem,
  usePortfolioItems,
  useUpdateCreatorProfile,
} from '../../../hooks/api/useCreator';
import {
  useRequestUploadUrl,
  uploadBrowserFileToPresignedUrl,
} from '../../../hooks/api/useStorage';
import { extractErrorMessage } from '../../../services/apiHelpers';
import { useTranslation } from '../../../i18n';
import { formatMoney, getInitials } from '../../../utils/format';

const NICHES: { key: Niche; labelEn: string; labelAr: string }[] = [
  { key: 'beauty_personal_care', labelEn: 'Beauty & Care', labelAr: 'الجمال والعناية' },
  { key: 'fashion', labelEn: 'Fashion', labelAr: 'الأزياء والموضة' },
  { key: 'food_fmcg', labelEn: 'Food & FMCG', labelAr: 'الأغذية والمشروبات' },
  { key: 'mom_baby', labelEn: 'Mom & Baby', labelAr: 'الأم والطفل' },
  { key: 'home_lifestyle', labelEn: 'Home & Lifestyle', labelAr: 'المنزل ونمط الحياة' },
  { key: 'other', labelEn: 'Other', labelAr: 'أخرى' },
];

export default function CreatorProfilePage() {
  const { t, locale } = useTranslation();

  const profileQuery = useCreatorProfile();
  const statsQuery = useCreatorStats();
  const portfolioQuery = usePortfolioItems();
  const updateProfile = useUpdateCreatorProfile();
  const addPortfolio = useAddPortfolioItem();
  const deletePortfolio = useDeletePortfolioItem();
  const requestUploadUrl = useRequestUploadUrl();

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [niches, setNiches] = useState<Niche[]>([]);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileQuery.data) {
      setDisplayName(profileQuery.data.displayName ?? '');
      setCity(profileQuery.data.city ?? '');
      setBasePrice(profileQuery.data.basePrice ? String(profileQuery.data.basePrice) : '');
      setNiches(profileQuery.data.niches ?? []);
    }
  }, [profileQuery.data]);

  const toggleNiche = (n: Niche) => {
    setNiches((prev) => (prev.includes(n) ? prev.filter((item) => item !== n) : [...prev, n]));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(false);

    try {
      await updateProfile.mutateAsync({
        displayName: displayName.trim() || undefined,
        city: city.trim() || undefined,
        niches,
        basePrice: basePrice ? parseInt(basePrice, 10) : undefined,
      });
      setSavedSuccess(true);
      profileQuery.refetch();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleUploadPortfolioItem = async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const presigned = await requestUploadUrl.mutateAsync({
        module: 'portfolio',
        contentType: file.type || 'video/mp4',
        fileSize: file.size,
      });

      await uploadBrowserFileToPresignedUrl(file, presigned.uploadUrl, setUploadProgress);

      await addPortfolio.mutateAsync({
        mediaUrl: presigned.fileUrl,
        mediaType: 'video',
      });

      setUploadFile(null);
      setUploadProgress(null);
      setIsUploading(false);
      portfolioQuery.refetch();
    } catch (err) {
      setError(extractErrorMessage(err));
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const portfolioItems = portfolioQuery.data || [];

  return (
    <AppShell requiredRole="creator">
      <QueryStateView
        isLoading={profileQuery.isLoading}
        isError={profileQuery.isError}
        data={profileQuery.data}
        onRetry={() => {
          profileQuery.refetch();
          portfolioQuery.refetch();
        }}
      >
        {(creator) => (
          <form
            onSubmit={handleSaveProfile}
            style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: spacing.md,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <AppText variant="caption" color={colors.textSecondary}>
                  {locale === 'ar'
                    ? 'ملف صانع المحتوى وبيانات العرض'
                    : 'Creator profile & public brief view'}
                </AppText>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                    {locale === 'ar' ? 'الملف الشخصي' : 'Creator profile'}
                  </AppText>
                  {creator.vettingStatus && (
                    <StatusBadge status={creator.vettingStatus} domain="custom" />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                {savedSuccess && (
                  <span style={{ fontSize: 13, color: colors.primary, fontWeight: 500 }}>
                    ✓ {locale === 'ar' ? 'تم الحفظ' : 'Saved'}
                  </span>
                )}
                <Button type="submit" variant="primary" loading={updateProfile.isPending}>
                  {locale === 'ar' ? 'حفظ التغييرات' : 'Save profile'}
                </Button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  borderRadius: radius.chip,
                  backgroundColor: '#fef2f2',
                  border: `1px solid ${colors.danger}`,
                  color: colors.danger,
                  fontSize: 13,
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {error}
              </div>
            )}

            {/* 2-Column: Editor & Live Brand-View Preview */}
            <div
              className="ugcx-split"
              style={
                {
                  gap: spacing.xl,
                  ['--split-main' as string]: '1.4fr',
                  ['--split-side-min' as string]: '320px',
                } as React.CSSProperties
              }
            >
              {/* Left Column: Form Fields and Portfolio Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
                {/* Basics Card */}
                <Card
                  elevation="card"
                  style={{
                    padding: spacing.xl,
                    borderRadius: radius.card,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.md,
                  }}
                >
                  <AppText
                    variant="subtitle"
                    style={{ fontWeight: 500, color: colors.textPrimary }}
                  >
                    {locale === 'ar' ? 'البيانات الأساسية' : 'Basics'}
                  </AppText>

                  <div className="ugcx-two-input-grid" style={{ gap: spacing.md }}>
                    <TextInput
                      label={locale === 'ar' ? 'الاسم المعروض' : 'Display name'}
                      value={displayName}
                      onChangeText={setDisplayName}
                      placeholder="e.g. Nour Hassan"
                    />
                    <TextInput
                      label={locale === 'ar' ? 'المدينة' : 'City'}
                      value={city}
                      onChangeText={setCity}
                      placeholder="e.g. Cairo, Alexandria"
                    />
                  </div>

                  <div>
                    <TextInput
                      label={locale === 'ar' ? 'السعر المبدئي (جنيه مصري)' : 'Base price (EGP)'}
                      type="number"
                      value={basePrice}
                      onChangeText={setBasePrice}
                      mono
                      dir="ltr"
                      placeholder="3000"
                    />
                    <AppText
                      variant="caption"
                      color={colors.textTertiary}
                      style={{ marginTop: 4, display: 'block' }}
                    >
                      {locale === 'ar'
                        ? `يظهر للعلامات التجارية على هيئة: يبدأ من ${formatMoney(basePrice || '0')}`
                        : `Brands see this as "from ${formatMoney(basePrice || '0')}".`}
                    </AppText>
                  </div>

                  <div>
                    <AppText
                      variant="dataMonoCaps"
                      color={colors.textSecondary}
                      style={{ marginBottom: spacing.xs, display: 'block' }}
                    >
                      {locale === 'ar' ? 'المجالات والاهتمامات' : 'Niches'}
                    </AppText>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                      {NICHES.map((n) => {
                        const isSelected = niches.includes(n.key);
                        return (
                          <FilterChip
                            key={n.key}
                            label={locale === 'ar' ? n.labelAr : n.labelEn}
                            selected={isSelected}
                            onClick={() => toggleNiche(n.key)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Portfolio Card */}
                <Card
                  elevation="card"
                  style={{
                    padding: spacing.xl,
                    borderRadius: radius.card,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.md,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <AppText
                      variant="subtitle"
                      style={{ fontWeight: 500, color: colors.textPrimary }}
                    >
                      {locale === 'ar' ? 'معرض الأعمال السابقة (Portfolio)' : 'Portfolio videos'}
                    </AppText>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: colors.textSecondary,
                      }}
                    >
                      {portfolioItems.length} {locale === 'ar' ? 'عنصر' : 'items'}
                    </span>
                  </div>

                  {/* Portfolio Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: spacing.md,
                    }}
                  >
                    {portfolioItems.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          position: 'relative',
                          aspectRatio: '9/16',
                          borderRadius: radius.card,
                          backgroundColor: '#000000',
                          overflow: 'hidden',
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {(item as any).thumbnailUrl || item.mediaUrl ? (
                          <img
                            src={(item as any).thumbnailUrl || item.mediaUrl}
                            alt="Portfolio"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                            }}
                          >
                            <Icon name="video" size={24} />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => deletePortfolio.mutate(item.id)}
                          style={{
                            position: 'absolute',
                            top: 6,
                            insetInlineEnd: 6,
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            border: 'none',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          aria-label="Delete item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Dropzone for adding new portfolio video */}
                  <div style={{ marginTop: spacing.sm }}>
                    <AppText
                      variant="dataMonoCaps"
                      color={colors.textSecondary}
                      style={{ marginBottom: spacing.xs, display: 'block' }}
                    >
                      {locale === 'ar' ? 'إضافة فيديو جديد للمعرض' : 'Upload new portfolio video'}
                    </AppText>
                    <Dropzone
                      accept="video/mp4,video/quicktime,video/webm"
                      maxSizeMB={250}
                      file={uploadFile}
                      onFileSelect={(file) => {
                        setUploadFile(file);
                        handleUploadPortfolioItem(file);
                      }}
                      progress={uploadProgress ?? undefined}
                    />
                  </div>
                </Card>
              </div>

              {/* Right Column: Sticky "What brands see" */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                  {locale === 'ar' ? 'كيف تراك العلامات التجارية' : 'What brands see'}
                </AppText>

                <Card
                  elevation="card"
                  style={{
                    padding: spacing.xl,
                    borderRadius: radius.card,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.md,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: radius.card,
                        backgroundColor: colors.accentSoft,
                        color: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 500,
                        fontSize: 20,
                      }}
                    >
                      {getInitials(displayName || creator.displayName)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <AppText variant="h2" style={{ fontWeight: 500, color: colors.textPrimary }}>
                        {displayName ||
                          creator.displayName ||
                          (locale === 'ar' ? 'صانع محتوى' : 'Creator')}
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {city || creator.city || 'Cairo, Egypt'}
                      </AppText>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.surfaceSoft,
                      borderRadius: radius.card,
                    }}
                  >
                    <AppText variant="dataMonoCaps" color={colors.textSecondary}>
                      {locale === 'ar' ? 'الأسعار تبدأ من' : 'Starting rate'}
                    </AppText>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 500,
                        fontSize: 20,
                        color: colors.primary,
                        marginTop: 2,
                        direction: 'ltr',
                        textAlign: 'start',
                      }}
                    >
                      {formatMoney(basePrice || creator.basePrice || '0')}
                    </div>
                  </div>

                  {/* Creator Stats Row */}
                  <div
                    className="ugcx-stats-row"
                    style={{
                      gap: spacing.xs,
                      padding: spacing.sm,
                      borderRadius: radius.card,
                      backgroundColor: colors.canvas,
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {locale === 'ar' ? 'المشاريع' : 'Jobs'}
                      </AppText>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 500,
                          color: colors.textPrimary,
                          marginTop: 2,
                        }}
                      >
                        {statsQuery.data?.jobsDone ?? 0}
                      </div>
                    </div>
                    <div>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {locale === 'ar' ? 'القبول' : 'Approval'}
                      </AppText>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 500,
                          color: colors.textPrimary,
                          marginTop: 2,
                        }}
                      >
                        {statsQuery.data?.approvalRate ?? 100}%
                      </div>
                    </div>
                    <div>
                      <AppText variant="caption" color={colors.textSecondary}>
                        {locale === 'ar' ? 'التعديلات' : 'Revisions'}
                      </AppText>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 500,
                          color: colors.textPrimary,
                          marginTop: 2,
                        }}
                      >
                        {statsQuery.data?.averageRevisions ?? 0}
                      </div>
                    </div>
                  </div>

                  <div>
                    <AppText
                      variant="dataMonoCaps"
                      color={colors.textSecondary}
                      style={{ marginBottom: spacing.xs, display: 'block' }}
                    >
                      {locale === 'ar' ? 'المجالات المعتمدة' : 'Niches'}
                    </AppText>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                      {niches.map((n) => (
                        <Tag key={n} tone="done">
                          {NICHES.find((item) => item.key === n)?.labelEn || n}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  {/* Portfolio sample previews */}
                  <div>
                    <AppText
                      variant="dataMonoCaps"
                      color={colors.textSecondary}
                      style={{ marginBottom: spacing.xs, display: 'block' }}
                    >
                      {locale === 'ar' ? 'معاينة أعمال المعرض' : 'Portfolio previews'}
                    </AppText>
                    <div className="ugcx-thumb-row" style={{ gap: spacing.xs }}>
                      {portfolioItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          style={{
                            aspectRatio: '9/16',
                            borderRadius: radius.chip,
                            backgroundColor: '#000000',
                            overflow: 'hidden',
                          }}
                        >
                          {(item as any).thumbnailUrl || item.mediaUrl ? (
                            <img
                              src={(item as any).thumbnailUrl || item.mediaUrl}
                              alt="Sample"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                              }}
                            >
                              <Icon name="play" size={16} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        )}
      </QueryStateView>
    </AppShell>
  );
}
