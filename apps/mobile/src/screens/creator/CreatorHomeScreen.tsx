import React from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorHomeStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';
import { useCreatorProfile } from '../../hooks/api/useCreator';
import { useHomeQueue, HomeTask } from '../../hooks/api/useHomeQueue';

type Props = NativeStackScreenProps<CreatorHomeStackParamList, 'Home'>;

export function CreatorHomeScreen({ navigation }: Props) {
  const { data: profile, isLoading: isProfileLoading } = useCreatorProfile();
  const { data: queue, isLoading: isQueueLoading } = useHomeQueue();

  const handleAction = (task: HomeTask) => {
    if (task.actionUrl.startsWith('/upload')) {
      // @ts-expect-error - Navigate across tabs
      navigation.navigate('WorkTab', {
        screen: 'DeliverableUpload',
        params: { collaborationId: task.collaborationId },
      });
    } else if (task.actionUrl.startsWith('/chat')) {
      // @ts-expect-error - Navigate across tabs
      navigation.navigate('WorkTab', {
        screen: 'CollaborationChat',
        params: { id: task.collaborationId },
      });
    } else {
      // @ts-expect-error - Navigate across tabs
      navigation.navigate('WorkTab', { screen: 'WorkStatus' });
    }
  };

  if (isProfileLoading || isQueueLoading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initials = profile?.displayName?.substring(0, 2).toUpperCase() || 'U';
  const urgentCount = queue?.urgentTasks?.length || 0;
  const upcomingCount = queue?.upcomingTasks?.length || 0;
  const totalCount = urgentCount + upcomingCount;

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
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <AppText variant="label" style={styles.avatarText}>
            {initials}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="label" color="ink">
            {profile?.displayName || 'Creator'}
          </AppText>
          <AppText variant="caption" color="muted">
            {profile?.city || 'City'} · {formatNiche(profile?.niches?.[0])}
          </AppText>
        </View>
      </View>

      <AppText variant="displayMd" color="ink" style={styles.heading}>
        {totalCount > 0 ? `${totalCount} things need you` : 'All caught up!'}
      </AppText>
      <AppText variant="body" color="muted" style={styles.sub}>
        {totalCount > 0
          ? `${urgentCount} urgent tasks and ${upcomingCount} upcoming.`
          : 'No urgent tasks for now.'}
      </AppText>

      {queue?.urgentTasks?.map((task) => (
        <View key={task.id} style={styles.coralCard}>
          <AppText style={styles.coralKicker}>URGENT</AppText>
          <AppText variant="titleLg" style={styles.coralTitle}>
            {task.title}
          </AppText>
          <AppText variant="body" style={styles.coralBody}>
            {task.description}
          </AppText>
          <View style={styles.coralActions}>
            <Pressable style={styles.coralPrimaryBtn} onPress={() => handleAction(task)}>
              <AppText variant="label" color="ink">
                {task.actionText}
              </AppText>
            </Pressable>
          </View>
        </View>
      ))}

      {queue?.upcomingTasks?.map((task) => (
        <Pressable key={task.id} style={styles.row} onPress={() => handleAction(task)}>
          <View
            style={[
              styles.rowIcon,
              {
                backgroundColor:
                  task.theme === 'forest' ? colors.signatureYellow : colors.signaturePeach,
              },
            ]}
          />
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <AppText variant="label" color="ink">
              {task.title}
            </AppText>
            <AppText variant="caption" color="muted">
              {task.description}
            </AppText>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  avatarText: { color: colors.signatureForest },
  heading: { marginBottom: 6 },
  sub: { marginBottom: spacing.lg },
  coralCard: {
    backgroundColor: colors.signatureCoral,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  coralKicker: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  coralTitle: { color: colors.onPrimary, marginBottom: 8 },
  coralBody: { color: 'rgba(255,255,255,0.9)', marginBottom: spacing.md },
  coralActions: { flexDirection: 'row', gap: 10 },
  coralPrimaryBtn: {
    backgroundColor: colors.onPrimary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowIcon: { width: 40, height: 40, borderRadius: radius.md },
});
