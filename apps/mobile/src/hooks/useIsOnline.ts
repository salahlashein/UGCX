import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook to inspect real-time network connectivity.
 * Used by OfflineBanner and offline-aware actions.
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected));
    });

    NetInfo.fetch().then((state) => {
      setIsOnline(Boolean(state.isConnected));
    });

    return unsubscribe;
  }, []);

  return isOnline;
}
