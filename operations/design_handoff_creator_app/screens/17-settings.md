# Settings (2d)

Language segmented control (English/العربية), account and support rows.

```jsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function SettingsScreen({ onLogout }) {
  const [lang, setLang] = useState('en');
  const Row = ({ label, value, danger }) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
  );
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.back}>‹</Text>
        <Text style={[type.displayMd, { color: colors.ink }]}>Settings</Text>
      </View>
      <Text style={styles.sectionLabel}>LANGUAGE</Text>
      <View style={styles.segmented}>
        <Pressable onPress={() => setLang('en')} style={[styles.segment, lang === 'en' && styles.segmentActive]}>
          <Text style={[styles.segmentText, lang === 'en' && styles.segmentTextActive]}>English</Text>
        </Pressable>
        <Pressable onPress={() => setLang('ar')} style={[styles.segment, lang === 'ar' && styles.segmentActive, { borderLeftWidth: 1, borderColor: colors.inputBorder }]}>
          <Text style={[styles.segmentText, lang === 'ar' && styles.segmentTextActive]}>العربية</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.list}>
        <Row label="Payout details" value="InstaPay ›" />
        <Row label="Phone number" value="+20 100 •••• 471" />
        <Row label="Notifications" value="On ›" />
      </View>
      <Text style={styles.sectionLabel}>SUPPORT</Text>
      <View style={styles.list}>
        <Row label="Help center" value="›" />
        <Pressable onPress={onLogout}><Row label="Log out" danger /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: spacing.md },
  back: { fontSize: 20, color: colors.ink },
  sectionLabel: { fontFamily: 'monospace', fontSize: 13, letterSpacing: 0.4, color: colors.muted, marginBottom: 8, marginTop: spacing.md },
  segmented: { flexDirection: 'row', borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, overflow: 'hidden', marginBottom: spacing.md },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { ...type.body, color: colors.body },
  segmentTextActive: { color: colors.onPrimary, fontWeight: '500' },
  list: { borderTopWidth: 1, borderColor: colors.hairline },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.hairline },
  rowLabel: { ...type.body, color: colors.ink },
  rowValue: { ...type.caption, color: colors.muted },
});

```
