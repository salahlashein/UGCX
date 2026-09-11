import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput as RNTextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorDiscoverStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { FilterChip } from '../../components/ui/FilterChip';
import { colors, spacing, radius } from '../../theme/tokens';
import { useLiveCampaigns } from '../../hooks/api/useCampaigns';
import { useCreatorEarnings, useCreatorProfile } from '../../hooks/api/useCreator';
import type { Campaign } from '@ugcx/shared-types';

type Props = NativeStackScreenProps<CreatorDiscoverStackParamList, 'Discover'>;

export function CampaignDiscoveryScreen({ navigation }: Props) {
  const [filter, setFilter] = useState('');

  const { data: campaignRes, isLoading } = useLiveCampaigns({ page: 1, perPage: 20 });
  const { data: earnings } = useCreatorEarnings();
  const { data: profile } = useCreatorProfile();

  const formatNiche = (niche?: string) => {
    switch (niche) {
      case 'beauty_personal_care': return 'Beauty';
      case 'mom_baby': return 'Mom & baby';
      case 'food_fmcg': return 'Food & FMCG';
      case 'fashion': return 'Fashion';
      case 'home_lifestyle': return 'Home & Lifestyle';
      default: return niche || 'Niche';
    }
  };

  const filters = [
    ...(profile?.niches?.map(formatNiche) || []),
    profile?.city || 'Cairo',
    'No shipping',
    profile?.basePrice ? `${profile.basePrice}+` : '2,000+',
  ].filter(Boolean).slice(0, 4);

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
        data={campaignRes?.data || []}
        keyExtractor={(b) => b.id}
        ListHeaderComponent={
          <View>
            <View style={styles.searchRow}>
              <RNTextInput placeholder="Search briefs, brands, niches" style={styles.search} />
              <View style={styles.langBtn}>
                <AppText style={styles.langBtnText}>AR</AppText>
              </View>
            </View>
            <View style={styles.chipRow}>
              {filters.map((f) => (
                <FilterChip
                  key={f}
                  label={f}
                  selected={filter === f}
                  onPress={() => setFilter(f)}
                />
              ))}
            </View>
            {earnings?.escrowBalance ? (
              <Pressable style={styles.wipStrip}>
                <AppText variant="body" color="ink">
                  EGP {earnings.escrowBalance} held in escrow
                </AppText>
              </Pressable>
            ) : null}
            <AppText variant="titleLg" color="ink" style={styles.count}>
              {campaignRes?.meta?.total || 0} open briefs
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              // @ts-expect-error - Assuming CampaignDetail exists in stack
              navigation.navigate('CampaignDetail', { id: item.id });
            }}
          >
            <View style={[styles.thumb, { backgroundColor: colors.signatureMint, height: 132 }]} />
            <AppText variant="caption" color="muted" style={styles.brand}>
              {(item as any).brand?.companyName || 'Brand'}
            </AppText>
            <AppText variant="titleLg" color="ink" style={styles.title}>
              {(item as any).product?.name || 'Campaign'}
            </AppText>
            <AppText variant="label" color="ink">
              {item.needsShipping ? 'Ships to you' : 'No shipping needed'}
            </AppText>
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: spacing.xxl }}
            />
          ) : (
            <AppText
              variant="body"
              color="muted"
              style={{ marginTop: spacing.xxl, textAlign: 'center' }}
            >
              No open briefs right now.
            </AppText>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  search: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
  },
  langBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtnText: { fontFamily: 'monospace', fontSize: 12, color: colors.muted },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  wipStrip: {
    backgroundColor: colors.signatureCream,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: spacing.lg,
  },
  count: { marginBottom: 14 },
  card: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  thumb: { borderRadius: radius.md, marginBottom: spacing.md },
  brand: { marginBottom: 4 },
  title: { marginBottom: 8 },
});
