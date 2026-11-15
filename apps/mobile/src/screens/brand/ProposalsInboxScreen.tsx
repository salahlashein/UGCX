import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { Proposal } from '@ugcx/shared-types';
import { useCampaignProposals, useUpdateProposalStatus } from '../../hooks/api/useProposals';
import { useMyCollaborations } from '../../hooks/api/useCollaborations';
import { QueryStateView } from '../../components/ui/QueryStateView';
import { Card } from '../../components/ui/Card';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { colors, radius, spacing } from '../../theme/tokens';
import { initialsOf } from '../../utils/format';

type Props = {
  route?: { params?: { campaignId?: string } };
  navigation: any;
};

/**
 * TASK-P1-007, TASK-P2-13 (artboard 3d): Proposals inbox.
 * Shows avatar with initials, display name, job count, clipped pitch, and price.
 * Tapping a row opens CreatorProfilePreview.
 */
export function ProposalsInboxScreen({ route, navigation }: Props) {
  const campaignId = route?.params?.campaignId;
  const { t } = useTranslation();
  const query = useCampaignProposals(campaignId);
  const updateStatus = useUpdateProposalStatus(campaignId ?? '');
  const collaborations = useMyCollaborations();

  const findCollaborationId = useMemo(() => {
    const byProposalId = new Map(
      (collaborations.data?.data ?? []).map((c) => [c.proposalId, c.id]),
    );
    return (proposalId: string) => byProposalId.get(proposalId);
  }, [collaborations.data]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <QueryStateView
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data?.data}
        onRetry={query.refetch}
        emptyMessage={t('brand.proposals.empty', 'No proposals received yet.')}
      >
        {(proposals) => (
          <FlatList
            data={proposals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ProposalCard
                proposal={item}
                collaborationId={findCollaborationId(item.id)}
                onOpenPreview={() =>
                  navigation.navigate('CreatorProfilePreview', { proposalId: item.id })
                }
                onShortlist={() =>
                  updateStatus.mutate({ id: item.id, dto: { status: 'shortlisted' } })
                }
                onDecline={() => updateStatus.mutate({ id: item.id, dto: { status: 'declined' } })}
                onAccept={() => navigation.navigate('AcceptProposal', { proposalId: item.id })}
                onViewCollaboration={(collabId) =>
                  navigation.navigate('CollaborationDetail', { collaborationId: collabId })
                }
              />
            )}
          />
        )}
      </QueryStateView>
    </SafeAreaView>
  );
}

function ProposalCard({
  proposal,
  collaborationId,
  onOpenPreview,
  onShortlist,
  onDecline,
  onAccept,
  onViewCollaboration,
}: {
  proposal: Proposal;
  collaborationId: string | undefined;
  onOpenPreview: () => void;
  onShortlist: () => void;
  onDecline: () => void;
  onAccept: () => void;
  onViewCollaboration: (collaborationId: string) => void;
}) {
  const { t } = useTranslation();
  const creatorName = proposal.creator?.displayName || t('creator.anonymous', 'Creator');

  return (
    <Card tone="canvas" style={styles.card}>
      <Pressable onPress={onOpenPreview} style={styles.cardHeaderPressable}>
        <View style={styles.avatar}>
          <AppText variant="titleSm" color="ink">
            {initialsOf(creatorName)}
          </AppText>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.topLine}>
            <AppText variant="titleSm" color="ink">
              {creatorName}
            </AppText>
            <AppText variant="titleSm" color="ink">
              {proposal.currency} {proposal.price}
            </AppText>
          </View>
          <AppText variant="caption" color="muted">
            {proposal.deliveryDays} {t('common.days', 'days')} · {t(`brand.proposals.status.${proposal.status}`, proposal.status)}
          </AppText>
        </View>
      </Pressable>

      {proposal.pitch ? (
        <Pressable onPress={onOpenPreview}>
          <AppText variant="body" color="body" numberOfLines={2} style={styles.pitch}>
            {proposal.pitch}
          </AppText>
        </Pressable>
      ) : null}

      {proposal.status === 'applied' && (
        <View style={styles.actions}>
          <Button
            title={t('brand.proposals.shortlist', 'Shortlist')}
            variant="secondary"
            fullWidth={false}
            onPress={onShortlist}
          />
          <Button
            title={t('brand.proposals.decline', 'Decline')}
            variant="secondary"
            fullWidth={false}
            onPress={onDecline}
          />
          <Button
            title={t('brand.proposals.accept', 'Accept')}
            fullWidth={false}
            onPress={onAccept}
          />
        </View>
      )}
      {proposal.status === 'shortlisted' && (
        <View style={styles.actions}>
          <Button
            title={t('brand.proposals.decline', 'Decline')}
            variant="secondary"
            fullWidth={false}
            onPress={onDecline}
          />
          <Button
            title={t('brand.proposals.accept', 'Accept')}
            fullWidth={false}
            onPress={onAccept}
          />
        </View>
      )}
      {proposal.status === 'accepted' && collaborationId && (
        <View style={styles.actions}>
          <Button
            title={t('brand.collaboration.title', 'View collaboration')}
            variant="secondary"
            fullWidth={false}
            onPress={() => onViewCollaboration(collaborationId)}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  cardHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.signatureMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pitch: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
});
