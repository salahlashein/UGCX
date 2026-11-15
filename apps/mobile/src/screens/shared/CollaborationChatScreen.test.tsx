import React from 'react';
import { render } from '@testing-library/react-native';
import { CollaborationChatScreen } from './CollaborationChatScreen';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: any) => {
      if (typeof fallback === 'string' && options?.total) {
        return fallback.replace('{{total}}', options.total);
      }
      return fallback ?? key;
    },
  }),
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: any) => selector({ user: { id: 'u-brand', role: 'brand' } }),
}));

jest.mock('../../hooks/api/useCollaborations', () => ({
  useCollaboration: () => ({
    data: {
      id: 'collab-1',
      status: 'delivered',
      totalAmount: '2800.00',
      creatorPrice: '2500.00',
      brand: { companyName: 'Glow Lab' },
      campaign: { title: 'Serum review' },
    },
    isLoading: false,
  }),
}));

jest.mock('../../hooks/api/useMessages', () => ({
  useMessages: () => ({
    data: {
      data: [
        {
          id: 'msg-sys-1',
          kind: 'system',
          senderUserId: null,
          event: 'escrow_funded',
          params: { total: '2800.00' },
          body: null,
        },
        {
          id: 'msg-user-1',
          kind: 'user',
          senderUserId: 'u-creator',
          body: 'Hello brand!',
        },
      ],
    },
    isLoading: false,
  }),
  useSendMessage: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
}));

jest.mock('../../hooks/api/useChats', () => ({
  useMarkChatRead: () => ({
    mutate: jest.fn(),
  }),
}));

describe('CollaborationChatScreen', () => {
  const mockRoute = {
    params: { collaborationId: 'collab-1' },
    key: 'CollaborationChat-1',
    name: 'CollaborationChat' as const,
  };
  const mockNavigation: any = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  it('renders system message as capsule and user message as bubble', async () => {
    const screen = await render(
      <CollaborationChatScreen route={mockRoute as any} navigation={mockNavigation} />,
    );

    // System message capsule
    expect(screen.getByText('Escrow funded · EGP 2800.00')).toBeTruthy();
    // User message bubble
    expect(screen.getByText('Hello brand!')).toBeTruthy();
  });
});
