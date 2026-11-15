import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CreatorProfilePreviewScreen } from './CreatorProfilePreviewScreen';

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

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: React.forwardRef(({ children }: any, ref: any) => {
      const [visible, setVisible] = React.useState(false);
      React.useImperativeHandle(ref, () => ({
        present: () => setVisible(true),
        dismiss: () => setVisible(false),
      }));
      return visible ? <View testID="bottom-sheet">{children}</View> : null;
    }),
    BottomSheetView: ({ children }: any) => <View>{children}</View>,
    BottomSheetBackdrop: () => null,
  };
});

const mockMutateAccept = jest.fn();

const mockProfilePreviewData = {
  creatorId: 'cr-1',
  displayName: 'Sarah Connor',
  city: 'Cairo',
  niches: ['beauty', 'skincare'],
  approvalRate: 98,
  averageRevisions: 1.2,
  jobsDone: 32,
  portfolio: [
    { id: 'port-1', mediaUrl: 'https://cdn.test/1.mp4', mediaType: 'video' },
  ],
  proposal: {
    id: 'prop-1',
    price: '2800.00',
    currency: 'EGP',
    deliveryDays: 5,
    pitch: 'I love this product and can deliver high quality content.',
  },
};

jest.mock('../../hooks/api/useProposals', () => ({
  useCreatorProfilePreview: () => ({
    data: mockProfilePreviewData,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../hooks/api/useCollaborations', () => ({
  useAcceptProposal: () => ({
    mutate: mockMutateAccept,
    isPending: false,
  }),
}));

describe('CreatorProfilePreviewScreen', () => {
  const mockNavigation = {
    replace: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
  } as any;

  const mockRoute = {
    params: { proposalId: 'prop-1' },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('an insufficient_escrow error renders the shortfall in the sheet copy', async () => {
    const { getByText, getByRole } = await render(
      <CreatorProfilePreviewScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getByText('Sarah Connor')).toBeTruthy();
    expect(getByText('98%')).toBeTruthy();
    expect(getByText('32')).toBeTruthy();

    const acceptBtn = getByRole('button', { name: 'Accept proposal · EGP 2800.00' });

    // Mock mutate calling onError with insufficient_escrow error
    mockMutateAccept.mockImplementationOnce((_id, { onError }) => {
      const error: any = new Error('Insufficient escrow');
      Object.setPrototypeOf(error, require('axios').AxiosError.prototype);
      error.isAxiosError = true;
      error.response = {
        data: {
          error: {
            code: 'insufficient_escrow',
            message: 'Insufficient escrow balance',
            details: [{ message: 'Shortfall: 2080.00 EGP' }],
          },
        },
      };
      onError(error);
    });

    await act(async () => {
      fireEvent.press(acceptBtn);
    });

    await waitFor(() => {
      expect(getByText('Insufficient escrow')).toBeTruthy();
      expect(
        getByText(
          'Available escrow is below the proposal cost. Add EGP 2080.00 to proceed.',
        ),
      ).toBeTruthy();
      expect(getByText('Add EGP 2080.00 to escrow')).toBeTruthy();
    });
  });
});
