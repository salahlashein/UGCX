import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Campaign } from '@ugcx/shared-types';
import type { BrandCampaignsStackParamList } from '../../navigation/types';
import { useMyCampaigns } from '../../hooks/api/useCampaigns';
import { QueryStateView } from '../../components/ui/QueryStateView';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandCampaignsStackParamList, 'CampaignsList'>;

/** TASK-P1-006: GUD-001 loading/empty/error states via QueryStateView. */
export function CampaignsListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const query = useMyCampaigns();

  const openCampaign = useCallback(
    (campaign: Campaign) => {
      if (campaign.status === 'draft') {
        navigation.navigate('CampaignWizard', { campaignId: campaign.id });
      } else {
        navigation.navigate('ProposalsInbox', { campaignId: campaign.id });
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Button
          title={t('brand.campaigns.createNew')}
          onPress={() => navigation.navigate('CampaignWizard', undefined)}
        />
      </View>
      <QueryStateView
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data?.data}
        onRetry={query.refetch}
        emptyMessage={t('brand.campaigns.empty')}
      >
        {(campaigns) => (
          <FlatList
            data={campaigns}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable onPress={() => openCampaign(item)}>
                <Card style={styles.card}>
                  <Text style={styles.title}>
                    {item.niche ? t(`niche.${item.niche}`) : t('brand.wizard.stepDetails')}
                  </Text>
                  <Text style={styles.status}>{t(`brand.campaigns.status.${item.status}`)}</Text>
                </Card>
              </Pressable>
            )}
          />
        )}
      </QueryStateView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: { padding: spacing.lg, paddingBottom: 0 },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  title: { ...typography.subtitle, color: colors.ink },
  status: { ...typography.caption, color: colors.muted, marginTop: spacing.xxs },
});
