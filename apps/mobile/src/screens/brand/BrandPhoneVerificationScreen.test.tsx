import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BrandPhoneVerificationScreen } from './BrandPhoneVerificationScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

const mockVerifyOtpMutateAsync = jest.fn();
const mockSendOtpMutateAsync = jest.fn();

jest.mock('../../hooks/api/useBrand', () => ({
  useBrandProfile: () => ({
    isLoading: false,
    data: { phone: '+201000004471' },
  }),
}));

jest.mock('../../hooks/api/useAuth', () => ({
  useSendOtp: () => ({
    mutateAsync: mockSendOtpMutateAsync,
    isPending: false,
  }),
  useVerifyOtp: () => ({
    mutateAsync: mockVerifyOtpMutateAsync,
    isPending: false,
  }),
}));

describe('BrandPhoneVerificationScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyOtpMutateAsync.mockResolvedValue({ success: true });
  });

  it('pre-fills 0000 and allows immediate verification', async () => {
    const { getByText } = await render(
      <BrandPhoneVerificationScreen navigation={mockNavigation as any} route={{} as any} />,
    );

    const continueButton = getByText('brand.verify.continue');
    fireEvent.press(continueButton);

    await waitFor(() => {
      expect(mockVerifyOtpMutateAsync).toHaveBeenCalledWith({
        phone: '+201000004471',
        otp: '0000',
        role: 'brand',
      });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('BrandBriefsTab', {
        screen: 'PostBrief',
      });
    });
  });
});
