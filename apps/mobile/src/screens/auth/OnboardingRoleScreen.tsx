import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { colors, spacing, radius } from '../../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingRole'>;

export function OnboardingRoleScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [role, setRole] = useState<'creator' | 'brand'>('creator');

  const Option = ({
    id,
    title,
    subtitle,
    swatch,
  }: {
    id: 'creator' | 'brand';
    title: string;
    subtitle: string;
    swatch: string;
  }) => (
    <Pressable
      onPress={() => setRole(id)}
      style={[styles.option, role === id && styles.optionSelected]}
    >
      <View style={[styles.avatar, { backgroundColor: swatch }]} />
      <View style={styles.optionTextContainer}>
        <AppText variant="label" color="ink">
          {title}
        </AppText>
        <AppText variant="caption" color="muted">
          {subtitle}
        </AppText>
      </View>
      <View style={[styles.radio, role === id && styles.radioSelected]} />
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logo} />
        <AppText variant="displayLg" color="ink" style={styles.heading}>
          {t('auth.roleSelect.title')}
        </AppText>
        <AppText variant="body" color="muted" style={styles.sub}>
          {t('auth.roleSelect.subtitle')}
        </AppText>

        <Option
          id="creator"
          title={t('auth.roleSelect.creator')}
          subtitle={t('auth.roleSelect.creatorSubtitle')}
          swatch={colors.signatureMint}
        />
        <Option
          id="brand"
          title={t('auth.roleSelect.brand')}
          subtitle={t('auth.roleSelect.brandSubtitle')}
          swatch={colors.signatureCream}
        />
      </View>
      <Pressable
        style={styles.cta}
        onPress={() => navigation.navigate('OnboardingPhoneNumber', { role })}
      >
        <AppText variant="label" color="onPrimary">
          {t('common.continue')}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.section, // 96px vertical padding per DESIGN.md
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  heading: {
    marginBottom: spacing.xs,
  },
  sub: {
    marginBottom: spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  optionTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  radioSelected: {
    borderWidth: 6,
    borderColor: colors.primary,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
