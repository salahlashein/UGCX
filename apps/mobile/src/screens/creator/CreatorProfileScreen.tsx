import React, { useState, type ReactNode } from 'react';
import { Alert, StyleSheet, View, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorProfileStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Icon, type IconName } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useLogout } from '../../hooks/api/useAuth';
import {
  useCreatorProfile,
  usePortfolioItems,
  usePayoutDetails,
  useCreatorEarnings,
} from '../../hooks/api/useCreator';
import { setAppLocale, type AppLocale } from '../../i18n';
import { parseApiError } from '../../services/apiError';
import { colors, spacing, radius } from '../../theme/tokens';
import { formatAmount, formatCount, initialsOf } from '../../utils/format';
import { navigationRef } from '../../navigation/navigationRef';

type Props = NativeStackScreenProps<CreatorProfileStackParamList, 'Profile'>;

export function CreatorProfileScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const logout = useLogout();
  const profileQuery = useCreatorProfile();
  const { data: portfolioItems } = usePortfolioItems();
  const { data: payoutDetails } = usePayoutDetails(profileQuery.data?.id);
  const { data: earnings } = useCreatorEarnings();
  const [showPayoutNotice, setShowPayoutNotice] = useState(false);

  const currentLang = (i18n.language === 'ar' ? 'ar' : 'en') as AppLocale;

  if (profileQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (profileQuery.isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState
          message={parseApiError(profileQuery.error).message}
          onRetry={profileQuery.refetch}
        />
      </SafeAreaView>
    );
  }

  const profile = profileQuery.data;
  const name = profile?.displayName || t('creator.profile.title', 'Creator');
  const initials = initialsOf(name);

  const payoutMethodStr = payoutDetails
    ? `${payoutDetails.method} · ${payoutDetails.accountIdentifier}`
    : t('creator.profile.notSet', 'Not set');

  const formatNiche = (niche?: string) => {
    switch (niche) {
      case 'beauty_personal_care':
        return t('niche.beauty_personal_care', 'Beauty & Skincare');
      case 'mom_baby':
        return t('niche.mom_baby', 'Mom & baby');
      case 'food_fmcg':
        return t('niche.food_fmcg', 'Food & FMCG');
      case 'fashion':
        return t('niche.fashion', 'Fashion');
      case 'home_lifestyle':
        return t('niche.home_lifestyle', 'Home & Lifestyle');
      default:
        return niche || 'Niche';
    }
  };

  const metaLine = [
    profile?.city,
    profile?.niches?.[0] ? formatNiche(profile.niches[0]) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleLanguageChange = async (locale: AppLocale) => {
    if (locale === currentLang) return;
    const { directionChanged } = await setAppLocale(locale);
    if (directionChanged) {
      Alert.alert(t('common.language', 'Language'), t('brand.profile.restartForDirection'), [
        { text: t('common.done', 'Done') },
      ]);
    }
  };

  const goToEarnings = () => {
    const targetNav = (navigation.getParent() || navigationRef) as any;
    targetNav.navigate('EarningsTab', { screen: 'Earnings' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Identity card matching BrandProfileScreen */}
        <Card style={styles.identity}>
          <View style={styles.logo}>
            <AppText variant="titleMd" color="onPrimary">
              {initials}
            </AppText>
          </View>
          <View style={styles.nameRow}>
            <AppText variant="titleMd" color="ink" accessibilityRole="header">
              {name}
            </AppText>
            <View accessible accessibilityLabel={t('creator.profile.vetted', 'Vetted creator')}>
              <Icon name="check-circle" size={18} color="primary" />
            </View>
          </View>
          {metaLine ? (
            <AppText variant="bodySm" color="muted">
              {metaLine}
            </AppText>
          ) : null}

          {profile?.niches && profile.niches.length > 0 && (
            <View style={styles.chipRow}>
              {profile.niches.map((n) => (
                <View key={n} style={styles.chip}>
                  <AppText variant="caption" color="primary">
                    {formatNiche(n)}
                  </AppText>
                </View>
              ))}
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('EditProfile')}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <AppText variant="bodySm" color="ink">
              {t('brand.profile.edit', 'Edit profile')}
            </AppText>
          </Pressable>

          <View style={styles.stats}>
            <Stat
              value={formatCount(profile?.stats?.collaborations ?? 0)}
              label={t('creator.profile.statCollaborations', 'Collaborations')}
            />
            <Stat
              value={String(profile?.stats?.approved ?? 'N/A')}
              label={t('creator.profile.statApproved', 'Approved')}
              divider
            />
            <Stat
              value={String(profile?.stats?.revisionsAvg ?? 0)}
              label={t('creator.profile.statRevisions', 'Revisions avg')}
              divider
            />
          </View>
        </Card>

        {/* Portfolio section */}
        <View style={styles.sectionHeader}>
          <AppText variant="titleSm" color="ink">
            {t('creator.profile.portfolio', 'Portfolio')}
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('EditProfile')}
            hitSlop={12}
          >
            <AppText variant="bodySm" color="link">
              {t('creator.profile.edit', 'Edit')}
            </AppText>
          </Pressable>
        </View>
        {portfolioItems && portfolioItems.length > 0 ? (
          <View style={styles.grid}>
            {portfolioItems.map((item, i) => (
              <Card key={i} style={styles.tile}>
                {item.mediaType === 'image' ? (
                  <Image
                    source={{ uri: item.mediaUrl }}
                    style={styles.tileImage}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View style={styles.tileVideoPlaceholder}>
                    <View style={styles.tileIcon}>
                      <Icon name="video" size={20} color="primary" />
                    </View>
                    <AppText variant="bodySm" color="ink">
                      {t('creator.profile.video', 'Video')}
                    </AppText>
                  </View>
                )}
              </Card>
            ))}
          </View>
        ) : (
          <Card style={styles.emptyPortfolio}>
            <AppText variant="bodySm" color="muted">
              {t('creator.profile.emptyPortfolio', 'No portfolio items yet.')}
            </AppText>
          </Card>
        )}

        {/* Workspace Group matching BrandProfileScreen */}
        <Group title={t('brand.profile.groupWorkspace', 'Workspace')}>
          <Row
            icon="inbox"
            label={t('creator.profile.myProposals', 'My proposals')}
            onPress={() => navigation.navigate('MyProposals')}
          />
          <Row
            icon="dollar-sign"
            label={t('creator.profile.basePrice', 'Base price')}
            value={
              profile?.basePrice
                ? `EGP ${formatAmount(profile.basePrice)}`
                : t('creator.profile.notSet', 'Not set')
            }
            onPress={() => navigation.navigate('EditProfile')}
            divider
          />
        </Group>

        {/* Money Group matching BrandProfileScreen */}
        <Group title={t('brand.profile.groupMoney', 'Money')}>
          <Row
            icon="file-text"
            label={t('creator.earnings.title', 'Earnings & ledger')}
            value={`EGP ${formatAmount(earnings?.clearedBalance ?? 0)}`}
            onPress={goToEarnings}
          />
          <Row
            icon="credit-card"
            label={t('creator.profile.payoutDetails', 'Payout details')}
            value={payoutMethodStr}
            expanded={showPayoutNotice}
            onPress={() => setShowPayoutNotice((open) => !open)}
            divider
          />
          {showPayoutNotice ? (
            <AppText variant="bodySm" color="muted" style={styles.notice}>
              {t(
                'creator.profile.payoutDetailsNotice',
                'Payouts are sent via InstaPay, Vodafone Cash, or bank transfer from the Earnings tab.',
              )}
            </AppText>
          ) : null}
        </Group>

        {/* Preferences Group with inline Language Segmented Control matching BrandProfileScreen */}
        <Group title={t('brand.profile.groupPreferences', 'Preferences')}>
          <View style={styles.row}>
            <RowIcon name="globe" />
            <AppText variant="body" color="ink" style={styles.flex}>
              {t('common.language', 'Language')}
            </AppText>
            <View style={styles.segmented} accessibilityRole="radiogroup">
              {(['en', 'ar'] as const).map((locale) => {
                const active = currentLang === locale;
                return (
                  <Pressable
                    key={locale}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => handleLanguageChange(locale)}
                    style={[styles.segment, active && styles.segmentActive]}
                  >
                    <AppText variant="bodySm" color="ink">
                      {locale === 'en' ? 'English' : 'العربية'}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => logout.mutate()}
            style={({ pressed }) => [styles.row, styles.divider, pressed && styles.rowPressed]}
          >
            <View style={[styles.rowIcon, styles.rowIconDanger]}>
              <Icon name="log-out" size={16} color="danger" directional />
            </View>
            <AppText variant="body" color="danger">
              {t('common.logout', 'Log out')}
            </AppText>
          </Pressable>
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <View style={[styles.stat, divider && styles.statDivider]}>
      <AppText variant="titleSm" color="ink" style={styles.tabular}>
        {value}
      </AppText>
      <AppText variant="bodySm" color="muted">
        {label}
      </AppText>
    </View>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <AppText variant="overline" color="muted" style={styles.groupTitle}>
        {title}
      </AppText>
      <Card style={styles.groupCard}>{children}</Card>
    </View>
  );
}

function RowIcon({ name }: { name: IconName }) {
  return (
    <View style={styles.rowIcon}>
      <Icon name={name} size={16} color="primary" />
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  divider,
  expanded,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress: () => void;
  divider?: boolean;
  expanded?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.rowPressed]}
    >
      <RowIcon name={icon} />
      <AppText variant="body" color="ink" style={styles.flex}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="bodySm" color="muted" style={styles.tabular}>
          {value}
        </AppText>
      ) : null}
      <Icon
        name={expanded ? 'chevron-down' : 'chevron-right'}
        size={18}
        color="borderStrong"
        directional={!expanded}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  pressed: { transform: [{ scale: 0.97 }] },
  identity: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: 0,
    borderRadius: radius.xxl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  editButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statDivider: { borderStartWidth: StyleSheet.hairlineWidth, borderStartColor: colors.hairline },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '48%',
    height: 164,
    padding: 0,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileVideoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceSoft,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPortfolio: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  groupTitle: { marginBottom: spacing.xs, marginStart: spacing.xxs },
  groupCard: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline },
  rowPressed: { backgroundColor: colors.surfaceSoft },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: colors.dangerSurface },
  notice: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    padding: 2,
  },
  segment: { paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radius.pill },
  segmentActive: { backgroundColor: colors.surface },
});
