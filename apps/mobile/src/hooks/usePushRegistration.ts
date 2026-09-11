import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useRegisterPushToken } from './api/usePushToken';
import { navigationRef } from '../navigation/navigationRef';
import { logger } from '../services/logger';

interface NotificationData {
  collaborationId?: string;
}

// expo-notifications has no web implementation: getLastNotificationResponse
// and getExpoPushTokenAsync both throw UnavailabilityError there instead of
// rejecting, so they crash past the try/catch below. Platform.OS is fixed
// for the process lifetime, so branching on it here never changes the
// hook-call order for a given mounted instance.
const isWeb = Platform.OS === 'web';

/**
 * TASK-P1-013: REQ-009, EDGE-P1-003 (permission denied never blocks core
 * flows — every step below fails soft and only logs).
 */
export function usePushRegistration(): void {
  const user = useAuthStore((state) => state.user);
  const registerPushToken = useRegisterPushToken();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lastResponse = isWeb ? undefined : Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (isWeb || !user) return;

    (async () => {
      try {
        const current = await Notifications.getPermissionsAsync();
        let status = current.status;
        if (status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        }
        if (status !== 'granted') {
          logger.info('Push permission not granted; skipping registration');
          return;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const token = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        await registerPushToken.mutateAsync({ expoPushToken: token.data });
      } catch (error) {
        // EDGE-P1-003: no EAS project / no physical push capability in a
        // given environment must not block sign-in or any other core flow.
        logger.warn('Push token registration failed; continuing without it', error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!lastResponse || !navigationRef.isReady() || !user) return;
    const data = lastResponse.notification.request.content.data as NotificationData;
    if (!data.collaborationId) return;

    const tabName = user.role === 'brand' ? 'CampaignsTab' : 'CollaborationsTab';
    const screenName = user.role === 'brand' ? 'CollaborationDetail' : 'MyCollaborationsList';
    navigationRef.dispatch(
      CommonActions.navigate({
        name: tabName,
        params: { screen: screenName, params: { collaborationId: data.collaborationId } },
      }),
    );
  }, [lastResponse, user]);
}
