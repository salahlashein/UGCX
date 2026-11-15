import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BriefListItem } from '@ugcx/shared-types';
import type { BrandBriefsStackParamList } from '../../navigation/types';
import {
  useMyBriefs,
  usePauseBrief,
  useResumeBrief,
  useCloseBrief,
  type BriefStatusFilter,
} from '../../hooks/api/useCampaigns';
import { AppText } from '../../components/ui/Text';
import { Card, PressableCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FilterChip } from '../../components/ui/FilterChip';
import { Icon } from '../../components/ui/Icon';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { colors, radius, spacing } from '../../theme/tokens';
import { parseApiError } from '../../services/apiError';

type Props = NativeStackScreenProps<BrandBriefsStackParamList, 'MyBriefs'>;

const FILTER_KEYS: BriefStatusFilter[] = ['all', 'draft', 'open', 'completed'];

/**
 * TASK-P1-13: My briefs list screen (artboard 4c and 4h).
 */
export function MyBriefsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<BriefStatusFilter>('all');
  const query = useMyBriefs(selectedFilter);
  const pauseBrief = usePauseBrief();
  const resumeBrief = useResumeBrief();
  const closeBrief = useCloseBrief();

  const filterCounts = query.data?.counts;
  const briefs = query.data?.data || [];

  const renderMetaText = (brief: BriefListItem) => {
    if (brief.status === 'draft') {
      return t('brand.briefs.meta.draft');
    }
    if (brief.status === 'completed' && brief.acceptedCreatorName) {
      return `${brief.acceptedCreatorName} · ${t('brand.briefs.meta.paidOut')}`;
    }
    if (brief.acceptedCreatorName && brief.collaborationStatus) {
      const statusLabel = t(`status.collaboration.${brief.collaborationStatus}`);
      return `${brief.acceptedCreatorName} · ${statusLabel}`;
    }
    return t('brand.briefs.meta.proposals', { count: brief.proposalCount ?? 0 });
  };

  const handleBriefPress = (brief: BriefListItem) => {
    if (brief.status === 'draft') {
      navigation.navigate('FundEscrow', { campaignId: brief.id });
    } else {
      navigation.navigate('ProposalsInbox', { campaignId: brief.id });
    }
  };

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <Card key={i} tone="strong" style={styles.skeletonCard} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Title and Plus Button */}
      <View style={styles.header}>
        <AppText variant="displayMd" color="ink">
          {t('brand.briefs.title')}
        </AppText>
        <Pressable
          style={styles.plusButton}
          onPress={() => navigation.navigate('PostBrief')}
          accessibilityRole="button"
          accessibilityLabel={t('brand.brief.title')}
        >
          <Icon name="plus" size={18} color="onPrimary" />
        </Pressable>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filtersBar}>
        {FILTER_KEYS.map((filter) => {
          const count = filterCounts ? filterCounts[filter] : undefined;
          const label = count !== undefined
            ? `${t(`brand.briefs.filters.${filter}`)} (${count})`
            : t(`brand.briefs.filters.${filter}`);
          return (
            <FilterChip
              key={filter}
              label={label}
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
            />
          );
        })}
      </View>

      {/* Content States */}
      {query.isLoading ? (
        renderLoadingSkeleton()
      ) : query.isError ? (
        <View style={styles.stateWrap}>
          <ErrorState
            message={parseApiError(query.error).message}
            onRetry={query.refetch}
          />
        </View>
      ) : briefs.length === 0 ? (
        <View style={styles.stateWrap}>
          <EmptyState
            icon="file-text"
            title={t('brand.briefs.empty.title')}
            message={t('brand.briefs.empty.message')}
            action={{
              label: t('brand.briefs.empty.action'),
              onPress: () => navigation.navigate('PostBrief'),
            }}
          />
        </View>
      ) : (
        <FlatList
          data={briefs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={query.refetch}
            />
          }
          renderItem={({ item }) => {
            const isDraft = item.status === 'draft';
            return (
              <Card style={[styles.card, isDraft && styles.draftCard]}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleBriefPress(item)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.titleWrap}>
                      <AppText
                        variant="titleSm"
                        color="ink"
                        numberOfLines={1}
                        style={styles.cardTitle}
                      >
                        {item.title}
                      </AppText>
                      <AppText variant="caption" color="muted" numberOfLines={1}>
                        {renderMetaText(item)}
                      </AppText>
                    </View>
                    <StatusBadge domain="campaign" status={item.status} />
                  </View>
                </Pressable>
                {(item.status === 'live' || item.status === 'paused') && (
                  <View style={styles.actionRow}>
                    {item.status === 'live' ? (
                      <Pressable
                        accessibilityRole="button"
                        style={styles.actionBtn}
                        onPress={(e: any) => {
                          e?.stopPropagation?.();
                          pauseBrief.mutate(item.id);
                        }}
                      >
                        <AppText variant="caption" color="primary">
                          {t('brand.brief.pause', 'Pause brief')}
                        </AppText>
                      </Pressable>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        style={styles.actionBtn}
                        onPress={(e: any) => {
                          e?.stopPropagation?.();
                          resumeBrief.mutate(item.id);
                        }}
                      >
                        <AppText variant="caption" color="primary">
                          {t('brand.brief.resume', 'Resume brief')}
                        </AppText>
                      </Pressable>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      style={[styles.actionBtn, styles.actionBtnClose]}
                      onPress={(e: any) => {
                        e?.stopPropagation?.();
                        closeBrief.mutate({ id: item.id });
                      }}
                    >
                      <AppText variant="caption" color="danger">
                        {t('brand.brief.close', 'Close & refund')}
                      </AppText>
                    </Pressable>
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.inputBorder,
  },
  actionBtn: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceStrong,
  },
  actionBtnClose: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    marginBottom: spacing.xs,
  },
  draftCard: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrap: {
    flex: 1,
    marginEnd: spacing.sm,
  },
  cardTitle: {
    marginBottom: spacing.xxs,
  },
  stateWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  skeletonCard: {
    height: 72,
    borderRadius: radius.md,
  },
});
