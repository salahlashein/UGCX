import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NotificationsScreen } from './NotificationsScreen';
import * as useNotificationsModule from '../../hooks/api/useNotifications';
import * as authStoreModule from '../../store/authStore';
import { CommonActions } from '@react-navigation/native';

const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      dispatch: mockDispatch,
    }),
  };
});

const mockEnTranslations = require('../../i18n/en.json');

function mockGetNestedTranslation(obj: any, path: string): string {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

function mockInterpolate(template: string, params?: Record<string, any>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{{${key}}}`;
  });
}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const template = mockGetNestedTranslation(mockEnTranslations, key);
      return mockInterpolate(template, params);
    },
  }),
}));

jest.mock('../../utils/date', () => ({
  formatRelativeTime: () => '2h ago',
}));

describe('NotificationsScreen (TASK-P4-08)', () => {
  const mockMarkReadMutate = jest.fn();
  const mockMarkAllReadMutate = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(useNotificationsModule, 'useUnreadCount').mockReturnValue({
      data: { unread: 2 },
    } as any);

    jest.spyOn(useNotificationsModule, 'useMarkNotificationRead').mockReturnValue({
      mutate: mockMarkReadMutate,
    } as any);

    jest.spyOn(useNotificationsModule, 'useMarkAllNotificationsRead').mockReturnValue({
      mutate: mockMarkAllReadMutate,
      isPending: false,
    } as any);
  });

  it('1. Rows from today render under a "TODAY" header', async () => {
    jest.spyOn(authStoreModule, 'useAuthStore').mockReturnValue({
      id: 'brand-user-1',
      role: 'brand',
    } as any);

    const todayStr = new Date().toISOString();
    jest.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
      data: {
        data: [
          {
            id: 'notif-1',
            event: 'brief_published',
            params: { title: 'Summer Campaign' },
            deepLink: null,
            collaborationId: null,
            campaignId: 'c-1',
            readAt: null,
            createdAt: todayStr,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    const screen = await render(<NotificationsScreen />);

    expect(screen.getByText('TODAY')).toBeTruthy();
    expect(screen.getByText('Brief "Summer Campaign" is live and accepting proposals')).toBeTruthy();
  });

  it('2. An unread row renders the dot at full opacity and a read row hides it', async () => {
    jest.spyOn(authStoreModule, 'useAuthStore').mockReturnValue({
      id: 'brand-user-1',
      role: 'brand',
    } as any);

    const todayStr = new Date().toISOString();
    jest.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
      data: {
        data: [
          {
            id: 'n-unread',
            event: 'brief_published',
            params: { title: 'Unread Brief' },
            readAt: null,
            createdAt: todayStr,
          },
          {
            id: 'n-read',
            event: 'brief_published',
            params: { title: 'Read Brief' },
            readAt: '2026-09-18T10:00:00Z',
            createdAt: todayStr,
          },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    const screen = await render(<NotificationsScreen />);

    const unreadDot = screen.getByTestId('unread-dot-n-unread');
    const readDot = screen.getByTestId('unread-dot-n-read');

    expect(unreadDot.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 1 })]),
    );
    expect(readDot.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
    );
  });

  it('3. A brand user sees brand copy for escrow_released and creator user sees creator copy', async () => {
    const todayStr = new Date().toISOString();
    const mockNotifData = {
      id: 'n-escrow',
      event: 'escrow_released',
      params: {
        total: '3080.00',
        creatorPrice: '2800.00',
        currency: 'EGP',
        creatorName: 'Salma K.',
      },
      readAt: null,
      createdAt: todayStr,
    };

    // Brand role
    jest.spyOn(authStoreModule, 'useAuthStore').mockReturnValue({
      id: 'brand-user-1',
      role: 'brand',
    } as any);

    jest.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
      data: { data: [mockNotifData], total: 1 },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    const brandRender = await render(<NotificationsScreen />);
    expect(brandRender.getByText('EGP 2800.00 released to Salma K.')).toBeTruthy();

    // Creator role
    jest.spyOn(authStoreModule, 'useAuthStore').mockReturnValue({
      id: 'creator-user-1',
      role: 'creator',
    } as any);

    const creatorRender = await render(<NotificationsScreen />);
    expect(creatorRender.getByText('EGP 2800.00 released to your earnings')).toBeTruthy();
  });

  it('4. The empty state renders for an empty list', async () => {
    jest.spyOn(authStoreModule, 'useAuthStore').mockReturnValue({
      id: 'brand-user-1',
      role: 'brand',
    } as any);

    jest.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    const screen = await render(<NotificationsScreen />);
    expect(screen.getByText('Nothing new')).toBeTruthy();
  });

  it('5. Tapping a row calls markRead once and navigates once', async () => {
    jest.spyOn(authStoreModule, 'useAuthStore').mockReturnValue({
      id: 'brand-user-1',
      role: 'brand',
    } as any);

    const todayStr = new Date().toISOString();
    jest.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
      data: {
        data: [
          {
            id: 'notif-tap',
            event: 'deliverable_submitted',
            params: { creatorName: 'Salma', title: 'Beauty Video', version: 1 },
            deepLink: {
              stack: 'BriefsTab',
              screen: 'ReviewDeliverable',
              params: { deliverableId: 'deliv-1' },
            },
            readAt: null,
            createdAt: todayStr,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isRefetching: false,
    } as any);

    const screen = await render(<NotificationsScreen />);
    const row = screen.getByTestId('notif-item-notif-tap');

    await act(async () => {
      fireEvent.press(row);
    });

    expect(mockMarkReadMutate).toHaveBeenCalledWith('notif-tap');
    expect(mockDispatch).toHaveBeenCalledWith(
      CommonActions.navigate({
        name: 'BriefsTab',
        params: {
          screen: 'ReviewDeliverable',
          params: { deliverableId: 'deliv-1' },
        },
      }),
    );
  });
});
