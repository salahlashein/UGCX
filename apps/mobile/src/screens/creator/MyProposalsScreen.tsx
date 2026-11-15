import React, { useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { FilterChip } from '../../components/ui/FilterChip';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Icon } from '../../components/ui/Icon';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, radius } from '../../theme/tokens';
import { useMyProposals } from '../../hooks/api/useProposals';
import { ProposalStatus } from '@ugcx/shared-types';

export function MyProposalsScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const { data: proposalsRes, isLoading } = useMyProposals();

  const filterOptions: Array<{ key: 'all' | 'pending' | 'accepted' | 'declined'; label: string }> = [
    { key: 'all', label: t('common.all', 'All') },
    { key: 'pending', label: t('creator.proposals.filterPending', 'Pending') },
    { key: 'accepted', label: t('status.proposal.accepted', 'Accepted') },
    { key: 'declined', label: t('status.proposal.declined', 'Declined') },
  ];

  const getFilteredProposals = () => {
    if (!proposalsRes?.data) return [];
    if (filter === 'all') return proposalsRes.data;
    if (filter === 'pending') {
      return proposalsRes.data.filter((p) => p.status === 'applied' || p.status === 'shortlisted');
    }
    return proposalsRes.data.filter((p) => p.status === filter);
  };

  const filtered = getFilteredProposals();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={filtered}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppText variant="displayMd" color="ink">
              {t('creator.proposals.title', 'My proposals')}
            </AppText>
            <View style={styles.chipRow}>
              {filterOptions.map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  selected={filter === f.key}
                  onPress={() => setFilter(f.key)}
                />
              ))}
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          isLoading ? (
            <LoadingState />
          ) : (
            <EmptyState
              icon="inbox"
              title={t('creator.proposals.empty', 'You have not applied to any briefs yet.')}
            />
          )
        }
        renderItem={({ item }) => {
          const statusKey = item.status as ProposalStatus;

          return (
            <Card style={[styles.row, statusKey === 'declined' && styles.declinedCard]}>
              <View style={styles.thumb}>
                <Icon name="file-text" size={20} color="primary" />
              </View>
              <View style={styles.info}>
                <AppText variant="label" color="ink" numberOfLines={1}>
                  {(item as any).campaign?.brand?.companyName || t('creator.discover.featuredBrand', 'Brand')} -{' '}
                  {(item as any).campaign?.product?.name ||
                    (item as any).campaign?.title ||
                    t('creator.proposals.untitledBrief', 'Untitled Brief')}
                </AppText>
                <AppText variant="bodySm" color="muted" style={styles.tabular}>
                  {t('creator.proposals.offeredMeta', 'You offered EGP {{price}} - delivery in {{days}}d', {
                    price: item.price,
                    days: item.deliveryDays,
                  })}
                </AppText>
              </View>
              <StatusBadge domain="proposal" status={statusKey} />
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  declinedCard: {
    opacity: 0.65,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: spacing.xxs,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
