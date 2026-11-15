import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput as RNTextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorDiscoverStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card, PressableCard } from '../../components/ui/Card';
import { FilterChip } from '../../components/ui/FilterChip';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, radius } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import { useLiveCampaigns } from '../../hooks/api/useCampaigns';
import { useCreatorEarnings, useCreatorProfile } from '../../hooks/api/useCreator';

type Props = NativeStackScreenProps<CreatorDiscoverStackParamList, 'Discover'>;

export function CampaignDiscoveryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: campaignRes, isLoading } = useLiveCampaigns({ page: 1, perPage: 20 });
  const { data: earnings } = useCreatorEarnings();
  const { data: profile } = useCreatorProfile();

  const formatNiche = (niche?: string) => {
    if (!niche) return t('creator.profile.niches', 'Niche');
    return t(`niche.${niche}`, niche);
  };

  const noShippingLabel = t('creator.discover.noShipping', 'No shipping');

  const filters = [
    ...(profile?.niches?.map(formatNiche) || []),
    profile?.city || t('creator.profile.city', 'Cairo'),
    noShippingLabel,
    profile?.basePrice ? `${profile.basePrice}+` : '2,000+',
  ]
    .filter(Boolean)
    .slice(0, 4);

  const filteredCampaigns = (campaignRes?.data || []).filter((item) => {
    const query = search.trim().toLowerCase();
    if (query) {
      const title = (item.title || '').toLowerCase();
      const brandName = ((item as any).brand?.companyName || '').toLowerCase();
      const niche = (item.niche || '').toLowerCase();
      if (!title.includes(query) && !brandName.includes(query) && !niche.includes(query)) {
        return false;
      }
    }
    if (filter) {
      if (filter === noShippingLabel && item.needsShipping) return false;
      if (item.niche && formatNiche(item.niche) !== filter && filter !== (profile?.city || '')) {
        if (
          filter === t('niche.beauty_personal_care') ||
          filter === t('niche.fashion') ||
          filter === t('niche.home_lifestyle') ||
          filter === t('niche.mom_baby') ||
          filter === t('niche.food_fmcg')
        ) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={filteredCampaigns}
        keyExtractor={(b) => b.id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppText variant="displayMd" color="ink">
              {t('creator.discover.title', 'Open briefs')}
            </AppText>

            <View style={styles.searchBox}>
              <Icon name="search" size={18} color="muted" />
              <RNTextInput
                placeholder={t('creator.discover.searchPlaceholder', 'Search briefs or brands...')}
                placeholderTextColor={colors.muted}
                value={search}
                onChangeText={setSearch}
                style={styles.search}
              />
            </View>

            <View style={styles.chipRow}>
              {filters.map((f) => (
                <FilterChip
                  key={f}
                  label={f}
                  selected={filter === f}
                  onPress={() => setFilter(filter === f ? '' : f)}
                />
              ))}
            </View>

            {earnings?.escrowBalance ? (
              <Card style={styles.escrowStrip}>
                <View style={styles.escrowIcon}>
                  <Icon name="shield" size={18} color="primary" />
                </View>
                <AppText variant="label" color="ink" style={styles.flex}>
                  {t('creator.discover.escrowHeld', 'EGP {{amount}} held in escrow', {
                    amount: earnings.escrowBalance,
                  })}
                </AppText>
              </Card>
            ) : null}

            <View style={styles.sectionHeader}>
              <AppText variant="titleSm" color="ink">
                {t('creator.discover.openBriefsCount', '{{count}} open briefs', {
                  count: campaignRes?.meta?.total || 0,
                })}
              </AppText>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <PressableCard
            style={styles.card}
            onPress={() => {
              navigation.navigate('CampaignDetail', { campaignId: item.id, id: item.id } as any);
            }}
          >
            <View style={styles.thumb}>
              <View style={styles.thumbIcon}>
                <Icon name="video" size={24} color="primary" />
              </View>
            </View>
            <View style={styles.cardTopRow}>
              <AppText variant="caption" color="muted" style={styles.flex} numberOfLines={1}>
                {(item as any).brand?.companyName || t('creator.discover.featuredBrand', 'Featured brand')}
              </AppText>
              <StatusBadge domain="campaign" status={item.status || 'live'} />
            </View>
            <AppText variant="titleSm" color="ink" style={styles.title}>
              {item.title || (item as any).product?.name || t('creator.discover.ugcVideo', 'UGC Video')}
            </AppText>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Icon name="package" size={14} color="primary" />
                <AppText variant="bodySm" color="ink">
                  {item.needsShipping
                    ? t('creator.discover.shipsProduct', 'Ships product')
                    : t('creator.discover.noShipping', 'No shipping')}
                </AppText>
              </View>
              {item.niche ? (
                <AppText variant="bodySm" color="muted">
                  {formatNiche(item.niche)}
                </AppText>
              ) : null}
            </View>
          </PressableCard>
        )}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState />
          ) : (
            <EmptyState
              icon="search"
              title={t('creator.discover.emptyTitle', 'No open briefs')}
              message={t('creator.discover.emptyDefault', 'Check back soon for new brand campaigns.')}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  flex: { flex: 1 },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  search: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  escrowStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  escrowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: spacing.xxs,
  },
  card: {
    gap: spacing.xs,
  },
  thumb: {
    height: 112,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  thumbIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  title: {
    marginBottom: spacing.xxs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
});
