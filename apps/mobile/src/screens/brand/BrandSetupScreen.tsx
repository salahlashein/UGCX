import { useState, useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Niche } from '@ugcx/shared-types';
import type { BrandProfileStackParamList } from '../../navigation/types';
import { useBrandProfile, useUpdateBrandProfile } from '../../hooks/api/useBrand';
import {
  useRequestUploadUrl,
  uploadFileToPresignedUrl,
} from '../../hooks/api/useStorage';
import { parseApiError } from '../../services/apiError';
import { AppText } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { TextInput } from '../../components/ui/TextInput';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { AppBottomSheet } from '../../components/ui/BottomSheet';
import { ChipSelect } from '../../components/forms/ChipSelect';
import { colors, radius, spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<BrandProfileStackParamList, 'BrandSetup'>;

const CATEGORY_OPTIONS: Array<{ value: Niche; labelKey: string }> = [
  { value: 'beauty_personal_care', labelKey: 'niche.beauty_personal_care' },
  { value: 'fashion', labelKey: 'niche.fashion' },
  { value: 'mom_baby', labelKey: 'niche.mom_baby' },
  { value: 'food_fmcg', labelKey: 'niche.food_fmcg' },
  { value: 'home_lifestyle', labelKey: 'niche.home_lifestyle' },
  { value: 'other', labelKey: 'niche.other' },
];

/**
 * TASK-P1-12: Brand setup screen (artboard 3a).
 */
export function BrandSetupScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const profileQuery = useBrandProfile();
  const updateProfile = useUpdateBrandProfile();
  const requestUploadUrl = useRequestUploadUrl();

  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<Niche | undefined>(undefined);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [businessDocumentUrl, setBusinessDocumentUrl] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null);
  const [logoUploadError, setLogoUploadError] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categorySheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (profileQuery.data) {
      setCompanyName(profileQuery.data.companyName || '');
      setCategory((profileQuery.data.category as Niche) || undefined);
      setLogoUrl(profileQuery.data.logoUrl || null);
      setBusinessDocumentUrl(profileQuery.data.businessDocumentUrl || null);
    }
  }, [profileQuery.data]);

  if (profileQuery.isLoading) {
    return <LoadingState />;
  }

  if (profileQuery.isError) {
    return (
      <ErrorState
        message={parseApiError(profileQuery.error).message}
        onRetry={profileQuery.refetch}
      />
    );
  }

  const handlePickLogo = async () => {
    try {
      setLogoUploadError(false);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets.length) return;

      const asset = result.assets[0];
      setIsUploadingLogo(true);
      setLogoUploadProgress(10);

      const mimeType = asset.mimeType || 'image/png';
      const uploadTicket = await requestUploadUrl.mutateAsync({
        module: 'brand_logo',
        contentType: mimeType,
        fileSize: asset.fileSize || 1024 * 1024,
      });

      setLogoUploadProgress(50);
      await uploadFileToPresignedUrl(asset.uri, uploadTicket.uploadUrl, mimeType);
      setLogoUploadProgress(90);

      await updateProfile.mutateAsync({ logoUrl: uploadTicket.fileUrl });
      setLogoUrl(uploadTicket.fileUrl);
      setLogoUploadProgress(100);
    } catch {
      setLogoUploadError(true);
    } finally {
      setIsUploadingLogo(false);
      setLogoUploadProgress(null);
    }
  };

  const handlePickDocument = async () => {
    try {
      setIsUploadingDoc(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const uploadTicket = await requestUploadUrl.mutateAsync({
        module: 'brand_document',
        contentType: 'application/pdf',
        fileSize: asset.size || 1024 * 1024,
      });

      await uploadFileToPresignedUrl(asset.uri, uploadTicket.uploadUrl, 'application/pdf');
      setBusinessDocumentUrl(uploadTicket.fileUrl);
      setDocumentName(asset.name);
    } catch (err) {
      setSubmitError(parseApiError(err).message);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await updateProfile.mutateAsync({
        companyName: companyName.trim(),
        category,
        logoUrl: logoUrl || undefined,
        businessDocumentUrl: businessDocumentUrl || undefined,
      });
      navigation.navigate('BrandPhoneVerification');
    } catch (err) {
      setSubmitError(parseApiError(err).message);
    }
  };

  const canContinue = companyName.trim().length > 0 && !isUploadingLogo && !isUploadingDoc;

  const categoryChips = CATEGORY_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  const selectedCategoryLabel = category
    ? t(CATEGORY_OPTIONS.find((c) => c.value === category)?.labelKey || '')
    : '';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <AppText variant="displayMd" color="ink" style={styles.heading}>
          {t('brand.setup.title')}
        </AppText>
        <AppText variant="body" color="muted" style={styles.subheading}>
          {t('brand.setup.subtitle')}
        </AppText>

        {/* Logo tile row */}
        <View style={styles.logoRow}>
          <Pressable onPress={handlePickLogo} accessibilityRole="button">
            <Card style={styles.logoTile}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              ) : (
                <AppText variant="caption" color="muted">
                  logo
                </AppText>
              )}
            </Card>
          </Pressable>
          <View style={styles.logoActionCol}>
            <Pressable onPress={handlePickLogo} disabled={isUploadingLogo}>
              <AppText variant="label" color="ink">
                {t('brand.setup.uploadLogo')}
              </AppText>
            </Pressable>
            {isUploadingLogo && logoUploadProgress !== null ? (
              <AppText variant="caption" color="muted">
                {logoUploadProgress}%
              </AppText>
            ) : null}
            {logoUploadError ? (
              <View style={styles.uploadErrorRow}>
                <AppText variant="caption" color="danger">
                  {t('brand.setup.uploadFailed')}
                </AppText>
                <Button
                  title={t('common.retry')}
                  variant="secondary"
                  onPress={handlePickLogo}
                />
              </View>
            ) : null}
          </View>
        </View>

        {/* Field 1: Brand name */}
        <View style={styles.fieldGap}>
          <TextInput
            label={t('brand.setup.brandName')}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder={t('brand.setup.brandName')}
          />
        </View>

        {/* Field 2: Category */}
        <View style={styles.fieldGap}>
          <Pressable
            onPress={() => categorySheetRef.current?.present()}
            accessibilityRole="button"
          >
            <TextInput
              label={t('brand.setup.category')}
              value={selectedCategoryLabel}
              placeholder={t('brand.setup.category')}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>
        </View>

        {/* Field 3: Business registration document (optional) */}
        <View style={styles.fieldGap}>
          <AppText variant="caption" color="body" style={styles.label}>
            {t('brand.setup.businessDocument')}
          </AppText>
          <Pressable onPress={handlePickDocument} disabled={isUploadingDoc}>
            <Card style={styles.docCard}>
              <AppText variant="body" color={documentName ? 'ink' : 'muted'}>
                {documentName || t('brand.setup.businessDocumentHint')}
              </AppText>
            </Card>
          </Pressable>
        </View>
      </ScrollView>

      {/* Primary action */}
      <BottomActionBar>
        <View style={styles.actionCol}>
          {submitError ? (
            <AppText variant="caption" color="danger" style={styles.errorText}>
              {submitError}
            </AppText>
          ) : null}
          <Button
            title={t('brand.setup.continue')}
            variant="primary"
            fullWidth
            disabled={!canContinue}
            loading={updateProfile.isPending}
            onPress={handleSubmit}
          />
        </View>
      </BottomActionBar>

      {/* Category picker bottom sheet */}
      <AppBottomSheet ref={categorySheetRef}>
        <AppText variant="titleSm" color="ink" style={styles.sheetTitle}>
          {t('brand.setup.category')}
        </AppText>
        <ChipSelect
          options={categoryChips}
          value={category}
          onChange={(val) => {
            setCategory(val as Niche);
            categorySheetRef.current?.dismiss();
          }}
        />
      </AppBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    paddingTop: spacing.section,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heading: {
    marginBottom: spacing.xs,
  },
  subheading: {
    marginBottom: spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoTile: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  logoActionCol: {
    marginStart: spacing.md,
    gap: spacing.xxs,
  },
  uploadErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fieldGap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xxs,
  },
  docCard: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: 'center',
  },
  actionCol: {
    width: '100%',
    gap: spacing.xs,
  },
  errorText: {
    marginBottom: spacing.xxs,
  },
  sheetTitle: {
    marginBottom: spacing.md,
  },
});
