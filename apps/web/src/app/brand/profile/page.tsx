'use client';

import React, { useEffect, useState } from 'react';
import type { BrandMemberRole, Niche } from '@ugcx/shared-types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AppText,
  Button,
  Card,
  Dropzone,
  FilterChip,
  GroupHeader,
  ListRow,
  QueryStateView,
  StatusBadge,
  Tag,
  TextInput,
} from '../../../components/ui';
import { colors, radius } from '../../../theme/tokens';
import { FEATURE_FLAGS } from '../../../config/features';
import {
  useBrandMembers,
  useBrandProfile,
  useBrandStats,
  useInviteMember,
  useRemoveMember,
  useResendInvite,
  useUpdateBrandProfile,
  useUpdateMemberRole,
} from '../../../hooks/api/useBrand';
import { useBrandRole } from '../../../hooks/useBrandRole';
import { useMyBriefs } from '../../../hooks/api/useCampaigns';
import { useMyCollaborations } from '../../../hooks/api/useCollaborations';
import {
  uploadBrowserFileToPresignedUrl,
  useRequestUploadUrl,
} from '../../../hooks/api/useStorage';
import { extractErrorMessage } from '../../../services/apiHelpers';
import { useTranslation } from '../../../i18n';
import { getInitials } from '../../../utils/format';

const NICHES: Niche[] = [
  'beauty_personal_care',
  'fashion',
  'mom_baby',
  'food_fmcg',
  'home_lifestyle',
  'other',
];

