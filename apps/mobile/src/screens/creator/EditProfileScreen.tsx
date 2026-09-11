import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CreatorProfileStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { useCreatorProfile, useUpdateCreatorProfile } from '../../hooks/api/useCreator';
import { colors, spacing, radius } from '../../theme/tokens';
import { Icon } from '../../components/ui/Icon';
import type { Niche } from '@ugcx/shared-types';

type Props = NativeStackScreenProps<CreatorProfileStackParamList, 'EditProfile'>;

const AVAILABLE_NICHES = [
  { id: 'beauty_personal_care', label: 'Beauty & Skincare' },
  { id: 'mom_baby', label: 'Mom & Baby' },
  { id: 'food_fmcg', label: 'Food & FMCG' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'home_lifestyle', label: 'Home & Lifestyle' },
];

export function EditProfileScreen({ navigation }: Props) {
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
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Icon name="arrow-left" size={24} color="ink" />
        </Pressable>
        <AppText variant="titleLg" color="ink" style={{ flex: 1, marginStart: spacing.md }}>
          Edit Profile
        </AppText>
        <Pressable onPress={handleSave} disabled={updateProfile.isPending}>
          <AppText
            variant="label"
            style={{ color: updateProfile.isPending ? colors.muted : colors.primary }}
          >
            {updateProfile.isPending ? 'Saving...' : 'Save'}
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <AppText variant="label" color="ink" style={styles.label}>
          Display Name
        </AppText>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. Mariam Adel"
          placeholderTextColor={colors.muted}
        />

        <AppText variant="label" color="ink" style={styles.label}>
          City
        </AppText>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Cairo"
          placeholderTextColor={colors.muted}
        />

        <AppText variant="label" color="ink" style={styles.label}>
          Base Price (EGP)
        </AppText>
        <TextInput
          style={styles.input}
          value={basePrice}
          onChangeText={setBasePrice}
          keyboardType="numeric"
          placeholder="e.g. 2500"
          placeholderTextColor={colors.muted}
        />

        <AppText variant="label" color="ink" style={styles.label}>
          Niches
        </AppText>
        <View style={styles.nicheGrid}>
          {AVAILABLE_NICHES.map((niche) => {
            const isSelected = selectedNiches.includes(niche.id as Niche);
            return (
              <Pressable
                key={niche.id}
                onPress={() => toggleNiche(niche.id)}
                style={[styles.nicheChip, isSelected && styles.nicheChipSelected]}
              >
                <AppText
                  variant="caption"
                  style={{ color: isSelected ? colors.onPrimary : colors.body }}
                >
                  {niche.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  label: { marginBottom: 8, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  nicheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nicheChip: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceSoft,
  },
  nicheChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
