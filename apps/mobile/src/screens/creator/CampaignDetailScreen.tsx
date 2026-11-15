import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput as RNTextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { CreatorDiscoverStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FilterChip } from '../../components/ui/FilterChip';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BackButton } from '../../components/ui/BackButton';
import { Icon, type IconName } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { AppBottomSheet } from '../../components/ui/BottomSheet';
import { colors, spacing, radius } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { useCampaign } from '../../hooks/api/useCampaigns';
import { useCreateProposal } from '../../hooks/api/useProposals';
import { useCreatorProfile } from '../../hooks/api/useCreator';
import { parseApiError } from '../../services/apiError';
import { initialsOf } from '../../utils/format';

type Props = NativeStackScreenProps<CreatorDiscoverStackParamList, 'CampaignDetail'>;

export function CampaignDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { campaignId } = route.params;
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const { mutate: createProposal, isPending } = useCreateProposal(campaignId);
  const { data: profile } = useCreatorProfile();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const basePrice = Number(profile?.basePrice || 2500);
  const budgetMin = Number(campaign?.budgetMin);
  const budgetMax = Number(campaign?.budgetMax);
  const hasBudget = budgetMin > 0 && budgetMax >= budgetMin;
  const presets = hasBudget
    ? Array.from(
        new Set([budgetMin, Math.round((budgetMin + budgetMax) / 2), budgetMax].map(String)),
      )
    : [
        String(basePrice),
        String(Math.round(basePrice * 1.25)),
        String(Math.round(basePrice * 1.5)),
      ];
  const defaultPrice = hasBudget
    ? String(Math.min(Math.max(basePrice, budgetMin), budgetMax))
    : String(basePrice);

  const [price, setPrice] = useState('');
  const [days, setDays] = useState(5);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!price && profile && campaign) {
      setPrice(defaultPrice);
    }
  }, [profile, campaign, price, defaultPrice]);

  const handleApply = () => {
    bottomSheetRef.current?.present();
  };

  const handleSend = () => {
    createProposal(
      {
        price: parseFloat(price),
        deliveryDays: days,
        pitch: note,
      },
      {
        onSuccess: () => {
          bottomSheetRef.current?.dismiss();
          navigation.goBack();
        },
        onError: (err) => {
          Alert.alert(t('common.error.title', 'Error'), parseApiError(err).message);
        },
      },
    );
  };

  if (isLoading || !campaign) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const brandName = (campaign as any).brand?.companyName || t('creator.discover.featuredBrand', 'Brand');
  const videoTypeLabel = campaign.videoType
    ? t(`brand.brief.types.${campaign.videoType}`, campaign.videoType.replace(/_/g, ' '))
    : undefined;
  const specs: Array<{ icon: IconName; label: string; value?: string | null }> = [
    { icon: 'video', label: t('creator.detail.deliverable', 'Deliverable'), value: videoTypeLabel },
    {
      icon: 'clock',
      label: t('creator.detail.duration', 'Duration'),
      value: t('brand.brief.steps.seconds', '{{count}}s', { count: campaign.durationSeconds || 60 }),
    },
    {
      icon: 'globe',
      label: t('creator.detail.language', 'Language'),
      value: campaign.language ? t(`brand.brief.languages.${campaign.language}`, campaign.language) : undefined,
    },
    {
      icon: 'file-text',
      label: t('creator.detail.script', 'Script'),
      value:
        campaign.scriptMode === 'brand'
          ? t('creator.detail.brandProvidesScript', 'Brand provides script')
          : t('creator.detail.creatorWritesScript', 'Creator writes script'),
    },
    {
      icon: 'package',
      label: t('creator.detail.shipping', 'Shipping'),
      value: campaign.needsShipping
        ? t('creator.detail.productShipped', 'Product shipped to you')
        : t('creator.detail.noProductNeeded', 'No product needed'),
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topHeader}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText variant="titleSm" color="ink" style={styles.flex} numberOfLines={1}>
          {t('creator.detail.title', 'Brief details')}
        </AppText>
        {campaign.status ? <StatusBadge domain="campaign" status={campaign.status} /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Overview Card */}
        <Card style={styles.heroCard}>
          <View style={styles.brandRow}>
            <View style={styles.brandAvatar}>
              <AppText variant="label" color="onPrimary">
                {initialsOf(brandName)}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="bodySm" color="muted">
                {t('creator.detail.postedBy', 'Posted by')}
              </AppText>
              <AppText variant="titleSm" color="ink" numberOfLines={1}>
                {brandName}
              </AppText>
            </View>
          </View>
          <AppText variant="displayMd" color="ink" style={styles.title}>
            {(campaign as any).title || (campaign as any).product?.name || t('creator.discover.ugcVideo', 'UGC Video')}
          </AppText>
          <AppText variant="body" color="body">
            {(campaign as any).brief ||
              (campaign as any).product?.description ||
              t('creator.detail.noDescription', 'No description provided.')}
          </AppText>
        </Card>

        {/* Specifications Grouped Card */}
        <AppText variant="overline" color="muted" style={styles.groupTitle}>
          {t('creator.detail.specifications', 'SPECIFICATIONS')}
        </AppText>
        <Card style={styles.specsCard}>
          {specs.map(({ icon, label, value }, index) => (
            <View key={label} style={[styles.specRow, index > 0 && styles.specDivider]}>
              <View style={styles.specIcon}>
                <Icon name={icon} size={16} color="primary" />
              </View>
              <AppText variant="body" color="muted" style={styles.flex}>
                {label}
              </AppText>
              <AppText variant="label" color="ink">
                {value}
              </AppText>
            </View>
          ))}
        </Card>

        {/* Talking Points Card */}
        {campaign.talkingPoints && campaign.talkingPoints.length > 0 && (
          <>
            <AppText variant="overline" color="muted" style={styles.groupTitle}>
              {t('creator.detail.talkingPoints', 'Talking points')}
            </AppText>
            <Card style={styles.talkingCard}>
              <AppText variant="titleSm" color="ink" style={styles.talkingHeader}>
                {t('creator.detail.threeThingsToHit', 'Three things to hit')}
              </AppText>
              {campaign.talkingPoints.map((tp, i) => (
                <View key={i} style={styles.talkingRow}>
                  <View style={styles.talkingIndex}>
                    <AppText variant="overline" color="primary" style={styles.tabular}>
                      {`0${i + 1}`}
                    </AppText>
                  </View>
                  <AppText variant="body" color="body" style={styles.flex}>
                    {tp}
                  </AppText>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      {/* Sticky Action Bar */}
      <View style={styles.stickyBar}>
        <View style={styles.stickyRow}>
          <View>
            <AppText variant="label" color="ink">
              {t('creator.detail.setYourPrice', 'Set your price')}
            </AppText>
            <AppText variant="caption" color="muted">
              {t('creator.detail.submitProposal', 'Submit a proposal')}
            </AppText>
          </View>
          <AppText variant="caption" color="muted" style={styles.tabular}>
            {t('creator.detail.slotsOpen', '{{count}} slots open', { count: campaign.slots })}
          </AppText>
        </View>
        <Button
          title={t('creator.detail.applySetPrice', 'Apply - set your price')}
          variant="primary"
          onPress={handleApply}
        />
      </View>

      <AppBottomSheet ref={bottomSheetRef} snapPoints={['85%']}>
        <AppText variant="displayMd" color="ink">
          {t('creator.detail.sheetTitle', 'Send proposal')}
        </AppText>
        <AppText variant="caption" color="muted" style={{ marginBottom: spacing.lg }}>
          {brandName} · {campaign.durationSeconds || 60}s {videoTypeLabel}
        </AppText>
        <AppText variant="label" color="ink" style={styles.label}>
          {t('creator.detail.yourRate', 'Your rate (EGP)')}
        </AppText>
        <View style={styles.priceInputRow}>
          <AppText variant="body" color="muted">
            EGP
          </AppText>
          <RNTextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={styles.priceInputField}
          />
        </View>
        <View style={styles.presetRow}>
          {presets.map((p) => (
            <FilterChip key={p} label={p} selected={price === p} onPress={() => setPrice(p)} />
          ))}
        </View>
        <AppText variant="label" color="ink" style={styles.label}>
          {t('creator.detail.deliveryDaysLabel', 'Delivery (days after product arrives)')}
        </AppText>
        <View style={styles.segmented}>
          {[3, 5, 7].map((d) => {
            const active = days === d;
            return (
              <Pressable
                key={d}
                onPress={() => setDays(d)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <AppText variant="bodySm" color="ink">
                  {d} {t('common.days', 'days')}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="label" color="ink" style={styles.label}>
          {t('creator.detail.noteToBrand', 'Quick note to brand (optional)')}
        </AppText>
        <RNTextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder={t('creator.detail.pitchPlaceholder', 'Share why you are a great fit for this brief...')}
          placeholderTextColor={colors.muted}
          style={styles.noteInput}
        />
        <View style={styles.escrowNote}>
          <View style={styles.escrowIconTile}>
            <Icon name="shield" size={14} color="primary" />
          </View>
          <AppText variant="caption" color="muted" style={styles.escrowText}>
            {t(
              'creator.detail.escrowHoldNote',
              "When the brand accepts, your EGP {{price}} moves from the brief's escrow into a hold at UGCX. UGCX releases it when they approve the video.",
              { price },
            )}
          </AppText>
        </View>
        <Button
          title={isPending ? t('common.loading', 'Loading') : t('creator.detail.sendProposal', 'Send proposal')}
          variant="primary"
          loading={isPending}
          disabled={isPending}
          onPress={handleSend}
        />
      </AppBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  heroCard: {
    borderRadius: radius.xxl,
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xxs,
  },
  groupTitle: {
    marginTop: spacing.xs,
    marginStart: spacing.xxs,
  },
  specsCard: {
    padding: 0,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  specDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  specIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  talkingCard: {
    gap: spacing.sm,
  },
  talkingHeader: {
    marginBottom: spacing.xxs,
  },
  talkingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  talkingIndex: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...elevation.raised,
  },
  stickyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: { marginBottom: spacing.xs, marginTop: spacing.sm },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  priceInputField: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.pill,
    padding: 3,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  noteInput: {
    minHeight: 84,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    padding: spacing.sm,
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing.md,
    textAlignVertical: 'top',
  },
  escrowNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  escrowIconTile: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowText: { flex: 1 },
});
