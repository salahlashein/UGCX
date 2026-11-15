import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText } from './Text';

export type StatusDomain = 'campaign' | 'proposal' | 'collaboration' | 'deliverable';
type ColorRole = keyof typeof colors;

export interface StatusToneResult {
  background: ColorRole;
  text: ColorRole;
}

// Verbatim from the plan's "StatusBadge tone map" schema.
const TONE_MAP: Record<StatusDomain, Record<string, StatusToneResult>> = {
  campaign: {
    draft: { background: 'surfaceStrong', text: 'body' },
    live: { background: 'signatureMint', text: 'ink' },
    paused: { background: 'signatureYellow', text: 'ink' },
    completed: { background: 'surfaceStrong', text: 'success' },
    cancelled: { background: 'dangerSurface', text: 'danger' },
  },
  proposal: {
    applied: { background: 'signatureYellow', text: 'ink' },
    shortlisted: { background: 'signatureMustard', text: 'ink' },
    accepted: { background: 'signatureForest', text: 'onPrimary' },
    declined: { background: 'dangerSurface', text: 'danger' },
  },
  collaboration: {
    pending_payment: { background: 'signatureYellow', text: 'ink' },
    funded: { background: 'signatureForest', text: 'onPrimary' },
    shipped: { background: 'signatureMint', text: 'ink' },
    in_progress: { background: 'signatureMint', text: 'ink' },
    delivered: { background: 'signaturePeach', text: 'ink' },
    revision_requested: { background: 'signatureMustard', text: 'ink' },
    approved: { background: 'signatureForest', text: 'onPrimary' },
    payment_failed: { background: 'dangerSurface', text: 'danger' },
    cancelled: { background: 'dangerSurface', text: 'danger' },
  },
  deliverable: {
    submitted: { background: 'signaturePeach', text: 'ink' },
    revision_requested: { background: 'signatureMustard', text: 'ink' },
    approved: { background: 'signatureForest', text: 'onPrimary' },
    declined: { background: 'dangerSurface', text: 'danger' },
  },
};

const DEFAULT_TONE: StatusToneResult = { background: 'surfaceStrong', text: 'body' };

/** EDGE-P1-007: an unrecognized status is neutral, never a crash and never an empty badge. */
export function statusTone(domain: StatusDomain, status: string): StatusToneResult {
  return TONE_MAP[domain]?.[status] ?? DEFAULT_TONE;
}

interface Props {
  status: string;
  domain: StatusDomain;
}

/** TASK-P1-023: campaign/proposal/collaboration/deliverable status, never plain muted text (REQ-010). */
export function StatusBadge({ status, domain }: Props) {
  const { t } = useTranslation();
  const known = Boolean(TONE_MAP[domain]?.[status]);
  const tone = known ? TONE_MAP[domain][status] : DEFAULT_TONE;
  const label = known ? t(`status.${domain}.${status}`) : status;

  return (
    <View style={[styles.badge, { backgroundColor: colors[tone.background] }]}>
      <AppText variant="overline" color={tone.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
});
