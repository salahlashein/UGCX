import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/ui/Text';
import { useLogout } from '../../hooks/api/useAuth';
import { colors, spacing, radius } from '../../theme/tokens';

export function SettingsScreen() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const setLang = (newLang: string) => i18n.changeLanguage(newLang);
  const logout = useLogout();

  const Row = ({ label, value, danger }: { label: string; value?: string; danger?: boolean }) => (
    <View style={styles.row}>
      <AppText variant="body" style={[styles.rowLabel, danger && { color: colors.danger }]}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="caption" color="muted">
          {value}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="displayMd" color="ink">
          Settings
        </AppText>
      </View>
      <AppText style={styles.sectionLabel}>LANGUAGE</AppText>
      <View style={styles.segmented}>
        <Pressable
          onPress={() => setLang('en')}
          style={[styles.segment, lang === 'en' && styles.segmentActive]}
        >
          <AppText
            variant="body"
            style={lang === 'en' ? styles.segmentTextActive : styles.segmentText}
          >
            English
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setLang('ar')}
          style={[
            styles.segment,
            lang === 'ar' && styles.segmentActive,
            { borderStartWidth: 1, borderColor: colors.inputBorder },
          ]}
        >
          <AppText
            variant="body"
            style={lang === 'ar' ? styles.segmentTextActive : styles.segmentText}
          >
            العربية
          </AppText>
        </Pressable>
      </View>
      <AppText style={styles.sectionLabel}>ACCOUNT</AppText>
      <View style={styles.list}>
        <Row label="Payout details" value="InstaPay ›" />
        <Row label="Phone number" value="+20 100 •••• 471" />
        <Row label="Notifications" value="On ›" />
      </View>
      <AppText style={styles.sectionLabel}>SUPPORT</AppText>
      <View style={styles.list}>
        <Row label="Help center" value="›" />
        <Pressable onPress={() => logout.mutate()}>
          <Row label="Log out" danger />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: spacing.md,
    marginTop: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.muted,
    marginBottom: 8,
    marginTop: spacing.md,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.body },
  segmentTextActive: { color: colors.onPrimary, fontWeight: '500' },
  list: { borderTopWidth: 1, borderColor: colors.hairline },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  rowLabel: { color: colors.ink },
});
