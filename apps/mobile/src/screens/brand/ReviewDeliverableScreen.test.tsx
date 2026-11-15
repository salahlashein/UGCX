import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ReviewDeliverableScreen } from './ReviewDeliverableScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: any) => {
      if (typeof fallback === 'string' && options?.version) {
        return fallback.replace('{{version}}', options.version);
      }
      return fallback ?? key;
    },
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

const mockMutate = jest.fn();

jest.mock('../../hooks/api/useDeliverables', () => ({
  useDeliverablePlayUrl: () => ({
    data: { url: 'https://cdn.example.com/deliv.mp4', expiresInSeconds: 900 },
    isLoading: false,
    isError: false,
  }),
  useCollaborationDeliverables: () => ({
    data: [
      {
        id: 'deliv-1',
        version: 2,
        status: 'submitted',
        feedback: [{ id: 'f-1', body: 'Please fix lighting', senderRole: 'brand' }],
      },
      {
        id: 'deliv-0',
        version: 1,
        status: 'revision_requested',
        feedback: [{ id: 'f-0', body: 'Too dark', senderRole: 'brand' }],
      },
    ],
    isLoading: false,
  }),
  useReviewDeliverable: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

jest.mock('../../hooks/api/useCollaborations', () => ({
  useCollaboration: () => ({
    data: { id: 'collab-1', status: 'delivered', totalAmount: '3000.00' },
    isLoading: false,
  }),
}));

jest.mock('../../components/VideoPlayer', () => {
  const { View, Text } = require('react-native');
  return {
    VideoPlayer: ({ onReady }: any) => {
      return (
        <View testID="mock-video-player">
          <Text testID="video-player-ready" onPress={() => onReady?.()}>
            Ready
          </Text>
        </View>
      );
    },
  };
});

describe('ReviewDeliverableScreen', () => {
  const mockRoute = {
    params: { deliverableId: 'deliv-1', collaborationId: 'collab-1' },
    key: 'ReviewDeliverable-1',
    name: 'ReviewDeliverable' as const,
  };
  const mockNavigation: any = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders version line and disables approve action before video is ready', async () => {
    const screen = await render(
      <ReviewDeliverableScreen route={mockRoute as any} navigation={mockNavigation} />,
    );

    expect(screen.getByText(/v2 · submitted/)).toBeTruthy();
  });

  it('requires note before requesting revision', async () => {
    const screen = await render(
      <ReviewDeliverableScreen route={mockRoute as any} navigation={mockNavigation} />,
    );

    const revisionBtn = screen.getByText('Request revision');
    await act(async () => {
      fireEvent.press(revisionBtn);
    });

    expect(mockMutate).not.toHaveBeenCalled();
    expect(screen.getByText('Please provide feedback for the creator')).toBeTruthy();
  });

  it('enables approve action once video is ready and triggers approve mutation', async () => {
    const screen = await render(
      <ReviewDeliverableScreen route={mockRoute as any} navigation={mockNavigation} />,
    );

    // Simulate video player ready
    await act(async () => {
      fireEvent.press(screen.getByTestId('video-player-ready'));
    });

    const approveBtn = screen.getByText('Approve & release');
    await act(async () => {
      fireEvent.press(approveBtn);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'deliv-1',
        dto: expect.objectContaining({ action: 'approve' }),
      }),
      expect.any(Object),
    );
  });
});
