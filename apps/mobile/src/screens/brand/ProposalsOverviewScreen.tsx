import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BriefListItem } from '@ugcx/shared-types';
import type { BrandProposalsStackParamList } from '../../navigation/types';
import { useMyBriefs } from '../../hooks/api/useCampaigns';
import { AppText } from '../../components/ui/Text';
import { PressableCard } from '../../components/ui/Card';
import { QueryStateView } from '../../components/ui/QueryStateView';
import { Icon } from '../../components/ui/Icon';
import { colors, spacing } from '../../theme/tokens';
import { formatCount } from '../../utils/format';

type Props = NativeStackScreenProps<BrandProposalsStackParamList, 'ProposalsAcrossBriefs'>;

/**
 * Proposals tab. The API lists proposals per brief, so this screen lists the open
 * briefs that have proposals. A tap opens that brief's inbox.
 */
export function ProposalsOverviewScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const query = useMyBriefs('open');

  const briefs = (query.data?.data ?? [])
    .filter((brief) => (brief.proposalCount ?? 0) > 0)
    .sort((a, b) => (b.proposalCount ?? 0) - (a.proposalCount ?? 0));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <QueryStateView<BriefListItem>
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={briefs}
        onRetry={() => query.refetch()}
        emptyMessage={t(
          'brand.proposals.overview.empty',
          'No proposals yet. They appear here when creators apply to your open briefs.',
        )}
      >
        {(items) => (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => query.refetch()}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <PressableCard
                accessibilityLabel={t(
                  'brand.proposals.overview.rowLabel',
                  '{{title}}, {{count}} proposals',
                  { title: item.title, count: item.proposalCount },
                )}
                onPress={() => navigation.navigate('ProposalsInbox', { campaignId: item.id })}
              >
                <View style={styles.row}>
                  <View style={styles.count}>
                    <AppText variant="label" color="onPrimary" style={styles.countText}>
                      {formatCount(item.proposalCount)}
                    </AppText>
                  </View>
                  <View style={styles.info}>
                    <AppText variant="label" color="ink" numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText variant="bodySm" color="muted">
                      {t('brand.proposals.overview.waiting', '{{count}} waiting for your review', {
                        count: item.proposalCount,
                      })}
                    </AppText>
                  </View>
                  <Icon name="chevron-right" size={18} color="muted" directional />
                </View>
              </PressableCard>
            )}
          />
        )}
      </QueryStateView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  list: { padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  count: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontVariant: ['tabular-nums'] },
  info: { flex: 1 },
});
