import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BrandChatsStackParamList } from '../../navigation/types';
import { useChats } from '../../hooks/api/useChats';
import { AppText } from '../../components/ui/Text';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, radius, spacing } from '../../theme/tokens';

/**
 * TASK-P3-11: Brand Chats Screen (Artboard 3f entry point).
 * Renders list of conversations with counterpart name, avatar initials,
 * last message preview, and unread pill.
 */
export function BrandChatsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BrandChatsStackParamList>>();
  const { data: chatsRes, isLoading, isError, error, refetch } = useChats();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (isError || !chatsRes) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ErrorState
          title={t('common.error.title', 'Error')}
          message={(error as Error)?.message ?? t('common.error.generic')}
          onRetry={() => refetch()}
        />
      </SafeAreaView>
    );
  }

  const chats = chatsRes.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="displayMd" color="ink">
          {t('nav.chats', 'Chats')}
        </AppText>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.collaborationId}
        contentContainerStyle={chats.length === 0 ? styles.emptyContainer : styles.listContent}
        renderItem={({ item }) => {
          return (
            <Pressable
              style={styles.chatRow}
              onPress={() =>
                navigation.navigate('CollaborationChat', {
                  collaborationId: item.collaborationId,
                })
              }
            >
              <View style={styles.avatar}>
                <AppText variant="label" color="ink">
                  {item.counterpartInitials || 'CR'}
                </AppText>
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.topRow}>
                  <AppText variant="label" color="ink" numberOfLines={1}>
                    {item.counterpartName}
                  </AppText>
                  <AppText variant="caption" color="muted">
                    {item.campaignTitle}
                  </AppText>
                </View>

                <View style={styles.bottomRow}>
                  <AppText variant="bodySm" color="body" numberOfLines={1} style={styles.preview}>
                    {item.lastMessagePreview || t('chat.empty', 'No messages yet')}
                  </AppText>

                  {item.unreadCount > 0 && (
                    <View style={styles.unreadPill}>
                      <AppText variant="caption" color="onPrimary" style={styles.unreadText}>
                        {item.unreadCount}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="message-circle"
            title={t('chat.empty', 'No chats yet')}
            message={t('chat.notEligible', 'Chats appear once a collaboration is funded.')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  listContent: {
    paddingVertical: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  chatInfo: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    marginEnd: spacing.sm,
  },
  unreadPill: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
