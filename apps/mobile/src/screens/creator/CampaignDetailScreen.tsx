import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput as RNTextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { CreatorDiscoverStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { AppBottomSheet } from '../../components/ui/BottomSheet';
import { colors, spacing, radius } from '../../theme/tokens';
import { useCampaign } from '../../hooks/api/useCampaigns';
import { useCreateProposal } from '../../hooks/api/useProposals';
import { useCreatorProfile } from '../../hooks/api/useCreator';
import { useEffect } from 'react';

type Props = NativeStackScreenProps<CreatorDiscoverStackParamList, 'CampaignDetail'>;

export function CampaignDetailScreen({ route, navigation }: Props) {
  const { campaignId } = route.params;
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const { mutate: createProposal, isPending } = useCreateProposal(campaignId);
  const { data: profile } = useCreatorProfile();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const basePrice = Number(profile?.basePrice || 2500);
  const presets = [
    String(basePrice),
    String(Math.round(basePrice * 1.25)),
    String(Math.round(basePrice * 1.5))
  ];

  const [price, setPrice] = useState('');
  const [days, setDays] = useState(5);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!price && profile) {
      setPrice(String(profile.basePrice || 2500));
    }
  }, [profile, price]);

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
      },
    );
  };

  if (isLoading || !campaign) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.hero} />
        <View style={{ padding: spacing.lg }}>
          <View style={styles.brandRow}>
            <View style={styles.brandAvatar} />
            <AppText variant="label" color="ink">
              {(campaign as any).brand?.companyName || 'Brand'}
            </AppText>
            {campaign.status && (
              <View style={styles.statusTag}>
                <AppText variant="caption" style={styles.statusTagText}>
                  {campaign.status}
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="displayMd" style={styles.title}>
            {(campaign as any).product?.name || 'Campaign Brief'}
          </AppText>
          <AppText style={styles.bodyText}>
            {(campaign as any).product?.description || 'No description provided.'}
          </AppText>
          {[
            ['Video type', campaign.videoType],
            ['Duration', `${campaign.durationSeconds || 60} seconds`],
            ['Language', campaign.language],
            ['Script', campaign.scriptMode],
            ['Shipping', campaign.needsShipping ? 'Product sent to you' : 'No shipping needed'],
          ].map(([k, v]) => (
            <View key={k} style={styles.specRow}>
              <AppText style={styles.specKey}>{k}</AppText>
              <AppText variant="label" style={styles.specVal}>
                {v}
              </AppText>
            </View>
          ))}
          {campaign.talkingPoints && campaign.talkingPoints.length > 0 && (
            <View style={styles.creamCard}>
              <AppText variant="label" style={styles.creamTitle}>
                Three things to hit
              </AppText>
              <AppText style={styles.bodyText}>
                {campaign.talkingPoints.map((tp, i) => `0${i + 1} ${tp}\n`).join('')}
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
      <View style={styles.stickyBar}>
        <View style={styles.stickyRow}>
          <View>
            <AppText variant="label" color="ink">
              Set your price
            </AppText>
            <AppText variant="caption" color="muted">
              Submit a proposal
            </AppText>
          </View>
          <AppText variant="caption" color="muted">
            {campaign.slots} slots open
          </AppText>
        </View>
        <Pressable style={styles.cta} onPress={handleApply}>
          <AppText variant="label" color="onPrimary">
            Apply - set your price
          </AppText>
        </Pressable>
      </View>

      <AppBottomSheet ref={bottomSheetRef} snapPoints={['85%']}>
        <AppText variant="displayMd" color="ink">
          Your proposal
        </AppText>
        <AppText variant="caption" color="muted" style={{ marginBottom: spacing.lg }}>
          {(campaign as any).brand?.companyName} · {campaign.durationSeconds || 60}s{' '}
          {campaign.videoType}
        </AppText>
        <AppText variant="label" color="ink" style={styles.label}>
          Your price
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
            <Pressable
              key={p}
              onPress={() => setPrice(p)}
              style={[styles.preset, price === p && styles.presetActive]}
            >
              <AppText
                variant="caption"
                style={price === p ? styles.presetTextActive : styles.presetText}
              >
                {p}
              </AppText>
            </Pressable>
          ))}
        </View>
        <AppText variant="label" color="ink" style={styles.label}>
          Delivery time
        </AppText>
        <View style={styles.segmented}>
          {[3, 5, 7].map((d) => (
            <Pressable
              key={d}
              onPress={() => setDays(d)}
              style={[styles.segment, days === d && styles.segmentActive]}
            >
              <AppText
                variant="body"
                style={days === d ? styles.segmentTextActive : styles.segmentText}
              >
                {d} days
              </AppText>
            </Pressable>
          ))}
        </View>
        <AppText variant="label" color="ink" style={styles.label}>
          Note to the brand
        </AppText>
        <RNTextInput value={note} onChangeText={setNote} multiline style={styles.noteInput} />
        <View style={styles.escrowNote}>
          <View style={styles.escrowDot} />
          <AppText variant="caption" color="muted" style={styles.escrowText}>
            The brand pays into escrow the moment they accept. Your EGP {price} is held by UGCX and
            released when they approve the video.
          </AppText>
        </View>
        <Pressable
          style={[styles.cta, isPending && { opacity: 0.7 }]}
          onPress={handleSend}
          disabled={isPending}
        >
          <AppText variant="label" color="onPrimary">
            {isPending ? 'Sending...' : 'Send proposal'}
          </AppText>
        </Pressable>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  hero: { height: 236, backgroundColor: colors.signaturePeach },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  brandAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.signatureCream,
  },
  statusTag: {
    backgroundColor: colors.signatureMint,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  statusTagText: { fontWeight: '500', color: colors.signatureForest },
  title: { color: colors.ink, marginBottom: 12 },
  bodyText: { fontSize: 15, color: colors.body, marginBottom: spacing.lg },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  specKey: { fontSize: 15, color: colors.muted },
  specVal: { color: colors.ink },
  creamCard: {
    backgroundColor: colors.signatureCream,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  creamTitle: { color: colors.ink, marginBottom: 10 },
  stickyBar: {
    borderTopWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    padding: spacing.lg,
    paddingBottom: 30,
  },
  stickyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  label: { marginBottom: 8, marginTop: spacing.sm },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  priceInputField: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.ink },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  preset: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { color: colors.body },
  presetTextActive: { color: colors.onPrimary, fontWeight: '500' },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderEndWidth: 1,
    borderColor: colors.inputBorder,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.body },
  segmentTextActive: { color: colors.onPrimary, fontWeight: '500' },
  noteInput: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 15,
    color: colors.body,
    marginBottom: spacing.md,
    textAlignVertical: 'top',
  },
  escrowNote: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  escrowDot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    marginTop: 3,
  },
  escrowText: { flex: 1 },
});
