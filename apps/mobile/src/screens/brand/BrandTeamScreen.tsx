import { useState, useRef } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { BrandMember, BrandMemberRole } from '@ugcx/shared-types';
import type { BrandProfileStackParamList } from '../../navigation/types';
import {
  useBrandTeam,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '../../hooks/api/useBrandTeam';
import { useAuthStore } from '../../store/authStore';
import { AppText } from '../../components/ui/Text';
import { Card, type CardTone, cardTextColor } from '../../components/ui/Card';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { AppBottomSheet } from '../../components/ui/BottomSheet';
import { ChipSelect } from '../../components/forms/ChipSelect';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { parseApiError } from '../../services/apiError';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandProfileStackParamList, 'BrandTeam'>;

const AVATAR_TONES: CardTone[] = ['coral', 'forest', 'mint', 'peach', 'yellow', 'mustard'];

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}

/**
 * TASK-P1-14: Brand Team Screen (artboard 4g).
 */
export function BrandTeamScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const teamQuery = useBrandTeam();
  const inviteMember = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const inviteSheetRef = useRef<BottomSheetModal>(null);
  const actionSheetRef = useRef<BottomSheetModal>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'approver' | 'viewer'>('approver');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<BrandMember | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const members = teamQuery.data || [];
  const callerMember = members.find((m) => m.userId === currentUserId);
  const isCallerOwner = callerMember?.role === 'owner';

  const handleOpenInvite = () => {
    setInviteEmail('');
    setInviteRole('approver');
    setInviteError(null);
    inviteSheetRef.current?.present();
  };

  const handleSendInvite = async () => {
    setInviteError(null);
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember.mutateAsync({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      inviteSheetRef.current?.dismiss();
    } catch (err) {
      setInviteError(parseApiError(err).message);
    }
  };

  const handleRowLongPress = (member: BrandMember) => {
    // Hide actions when caller is not owner, or on caller's own row
    if (!isCallerOwner || member.userId === currentUserId) return;
    setSelectedMember(member);
    setActionError(null);
    actionSheetRef.current?.present();
  };

  const handleToggleRole = async () => {
    if (!selectedMember) return;
    const newRole: 'approver' | 'viewer' =
      selectedMember.role === 'approver' ? 'viewer' : 'approver';
    try {
      await updateRole.mutateAsync({
        id: selectedMember.id,
        dto: { role: newRole },
      });
      actionSheetRef.current?.dismiss();
    } catch (err) {
      setActionError(parseApiError(err).message);
    }
  };

  const handleConfirmRemove = () => {
    if (!selectedMember) return;
    Alert.alert(
      t('brand.team.removeMember'),
      t('brand.team.removeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('brand.team.removeMember'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember.mutateAsync(selectedMember.id);
              actionSheetRef.current?.dismiss();
            } catch (err) {
              setActionError(parseApiError(err).message);
            }
          },
        },
      ],
    );
  };

  const roleOptions = [
    { value: 'approver', label: t('brand.team.roles.approver') },
    { value: 'viewer', label: t('brand.team.roles.viewer') },
  ];

  if (teamQuery.isLoading) {
    return <LoadingState />;
  }

  if (teamQuery.isError) {
    return (
      <ErrorState
        message={parseApiError(teamQuery.error).message}
        onRetry={teamQuery.refetch}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="displayMd" color="ink">
          {t('brand.team.title')}
        </AppText>
        {isCallerOwner ? (
          <Pressable
            onPress={handleOpenInvite}
            accessibilityRole="button"
            accessibilityLabel={t('brand.team.invite')}
          >
            <AppText variant="label" color="link" style={styles.inviteButtonText}>
              {t('brand.team.invite')}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {/* Team Member List */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={teamQuery.isRefetching}
            onRefresh={teamQuery.refetch}
          />
        }
        renderItem={({ item, index }) => {
          const isCaller = item.userId === currentUserId;
          const initials = getInitials(item.displayName, item.email);
          const tone = AVATAR_TONES[index % AVATAR_TONES.length];
          const textColor = cardTextColor(tone);

          const primaryText = isCaller
            ? t('brand.team.you')
            : item.displayName || item.email || '';

          const roleLabel = t(`brand.team.roles.${item.role}`);
          const secondaryText =
            item.status === 'invited'
              ? `${roleLabel} · ${t('brand.team.invitedSuffix')}`
              : roleLabel;

          return (
            <Pressable
              style={styles.row}
              onLongPress={() => handleRowLongPress(item)}
              delayLongPress={500}
            >
              {/* Avatar circle */}
              <Card tone={tone} style={styles.avatar}>
                <AppText variant="caption" color={textColor} style={styles.avatarText}>
                  {initials}
                </AppText>
              </Card>

              {/* Member Details */}
              <View style={styles.details}>
                <AppText variant="body" color="ink" numberOfLines={1}>
                  {primaryText}
                </AppText>
                <AppText variant="caption" color="muted" numberOfLines={1}>
                  {secondaryText}
                </AppText>
              </View>
            </Pressable>
          );
        }}
      />

      {/* Invite Teammate Bottom Sheet */}
      <AppBottomSheet ref={inviteSheetRef}>
        <AppText variant="titleSm" color="ink" style={styles.sheetTitle}>
          {t('brand.team.inviteSheetTitle')}
        </AppText>

        <TextInput
          label={t('brand.team.email')}
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholder="colleague@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.fieldGap}>
          <AppText variant="caption" color="body" style={styles.label}>
            {t('brand.team.role')}
          </AppText>
          <ChipSelect
            options={roleOptions}
            value={inviteRole}
            onChange={(val) => setInviteRole(val as 'approver' | 'viewer')}
          />
        </View>

        {inviteError ? (
          <AppText variant="caption" color="danger" style={styles.sheetError}>
            {inviteError}
          </AppText>
        ) : null}

        <Button
          title={t('brand.team.sendInvite')}
          variant="primary"
          fullWidth
          loading={inviteMember.isPending}
          disabled={!inviteEmail.trim()}
          onPress={handleSendInvite}
        />
      </AppBottomSheet>

      {/* Member Options Action Sheet */}
      <AppBottomSheet ref={actionSheetRef}>
        <AppText variant="titleSm" color="ink" style={styles.sheetTitle}>
          {selectedMember?.displayName || selectedMember?.email}
        </AppText>

        {actionError ? (
          <AppText variant="caption" color="danger" style={styles.sheetError}>
            {actionError}
          </AppText>
        ) : null}

        <View style={styles.actionSheetButtons}>
          <Button
            title={`${t('brand.team.changeRole')} (${selectedMember?.role === 'approver' ? t('brand.team.roles.viewer') : t('brand.team.roles.approver')})`}
            variant="secondary"
            fullWidth
            loading={updateRole.isPending}
            onPress={handleToggleRole}
          />
          <Button
            title={t('brand.team.removeMember')}
            variant="danger"
            fullWidth
            loading={removeMember.isPending}
            onPress={handleConfirmRemove}
          />
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  avatarText: {
    fontWeight: '600',
  },
  details: {
    flex: 1,
    marginStart: spacing.md,
    gap: spacing.xxs,
  },
  sheetTitle: {
    marginBottom: spacing.md,
  },
  fieldGap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xxs,
  },
  sheetError: {
    marginBottom: spacing.sm,
  },
  actionSheetButtons: {
    gap: spacing.sm,
  },
});
