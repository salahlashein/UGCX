import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { BrandSetupScreen } from './BrandSetupScreen';
import * as ImagePicker from 'expo-image-picker';

// Mock dependencies
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockMutateAsyncUpdate = jest.fn();
const mockMutateAsyncUploadUrl = jest.fn();
const mockUploadPresigned = jest.fn();

const mockBrandProfileData = {
  id: 'brand-1',
  companyName: '',
  category: null,
  logoUrl: null,
  businessDocumentUrl: null,
};

jest.mock('../../hooks/api/useBrand', () => ({
  useBrandProfile: () => ({
    isLoading: false,
    isError: false,
    data: mockBrandProfileData,
    refetch: jest.fn(),
  }),
  useUpdateBrandProfile: () => ({
    mutateAsync: mockMutateAsyncUpdate,
    isPending: false,
  }),
}));

jest.mock('../../hooks/api/useStorage', () => ({
  useRequestUploadUrl: () => ({
    mutateAsync: mockMutateAsyncUploadUrl,
  }),
  uploadFileToPresignedUrl: (...args: unknown[]) => mockUploadPresigned(...args),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: React.forwardRef(({ children }: any, _ref: any) => <View>{children}</View>),
    BottomSheetView: ({ children }: any) => <View>{children}</View>,
    BottomSheetBackdrop: () => null,
  };
});

describe('BrandSetupScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsyncUpdate.mockResolvedValue({});
    mockMutateAsyncUploadUrl.mockResolvedValue({
      uploadUrl: 'https://storage.test/upload',
      fileUrl: 'https://cdn.test/logo.png',
    });
    mockUploadPresigned.mockResolvedValue(undefined);
  });

  it('disables the continue action while companyName is empty', async () => {
    const { getByRole, getByPlaceholderText } = await render(
      <BrandSetupScreen navigation={mockNavigation} route={{} as any} />,
    );

    const continueBtnDisabled = getByRole('button', { name: 'brand.setup.continue' });
    expect(continueBtnDisabled.props.accessibilityState.disabled).toBe(true);

    const input = getByPlaceholderText('brand.setup.brandName');
    await act(async () => {
      fireEvent.changeText(input, 'Acme Inc');
    });

    const continueBtnEnabled = getByRole('button', { name: 'brand.setup.continue' });
    expect(continueBtnEnabled.props.accessibilityState.disabled).toBe(false);

    await act(async () => {
      fireEvent.press(continueBtnEnabled);
    });

    expect(mockMutateAsyncUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: 'Acme Inc',
      }),
    );
  });

  it('renders the retry action when logo upload fails', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///local/logo.png', mimeType: 'image/png', fileSize: 500 }],
    });
    mockUploadPresigned.mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByRole } = await render(
      <BrandSetupScreen navigation={mockNavigation} route={{} as any} />,
    );

    const uploadText = getByText('brand.setup.uploadLogo');
    await act(async () => {
      fireEvent.press(uploadText);
    });

    await waitFor(() => {
      expect(getByText('brand.setup.uploadFailed')).toBeTruthy();
      expect(getByRole('button', { name: 'common.retry' })).toBeTruthy();
    });
  });

  it('submitting calls updateBrandProfile once with fields and navigates to BrandPhoneVerification', async () => {
    const { getByRole, getByPlaceholderText } = await render(
      <BrandSetupScreen navigation={mockNavigation} route={{} as any} />,
    );

    const input = getByPlaceholderText('brand.setup.brandName');
    await act(async () => {
      fireEvent.changeText(input, 'SuperBrand');
    });

    const continueBtn = getByRole('button', { name: 'brand.setup.continue' });
    await act(async () => {
      fireEvent.press(continueBtn);
    });

    expect(mockMutateAsyncUpdate).toHaveBeenCalledTimes(1);
    expect(mockMutateAsyncUpdate).toHaveBeenCalledWith({
      companyName: 'SuperBrand',
      category: undefined,
      logoUrl: undefined,
      businessDocumentUrl: undefined,
    });
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BrandPhoneVerification');
  });
});
