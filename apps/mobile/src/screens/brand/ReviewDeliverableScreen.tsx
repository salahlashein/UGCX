import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput as RNTextInput,
  I18nManager,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BrandBriefsStackParamList } from '../../navigation/types';
import { useDeliverablePlayUrl, useCollaborationDeliverables, useReviewDeliverable } from '../../hooks/api/useDeliverables';
import { useCollaboration } from '../../hooks/api/useCollaborations';
import { VideoPlayer } from '../../components/VideoPlayer';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { SuccessPanel } from '../../components/ui/SuccessPanel';
import { colors, radius, sizes, spacing } from '../../theme/tokens';
import { typography } from '../../theme/typography';
import { fontFamilyFor, LINE_HEIGHT_MULTIPLIER_AR } from '../../theme/fonts';
import { parseApiError } from '../../services/apiError';

type Props = NativeStackScreenProps<BrandBriefsStackParamList, 'ReviewDeliverable'>;

/**
 * TASK-P3-10: Deliverable Review Screen (Artboard 3e).
 * Displays video player with ready state gating, version details,
 * previous feedback card, note field, and approve/revision actions.
 */
export function ReviewDeliverableScreen({ route, navigation }: Props) {
  const { deliverableId, collaborationId: routeCollabId } = route.params;
  const { t } = useTranslation();

  const [isVideoReady, setIsVideoReady] = useState(false);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<{
    releasedAmount: string | null;
    creatorAmount: string | null;
    currency: string;
  } | null>(null);

  const collabId = routeCollabId ?? null;

  const { data: deliverables } = useCollaborationDeliverables(collabId ?? undefined);
  const currentDeliverable = deliverables?.find((d) => d.id === deliverableId);

  const reviewMutation = useReviewDeliverable(collabId ?? '');

  // Format previous feedback if version > 1
  const prevDeliverable = deliverables?.find((d) => d.version === (currentDeliverable?.version ?? 1) - 1);
  const previousFeedback = prevDeliverable?.feedback?.[prevDeliverable.feedback.length - 1];

  const isArabic = I18nManager.isRTL;
  const bodyRole = typography.body;

  const handleRequestRevision = () => {
    if (!note.trim()) {
      setNoteError(t('brand.review.errors.noteRequired', 'Please provide feedback for the creator'));
      return;
    }
    setNoteError(null);

    reviewMutation.mutate(
      {
        id: deliverableId,
        dto: {
          action: 'request_revision',
          feedback: note.trim(),
        },
      },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        onError: (err) => {
          setNoteError(parseApiError(err).message);
        },
      },
    );
  };

  const handleApprove = () => {
    setNoteError(null);
    reviewMutation.mutate(
      {
        id: deliverableId,
        dto: {
          action: 'approve',
          feedback: note.trim() || undefined,
        },
      },
      {
        onSuccess: (res) => {
          setReviewSuccess({
            releasedAmount: res.releasedAmount ?? null,
            creatorAmount: res.creatorAmount ?? null,
            currency: res.currency || 'EGP',
          });
        },
        onError: (err) => {
          setNoteError(parseApiError(err).message);
        },
      },
    );
  };

  if (reviewSuccess) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <SuccessPanel
            title={t('brand.review.successTitle', 'Deliverable Approved')}
            message={t(
              'brand.review.successMessage',
              'Payment released: {{amount}} {{currency}}',
              {
                amount: reviewSuccess.creatorAmount ?? reviewSuccess.releasedAmount ?? '',
                currency: reviewSuccess.currency,
              },
            )}
            action={{
              label: t('common.done', 'Done'),
              onPress: () => navigation.goBack(),
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Video Surface */}
        <View style={styles.videoWrapper}>
          <VideoPlayer
            deliverableId={deliverableId}
            onReady={() => setIsVideoReady(true)}
            onError={() => setIsVideoReady(false)}
          />
        </View>

        {/* Version line & Status */}
        <View style={styles.metaRow}>
          <AppText variant="caption" color="muted">
            {t('brand.review.versionLine', 'v{{version}} · submitted', {
              version: currentDeliverable?.version ?? 1,
            })}
          </AppText>
          <StatusBadge status="funded" domain="collaboration" />
        </View>

        {/* Previous Feedback Card (v > 1) */}
        {(currentDeliverable?.version ?? 1) > 1 && previousFeedback && (
          <Card tone="cream" style={styles.feedbackCard}>
            <AppText variant="caption" color="muted" style={styles.feedbackKicker}>
              {t('brand.review.previousFeedback', 'v{{version}} feedback:', {
                version: (currentDeliverable?.version ?? 2) - 1,
              })}
            </AppText>
            <AppText variant="bodySm" color="ink">
              "{previousFeedback.body}"
            </AppText>
          </Card>
        )}

        {/* Note input field */}
        <View style={styles.noteSection}>
          <AppText variant="caption" color="muted" style={styles.noteLabel}>
            {t('brand.review.addNoteLabel', 'Add a note (optional for approval, required for revision)')}
          </AppText>
          <RNTextInput
            value={note}
            onChangeText={(text) => {
              setNote(text);
              if (noteError) setNoteError(null);
            }}
            placeholder={t('brand.review.notePlaceholder', 'Looks great, approved.')}
            placeholderTextColor={colors.muted}
            multiline
            style={[
              styles.noteInput,
              {
                fontFamily: fontFamilyFor(bodyRole.weight, isArabic),
                fontWeight: String(bodyRole.weight) as TextStyle['fontWeight'],
                fontSize: bodyRole.fontSize,
                lineHeight: Math.round(
                  bodyRole.lineHeight * (isArabic ? LINE_HEIGHT_MULTIPLIER_AR : 1),
                ),
              },
              !!noteError && styles.noteInputError,
            ]}
          />
          {noteError ? (
            <AppText variant="bodySm" color="danger" accessibilityRole="alert" style={styles.errorText}>
              {noteError}
            </AppText>
          ) : null}
        </View>
      </ScrollView>

      {/* Two-action Bottom Bar */}
      <BottomActionBar>
        <View style={styles.actionRow}>
          <View style={styles.actionCol}>
            <Button
              title={t('brand.review.requestRevision', 'Request revision')}
              variant="secondary"
              onPress={handleRequestRevision}
              loading={reviewMutation.isPending}
              disabled={reviewMutation.isPending}
            />
          </View>
          <View style={styles.actionCol}>
            <Button
              title={t('brand.review.approveRelease', 'Approve & release')}
              variant="primary"
              onPress={handleApprove}
              loading={reviewMutation.isPending}
              disabled={!isVideoReady || reviewMutation.isPending}
            />
          </View>
        </View>
      </BottomActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  videoWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackCard: {
    marginVertical: spacing.xs,
  },
  feedbackKicker: {
    marginBottom: spacing.xxs,
    fontWeight: '600',
  },
  noteSection: {
    marginTop: spacing.xs,
  },
  noteLabel: {
    marginBottom: spacing.xs,
  },
  noteInput: {
    minHeight: 72,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  noteInputError: {
    borderColor: colors.danger,
  },
  errorText: {
    marginTop: spacing.xxs,
  },
  actionRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  actionCol: {
    flex: 1,
  },
});