export default function BrandProfilePage() {
  const { t, locale } = useTranslation();
  const { role: memberRole } = useBrandRole();
  const isOwner = memberRole === 'owner';

  const profileQuery = useBrandProfile();
  const brandStatsQuery = useBrandStats();
  const updateProfile = useUpdateBrandProfile();
  const requestUploadUrl = useRequestUploadUrl();

  const briefsQuery = useMyBriefs('all');
  const collabsQuery = useMyCollaborations();

  const membersQuery = useBrandMembers();
  const inviteMember = useInviteMember();
  const resendInvite = useResendInvite();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('EG');
  const [category, setCategory] = useState<Niche>('beauty_personal_care');
  const [logoUrl, setLogoUrl] = useState('');
  const [savedBanner, setSavedBanner] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Logo upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'approver' | 'viewer'>('viewer');
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (profileQuery.data) {
      setCompanyName(profileQuery.data.companyName ?? '');
      setCountry(profileQuery.data.country ?? 'EG');
      if (profileQuery.data.category) {
        setCategory(profileQuery.data.category);
      }
      setLogoUrl(profileQuery.data.logoUrl ?? '');
    }
  }, [profileQuery.data]);

  const handleLogoUpload = async (file: File) => {
    setUploadError(null);
    setUploadFileName(file.name);
    setUploadProgress(10);

    try {
      const { uploadUrl, fileUrl } = await requestUploadUrl.mutateAsync({
        module: 'brand_logo',
        contentType: file.type,
        fileSize: file.size,
      });

      await uploadBrowserFileToPresignedUrl(file, uploadUrl, (pct) => setUploadProgress(pct));
      setLogoUrl(fileUrl);
      setUploadProgress(100);
    } catch (err) {
      setUploadError(extractErrorMessage(err));
      setUploadProgress(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setFormError(null);
    setSavedBanner(false);
    try {
      await updateProfile.mutateAsync({
        companyName: companyName.trim() || undefined,
        country: country.trim() || 'EG',
        category,
        logoUrl: logoUrl.trim() || undefined,
      });
      setSavedBanner(true);
    } catch (err) {
      setFormError(extractErrorMessage(err));
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !inviteEmail.trim()) return;

    setInviteError(null);
    try {
      await inviteMember.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail('');
    } catch (err) {
      setInviteError(extractErrorMessage(err));
    }
  };

  const briefsTotal = briefsQuery.data?.meta?.total ?? briefsQuery.data?.data?.length ?? 0;
  const hiredTotal = collabsQuery.data?.meta?.total ?? collabsQuery.data?.data?.length ?? 0;

  // Titles use the saved brand name, not the text still being edited.
  const savedBrandName = profileQuery.data?.companyName?.trim() || null;
  const logoLabel = savedBrandName
    ? locale === 'ar'
      ? `شعار ${savedBrandName}`
      : `${savedBrandName} logo`
    : t('brand.profile.logo', 'Brand Logo');

  return (
    <AppShell requiredRole="brand">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <AppText variant="displayMd" color="ink" as="h1">
              {savedBrandName ?? t('brand.profile.title', 'Brand profile')}
            </AppText>
            <AppText variant="caption" color="muted">
              {isOwner
                ? t('brand.profile.ownerSubtitle', 'Manage company details and brand team.')
                : t('brand.profile.readOnlySubtitle', 'View company details (read-only mode).')}
            </AppText>
          </div>
          {profileQuery.data ? (
            <StatusBadge status={profileQuery.data.verificationStatus} domain="custom" />
          ) : null}
        </div>

        <QueryStateView
          isLoading={profileQuery.isLoading}
          isError={profileQuery.isError}
          data={profileQuery.data}
          onRetry={() => profileQuery.refetch()}
        >
          {(brand) => (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Editor & Team */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <Card padding="lg" className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <AppText variant="titleSm" color="ink">
                      {t('brand.profile.details', 'Company Details')}
                    </AppText>
                    {!isOwner ? (
                      <Tag label={memberRole?.toUpperCase() || 'READ-ONLY'} tone="muted" />
                    ) : null}
                  </div>

                  {savedBanner ? (
                    <div
                      style={{
                        backgroundColor: colors.accentSoft,
                        padding: 12,
                        borderRadius: `${radius.md}px`,
                      }}
                    >
                      <AppText variant="caption" color="primary">
                        {t('common.done', 'Saved successfully')}
                      </AppText>
                    </div>
                  ) : null}

                  {formError ? (
                    <div
                      role="alert"
                      style={{
                        backgroundColor: colors.dangerSurface,
                        padding: 12,
                        borderRadius: `${radius.md}px`,
                      }}
                    >
                      <AppText variant="caption" color="danger">
                        {formError}
                      </AppText>
                    </div>
                  ) : null}

                  <form onSubmit={handleSave} className="flex flex-col gap-4">
                    <TextInput
                      label={t('brand.profile.companyName', 'Company name')}
                      value={companyName}
                      onChangeText={setCompanyName}
                      placeholder="Glow Lab"
                      disabled={!isOwner}
                      required
                    />

                    <TextInput
                      label={t('brand.profile.country', 'Country')}
                      value={country}
                      onChangeText={setCountry}
                      placeholder="EG"
                      disabled={!isOwner}
                      required
                    />

                    <div className="flex flex-col gap-2">
                      <AppText variant="label" color="ink">
                        {t('brand.setup.category', 'Category')}
                      </AppText>
                      <div className="flex flex-wrap gap-2">
                        {NICHES.map((n) => (
                          <FilterChip
                            key={n}
                            label={t(`niche.${n}`, n)}
                            selected={category === n}
                            onClick={() => {
                              if (isOwner) setCategory(n);
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Logo Section */}
                    <div className="flex flex-col gap-2">
                      <AppText variant="label" color="ink">
                        {logoLabel}
                      </AppText>
                      {logoUrl ? (
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoUrl}
                            alt={logoLabel}
                            width={48}
                            height={48}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }}
                          />
                          <AppText variant="caption" color="muted">
                            {isOwner
                              ? locale === 'ar'
                                ? 'الـlogo الحالي. ارفع صورة جديدة لو عايز تغيّره.'
                                : 'Current logo. Upload a new image to replace it.'
                              : locale === 'ar'
                                ? 'الـlogo الحالي'
                                : 'Current logo'}
                          </AppText>
                        </div>
                      ) : null}
                      {isOwner ? (
                        <Dropzone
                          accept={['image/png', 'image/jpeg', 'image/webp']}
                          maxBytes={5 * 1024 * 1024}
                          onFile={handleLogoUpload}
                          progress={uploadProgress}
                          fileName={uploadFileName}
                          error={uploadError}
                        />
                      ) : (
                        !logoUrl && (
                          <AppText variant="caption" color="muted">
                            {locale === 'ar' ? 'مفيش logo' : 'No logo uploaded'}
                          </AppText>
                        )
                      )}
                    </div>

                    {isOwner ? (
                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          title={t('common.save', 'Save changes')}
                          variant="primary"
                          loading={updateProfile.isPending}
                        />
                      </div>
                    ) : null}
                  </form>
                </Card>

                {/* Team Management (Gated by Feature Flag) */}
                {FEATURE_FLAGS.brandTeamManagement ? (
                  <Card padding="lg" className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <AppText variant="titleSm" color="ink">
                        {t('brand.profile.team', 'Team Members')}
                      </AppText>
                      <Tag label="MANAGEMENT" tone="accent" />
                    </div>

                    {isOwner ? (
                      <form onSubmit={handleInvite} className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-6">
                            <TextInput
                              placeholder="colleague@brand.com"
                              value={inviteEmail}
                              onChangeText={setInviteEmail}
                              type="email"
                              required
                            />
                          </div>
                          <div className="sm:col-span-3 flex items-center gap-1">
                            <FilterChip
                              label="Approver"
                              selected={inviteRole === 'approver'}
                              onClick={() => setInviteRole('approver')}
                            />
                            <FilterChip
                              label="Viewer"
                              selected={inviteRole === 'viewer'}
                              onClick={() => setInviteRole('viewer')}
                            />
                          </div>
                          <div className="sm:col-span-3 flex justify-end">
                            <Button
                              type="submit"
                              title={t('common.invite', 'Invite')}
                              variant="secondary"
                              size="sm"
                              loading={inviteMember.isPending}
                            />
                          </div>
                        </div>
                        {inviteError ? (
                          <AppText variant="caption" color="danger">
                            {inviteError}
                          </AppText>
                        ) : null}
                      </form>
                    ) : null}

                    {/* Members List */}
                    <div className="flex flex-col gap-1 mt-2">
                      <GroupHeader
                        label={t('brand.profile.members', 'Members')}
                        count={membersQuery.data?.length ?? 0}
                      />
                      {membersQuery.data && membersQuery.data.length > 0 ? (
                        <div className="divide-y divide-dashed overflow-hidden">
                          {membersQuery.data.map((member) => {
                            const isCaller = member.userId === brand.id;
                            const isSelfOwner = member.role === 'owner';

                            return (
                              <ListRow
                                key={member.id}
                                title={
                                  <div className="flex items-center gap-2">
                                    <AppText
                                      variant="bodySm"
                                      color="ink"
                                      style={{ fontWeight: 500 }}
                                    >
                                      {member.displayName || member.email || 'Team Member'}
                                    </AppText>
                                    <Tag
                                      label={member.role.toUpperCase()}
                                      tone={member.role === 'owner' ? 'accent' : 'muted'}
                                    />
                                  </div>
                                }
                                subtitle={
                                  <AppText variant="caption" color="muted">
                                    {member.email} · {member.status}
                                  </AppText>
                                }
                                trailing={
                                  isOwner && !isSelfOwner ? (
                                    <div className="flex items-center gap-2">
                                      {member.status === 'invited' && (
                                        <Button
                                          title={t('common.resend', 'Resend')}
                                          variant="secondary"
                                          size="sm"
                                          loading={resendInvite.isPending}
                                          onClick={() => resendInvite.mutate(member.id)}
                                        />
                                      )}
                                      <select
                                        value={member.role}
                                        onChange={(e) =>
                                          updateRole.mutate({
                                            id: member.id,
                                            role: e.target.value as Exclude<
                                              BrandMemberRole,
                                              'owner'
                                            >,
                                          })
                                        }
                                        style={{
                                          fontSize: '12px',
                                          padding: '4px 8px',
                                          borderRadius: `${radius.md}px`,
                                          borderColor: colors.dashLine,
                                          backgroundColor: colors.surface,
                                          color: colors.ink,
                                        }}
                                      >
                                        <option value="approver">Approver</option>
                                        <option value="viewer">Viewer</option>
                                      </select>
                                      <Button
                                        title={t('common.remove', 'Remove')}
                                        variant="danger"
                                        size="sm"
                                        onClick={() => removeMember.mutate(member.id)}
                                      />
                                    </div>
                                  ) : null
                                }
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <AppText variant="caption" color="muted" className="p-2">
                          {t('brand.profile.noMembers', 'No team members found.')}
                        </AppText>
                      )}
                    </div>
                  </Card>
                ) : null}
              </div>

              {/* Right Column: Sticky "What creators see" preview */}
              <div className="lg:col-span-5 lg:sticky lg:top-4 flex flex-col gap-4">
                <Card padding="lg" className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="mono-caps"
                      data-mono-caps="true"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        lineHeight: '14px',
                        fontWeight: 500,
                        letterSpacing: '0.6px',
                        color: colors.muted,
                        textTransform: 'uppercase',
                      }}
                    >
                      {t('brand.profile.previewOverline', 'What creators see')}
                    </span>
                    <StatusBadge status={brand.verificationStatus} domain="custom" />
                  </div>

                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={companyName}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: `${radius.lg}px`,
                          objectFit: 'cover',
                          backgroundColor: colors.accentSoft,
                        }}
                      />
                    ) : (
                      <div
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: `${radius.lg}px`,
                          backgroundColor: colors.accentSoft,
                        }}
                      >
                        <AppText variant="titleMd" color="primary">
                          {getInitials(companyName || 'Brand', 'BR')}
                        </AppText>
                      </div>
                    )}

                    <div className="flex flex-col min-w-0">
                      <AppText variant="titleMd" color="ink" className="truncate">
                        {companyName || 'Unnamed Brand'}
                      </AppText>
                      <AppText variant="caption" color="muted">
                        {country} · {t(`niche.${category}`, category)}
                      </AppText>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-3 gap-2 p-3 mt-1 text-center"
                    style={{
                      borderRadius: `${radius.card}px`,
                      border: `1px dashed ${colors.dashLine}`,
                      backgroundColor: colors.surfaceSoft,
                    }}
                  >
                    <div className="flex flex-col">
                      <span
                        className="mono-caps"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: colors.muted,
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('brand.profile.briefsPosted', 'Briefs')}
                      </span>
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '18px',
                          fontWeight: 500,
                          color: colors.ink,
                        }}
                      >
                        {brandStatsQuery.data?.briefsPosted ?? briefsTotal}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span
                        className="mono-caps"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: colors.muted,
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('brand.profile.creatorsHired', 'Hired')}
                      </span>
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '18px',
                          fontWeight: 500,
                          color: colors.ink,
                        }}
                      >
                        {brandStatsQuery.data?.creatorsHired ?? hiredTotal}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span
                        className="mono-caps"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: colors.muted,
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('brand.profile.avgApproval', 'Pays in')}
                      </span>
                      <span
                        className="tabular-nums"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '18px',
                          fontWeight: 500,
                          color: colors.ink,
                        }}
                      >
                        {brandStatsQuery.data?.avgApprovalDays != null
                          ? `${brandStatsQuery.data.avgApprovalDays}d`
                          : locale === 'ar'
                            ? 'جديد على ReelPal'
                            : 'New on ReelPal'}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </QueryStateView>
      </div>
    </AppShell>
  );
}
