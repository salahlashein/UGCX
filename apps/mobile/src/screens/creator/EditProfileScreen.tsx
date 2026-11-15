import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorProfileStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { TextInput } from '../../components/ui/TextInput';
import { FilterChip } from '../../components/ui/FilterChip';
import { Button } from '../../components/ui/Button';
import { BackButton } from '../../components/ui/BackButton';
import { LoadingState } from '../../components/ui/LoadingState';
import { useCreatorProfile, useUpdateCreatorProfile } from '../../hooks/api/useCreator';
import { colors, spacing } from '../../theme/tokens';
import type { Niche } from '@ugcx/shared-types';

type Props = NativeStackScreenProps<CreatorProfileStackParamList, 'EditProfile'>;

const AVAILABLE_NICHES: Niche[] = [
  'beauty_personal_care',
  'mom_baby',
  'food_fmcg',
  'fashion',
  'home_lifestyle',
];

export function EditProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useCreatorProfile();
  const updateProfile = useUpdateCreatorProfile();

  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<Niche[]>([]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setCity(profile.city || '');
      setBasePrice(profile.basePrice ? String(profile.basePrice) : '');
      setSelectedNiches(profile.niches || []);
    }
  }, [profile]);

  const toggleNiche = (nicheId: string) => {
    setSelectedNiches((prev) =>
      prev.includes(nicheId as Niche)
        ? prev.filter((id) => id !== nicheId)
        : [...prev, nicheId as Niche],
    );
  };

  const handleSave = () => {
    updateProfile.mutate(
      {
        displayName,
        city,
        basePrice: basePrice ? Number(basePrice) : undefined,
        niches: selectedNiches,
      },
      {
        onSuccess: () => {
          navigation.goBack();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText variant="titleSm" color="ink" style={{ flex: 1 }}>
          {t('creator.editProfile.title', 'Edit profile')}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.formCard}>
          <TextInput
            label={t('creator.profile.displayName', 'Display name')}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('creator.editProfile.displayNamePlaceholder', 'Your full name')}
          />
          <TextInput
            label={t('creator.profile.city', 'City')}
            value={city}
            onChangeText={setCity}
            placeholder={t('creator.editProfile.cityPlaceholder', 'e.g. Cairo, Alexandria')}
          />
          <TextInput
            label={t('creator.editProfile.basePriceLabel', 'Base Price (EGP)')}
            value={basePrice}
            onChangeText={setBasePrice}
            keyboardType="numeric"
            placeholder="2500"
          />
        </Card>

        <Card style={styles.formCard}>
          <AppText variant="caption" color="body" style={styles.sectionLabel}>
            {t('creator.profile.niches', 'Niches')}
          </AppText>
          <View style={styles.nicheGrid}>
            {AVAILABLE_NICHES.map((nicheId) => {
              const isSelected = selectedNiches.includes(nicheId);
              return (
                <FilterChip
                  key={nicheId}
                  label={t(`niche.${nicheId}`, nicheId)}
                  selected={isSelected}
                  onPress={() => toggleNiche(nicheId)}
                />
              );
            })}
          </View>
        </Card>

        <Button
          title={updateProfile.isPending ? t('common.loading', 'Loading') : t('common.save', 'Save')}
          variant="primary"
          loading={updateProfile.isPending}
          disabled={updateProfile.isPending}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  formCard: {
    gap: spacing.xs,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  nicheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
