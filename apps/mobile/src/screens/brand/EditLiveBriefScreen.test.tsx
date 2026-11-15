import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditLiveBriefScreen } from './EditLiveBriefScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: any) => {
      if (typeof fallback === 'string' && options?.amount) {
        return fallback.replace('{{amount}}', options.amount);
      }
      return fallback ?? key;
    },
  }),
}));

const mockMutateClose = jest.fn();

let mockCampaignData: any = {
  id: 'cmp-1',
  title: 'Summer Launch',
  budgetMin: '2500.00',
  budgetMax: '4000.00',
  status: 'live',
};

let mockEscrowBalance: any = {
  campaignId: 'cmp-1',
  currency: 'EGP',
  funded: '3200.00',
  allocated: '3080.00',
  available: '120.00',
  refunded: '0.00',
};

jest.mock('../../hooks/api/useCampaigns', () => ({
  useCampaign: () => ({
    data: mockCampaignData,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../hooks/api/useEscrow', () => ({
  useEscrowBalance: () => ({
    data: mockEscrowBalance,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useCloseBrief: () => ({
    mutate: mockMutateClose,
    isPending: false,
  }),
}));

describe('EditLiveBriefScreen', () => {
  const mockNavigation = {
    replace: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
  } as any;

  const mockRoute = {
    params: { campaignId: 'cmp-1' },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('the close confirmation names the refund amount', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { getByText, getByRole } = await render(
      <QueryClientProvider client={queryClient}>
        <EditLiveBriefScreen navigation={mockNavigation} route={mockRoute} />
      </QueryClientProvider>,
    );

    const closeBtn = getByRole('button', { name: 'Close early & refund unspent escrow' });

    await act(async () => {
      fireEvent.press(closeBtn);
    });

    await waitFor(() => {
      expect(getByText('Close brief early?')).toBeTruthy();
      expect(
        getByText(
          'Unspent escrow of EGP 120.00 will be refunded to your payment method. Open proposals will be declined.',
        ),
      ).toBeTruthy();
    });
  });
});
