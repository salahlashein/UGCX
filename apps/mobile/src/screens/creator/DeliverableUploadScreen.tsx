import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  TextInput as RNTextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import type { CreatorWorkStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { colors, spacing, radius } from '../../theme/tokens';
import { elevation } from '../../theme/elevation';
import {
  useCollaborationDeliverables,
  useRegisterDeliverable,
  useRequestUploadUrl,
} from '../../hooks/api/useDeliverables';
import { uploadFileToPresignedUrl } from '../../hooks/api/useStorage';
import { useCollaboration } from '../../hooks/api/useCollaborations';
import { parseApiError } from '../../services/apiError';
import { BackButton } from '../../components/ui/BackButton';

type Props = NativeStackScreenProps<CreatorWorkStackParamList, 'DeliverableUpload'>;

interface PropsWithInitial extends Props {
  initialVideoUri?: string | null;
  initialAllChecked?: boolean;
}

/**
 * TASK-P3-12 & TASK-P4-09: DeliverableUploadScreen (Creator Screen 10 & 18).
 * Dynamic revision banner, pre-submit checklist gating, creator note, and inline upload failure progress state.
 */
export function DeliverableUploadScreen({
  route,
  navigation,
  initialVideoUri,
  initialAllChecked,
}: PropsWithInitial) {
  const { collaborationId } = route.params;
  const { t } = useTranslation();

  const [note, setNote] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(initialVideoUri ?? null);
  const [videoFileName, setVideoFileName] = useState('glowlab-review-v2.mp4');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadFailedPercent, setUploadFailedPercent] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const checklistItems = [
    t('creator.upload.checkVertical', 'Vertical 9:16, no letterboxing'),
    t('creator.upload.checkAudio', 'Clear audio and lighting'),
    t('creator.upload.checkBrief', 'Followed brief requirements and talking points'),
  ];

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    if (initialAllChecked) {
      return checklistItems.reduce<Record<string, boolean>>((acc, item) => {
        acc[item] = true;
        return acc;
      }, {});
    }
    return {};
  });

  const { data: collab, isLoading: isCollabLoading } = useCollaboration(collaborationId);
  const { data: deliverables, isLoading: isDeliverablesLoading } =
    useCollaborationDeliverables(collaborationId);

  const { mutateAsync: registerDeliverable, isPending: isRegistering } =
    useRegisterDeliverable(collaborationId);

  const requestUploadUrl = useRequestUploadUrl(collaborationId);

  const isRevisionRequested = collab?.status === 'revision_requested';
  const revisionCount = (deliverables || []).filter(
    (d) => d.status === 'revision_requested',
  ).length;

  const latestDeliverableWithFeedback = (deliverables || []).find(
    (d) => d.feedback && d.feedback.length > 0,
  );
  const latestFeedback =
    latestDeliverableWithFeedback?.feedback?.[
      latestDeliverableWithFeedback.feedback.length - 1
    ];

  const allChecked = checklistItems.every((item) => checkedItems[item]);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
      const name =
        result.assets[0].fileName ||
        result.assets[0].uri.split('/').pop() ||
        'deliverable.mp4';
      setVideoFileName(name);
      setUploadFailedPercent(null);
      setUploadError(null);
      setUploadProgress(0);
    }
  };

  const executeUpload = async () => {
    if (!videoUri || !allChecked) return;
    setIsUploading(true);
    setUploadFailedPercent(null);
    setUploadError(null);
    setUploadProgress(0);
    let currentPercent = 0;

    try {
      const response = await requestUploadUrl.mutateAsync({
        contentType: 'video/mp4',
        fileSize: 50000000,
      });

      await uploadFileToPresignedUrl(
        videoUri,
        response.uploadUrl,
        'video/mp4',
        (percent) => {
          currentPercent = percent;
          setUploadProgress(percent);
        },
      );

      await registerDeliverable({
        type: 'ready_ad',
        fileUrl: response.fileUrl,
        durationSeconds: (collab as any)?.campaign?.durationSeconds || 60,
        note: note.trim() || undefined,
      });
      setIsUploading(false);
      navigation.goBack();
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      const refusedByApi =
        parsed.code !== 'unknown_error' && parsed.code !== 'network_error';
      setUploadError(
        refusedByApi
          ? parsed.message
          : currentPercent > 0
            ? t(
                'creator.upload.failedBanner',
                'Upload failed. The connection dropped at {{percent}}%. Tap retry to upload again.',
                { percent: currentPercent },
              )
            : t(
                'creator.upload.failedGeneric',
                'Upload failed. Check your connection and try again.',
              ),
      );
      setUploadFailedPercent(currentPercent);
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    executeUpload();
  };

  if (isCollabLoading || isDeliverablesLoading || !collab) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText variant="titleSm" color="ink" style={{ flex: 1 }}>
          {t('creator.upload.title', 'Upload deliverable')}
        </AppText>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {/* Upload Failure Danger Banner (Creator screen 18) */}
        {uploadFailedPercent !== null && (
          <View style={styles.errorBanner}>
            <View style={styles.errorIconTile}>
              <Icon name="alert-circle" size={16} color="danger" />
            </View>
            <AppText variant="bodySm" color="body" style={styles.errorBody}>
              {uploadError}
            </AppText>
          </View>
        )}

        {/* Revision Banner with real feedback note */}
        {isRevisionRequested && uploadFailedPercent === null && (
          <View style={styles.revisionBanner}>
            <View style={styles.revisionHeaderRow}>
              <View style={styles.errorIconTile}>
                <Icon name="alert-circle" size={16} color="danger" />
              </View>
              <AppText variant="label" style={styles.revisionTitle}>
                {t('creator.upload.revisionRequested', 'Revision {{count}} requested', {
                  count: revisionCount > 0 ? revisionCount : 1,
                })}
              </AppText>
            </View>
            {latestFeedback ? (
              <AppText variant="body" style={styles.bodyText}>
                &quot;{latestFeedback.body}&quot;
              </AppText>
            ) : null}
          </View>
        )}

        {videoUri ? (
          <Card style={styles.fileCard}>
            <View style={styles.thumb}>
              <Icon name="video" size={24} color="primary" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="label" color="ink" style={{ marginBottom: spacing.xxs }}>
                {videoFileName}
              </AppText>
              {uploadFailedPercent !== null ? (
                <>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${uploadFailedPercent}%` as any,
                          backgroundColor: colors.danger,
                        },
                      ]}
                    />
                  </View>
                  <AppText variant="caption" style={[styles.fileMeta, { color: colors.danger }]}>
                    {t('creator.upload.failedAt', 'Failed at {{percent}}%', {
                      percent: uploadFailedPercent,
                    })}
                  </AppText>
                </>
              ) : isUploading ? (
                <>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${uploadProgress}%` as any,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <AppText variant="caption" color="muted">
                    {uploadProgress}%
                  </AppText>
                </>
              ) : (
                <>
                  <AppText variant="bodySm" color="muted" style={styles.fileMeta}>
                    {t('creator.upload.readyToUpload', 'Ready to upload')}
                  </AppText>
                  <Pressable onPress={pickVideo}>
                    <AppText variant="caption" color="primary">
                      {t('creator.upload.changeVideo', 'Change video')}
                    </AppText>
                  </Pressable>
                </>
              )}
            </View>
          </Card>
        ) : (
          <View style={styles.dropzoneGroup}>
            <Pressable style={styles.dropzone} onPress={pickVideo}>
              <View style={styles.dropzoneIcon}>
                <Icon name="upload" size={20} color="primary" />
              </View>
              <AppText variant="label" color="ink">
                {t('creator.upload.pickVideo', '+ Pick video file')}
              </AppText>
            </Pressable>
            {(Platform.OS === 'web' || typeof __DEV__ !== 'undefined') && (
              <Pressable
                accessibilityRole="button"
                testID="use-mock-video-btn"
                style={[styles.dropzone, styles.mockDropzone]}
                onPress={() => {
                  const blob = new Blob(['mock-video-payload'], { type: 'video/mp4' });
                  const mockUri = URL.createObjectURL(blob);
                  setVideoUri(mockUri);
                  setVideoFileName('review-deliverable.mp4');
                  setUploadFailedPercent(null);
                  setUploadError(null);
                  setUploadProgress(0);
                }}
              >
                <AppText variant="label" color="primary">
                  {'+ Use test video file'}
                </AppText>
              </Pressable>
            )}
          </View>
        )}

        {/* Pre-submit Checklist inside grouped white Card */}
        <AppText variant="titleSm" color="ink" style={styles.sectionTitle}>
          {t('creator.upload.beforeSubmit', 'Before you submit')}
        </AppText>

        <Card style={styles.checklistCard}>
          {checklistItems.map((label, index) => (
            <Pressable
              key={label}
              style={[styles.checkRow, index > 0 && styles.checkDivider]}
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
              <AppText variant="body" color="ink" style={{ flex: 1 }}>
                {label}
              </AppText>
            </Pressable>
          ))}
        </Card>

        {/* Creator Note Field */}
        <RNTextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('creator.upload.notePlaceholder', 'Note for the brand (optional)')}
          placeholderTextColor={colors.muted}
          multiline
          style={styles.noteInput}
        />
      </ScrollView>

      {/* Sticky Bottom Submission Bar */}
      <View style={styles.stickyBar}>
        <AppText variant="caption" color="muted" style={styles.disclosure}>
          {t(
            'creator.upload.reviewWindow',
            '{{brandName}} has 3 days to approve or request one more revision.',
            { brandName: (collab as any).brand?.companyName || 'The brand' },
          )}
        </AppText>
        <Pressable
          style={[
            styles.cta,
            (!videoUri || !allChecked || isRegistering || isUploading) && styles.ctaDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!videoUri || !allChecked || isRegistering || isUploading}
        >
          <AppText variant="button" color="onPrimary">
            {isRegistering || isUploading
              ? t('creator.upload.submitting', 'Submitting...')
              : uploadFailedPercent !== null
                ? t('creator.upload.retryAction', 'Retry upload')
                : t('creator.upload.submitAction', 'Submit for review')}
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  revisionBanner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  revisionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  revisionTitle: { color: colors.danger, flex: 1 },
  bodyText: { color: colors.body },
  errorBanner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorIconTile: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBody: { flex: 1 },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  thumb: {
    width: 84,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileMeta: { marginBottom: spacing.xs },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceStrong,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: { height: 6 },
  dropzoneGroup: {
    gap: spacing.sm,
  },
  dropzone: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inputBorder,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...elevation.soft,
  },
  mockDropzone: {
    borderStyle: 'solid',
    borderColor: colors.primary,
    paddingVertical: spacing.md,
  },
  dropzoneIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    paddingHorizontal: spacing.xxs,
  },
  checklistCard: {
    padding: 0,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  checkDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.primary, borderWidth: 0 },
  checkmark: { color: colors.onPrimary, fontSize: 12 },
  noteInput: {
    minHeight: 84,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.xl,
    padding: spacing.md,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  stickyBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...elevation.raised,
  },
  disclosure: { marginBottom: spacing.sm },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
});
