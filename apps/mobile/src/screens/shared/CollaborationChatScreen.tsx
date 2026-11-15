import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput as RNTextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type {
  BrandCampaignsStackParamList,
  CreatorWorkStackParamList,
} from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { SystemMessageCapsule } from '../../components/ui/SystemMessageCapsule';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BackButton } from '../../components/ui/BackButton';
import { Icon } from '../../components/ui/Icon';
import { colors, spacing, radius } from '../../theme/tokens';
import { useCollaboration } from '../../hooks/api/useCollaborations';
import { useMessages, useSendMessage } from '../../hooks/api/useMessages';
import { useMarkChatRead } from '../../hooks/api/useChats';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<
  BrandCampaignsStackParamList & CreatorWorkStackParamList,
  'CollaborationChat'
>;

export function CollaborationChatScreen({ route, navigation }: Props) {
  const { collaborationId } = route.params;
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const { data: collab, isLoading: isCollabLoading } = useCollaboration(collaborationId);
  const { data: messagesRes, isLoading: isMessagesLoading } = useMessages(collaborationId);
  const { mutate: sendMessage, isPending } = useSendMessage(collaborationId);
  const { mutate: markRead } = useMarkChatRead();

  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (collaborationId) {
      markRead(collaborationId);
    }
  }, [collaborationId, markRead]);

  const handleSend = () => {
    if (!draft.trim() || isPending) return;
    sendMessage(
      { body: draft },
      {
        onSuccess: () => {
          setDraft('');
        },
      },
    );
  };

  const messages = messagesRes?.data || [];

  const renderSystemMessageText = (event: string, params: Record<string, string | number> | null) => {
    const brandName = (collab as any)?.brand?.companyName || 'Brand';
    const creatorName = (collab as any)?.creator?.displayName || 'Creator';
    const version = params?.version ?? '1';
    const total = params?.total ?? '';
    const creatorPrice = params?.creatorPrice ?? '';

    switch (event) {
      case 'escrow_funded':
        return user?.role === 'brand'
          ? t('chat.system.escrow_funded_brand', 'Escrow funded · EGP {{total}}', { total: total || (collab as any)?.totalAmount })
          : t('chat.system.escrow_funded_creator', 'Escrow funded · EGP {{creatorPrice}}', { creatorPrice: creatorPrice || (collab as any)?.creatorPrice });
      case 'shipment_confirmed':
        return t('chat.system.shipment_confirmed', '📦 Shipment marked sent');
      case 'deliverable_submitted':
        return user?.role === 'brand'
          ? t('chat.system.deliverable_submitted_brand', '{{creatorName}} submitted v{{version}}', { creatorName, version })
          : t('chat.system.deliverable_submitted_creator', 'You submitted v{{version}}', { version });
      case 'revision_requested':
        return user?.role === 'brand'
          ? t('chat.system.revision_requested_brand', 'You requested a revision')
          : t('chat.system.revision_requested_creator', '{{brandName}} requested a revision', { brandName });
      case 'escrow_released':
        return user?.role === 'brand'
          ? t('chat.system.escrow_released_brand', 'Escrow released · EGP {{total}}', { total: total || (collab as any)?.totalAmount })
          : t('chat.system.escrow_released_creator', 'Escrow released · EGP {{creatorPrice}}', { creatorPrice: creatorPrice || (collab as any)?.creatorPrice });
      default:
        return t(`chat.system.${event}`, event);
    }
  };

  if (isCollabLoading || !collab) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.avatar} />
        <View style={{ flex: 1, marginStart: 4 }}>
          <AppText variant="label" color="ink">
            {user?.role === 'creator'
              ? (collab as any).brand?.companyName || 'Brand'
              : (collab as any).creator?.displayName || 'Creator'}
          </AppText>
          <AppText variant="caption" color="muted">
            {(collab as any).campaign?.product?.name || (collab as any).campaign?.title || 'Campaign'}
          </AppText>
        </View>
        <StatusBadge status={collab.status} domain="collaboration" />
      </View>

      <FlatList
        ref={listRef}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: 14 }}
        inverted={false}
        renderItem={({ item }) => {
          if (item.kind === 'system' || !item.senderUserId) {
            const systemText = renderSystemMessageText(
              item.event || 'update',
              item.params as Record<string, string | number> | null,
            );
            return <SystemMessageCapsule message={systemText} />;
          }

          const mine = item.senderUserId === user?.id;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <AppText
                variant="body"
                style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}
              >
                {item.body}
              </AppText>
            </View>
          );
        }}
        ListEmptyComponent={
          isMessagesLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>
              {t('chat.empty', 'No messages yet. Say hello!')}
            </AppText>
          )
        }
      />

      <View style={styles.inputBar}>
        <RNTextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('chat.placeholder', 'Type a message')}
          placeholderTextColor={colors.muted}
          style={styles.input}
          onSubmitEditing={handleSend}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.send', 'Send')}
          style={[styles.sendBtn, isPending && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={isPending}
        >
          <Icon name="send" size={18} color="onPrimary" directional />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.signatureCream,
  },
  bubble: { maxWidth: '75%', borderRadius: radius.md, padding: 12 },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  bubbleTextTheirs: { color: colors.body },
  bubbleTextMine: { color: colors.onPrimary },
  inputBar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    paddingBottom: 30,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
