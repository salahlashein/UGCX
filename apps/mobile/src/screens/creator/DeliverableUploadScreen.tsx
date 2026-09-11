import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  TextInput as RNTextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import type { CreatorWorkStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';
import {
  useCollaborationDeliverables,
  useRegisterDeliverable,
} from '../../hooks/api/useDeliverables';
import { useRequestUploadUrl, uploadFileToPresignedUrl } from '../../hooks/api/useStorage';
import { useCollaboration } from '../../hooks/api/useCollaborations';

type Props = NativeStackScreenProps<CreatorWorkStackParamList, 'DeliverableUpload'>;

export function DeliverableUploadScreen({ route, navigation }: Props) {
  const { collaborationId } = route.params;
  const [note, setNote] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const { data: collab, isLoading: isCollabLoading } = useCollaboration(collaborationId);
  const { data: deliverables, isLoading: isDeliverablesLoading } =
    useCollaborationDeliverables(collaborationId);

  const { mutateAsync: registerDeliverable, isPending: isRegistering } =
    useRegisterDeliverable(collaborationId);

  const requestUploadUrl = useRequestUploadUrl();

  const activeDeliverable = deliverables?.[0]; // Usually the latest one
  const hasRevision = (activeDeliverable?.status as any) === 'rejected';

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!videoUri) return;
    setIsUploading(true);
    try {
      // 1. Get presigned URL
      const response = await requestUploadUrl.mutateAsync({
        module: 'deliverable',
        contentType: 'video/mp4',
        fileSize: 50000000,
      });

      // 2. Upload file
      await uploadFileToPresignedUrl(videoUri, response.uploadUrl, 'video/mp4');

      // 3. Register deliverable
      await registerDeliverable({
        type: 'ready_ad',
        fileUrl: response.fileUrl,
        durationSeconds: (collab as any)?.campaign?.durationSeconds || 60,
      });
      setIsUploading(false);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to submit deliverable:', err);
      Alert.alert(
        'Upload Failed',
        'Could not upload your video. Please check your connection and try again.',
      );
      setIsUploading(false);
    }
  };

  if (isCollabLoading || isDeliverablesLoading || !collab) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText style={styles.back}>{'<'}</AppText>
        </Pressable>
        <AppText variant="label" color="ink" style={{ flex: 1 }}>
          Upload deliverable
        </AppText>
        <AppText variant="body" color="muted">
          Save draft
        </AppText>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {hasRevision && (
          <View style={styles.revisionBanner}>
            <AppText variant="label" style={styles.revisionTitle}>
              Revision requested
            </AppText>
            <AppText variant="body" style={styles.bodyText}>
              "{(activeDeliverable as any)?.reviewNote || 'Please update the video.'}"
            </AppText>
          </View>
        )}

        {videoUri ? (
          <View style={styles.fileRow}>
            <View style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <AppText variant="label" color="ink">
                Selected Video
              </AppText>
              <AppText variant="caption" color="muted" style={styles.fileMeta}>
                Ready to upload
              </AppText>
            </View>
          </View>
        ) : (
          <Pressable style={styles.dropzone} onPress={pickVideo}>
            <AppText variant="body" color="body">
              + Pick video file
            </AppText>
          </Pressable>
        )}

        <AppText variant="titleLg" color="ink" style={{ marginVertical: spacing.md }}>
          Before you submit
        </AppText>

        {[
          'Vertical 9:16, no letterboxing',
          ...((collab as any)?.campaign?.talkingPoints || []),
        ].map((label) => (
          <Pressable
            key={label}
            style={styles.checkRow}
            onPress={() =>
              setCheckedItems((prev) => ({
                ...prev,
                [label]: !prev[label],
              }))
            }
          >
            <View style={[styles.checkbox, checkedItems[label] && styles.checkboxDone]}>
              {checkedItems[label] && <AppText style={styles.checkmark}>✓</AppText>}
            </View>
            <AppText variant="body" color="body">
              {label}
            </AppText>
          </Pressable>
        ))}

        <RNTextInput
          value={note}
          onChangeText={setNote}
          placeholder="Note for the brand (optional)"
          multiline
          style={styles.noteInput}
        />
      </ScrollView>
      <View style={styles.stickyBar}>
        <AppText variant="caption" color="muted" style={styles.disclosure}>
          {(collab as any).brand?.companyName} has 3 days to approve or request one more revision.
        </AppText>
        <Pressable
          style={[styles.cta, (isRegistering || isUploading) && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isRegistering || isUploading}
        >
          <AppText variant="label" color="onPrimary">
            {isRegistering || isUploading ? 'Submitting...' : 'Submit for review'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.lg,
  },
  back: { fontSize: 24, color: colors.ink, padding: spacing.xs, marginStart: -spacing.xs },
  revisionBanner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  revisionTitle: { color: colors.danger, marginBottom: 6 },
  bodyText: { color: colors.body },
  fileRow: { flexDirection: 'row', gap: 14, marginBottom: spacing.md },
  thumb: {
    width: 96,
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
  },
  fileMeta: { marginBottom: 8 },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: 6, backgroundColor: colors.primary },
  dropzone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.primary, borderWidth: 0 },
  checkmark: { color: colors.onPrimary, fontSize: 12 },
  noteInput: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 15,
    color: colors.body,
    marginVertical: spacing.md,
    textAlignVertical: 'top',
  },
  stickyBar: {
    borderTopWidth: 1,
    borderColor: colors.hairline,
    paddingTop: spacing.md,
    paddingBottom: 30,
  },
  disclosure: { marginBottom: 12 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
