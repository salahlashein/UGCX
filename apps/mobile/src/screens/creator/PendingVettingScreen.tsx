import React from 'react';
import { StyleSheet, View, Pressable, ScrollView } from 'react-native';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';
import { useCreatorProfile, usePortfolioItems, usePayoutDetails } from '../../hooks/api/useCreator';
import { useLiveCampaigns } from '../../hooks/api/useCampaigns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorHomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CreatorHomeStackParamList, 'PendingVetting'>;

export function PendingVettingScreen({ navigation }: Props) {
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
  const initials = profile?.displayName?.substring(0, 2).toUpperCase() || 'U';

  const formatNiche = (niche?: string) => {
    switch (niche) {
      case 'beauty_personal_care': return 'Beauty & Skincare';
      case 'mom_baby': return 'Mom & baby';
      case 'food_fmcg': return 'Food & FMCG';
      case 'fashion': return 'Fashion';
      case 'home_lifestyle': return 'Home & Lifestyle';
      default: return niche || 'Niche';
    }
  };

  const handleAddPayoutDetails = () => {
    // @ts-expect-error - Navigate across tabs or stacks
    navigation.navigate('EarningsTab', { screen: 'PayoutDetails' });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <AppText variant="label" style={styles.avatarText}>
            {initials}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="label" color="ink">
            {profile?.displayName || 'Creator'}
          </AppText>
          <AppText variant="caption" color="muted">
            {profile?.city || 'City'} · {formatNiche(profile?.niches?.[0])}
          </AppText>
        </View>
      </View>

      <View style={styles.statusCard}>
        <AppText style={styles.kicker}>UNDER REVIEW</AppText>
        <AppText variant="displayMd" style={{ color: colors.onPrimary, marginBottom: 10 }}>
          We're checking your profile
        </AppText>
        <AppText style={styles.statusBody}>
          A real person reviews every creator. Most are approved within 48 hours — we'll notify you
          either way.
        </AppText>
        <View style={styles.progressRow}>
          {steps.map((filled, i) => (
            <View key={i} style={[styles.progressSeg, { opacity: filled ? 1 : 0.3 }]} />
          ))}
        </View>
        <AppText style={styles.progressLabel}>{completedSteps} of 4 steps done</AppText>
      </View>

      <View style={styles.checklist}>
        {[
          { label: 'Profile and niches', done: hasProfile },
          { label: '3 portfolio videos', done: hasPortfolio },
          { label: 'Base price set', done: hasBasePrice },
        ].map(({ label, done }) => (
          <View key={label} style={styles.checkRow}>
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
        <View style={{ padding: 16 }}>
          <View style={[styles.checkRow, { marginBottom: 14, borderBottomWidth: 0, padding: 0 }]}>
            {hasPayout ? (
              <View style={styles.checkDone}>
                <AppText style={styles.checkmark}>✓</AppText>
              </View>
            ) : (
              <View style={styles.checkTodo} />
            )}
            <View style={{ flex: 1 }}>
              <AppText variant="label" color="ink">
                Payout details
              </AppText>
              <AppText variant="caption" color="muted">
                Needed before your first payment
              </AppText>
            </View>
          </View>
          {!hasPayout && (
            <Pressable style={styles.cta} onPress={handleAddPayoutDetails}>
              <AppText variant="label" color="onPrimary">
                Add payout details
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

      <AppText variant="titleLg" color="ink" style={{ marginBottom: 6 }}>
        Briefs you'll be able to apply to
      </AppText>
      <AppText variant="caption" color="muted" style={{ marginBottom: 16 }}>
        Applying unlocks the moment you're approved.
      </AppText>

      <View style={{ opacity: 0.45, gap: 12 }}>
        {campaignsRes?.data?.map((campaign: any) => (
          <View key={campaign.id} style={styles.lockedRow}>
            <View style={styles.lockedThumb} />
            <View style={{ flex: 1 }}>
              <AppText variant="label" color="ink">
                {campaign.brand?.companyName || 'Brand'} · {campaign.product?.name || 'Campaign'}
              </AppText>
              <AppText variant="caption" color="muted">
                {campaign.budget ? `EGP ${campaign.budget.min}–${campaign.budget.max}` : 'Fixed price'}
              </AppText>
            </View>
          </View>
        ))}
        {(!campaignsRes?.data || campaignsRes.data.length === 0) && (
          <AppText variant="caption" color="muted">
            Check back later for new briefs!
          </AppText>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.muted },
  statusCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  kicker: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  statusBody: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: spacing.md },
  progressRow: { flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.onPrimary },
  progressLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 10 },
  checklist: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  checkDone: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { color: colors.onPrimary, fontSize: 11 },
  checkText: { flex: 1 },
  checkTodo: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: 16,
  },
  lockedThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.signaturePeach,
  },
});
