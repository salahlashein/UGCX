import React from 'react';
import { render } from '@testing-library/react-native';
import { BrandDashboardScreen } from './BrandDashboardScreen';

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
    t: (key: string, fallback?: string, options?: any) => {
      if (typeof fallback === 'string' && options?.count !== undefined) {
        return fallback.replace('{{count}}', options.count);
      }
      return fallback ?? key;
    },
  }),
}));

let mockDashboardData: any = {
  brandName: 'Glow Lab',
  logoUrl: null,
  month: { spend: '18400.00', deliverableCount: 6, currency: 'EGP' },
  attention: { briefsNeedingProposalReview: 0, deliverablesAwaitingReview: 0 },
  activeBriefs: [],
  activeBriefCount: 0,
};

jest.mock('../../hooks/api/useDashboard', () => ({
  useBrandDashboard: () => ({
    data: mockDashboardData,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

describe('BrandDashboardScreen', () => {
  it('hides attention badges when both attention counts are zero', async () => {
    mockDashboardData = {
      ...mockDashboardData,
      attention: { briefsNeedingProposalReview: 0, deliverablesAwaitingReview: 0 },
    };

    const screen = await render(<BrandDashboardScreen />);
    expect(screen.queryByLabelText(/need proposal review/)).toBeNull();
    expect(screen.queryByLabelText(/awaiting review/)).toBeNull();
  });

  it('renders empty state when there are no active briefs', async () => {
    mockDashboardData = {
      ...mockDashboardData,
      activeBriefs: [],
      activeBriefCount: 0,
    };

    const screen = await render(<BrandDashboardScreen />);
    expect(screen.getByText('No briefs yet')).toBeTruthy();
  });

  it('renders a proposals badge when briefs need proposal review', async () => {
    mockDashboardData = {
      ...mockDashboardData,
      attention: { briefsNeedingProposalReview: 2, deliverablesAwaitingReview: 0 },
    };

    const screen = await render(<BrandDashboardScreen />);
    expect(screen.getByLabelText('2 briefs need proposal review')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('shows both attention counts when proposals and deliverables are waiting', async () => {
    mockDashboardData = {
      ...mockDashboardData,
      attention: { briefsNeedingProposalReview: 3, deliverablesAwaitingReview: 1 },
    };

    const screen = await render(<BrandDashboardScreen />);
    expect(screen.getByLabelText('3 briefs need proposal review')).toBeTruthy();
    expect(screen.getByLabelText('1 deliverables awaiting review')).toBeTruthy();
  });

  it('renders the four quick actions', async () => {
    const screen = await render(<BrandDashboardScreen />);
    for (const id of ['new-brief', 'proposals', 'review', 'wallet']) {
      expect(screen.getByTestId(`quick-action-${id}`)).toBeTruthy();
    }
  });
});
