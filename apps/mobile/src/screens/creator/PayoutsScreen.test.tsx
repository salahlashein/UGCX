import React from 'react';
import { render } from '@testing-library/react-native';
import { PayoutsScreen } from './PayoutsScreen';

jest.mock('../../components/ui/BottomSheet', () => {
  const { View } = require('react-native');
  return {
    AppBottomSheet: ({ children }: any) => <View testID="mock-bottom-sheet">{children}</View>,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

let mockEarnings = {
  escrowBalance: '1500.00',
  pendingBalance: '3200.00',
  clearedBalance: '4800.00',
  currency: 'EGP',
};

let mockLedger = [
  {
    id: 'tx-1',
    title: 'Released · Glow Lab',
    meta: 'Serum review',
    amount: '3,200.00',
    sign: '+',
    status: 'Withdrawable',
    statusToken: 'success',
  },
];

jest.mock('../../hooks/api/useCreator', () => ({
  useCreatorEarnings: () => ({
    data: mockEarnings,
  }),
  useCreatorLedger: () => ({
    data: mockLedger,
    refetch: jest.fn(),
  }),
  useRequestPayout: () => ({
    mutateAsync: jest.fn(),
  }),
}));

describe('PayoutsScreen', () => {
  it('formats string amounts with commas and renders ledger rows', async () => {
    const screen = await render(<PayoutsScreen />);

    expect(screen.getByText('READY TO WITHDRAW')).toBeTruthy();
    expect(screen.getByText('EGP 3,200')).toBeTruthy();
    expect(screen.getByText('EGP 1,500')).toBeTruthy();
    expect(screen.getByText('EGP 4,800')).toBeTruthy();
    expect(screen.getByText('Released · Glow Lab')).toBeTruthy();
    expect(screen.getByText('+3,200.00')).toBeTruthy();
  });
});
