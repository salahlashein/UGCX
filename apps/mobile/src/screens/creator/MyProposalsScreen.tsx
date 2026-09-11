import React, { useState } from 'react';
import { StyleSheet, View, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';
import { useMyProposals } from '../../hooks/api/useProposals';
import { ProposalStatus } from '@ugcx/shared-types';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  applied: { bg: colors.surfaceStrong, color: colors.body },
  shortlisted: { bg: colors.surfaceStrong, color: colors.body }, // Map shortlisted to pending visually
  accepted: { bg: colors.signatureMint, color: colors.signatureForest },
  declined: { bg: colors.dangerSurface, color: colors.danger },
};

export function MyProposalsScreen() {
  const [filter, setFilter] = useState('All');
  const { data: proposalsRes, isLoading } = useMyProposals();

  const getFilteredProposals = () => {
    if (!proposalsRes?.data) return [];
    if (filter === 'All') return proposalsRes.data;
    if (filter === 'Pending') {
      return proposalsRes.data.filter((p) => p.status === 'applied' || p.status === 'shortlisted');
    }
    return proposalsRes.data.filter((p) => p.status === filter.toLowerCase());
  };

  const filtered = getFilteredProposals();

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
      data={filtered}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View>
          <AppText
            variant="displayMd"
            color="ink"
            style={{ marginVertical: spacing.md, marginTop: spacing.lg }}
          >
            My proposals
          </AppText>
          <View style={styles.chipRow}>
            {['All', 'Pending', 'Accepted', 'Declined'].map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.chip, filter === f && styles.chipActive]}
              >
                <AppText
                  variant="caption"
                  style={filter === f ? styles.chipActiveText : styles.chipText}
                >
                  {f}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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
            No proposals found.
          </AppText>
        )
      }
      renderItem={({ item }) => {
        const statusKey = item.status as ProposalStatus;
        const s = STATUS_STYLE[statusKey] || STATUS_STYLE.applied;
        const displayStatus =
          statusKey === 'applied' || statusKey === 'shortlisted'
            ? 'Pending'
            : statusKey === 'accepted'
              ? 'Accepted'
              : 'Declined';

        return (
          <View style={[styles.row, statusKey === 'declined' && { opacity: 0.6 }]}>
            <View style={[styles.thumb, { backgroundColor: colors.signatureMint }]} />
            <View style={{ flex: 1 }}>
              <AppText variant="label" color="ink">
                {(item as any).campaign?.brand?.companyName || 'Brand'} -{' '}
                {(item as any).campaign?.product?.name || 'Campaign'}
              </AppText>
              <AppText variant="caption" color="muted">
                You offered EGP {item.price} - delivery in {item.deliveryDays}d
              </AppText>
            </View>
            <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
              <AppText variant="caption" style={[{ color: s.color }, styles.statusText]}>
                {displayStatus}
              </AppText>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.body },
  chipActiveText: { color: colors.onPrimary, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  thumb: { width: 52, height: 52, borderRadius: radius.md },
  statusPill: { borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 11 },
  statusText: { fontWeight: '500' },
});
