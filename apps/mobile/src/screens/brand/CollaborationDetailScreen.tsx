import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Deliverable } from '@ugcx/shared-types';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import { useCollaboration, useConfirmShipment } from '../../hooks/api/useCollaborations';
import {
  useCollaborationDeliverables,
  useReviewDeliverable,
} from '../../hooks/api/useDeliverables';
import { parseApiError } from '../../services/apiError';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormTextInput } from '../../components/forms/FormTextInput';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandCampaignsStackParamList, 'CollaborationDetail'>;

interface ShipmentForm {
  carrier: string;
  trackingNumber: string;
}

/** TASK-P1-008: GUD-001 loading/empty/error states. */
export function CollaborationDetailScreen({ route, navigation }: Props) {
  const { collaborationId } = route.params;
  const { t } = useTranslation();
  const collaborationQuery = useCollaboration(collaborationId);
  const deliverablesQuery = useCollaborationDeliverables(collaborationId);
  const confirmShipment = useConfirmShipment();
  const reviewDeliverable = useReviewDeliverable(collaborationId);
  const [actionError, setActionError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<ShipmentForm>({
    defaultValues: { carrier: '', trackingNumber: '' },
  });

  if (collaborationQuery.isLoading) return <LoadingState />;
  if (collaborationQuery.isError || !collaborationQuery.data) {
    return (
      <ErrorState
        message={parseApiError(collaborationQuery.error).message}
        onRetry={collaborationQuery.refetch}
      />
    );
  }

  const collaboration = collaborationQuery.data;
  const latestDeliverable: Deliverable | undefined = deliverablesQuery.data?.[0];

  const onConfirmShipment = handleSubmit(async (values) => {
    setActionError(null);
    try {
      await confirmShipment.mutateAsync({ id: collaborationId, dto: values });
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  });

  const reviewAction = async (action: 'approve' | 'request_revision' | 'decline') => {
    if (!latestDeliverable) return;
    setActionError(null);
    try {
      await reviewDeliverable.mutateAsync({ id: latestDeliverable.id, dto: { action } });
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.status}>
            {t('brand.collaboration.status')}: {collaboration.status}
          </Text>
          <Text style={styles.amount}>
            {collaboration.totalAmount} {collaboration.currency}
          </Text>
        </Card>

        {actionError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {actionError}
          </Text>
        ) : null}

        {collaboration.status === 'funded' && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{t('brand.collaboration.confirmShipment')}</Text>
            <FormTextInput
              control={control}
              name="carrier"
              label={t('brand.collaboration.carrier')}
            />
            <FormTextInput
              control={control}
              name="trackingNumber"
              label={t('brand.collaboration.trackingNumber')}
            />
            <Button
              title={t('brand.collaboration.confirmShipment')}
              onPress={onConfirmShipment}
              loading={confirmShipment.isPending}
            />
          </Card>
        )}

        {collaboration.status === 'delivered' && latestDeliverable && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{t('brand.collaboration.reviewDeliverable')}</Text>
            <Text style={styles.body}>{latestDeliverable.fileUrl}</Text>
            <View style={styles.actions}>
              <Button
                title={t('brand.collaboration.approve')}
                onPress={() => reviewAction('approve')}
                loading={reviewDeliverable.isPending}
              />
              <Button
                title={t('brand.collaboration.requestRevision')}
                variant="secondary"
                onPress={() => reviewAction('request_revision')}
              />
              <Button
                title={t('brand.collaboration.decline')}
                variant="secondary"
                onPress={() => reviewAction('decline')}
              />
            </View>
          </Card>
        )}

        <Button
          title={t('brand.collaboration.openChat')}
          variant="secondary"
          onPress={() => navigation.navigate('CollaborationChat', { collaborationId })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { marginBottom: spacing.md },
  status: { ...typography.subtitle, color: colors.ink },
  amount: { ...typography.body, color: colors.muted, marginTop: spacing.xxs },
  sectionTitle: { ...typography.subtitle, color: colors.ink, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.body, marginBottom: spacing.sm },
  error: { ...typography.body, color: colors.danger, marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
});
