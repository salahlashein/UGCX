import React from 'react';
import { StyleSheet, View, Pressable, ScrollView, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorProfileStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { useLogout } from '../../hooks/api/useAuth';
import { useCreatorProfile, usePortfolioItems, usePayoutDetails } from '../../hooks/api/useCreator';
import { colors, spacing, radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<CreatorProfileStackParamList, 'Profile'>;

export function CreatorProfileScreen({ navigation }: Props) {
  const logout = useLogout();
  const { data: profile } = useCreatorProfile();
  const { data: portfolioItems } = usePortfolioItems();
  const { data: payoutDetails } = usePayoutDetails(profile?.id);
  const initials = profile?.displayName?.substring(0, 2).toUpperCase() || 'U';

  const payoutMethodStr = payoutDetails
    ? `${payoutDetails.method} · ${payoutDetails.accountIdentifier}`
    : 'Not set';

  const formatNiche = (niche?: string) => {
    switch (niche) {
      case 'beauty_personal_care':
        return 'Beauty & Skincare';
      case 'mom_baby':
        return 'Mom & baby';
      case 'food_fmcg':
        return 'Food & FMCG';
      case 'fashion':
        return 'Fashion';
      case 'home_lifestyle':
        return 'Home & Lifestyle';
      default:
        return niche || 'Niche';
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{initials}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="displayMd" color="ink">
            {profile?.displayName || 'Creator'}
          </AppText>
          <AppText variant="body" color="muted">
            {profile?.city || 'City'} · filming since 2026
          </AppText>
        </View>
        <Pressable style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <AppText variant="label" style={styles.editBtnText}>
            Edit
          </AppText>
        </Pressable>
      </View>
      <View style={styles.vettedBadge}>
        <AppText variant="caption" style={styles.vettedText}>
          Vetted creator · Aug 2026
        </AppText>
      </View>
      <View style={styles.chipRow}>
        {profile?.niches?.map((n) => (
          <View key={n} style={styles.chip}>
            <AppText variant="caption" color="body">
              {formatNiche(n)}
            </AppText>
          </View>
        ))}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <AppText variant="titleLg" color="ink">
            {profile?.stats?.collaborations ?? 0}
          </AppText>
          <AppText variant="caption" color="muted">
            Collaborations
          </AppText>
        </View>
        <View style={[styles.statCell, styles.statBorder]}>
          <AppText variant="titleLg" color="ink">
            {profile?.stats?.approved ?? 'N/A'}
          </AppText>
          <AppText variant="caption" color="muted">
            Approved
          </AppText>
        </View>
        <View style={styles.statCell}>
          <AppText variant="titleLg" color="ink">
            {profile?.stats?.revisionsAvg ?? 0}
          </AppText>
          <AppText variant="caption" color="muted">
            Revisions avg
          </AppText>
        </View>
      </View>
      <View style={styles.sectionHeader}>
        <AppText variant="titleLg" color="ink">
          Portfolio
        </AppText>
        <AppText variant="caption" style={{ color: colors.link }}>
          Add video
        </AppText>
      </View>
      <View style={styles.grid}>
        {portfolioItems?.map((item, i) => (
          <View
            key={i}
            style={[styles.tile, { backgroundColor: colors.signaturePeach, overflow: 'hidden' }]}
          >
            {item.mediaType === 'image' ? (
              <Image source={{ uri: item.mediaUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="label" color="ink">
                  🎥 Video
                </AppText>
              </View>
            )}
          </View>
        ))}
        {(!portfolioItems || portfolioItems.length === 0) && (
          <AppText variant="body" color="muted">
            No portfolio items yet.
          </AppText>
        )}
      </View>
      {[
        ['Base price', profile?.basePrice ? `EGP ${profile.basePrice}` : 'Not set'],
        ['Payout details', payoutMethodStr],
        ['App language', 'English'],
      ].map(([k, v]) => (
        <View key={k} style={styles.infoRow}>
          <AppText variant="body" color="muted">
            {k}
          </AppText>
          <AppText variant="label" color="ink">
            {v}
          </AppText>
        </View>
      ))}

      <View style={styles.actions}>
        <Button title="Log out" variant="ghost" onPress={() => logout.mutate()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.signatureMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, color: colors.signatureForest },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  editBtnText: { fontSize: 13, color: colors.ink },
  vettedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.signatureForest,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: spacing.lg,
  },
  vettedText: { fontWeight: '500', color: colors.onPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  statsRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  statCell: { flex: 1, padding: spacing.md },
  statBorder: { borderStartWidth: 1, borderEndWidth: 1, borderColor: colors.hairline },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.lg },
  tile: { width: '47%', height: 196, borderRadius: radius.md },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  actions: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
