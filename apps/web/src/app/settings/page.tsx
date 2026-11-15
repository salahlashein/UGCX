'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/layout/AppShell';
import { AppText, Button, Card, Icon, ListRow, SegmentedControl, Tag } from '../../components/ui';
import { FEATURE_FLAGS } from '../../config/features';
import { useAuthStore } from '../../store/authStore';
import { useBrandProfile } from '../../hooks/api/useBrand';
import { useBrandRole } from '../../hooks/useBrandRole';
import { useCreatorProfile } from '../../hooks/api/useCreator';
import { useMe, useUpdateMe } from '../../hooks/api/useMe';
import { apiPost } from '../../services/apiHelpers';
import { useTranslation } from '../../i18n';
import { colors, radius } from '../../theme/tokens';
import { getInitials } from '../../utils/format';

export default function SettingsPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const isBrand = user?.role === 'brand';
  const isCreator = user?.role === 'creator';

  const meQuery = useMe();
  const updateMe = useUpdateMe();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');

  const brandQuery = useBrandProfile();
  const creatorQuery = useCreatorProfile();
  const { role: brandMemberRole } = useBrandRole();

  const userDisplayName = meQuery.data?.displayName;
  const displayName =
    userDisplayName ||
    (isBrand
      ? brandQuery.data?.companyName || user?.email || 'Brand'
      : isCreator
        ? creatorQuery.data?.displayName || user?.email || 'Creator'
        : user?.email || 'User');

  const canAccessBilling =
    isBrand && (brandMemberRole === 'owner' || brandMemberRole === 'approver');
  const canAccessTeam = isBrand && FEATURE_FLAGS.brandTeamManagement;

  const handleSaveName = async () => {
    if (!nameVal.trim()) return;
    try {
      await updateMe.mutateAsync({ displayName: nameVal.trim() });
      setEditingName(false);
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (refreshToken) {
        await apiPost('/auth/logout', { refreshToken });
      }
    } catch {
      // Continue clearing local auth even if network fails
    } finally {
      clearAuth();
      router.replace('/login');
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto flex flex-col gap-6 w-full">
        <AppText variant="displayMd" color="ink" as="h1">
          {t('common.settings', 'Settings')}
        </AppText>

        {/* Identity Card */}
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
              {t('settings.account', 'Account & Role')}
            </span>
            <Tag label={(user?.role || 'user').toUpperCase()} tone="accent" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: `${radius.pill}px`,
                  backgroundColor: colors.accentSoft,
                }}
              >
                <AppText variant="titleSm" color="primary">
                  {getInitials(displayName, isBrand ? 'BR' : 'CR')}
                </AppText>
              </div>

              <div className="flex flex-col min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="px-2 py-1 text-sm border rounded"
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      placeholder={locale === 'ar' ? 'الاسم الظاهر' : 'Display name'}
                    />
                    <Button
                      title={locale === 'ar' ? 'حفظ' : 'Save'}
                      variant="primary"
                      size="sm"
                      loading={updateMe.isPending}
                      onClick={handleSaveName}
                    />
                    <Button
                      title={locale === 'ar' ? 'إلغاء' : 'Cancel'}
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingName(false)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AppText variant="titleSm" color="ink" className="truncate">
                      {displayName}
                    </AppText>
                    <button
                      type="button"
                      onClick={() => {
                        setNameVal(userDisplayName || '');
                        setEditingName(true);
                      }}
                      className="text-xs text-muted hover:text-ink cursor-pointer"
                    >
                      ✎
                    </button>
                  </div>
                )}
                <AppText variant="caption" color="muted">
                  {user?.email}
                  {isBrand && brandMemberRole ? ` · ${brandMemberRole.toUpperCase()}` : ''}
                </AppText>
              </div>
            </div>

            <Button
              title={t('settings.viewProfile', 'View profile')}
              variant="secondary"
              size="sm"
              onClick={() => {
                if (isBrand) router.push('/brand/profile');
                else if (isCreator) router.push('/creator/profile');
              }}
            />
          </div>
        </Card>

        {/* Language & Direction Card */}
        <Card padding="lg" className="flex flex-col gap-4">
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
            {t('common.language', 'Language & Direction')}
          </span>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <AppText variant="bodySm" color="body">
                {t('settings.interfaceLanguage', 'Interface language')}
              </AppText>
              <SegmentedControl
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ar', label: 'العربية' },
                ]}
                value={locale}
                onChange={(val) => {
                  const newLocale = val as 'en' | 'ar';
                  setLocale(newLocale);
                  updateMe.mutate({ locale: newLocale });
                }}
              />
            </div>

            <div
              className="flex items-center justify-between p-3"
              style={{
                borderRadius: `${radius.card}px`,
                border: `1px dashed ${colors.dashLine}`,
                backgroundColor: colors.surfaceSoft,
              }}
            >
              <AppText variant="caption" color="muted">
                {t('settings.layoutDirection', 'Layout direction')}
              </AppText>
              <AppText variant="caption" color="body" style={{ fontWeight: 500 }}>
                {locale === 'ar' ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
              </AppText>
            </div>
          </div>
        </Card>

        {/* Links & Security Card */}
        <Card padding="none" className="divide-y divide-dashed overflow-hidden">
          {/* Brand Team Link (gated by feature flag) */}
          {canAccessTeam ? (
            <ListRow
              leading={<Icon name="brand" size={18} color="muted" />}
              title={t('brand.profile.team', 'Team Members')}
              subtitle={t('brand.profile.teamSubtitle', 'Invite colleagues and manage roles')}
              onClick={() => router.push('/brand/profile')}
            />
          ) : null}

          {/* Brand Billing Link */}
          {canAccessBilling ? (
            <ListRow
              leading={<Icon name="credit-card" size={18} color="muted" />}
              title={t('nav.billing', 'Billing & Statements')}
              subtitle={t('brand.billing.subtitle', 'Campaign escrow and invoice history')}
              onClick={() => router.push('/brand/billing')}
            />
          ) : null}

          {/* Security */}
          <ListRow
            leading={<Icon name="shield-check" size={18} color="muted" />}
            title={t('settings.security', 'Security')}
            subtitle={`${t('settings.authMethod', 'Email one-time code')} · ${user?.email || ''}`}
          />
        </Card>

        {/* Session Log out */}
        <div className="flex justify-end pt-2">
          <Button
            title={t('common.logout', 'Log out')}
            variant="danger"
            icon="log-out"
            loading={loggingOut}
            onClick={handleLogout}
          />
        </div>
      </div>
    </AppShell>
  );
}
