import React, { useState } from 'react';
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
import type {
  BrandCampaignsStackParamList,
  CreatorWorkStackParamList,
} from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';
import { useCollaboration } from '../../hooks/api/useCollaborations';
import { useMessages, useSendMessage } from '../../hooks/api/useMessages';
import { useAuthStore } from '../../store/authStore';

type Props = NativeStackScreenProps<
  BrandCampaignsStackParamList & CreatorWorkStackParamList,
  'CollaborationChat'
>;

export function CollaborationChatScreen({ route, navigation }: Props) {
  const { collaborationId } = route.params;
  const user = useAuthStore((state) => state.user);

  const { data: collab, isLoading: isCollabLoading } = useCollaboration(collaborationId);
  const { data: messagesRes, isLoading: isMessagesLoading } = useMessages(collaborationId);
  const { mutate: sendMessage, isPending } = useSendMessage(collaborationId);

  const [draft, setDraft] = useState('');

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
        <Pressable onPress={() => navigation.goBack()}>
          <AppText style={styles.back}>{'<'}</AppText>
        </Pressable>
        <View style={styles.avatar} />
        <View style={{ flex: 1, marginStart: 4 }}>
          <AppText variant="label" color="ink">
            {(collab as any).brand?.companyName || 'Brand'}
          </AppText>
          <AppText variant="caption" color="muted">
            {(collab as any).campaign?.product?.name || 'Campaign'}
          </AppText>
        </View>
        <View style={styles.statusTag}>
          <AppText style={styles.statusTagText}>{collab.status}</AppText>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: 14 }}
        inverted={false}
        renderItem={({ item }) => {
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
              No messages yet.
            </AppText>
          )
        }
      />

      <View style={styles.inputBar}>
        <View style={styles.attach}>
          <AppText style={{ color: colors.muted }}>+</AppText>
        </View>
        <RNTextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message..."
          style={styles.input}
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[styles.sendBtn, isPending && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={isPending}
        >
          <AppText style={{ color: colors.onPrimary }}>{'>'}</AppText>
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
  back: { fontSize: 24, color: colors.ink, padding: spacing.xs, marginStart: -spacing.xs },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.signatureCream,
  },
  statusTag: {
    backgroundColor: colors.signatureYellow,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  statusTagText: { fontSize: 12, fontWeight: '500', color: colors.ink },
  systemBubble: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
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
  attach: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
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
