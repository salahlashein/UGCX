import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BrandProfileScreen } from './BrandProfileScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

let mockBrandData: any = {
  id: 'b-1',
  companyName: 'Glow Lab',
  country: 'EG',
  verificationStatus: 'unverified',
};

jest.mock('../../hooks/api/useBrand', () => ({
  useBrandProfile: () => ({
    data: mockBrandData,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useUpdateBrandProfile: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../../config/features', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

jest.mock('../../hooks/api/useBrandTeam', () => ({
  useBrandTeam: () => ({
    data: [{ id: 'm-1' }, { id: 'm-2' }],
    isLoading: false,
  }),
}));

jest.mock('../../hooks/api/useProducts', () => ({
  useProducts: () => ({ data: { data: [{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }] } }),
}));

jest.mock('../../hooks/api/useBilling', () => ({
  useBilling: () => ({ data: { summary: { lifetimeSpend: '3300.00', currency: 'EGP' } } }),
}));

jest.mock('../../hooks/api/useAuth', () => ({
  useLogout: () => ({
    mutate: jest.fn(),
  }),
}));

describe('BrandProfileScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  } as any;

  it('hides verified pill for an unverified brand', async () => {
    mockBrandData = {
      ...mockBrandData,
      verificationStatus: 'unverified',
    };

    const screen = await render(<BrandProfileScreen navigation={mockNavigation} route={{} as any} />);

    expect(screen.queryByLabelText('brand.profile.verified')).toBeNull();
    expect(screen.getByText('Get verified')).toBeTruthy();
  });

  it('renders verified pill when brand is verified', async () => {
    mockBrandData = {
      ...mockBrandData,
      verificationStatus: 'verified',
    };

    const screen = await render(<BrandProfileScreen navigation={mockNavigation} route={{} as any} />);

    expect(screen.getByLabelText('brand.profile.verified')).toBeTruthy();
  });

  it('shows team, product and spend stats from the API', async () => {
    const screen = await render(<BrandProfileScreen navigation={mockNavigation} route={{} as any} />);

    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    expect(screen.getByText('3,300')).toBeTruthy();
  });

  it('opens the edit screen from Edit profile', async () => {
    const screen = await render(<BrandProfileScreen navigation={mockNavigation} route={{} as any} />);

    fireEvent.press(screen.getByText('Edit profile'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('EditBrandProfile');
  });
});
