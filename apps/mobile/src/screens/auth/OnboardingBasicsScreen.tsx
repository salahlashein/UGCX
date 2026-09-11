import React, { useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import type { AuthStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { FilterChip } from '../../components/ui/FilterChip';
import { colors, spacing, radius } from '../../theme/tokens';
import { useUpdateCreatorProfile } from '../../hooks/api/useCreator';
import { useRequestUploadUrl, uploadFileToPresignedUrl } from '../../hooks/api/useStorage';
import type { Niche } from '@ugcx/shared-types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingBasics'>;

const NICHE_OPTIONS: { label: string; value: Niche }[] = [
  { label: 'Beauty & Skincare', value: 'beauty_personal_care' },
  { label: 'Mom & baby', value: 'mom_baby' },
  { label: 'Food & FMCG', value: 'food_fmcg' },
  { label: 'Fashion', value: 'fashion' },
  { label: 'Home & Lifestyle', value: 'home_lifestyle' },
];

export function OnboardingBasicsScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [niches, setNiches] = useState<Niche[]>([]);
  const [clipUri, setClipUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const role = route.params.role;
  const updateProfile = useUpdateCreatorProfile();
  const requestUploadUrl = useRequestUploadUrl();

  const toggleNiche = (n: Niche) => {
    setNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : prev.length < 3 ? [...prev, n] : prev,
    );
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setClipUri(result.assets[0].uri);
    }
  };

  const canContinue =
    name.trim().length > 0 && city.trim().length > 0 && niches.length > 0 && clipUri !== null && !isUploading;

  const handleNext = async () => {
    if (!clipUri) return;
    setIsUploading(true);
    try {
      // 1. Get presigned URL
      const response = await requestUploadUrl.mutateAsync({
        module: 'verification',
        contentType: 'video/mp4', // Assuming mp4 for simplicity
        fileSize: 10000000, // 10MB approx
      });

      // 2. Upload file
      await uploadFileToPresignedUrl(clipUri, response.uploadUrl, 'video/mp4');

      // 3. Save profile
      updateProfile.mutate(
        {
          displayName: name,
          city,
          niches,
          verificationClipUrl: response.fileUrl,
        },
        {
          onSuccess: () => {
            setIsUploading(false);
            navigation.navigate('OnboardingPortfolio', { role });
          },
          onError: (err) => {
            console.error(err);
            Alert.alert('Save Failed', 'Could not update your profile. Please try again.');
            setIsUploading(false);
          },
        },
      );
    } catch (err) {
      console.error('Failed to upload video:', err);
      Alert.alert('Upload Failed', 'Could not upload your video. Please check your connection and try again.');
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <AppText style={styles.stepLabel}>STEP 1 OF 2 — REQUIRED</AppText>
        <AppText variant="displayMd" color="ink" style={styles.heading}>
          The basics
        </AppText>
        <AppText variant="body" color="muted" style={styles.sub}>
          This is all we need to start reviewing you.
        </AppText>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <AppText variant="label" color="ink" style={styles.label}>
          Full name
        </AppText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          style={styles.inputMargin}
        />

        <AppText variant="label" color="ink" style={styles.label}>
          City
        </AppText>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Cairo"
          style={styles.inputMargin}
        />

        <AppText variant="label" color="ink" style={styles.label}>
          Your niches - pick up to 3
        </AppText>
        <View style={styles.chipRow}>
          {NICHE_OPTIONS.map((opt) => {
            const selected = niches.includes(opt.value);
            return (
              <FilterChip
                key={opt.label}
                label={opt.label + (selected ? ' ✓' : '')}
                selected={selected}
                onPress={() => toggleNiche(opt.value)}
              />
            );
          })}
        </View>

        <AppText variant="label" color="ink" style={styles.label}>
          One video of yourself talking
        </AppText>
        <Pressable style={styles.dropzone} onPress={pickVideo}>
          <AppText variant="body" color="muted">
            {clipUri ? 'Video selected' : '+ Record or upload a 15s clip'}
          </AppText>
        </Pressable>
        <AppText variant="caption" color="muted" style={styles.hint}>
          Required so an admin can verify it's really you.
        </AppText>
      </ScrollView>
      <Pressable
        disabled={!canContinue}
        style={[styles.cta, !canContinue && styles.ctaDisabled]}
        onPress={handleNext}
      >
        {isUploading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <AppText variant="label" style={!canContinue ? styles.ctaTextDisabled : styles.ctaText}>
            {t('common.continue')}
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
  },
  header: { marginBottom: spacing.md },
  stepLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.muted,
    marginBottom: 10,
  },
  heading: { marginBottom: 6 },
  sub: { marginBottom: spacing.xl },
  label: { marginBottom: 8, marginTop: spacing.md },
  inputMargin: { marginBottom: 0 }, // The default TextInput has margin, but our label separates them
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dropzone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
  },
  hint: { marginTop: 8 },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  ctaDisabled: { backgroundColor: colors.surfaceStrong },
  ctaText: { color: colors.onPrimary },
  ctaTextDisabled: { color: colors.borderStrong },
});
