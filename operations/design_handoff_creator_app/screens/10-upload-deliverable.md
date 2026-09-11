# Upload Deliverable (1e cont.)

Revision banner (danger tokens), file progress, pre-submit checklist.

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, type } from '../theme/tokens';

export default function UploadDeliverableScreen({ hasRevision = true, onSubmit }) {
  const [note, setNote] = useState('');
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.back}>‹</Text>
        <Text style={[type.label, { flex: 1, color: colors.ink }]}>Upload deliverable</Text>
        <Text style={styles.saveDraft}>Save draft</Text>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {hasRevision && (
          <View style={styles.revisionBanner}>
            <Text style={styles.revisionTitle}>Revision 1 requested</Text>
            <Text style={styles.body}>"Love the intro. Can you re-shoot the middle with a close-up of the pump and drop the background music?"</Text>
          </View>
        )}
        <View style={styles.fileRow}>
          <View style={styles.thumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.fileName}>glowlab-review-v2.mp4</Text>
            <Text style={styles.fileMeta}>62s · 1080×1920 · 184 MB</Text>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '68%' }]} /></View>
            <Text style={styles.fileMeta}>Uploading · 68%</Text>
          </View>
        </View>
        <Pressable style={styles.dropzone}><Text style={styles.body}>+ Add another file</Text></Pressable>
        <Text style={[type.titleLg, { color: colors.ink, marginVertical: spacing.md }]}>Before you submit</Text>
        {[['Vertical 9:16, no letterboxing', true], ['No copyrighted music', true], ['Pump close-up included', false]].map(([label, done]) => (
          <View key={label} style={styles.checkRow}>
            <View style={[styles.checkbox, done && styles.checkboxDone]}>
              {done && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.body}>{label}</Text>
          </View>
        ))}
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Note for the brand (optional)"
          multiline
          style={styles.noteInput}
        />
      </ScrollView>
      <View style={styles.stickyBar}>
        <Text style={styles.disclosure}>Glow Lab has 3 days to approve or request one more revision.</Text>
        <Pressable style={styles.cta} onPress={onSubmit}><Text style={styles.ctaText}>Submit for review</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.lg },
  back: { fontSize: 20, color: colors.ink },
  saveDraft: { ...type.body, color: colors.muted },
  revisionBanner: { backgroundColor: colors.dangerSurface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  revisionTitle: { ...type.label, color: colors.danger, marginBottom: 6 },
  body: { ...type.body, color: colors.body },
  fileRow: { flexDirection: 'row', gap: 14, marginBottom: spacing.md },
  thumb: { width: 96, height: 150, borderRadius: radius.md, backgroundColor: colors.surfaceStrong },
  fileName: { ...type.label, color: colors.ink },
  fileMeta: { ...type.caption, color: colors.muted, marginBottom: 8 },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceStrong, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 6, backgroundColor: colors.primary },
  dropzone: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.inputBorder, borderRadius: radius.md, padding: 20, alignItems: 'center', marginBottom: spacing.lg },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.hairline },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.inputBorder, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: colors.primary, borderWidth: 0 },
  checkmark: { color: colors.onPrimary, fontSize: 12 },
  noteInput: { minHeight: 70, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.sm, padding: 12, ...type.body, marginVertical: spacing.md, textAlignVertical: 'top' },
  stickyBar: { borderTopWidth: 1, borderColor: colors.hairline, paddingTop: spacing.md, paddingBottom: 30 },
  disclosure: { ...type.caption, color: colors.muted, marginBottom: 12 },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText: { ...type.label, color: colors.onPrimary },
});

```
