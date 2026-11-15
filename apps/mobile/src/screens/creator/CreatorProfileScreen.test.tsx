import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { CreatorProfileScreen } from './CreatorProfileScreen';
import * as i18nModule from '../../i18n';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

jest.mock('../../i18n', () => ({
  setAppLocale: jest.fn().mockResolvedValue({ directionChanged: false }),
}));

jest.mock('../../hooks/api/useAuth', () => ({
  useLogout: () => ({
    mutate: jest.fn(),
  }),
}));

jest.mock('../../hooks/api/useCreator', () => ({
  useCreatorProfile: () => ({
    data: {
      id: 'c-1',
      displayName: 'Mariam Adel',
      city: 'Cairo',
      basePrice: '2500.00',
      niches: ['beauty_personal_care'],
      stats: { collaborations: 4, approved: '100%', revisionsAvg: 1 },
    },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  usePortfolioItems: () => ({
    data: [],
  }),
  usePayoutDetails: () => ({
    data: { method: 'InstaPay', accountIdentifier: 'mariam@instapay' },
  }),
  useCreatorEarnings: () => ({
    data: { clearedBalance: '4800.00' },
  }),
}));

describe('CreatorProfileScreen', () => {
  const mockNavigation: any = {
    navigate: jest.fn(),
    getParent: () => ({ navigate: jest.fn() }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders identity card stats and switches language inline without navigating to Settings', async () => {
    const screen = await render(
      <CreatorProfileScreen navigation={mockNavigation} route={{} as any} />,
    );

    expect(screen.getByText('Mariam Adel')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('EGP 2,500')).toBeTruthy();

    const arabicSegment = screen.getByText('العربية');
    await act(async () => {
      fireEvent.press(arabicSegment);
    });

    expect(i18nModule.setAppLocale).toHaveBeenCalledWith('ar');
    expect(mockNavigation.navigate).not.toHaveBeenCalledWith('Settings');
  });

  it('expands payout details inline when pressed', async () => {
    const screen = await render(
      <CreatorProfileScreen navigation={mockNavigation} route={{} as any} />,
    );

    const payoutRow = screen.getByText('Payout details');
    await act(async () => {
      fireEvent.press(payoutRow);
    });

    expect(
      screen.getByText(
        'Payouts are sent via InstaPay, Vodafone Cash, or bank transfer from the Earnings tab.',
      ),
    ).toBeTruthy();
  });
});
