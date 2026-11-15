import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { FundEscrowScreen } from './FundEscrowScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: (props: any) => <View {...props} testID="webview" />,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

const mockMutateFund = jest.fn();
const mockMutatePublish = jest.fn();
const mockMutateManual = jest.fn();
const mockRefetchEscrow = jest.fn();

let mockCampaignData: any = {
  id: 'cmp-1',
  title: 'Summer Launch',
  budgetMin: '2500.00',
  budgetMax: '4000.00',
  status: 'draft',
};

let mockEscrowBalance: any = {
  campaignId: 'cmp-1',
  currency: 'EGP',
  funded: '0.00',
  allocated: '0.00',
  available: '0.00',
  refunded: '0.00',
};

jest.mock('../../hooks/api/useCampaigns', () => ({
  useCampaign: () => ({
    data: mockCampaignData,
    isLoading: false,
    isError: false,
  }),
  usePublishCampaign: () => ({
    mutate: mockMutatePublish,
  }),
}));

jest.mock('../../hooks/api/useEscrow', () => ({
  useEscrowBalance: () => ({
    data: mockEscrowBalance,
    refetch: mockRefetchEscrow,
  }),
  useFundEscrow: () => ({
    mutate: mockMutateFund,
    isPending: false,
  }),
  useSubmitManualEscrow: () => ({
    mutate: mockMutateManual,
    isPending: false,
  }),
}));

describe('FundEscrowScreen', () => {
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
    mockCampaignData = {
      id: 'cmp-1',
      title: 'Summer Launch',
      budgetMin: '2500.00',
      budgetMax: '4000.00',
      status: 'draft',
    };
  });

  it('renders the default amount as the midpoint of budget min and max (3,250)', async () => {
    const { getByText } = await render(
      <FundEscrowScreen navigation={mockNavigation} route={mockRoute} />,
    );

    // (2500 + 4000) / 2 = 3250
    expect(getByText('3,250')).toBeTruthy();
    expect(getByText('EGP ')).toBeTruthy();
  });

  it('submits manual transfer details when reference is entered', async () => {
    const { getByRole, getByPlaceholderText } = await render(
      <FundEscrowScreen navigation={mockNavigation} route={mockRoute} />,
    );

    const refInput = getByPlaceholderText('e.g. 987654321');
    await act(async () => {
      fireEvent.changeText(refInput, 'IP-123456');
    });

    const submitBtn = getByRole('button', { name: 'I Have Transferred & Submit' });
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(mockMutateManual).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionReference: 'IP-123456',
        method: 'instapay',
        amount: 3250,
      }),
      expect.any(Object),
    );
  });
});
