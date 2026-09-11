import React from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';
import { useMyCollaborations } from '../../hooks/api/useCollaborations';
import { useCreatorEarnings, useCreatorProfile } from '../../hooks/api/useCreator';

export function CollaborationStatusScreen() {
  const { data: collabRes, isLoading: isCollabLoading } = useMyCollaborations();
  const { data: earnings, isLoading: isEarningsLoading } = useCreatorEarnings();
  const { data: profile } = useCreatorProfile();

  if (isCollabLoading || isEarningsLoading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const collabs = collabRes?.data || [];

  const needsFilming = collabs.filter(
    (c) => c.status === 'funded' || c.status === 'shipped' || c.status === 'delivered',
  );
  const inReview = collabs.filter((c) => c.status === 'approved'); // "approved" or revisions if we had it

  const initials = profile?.displayName?.substring(0, 2).toUpperCase() || 'U';

  const RAILS = [
    {
      title: 'Needs filming',
      count: needsFilming.length,
      cards: needsFilming.map((c) => ({
        tag:
          c.status === 'shipped' ? 'Shipment sent' : c.status === 'funded' ? 'Funded' : 'Due soon',
        tagBg: c.status === 'shipped' ? colors.signatureYellow : colors.signaturePeach,
        title: (c as any).campaign?.product?.name || 'Campaign',
        meta: `EGP ${c.creatorPrice} held`,
      })),
    },
    {
      title: 'In review / Completed',
      count: inReview.length,
      cards: inReview.map((c) => ({
        tag: c.status,
        tagBg: colors.surfaceStrong,
        title: (c as any).campaign?.product?.name || 'Campaign',
        meta: `EGP ${c.creatorPrice}`,
      })),
    },
  ].filter((r) => r.count > 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.headerRow}>
        <AppText variant="displayMd" color="ink">
          My board
        </AppText>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{initials}</AppText>
        </View>
      </View>
      <View style={styles.escrowCard}>
        <AppText style={styles.escrowKicker}>ESCROW</AppText>
        <View style={{ flexDirection: 'row', gap: 28 }}>
          <View>
            <AppText variant="displayMd" style={styles.escrowAmount}>
              EGP {earnings?.escrowBalance || 0}
            </AppText>
            <AppText variant="caption" style={styles.escrowLabel}>
              held for you
            </AppText>
          </View>
          <View>
            <AppText variant="displayMd" style={styles.escrowAmount}>
              EGP {earnings?.pendingBalance || 0}
            </AppText>
            <AppText variant="caption" style={styles.escrowLabel}>
              ready to withdraw
            </AppText>
          </View>
        </View>
      </View>
      {RAILS.length === 0 ? (
        <AppText
          variant="body"
          color="muted"
          style={{ textAlign: 'center', marginTop: spacing.xl }}
        >
          You have no active collaborations.
        </AppText>
      ) : (
        RAILS.map((rail) => (
          <View key={rail.title} style={{ marginBottom: spacing.lg }}>
            <View style={styles.railHeader}>
              <AppText variant="titleLg" color="ink">
                {rail.title}
              </AppText>
              <AppText style={styles.railCount}>{rail.count}</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {rail.cards.map((c, i) => (
                <View key={i} style={[styles.card, (c as any).faded && { opacity: 0.5 }]}>
                  <View style={[styles.tag, { backgroundColor: c.tagBg }]}>
                    <AppText
                      style={[
                        styles.tagText,
                        (c as any).tagColor ? { color: (c as any).tagColor } : undefined,
                      ]}
                    >
                      {c.tag}
                    </AppText>
                  </View>
                  <AppText variant="titleLg" color="ink" style={styles.cardTitle}>
                    {c.title}
                  </AppText>
                  {c.meta ? (
                    <AppText variant="caption" color="muted">
                      {c.meta}
                    </AppText>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.signatureMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '500', color: colors.signatureForest },
  escrowCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  escrowKicker: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  escrowAmount: { color: colors.onPrimary },
  escrowLabel: { color: 'rgba(255,255,255,0.75)' },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 10,
  },
  railCount: { fontFamily: 'monospace', fontSize: 13, color: colors.muted },
  card: {
    width: 212,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    marginEnd: spacing.sm, // Using marginEnd for RTL support
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
    marginBottom: 12,
  },
  tagText: { fontSize: 12, fontWeight: '500', color: colors.ink },
  cardTitle: { marginBottom: 8 },
});
