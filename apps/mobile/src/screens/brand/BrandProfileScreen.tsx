import { useState, type ReactNode } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandProfileStackParamList } from '../../navigation/types';
import { useBrandProfile } from '../../hooks/api/useBrand';
import { useBrandTeam } from '../../hooks/api/useBrandTeam';
import { useProducts } from '../../hooks/api/useProducts';
import { useBilling } from '../../hooks/api/useBilling';
import { useLogout } from '../../hooks/api/useAuth';
import { setAppLocale, type AppLocale } from '../../i18n';
import { parseApiError } from '../../services/apiError';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Card } from '../../components/ui/Card';
import { AppText } from '../../components/ui/Text';
import { Icon, type IconName } from '../../components/ui/Icon';
import { colors, radius, spacing } from '../../theme/tokens';
import { formatAmount, formatCount, initialsOf } from '../../utils/format';
import { isFeatureEnabled } from '../../config/features';

type Props = NativeStackScreenProps<BrandProfileStackParamList, 'BrandProfile'>;

/**
 * TASK-P1-14: Brand profile screen (artboard 3h).
 * 2026-10-03 redesign ("R1 identity card + settings"): identity card with stats,
 * then grouped settings. Editing moves to EditBrandProfileScreen.
 */
export function BrandProfileScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const profileQuery = useBrandProfile();
  const teamQuery = useBrandTeam();
  const productsQuery = useProducts();
  const billingQuery = useBilling(1, 1);
  const logout = useLogout();
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);
  const currentLang = (i18n.language === 'ar' ? 'ar' : 'en') as AppLocale;

  if (profileQuery.isLoading) return <LoadingState />;
  if (profileQuery.isError) {
    return (
      <ErrorState
        message={parseApiError(profileQuery.error).message}
        onRetry={profileQuery.refetch}
      />
    );
  }

  const brand = profileQuery.data;
  const name = brand?.companyName || t('brand.profile.title');
  const isVerified = brand?.verificationStatus === 'verified';
  const memberCount = teamQuery.data?.length ?? 1;
  const productCount = productsQuery.data?.data?.length ?? 0;
  const lifetimeSpend = billingQuery.data?.summary?.lifetimeSpend ?? '0';
  const metaLine = [brand?.category ? t(`niche.${brand.category}`) : null, brand?.country]
    .filter(Boolean)
    .join(' · ');

  const handleLanguageChange = async (locale: AppLocale) => {
    if (locale === currentLang) return;
    const { directionChanged } = await setAppLocale(locale);
    if (directionChanged) {
      Alert.alert(t('common.language'), t('brand.profile.restartForDirection'), [
        { text: t('common.done') },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Identity card */}
        <Card style={styles.identity}>
          <View style={styles.logo}>
            {brand?.logoUrl ? (
              <Image
                source={{ uri: brand.logoUrl }}
                style={styles.logoImage}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <AppText variant="titleMd" color="onPrimary">
                {initialsOf(name)}
              </AppText>
            )}
          </View>
          <View style={styles.nameRow}>
            <AppText variant="titleMd" color="ink" accessibilityRole="header">
              {name}
            </AppText>
            {isVerified ? (
              <View accessible accessibilityLabel={t('brand.profile.verified')}>
                <Icon name="check-circle" size={18} color="primary" />
              </View>
            ) : null}
          </View>
          {metaLine ? (
            <AppText variant="bodySm" color="muted">
              {metaLine}
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('EditBrandProfile')}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
          >
            <AppText variant="bodySm" color="ink">
              {t('brand.profile.edit', 'Edit profile')}
            </AppText>
          </Pressable>

          <View style={styles.stats}>
            {isFeatureEnabled('brandTeamManagement') && (
              <Stat value={formatCount(memberCount)} label={t('brand.profile.statTeam', 'Team')} />
            )}
            {isFeatureEnabled('productCatalog') && (
              <Stat
                value={formatCount(productCount)}
                label={t('brand.profile.statProducts', 'Products')}
                divider={isFeatureEnabled('brandTeamManagement')}
              />
            )}
            <Stat
              value={formatAmount(lifetimeSpend)}
              label={t('brand.profile.statSpent', 'EGP spent')}
              divider={isFeatureEnabled('productCatalog') || isFeatureEnabled('brandTeamManagement')}
            />
          </View>
        </Card>

        {/* Workspace */}
        <Group title={t('brand.profile.groupWorkspace', 'Workspace')}>
          {isFeatureEnabled('brandTeamManagement') && (
            <Row
              icon="users"
              label={t('brand.profile.teamMembers')}
              value={formatCount(memberCount)}
              onPress={() => navigation.navigate('BrandTeam')}
            />
          )}
          {isFeatureEnabled('productCatalog') && (
            <Row
              icon="package"
              label={t('nav.products')}
              value={formatCount(productCount)}
              onPress={() => navigation.navigate('ProductsList')}
              divider={isFeatureEnabled('brandTeamManagement')}
            />
          )}
          <Row
            icon={isVerified ? 'award' : 'shield'}
            label={
              isVerified
                ? t('brand.setup.title', 'Brand setup')
                : t('brand.profile.getVerified', 'Get verified')
            }
            onPress={() => navigation.navigate('BrandSetup')}
            divider={isFeatureEnabled('productCatalog') || isFeatureEnabled('brandTeamManagement')}
          />
        </Group>

        {/* Money */}
        <Group title={t('brand.profile.groupMoney', 'Money')}>
          {isFeatureEnabled('brandBillingInvoices') && (
            <Row
              icon="file-text"
              label={t('brand.profile.billingHistory', 'Billing & invoices')}
              value={`EGP ${formatAmount(lifetimeSpend)}`}
              onPress={() => navigation.navigate('BrandBilling')}
            />
          )}
          <Row
            icon="credit-card"
            label={t('brand.profile.paymentMethods', 'Payment methods')}
            expanded={showPaymentNotice}
            onPress={() => setShowPaymentNotice((open) => !open)}
            divider={isFeatureEnabled('brandBillingInvoices')}
          />
          {showPaymentNotice ? (
            <AppText variant="bodySm" color="muted" style={styles.notice}>
              {t(
                'brand.profile.paymentMethodsNotice',
                'Cards are held securely by our payment provider (Paymob).',
              )}
            </AppText>
          ) : null}
        </Group>

        {/* Preferences */}
        <Group title={t('brand.profile.groupPreferences', 'Preferences')}>
          <View style={styles.row}>
            <RowIcon name="globe" />
            <AppText variant="body" color="ink" style={styles.flex}>
              {t('common.language')}
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
              {t('common.logout')}
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
  logoImage: { width: '100%', height: '100%' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
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
