import React, { useState } from 'react';
import { StyleSheet, View, TextInput as RNTextInput, Pressable, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import type { AuthStackParamList } from '../../navigation/types';
import { AppText } from '../../components/ui/Text';
import { hydrateSession } from '../../store/sessionPersistence';
import { colors, spacing, radius } from '../../theme/tokens';
import { useUpdateCreatorProfile, useAddPortfolioItem } from '../../hooks/api/useCreator';
import { useRequestUploadUrl, uploadFileToPresignedUrl } from '../../hooks/api/useStorage';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingPortfolio'>;

export function OnboardingPortfolioScreen({ route }: Props) {
  const [price, setPrice] = useState('');
  const [handle, setHandle] = useState('');
  const [samples, setSamples] = useState<{ uri: string; type: 'video' | 'image' }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const role = route.params.role;
  const updateProfile = useUpdateCreatorProfile();
  const addPortfolioItem = useAddPortfolioItem();
  const requestUploadUrl = useRequestUploadUrl();

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets.length > 0) {
      setSamples([...samples, { uri: result.assets[0].uri, type: result.assets[0].type === 'video' ? 'video' : 'image' }]);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload samples and register them
      for (const sample of samples) {
        const contentType = sample.type === 'video' ? 'video/mp4' : 'image/jpeg';
        const response = await requestUploadUrl.mutateAsync({
          module: 'portfolio',
          contentType,
          fileSize: 5000000,
        });

        await uploadFileToPresignedUrl(sample.uri, response.uploadUrl, contentType);

        await addPortfolioItem.mutateAsync({
          mediaUrl: response.fileUrl,
          mediaType: sample.type === 'video' ? 'video' : 'image',
        });
      }

      // 2. Save price
      if (price.trim().length > 0) {
        await updateProfile.mutateAsync({
          basePrice: Number(price),
        });
      }

      // 3. Complete onboarding
      await hydrateSession();
    } catch (err) {
      console.error('Failed to submit portfolio:', err);
      Alert.alert('Upload Failed', 'Could not save your portfolio. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await hydrateSession();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <AppText style={styles.stepLabel}>STEP 2 OF 2 — OPTIONAL</AppText>
          <Pressable onPress={handleSkip}>
            <AppText variant="label" style={styles.skip}>
              Skip for now
            </AppText>
          </Pressable>
        </View>
        <AppText variant="displayMd" color="ink" style={styles.heading}>
          Build your portfolio
        </AppText>
        <AppText variant="body" color="muted" style={styles.sub}>
          Adding samples now speeds up vetting - you can also do this after you're approved.
        </AppText>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <View style={styles.grid}>
          <Pressable style={styles.addTile} onPress={pickMedia}>
            <AppText variant="caption" color="muted">
              + Add media
            </AppText>
          </Pressable>
          {samples.map((sample, i) => {
            if (sample.type === 'video') {
              return (
                <View key={i} style={[styles.sampleTile, { alignItems: 'center', justifyContent: 'center' }]}>
                  <AppText variant="label" color="ink">🎥 Video</AppText>
                </View>
              );
            }
            return <Image key={i} source={{ uri: sample.uri }} style={styles.sampleTile} />;
          })}
        </View>
        <AppText variant="label" color="ink" style={styles.label}>
          Base price - optional, editable anytime
        </AppText>
        <View style={styles.priceRow}>
          <AppText variant="body" color="muted">
            EGP
          </AppText>
          <RNTextInput
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 2,500"
            keyboardType="numeric"
            style={styles.priceInput}
          />
        </View>
        <AppText variant="label" color="ink" style={styles.label}>
          Instagram or TikTok - optional
        </AppText>
        <RNTextInput
          value={handle}
          onChangeText={setHandle}
          placeholder="@yourhandle"
          style={styles.input}
        />
      </ScrollView>
      <Pressable style={styles.cta} onPress={handleFinish} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <AppText variant="label" color="onPrimary">
            Submit for review
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  stepLabel: {
    fontFamily: 'monospace',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.muted,
  },
  skip: { fontSize: 13, color: colors.link },
  heading: { marginBottom: 6 },
  sub: { marginBottom: spacing.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  addTile: {
    width: '47%',
    height: 150,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleTile: {
    width: '47%',
    height: 150,
    borderRadius: radius.md,
    backgroundColor: colors.signaturePeach,
  },
  label: { marginBottom: 8 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: spacing.md,
  },
  priceInput: {
    flex: 1,
    fontSize: 15, // matching AppText variant="body"
    color: colors.ink,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
});
