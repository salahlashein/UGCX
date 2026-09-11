import React from 'react';
import { StyleSheet, View, SectionList } from 'react-native';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';

const SECTIONS = [
  {
    title: 'TODAY',
    data: [
      {
        text: 'Kanz Modest sent a message',
        meta: '"Any update on the reshoot?" · 2h ago',
        unread: true,
      },
      { text: 'Glow Lab requested a revision', meta: 'Collaboration #1042 · 5h ago', unread: true },
    ],
  },
  {
    title: 'YESTERDAY',
    data: [
      { text: 'EGP 2,800 released — Nefer Skin', meta: 'Now ready to withdraw', unread: false },
      { text: 'Your payout was sent', meta: 'EGP 5,100 via InstaPay · ref PO-2291', unread: false },
      {
        text: "You're vetted — welcome!",
        meta: 'You can now apply to any open brief',
        unread: false,
      },
    ],
  },
];

export function NotificationsScreen() {
  return (
    <SectionList
      style={styles.screen}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
      sections={SECTIONS}
      keyExtractor={(item, i) => item.text + i}
      ListHeaderComponent={
        <AppText
          variant="displayMd"
          color="ink"
          style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}
        >
          Notifications
        </AppText>
      }
      renderSectionHeader={({ section }) => (
        <AppText style={styles.sectionHeader}>{section.title}</AppText>
      )}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={[styles.dot, { opacity: item.unread ? 1 : 0 }]} />
          <View style={{ flex: 1 }}>
            <AppText variant="label" color="ink">
              {item.text}
            </AppText>
            <AppText variant="caption" color="muted">
              {item.meta}
            </AppText>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  sectionHeader: {
    fontFamily: 'monospace',
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.muted,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.signatureCoral,
    marginTop: 6,
  },
});
