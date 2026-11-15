import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorHomeStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { colors, spacing, radius } from '../../theme/tokens';
import { useCreatorProfile, usePortfolioItems, usePayoutDetails } from '../../hooks/api/useCreator';
import { useLiveCampaigns } from '../../hooks/api/useCampaigns';
import { initialsOf } from '../../utils/format';

type Props = NativeStackScreenProps<CreatorHomeStackParamList, 'PendingVetting'>;

export function PendingVettingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { data: profile } = useCreatorProfile();
  const { data: portfolio } = usePortfolioItems();
  const { data: payoutDetails } = usePayoutDetails(profile?.id);
  const { data: campaignsRes } = useLiveCampaigns({ page: 1, perPage: 2 });

  const hasProfile = Boolean(profile?.displayName && profile?.niches?.length);
  const hasPortfolio = Boolean(portfolio && portfolio.length >= 3);
  const hasBasePrice = Boolean(profile?.basePrice);
  const hasPayout = Boolean(payoutDetails);

  const steps = [hasProfile, hasPortfolio, hasBasePrice, hasPayout];
  const completedSteps = steps.filter(Boolean).length;
  const initials = profile?.displayName ? initialsOf(profile.displayName) : 'U';

  const formatNiche = (niche?: string) => {
    if (!niche) return t('creator.profile.niches', 'Niche');
    return t(`niche.${niche}`, niche);
  };

  const handleAddPayoutDetails = () => {
    // @ts-expect-error - Navigate across tabs or stacks
    navigation.navigate('EarningsTab', { screen: 'Earnings' });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <AppText variant="label" color="onPrimary">
              {initials}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodySm" color="muted">
              {profile?.city || t('creator.profile.city', 'City')} · {formatNiche(profile?.niches?.[0])}
            </AppText>
            <AppText variant="titleSm" color="ink">
              {profile?.displayName || t('creator.profile.title', 'Creator')}
            </AppText>
          </View>
        </View>

        <Card style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Icon name="shield" size={20} color="primary" />
          </View>
          <AppText variant="overline" color="primary">
            {t('creator.vetting.badge', 'UNDER REVIEW')}
          </AppText>
          <AppText variant="titleLg" color="ink">
            {t('creator.vetting.title', 'We are reviewing your profile')}
          </AppText>
          <AppText variant="body" color="body">
            {t(
              'creator.vetting.subtitle',
              'A human checks every creator on UGCX so brands trust the pool. Most reviews finish within 24 hours.',
            )}
          </AppText>
          <View style={styles.progressRow}>
            {steps.map((filled, i) => (
              <View
                key={i}
                style={[
                  styles.progressSeg,
                  { backgroundColor: filled ? colors.primary : colors.surfaceStrong },
                ]}
              />
            ))}
          </View>
          <AppText variant="caption" color="muted">
            {t('creator.vetting.stepsDone', '{{completed}} of 4 steps done', {
              completed: completedSteps,
            })}
          </AppText>
        </Card>

        <Card style={styles.checklist}>
          {[
            { label: t('creator.vetting.checkProfile', 'Profile and niches'), done: hasProfile },
            { label: t('creator.vetting.checkPortfolio', '3 portfolio videos'), done: hasPortfolio },
            { label: t('creator.vetting.checkBasePrice', 'Base price set'), done: hasBasePrice },
          ].map(({ label, done }, index) => (
            <View key={label} style={[styles.checkRow, index > 0 && styles.checkDivider]}>
              {done ? (
                <View style={styles.checkDone}>
                  <AppText style={styles.checkmark}>✓</AppText>
                </View>
              ) : (
                <View style={styles.checkTodo} />
              )}
              <AppText variant="body" color="ink" style={styles.checkText}>
                {label}
              </AppText>
            </View>
          ))}
          <View style={[styles.payoutBlock, styles.checkDivider]}>
            <View style={styles.payoutTop}>
              {hasPayout ? (
                <View style={styles.checkDone}>
                  <AppText style={styles.checkmark}>✓</AppText>
                </View>
              ) : (
                <View style={styles.checkTodo} />
              )}
              <View style={{ flex: 1 }}>
                <AppText variant="label" color="ink">
                  {t('creator.payout.title', 'Payout details')}
                </AppText>
                <AppText variant="bodySm" color="muted">
                  {t('creator.vetting.payoutNeeded', 'Needed before your first payment')}
                </AppText>
              </View>
            </View>
            {!hasPayout && (
              <Button
                title={t('creator.vetting.addPayoutDetails', 'Add payout details')}
                variant="primary"
                onPress={handleAddPayoutDetails}
              />
            )}
          </View>
        </Card>

        <View style={styles.previewHeader}>
          <AppText variant="titleSm" color="ink">
            {t('creator.vetting.previewTitle', "Briefs you'll be able to apply to")}
          </AppText>
          <AppText variant="bodySm" color="muted">
            {t('creator.vetting.previewSub', "Applying unlocks the moment you're approved.")}
          </AppText>
        </View>

        <View style={styles.lockedList}>
          {campaignsRes?.data?.map((campaign: any) => (
            <Card key={campaign.id} style={styles.lockedRow}>
              <View style={styles.lockedThumb}>
                <Icon name="video" size={18} color="primary" />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="label" color="ink">
                  {campaign.brand?.companyName || t('creator.discover.featuredBrand', 'Brand')} ·{' '}
                  {campaign.product?.name || t('creator.discover.ugcVideo', 'UGC Video')}
                </AppText>
                <AppText variant="bodySm" color="muted">
                  {campaign.budget
                    ? `EGP ${campaign.budget.min}–${campaign.budget.max}`
                    : t('brand.editLiveBrief.fixedPrice', 'fixed price')}
                </AppText>
              </View>
            </Card>
          ))}
          {(!campaignsRes?.data || campaignsRes.data.length === 0) && (
            <AppText variant="bodySm" color="muted">
              {t('creator.discover.emptyDefault', 'Check back soon for new brand campaigns.')}
            </AppText>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    borderRadius: radius.xxl,
    gap: spacing.xs,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  progressSeg: { flex: 1, height: 6, borderRadius: radius.pill },
  checklist: {
    padding: 0,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  checkDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  checkDone: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: colors.onPrimary, fontSize: 11 },
  checkText: { flex: 1 },
  checkTodo: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  payoutBlock: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  payoutTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewHeader: {
    paddingHorizontal: spacing.xxs,
    gap: spacing.xxs,
  },
  lockedList: {
    opacity: 0.6,
    gap: spacing.sm,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockedThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
