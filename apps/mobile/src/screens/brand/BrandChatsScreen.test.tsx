import React from 'react';
import { render } from '@testing-library/react-native';
import { BrandChatsScreen } from './BrandChatsScreen';

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
  }),
}));

let mockChats = [
  {
    collaborationId: 'collab-1',
    counterpartName: 'Nour H.',
    counterpartInitials: 'NH',
    campaignTitle: 'Serum review',
    lastMessagePreview: 'Sounds great, sample is on the way today.',
    lastMessageAt: '2026-03-30T12:00:00Z',
    unreadCount: 2,
    collaborationStatus: 'delivered',
  },
];

jest.mock('../../hooks/api/useChats', () => ({
  useChats: () => ({
    data: { data: mockChats },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

describe('BrandChatsScreen', () => {
  it('renders chat row and unread pill when unread count is above zero', async () => {
    const screen = await render(<BrandChatsScreen />);

    expect(screen.getByText('Nour H.')).toBeTruthy();
    expect(screen.getByText('Serum review')).toBeTruthy();
    expect(screen.getByText('Sounds great, sample is on the way today.')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });
});
