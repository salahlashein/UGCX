import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from './OfflineBanner';
import * as useIsOnlineModule from '../hooks/useIsOnline';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) =>
      fallback || 'No connection. We will retry when you are back online.',
  }),
}));

describe('OfflineBanner', () => {
  it('renders nothing when device is online', async () => {
    jest.spyOn(useIsOnlineModule, 'useIsOnline').mockReturnValue(true);
    const { queryByText } = await render(<OfflineBanner />);
    expect(
      queryByText('No connection. We will retry when you are back online.'),
    ).toBeNull();
  });

  it('renders offline warning banner when device is offline', async () => {
    jest.spyOn(useIsOnlineModule, 'useIsOnline').mockReturnValue(false);
    const { findByText } = await render(<OfflineBanner />);
    expect(
      await findByText('No connection. We will retry when you are back online.'),
    ).toBeTruthy();
  });
});
