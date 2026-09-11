import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Proposal } from '@ugcx/shared-types';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import { useCampaignProposals, useUpdateProposalStatus } from '../../hooks/api/useProposals';
import { useMyCollaborations } from '../../hooks/api/useCollaborations';
import { QueryStateView } from '../../components/ui/QueryStateView';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandCampaignsStackParamList, 'ProposalsInbox'>;

/** TASK-P1-007 */
export function ProposalsInboxScreen({ route, navigation }: Props) {
  const { campaignId } = route.params;
  const { t } = useTranslation();
  const query = useCampaignProposals(campaignId);
  const updateStatus = useUpdateProposalStatus(campaignId);
  // Backs the "View collaboration" action on an already-accepted proposal
  // (feature_mobile_app_phase1 addendum: GET /collaborations/mine).
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
        emptyMessage={t('brand.proposals.empty')}
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
                onShortlist={() =>
                  updateStatus.mutate({ id: item.id, dto: { status: 'shortlisted' } })
                }
                onDecline={() => updateStatus.mutate({ id: item.id, dto: { status: 'declined' } })}
                onAccept={() => navigation.navigate('AcceptProposal', { proposalId: item.id })}
                onViewCollaboration={(collaborationId) =>
                  navigation.navigate('CollaborationDetail', { collaborationId })
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
  onShortlist,
  onDecline,
  onAccept,
  onViewCollaboration,
}: {
  proposal: Proposal;
  collaborationId: string | undefined;
  onShortlist: () => void;
  onDecline: () => void;
  onAccept: () => void;
  onViewCollaboration: (collaborationId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card style={styles.card}>
      <Text style={styles.price}>
        {proposal.price} {proposal.currency}
      </Text>
      <Text style={styles.meta}>{proposal.deliveryDays} days</Text>
      <Text style={styles.pitch}>{proposal.pitch}</Text>
      <Text style={styles.status}>{t(`brand.proposals.status.${proposal.status}`)}</Text>

      {proposal.status === 'applied' && (
        <View style={styles.actions}>
          <Button
            title={t('brand.proposals.shortlist')}
            variant="secondary"
            onPress={onShortlist}
          />
          <Button title={t('brand.proposals.decline')} variant="secondary" onPress={onDecline} />
          <Button title={t('brand.proposals.accept')} onPress={onAccept} />
        </View>
      )}
      {proposal.status === 'shortlisted' && (
        <View style={styles.actions}>
          <Button title={t('brand.proposals.decline')} variant="secondary" onPress={onDecline} />
          <Button title={t('brand.proposals.accept')} onPress={onAccept} />
        </View>
      )}
      {proposal.status === 'accepted' && collaborationId && (
        <View style={styles.actions}>
          <Button
            title={t('brand.collaboration.title')}
            variant="secondary"
            onPress={() => onViewCollaboration(collaborationId)}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  price: { ...typography.subtitle, color: colors.ink },
  meta: { ...typography.caption, color: colors.muted },
  pitch: { ...typography.body, color: colors.body, marginTop: spacing.xs },
  status: { ...typography.caption, color: colors.muted, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
});
