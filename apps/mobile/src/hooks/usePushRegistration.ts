import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useRegisterPushToken } from './api/usePushToken';
import { navigationRef } from '../navigation/navigationRef';
import { logger } from '../services/logger';
import { isFeatureEnabled } from '../config/features';

import type { NotificationDeepLink } from '@ugcx/shared-types';

interface NotificationData {
  collaborationId?: string;
  deepLink?: NotificationDeepLink;
}

export const ALLOWED_DEEP_LINKS: Record<string, string[]> = {
  BriefsTab: ['MyBriefs', 'ProposalsInbox', 'CollaborationDetail', 'ReviewDeliverable', 'CollaborationChat'],
  ProposalsTab: ['ProposalsAcrossBriefs', 'ProposalsInbox', 'CreatorProfilePreview'],
  ChatsTab: ['BrandChats', 'CollaborationChat'],
  DashboardTab: ['BrandDashboard', 'Notifications'],
  HomeTab: ['Home', 'Notifications'],
  DiscoverTab: ['Discover', 'CampaignDetail'],
  WorkTab: ['WorkStatus', 'DeliverableUpload', 'CollaborationChat'],
  EarningsTab: ['Earnings'],
  ProfileTab: ['Profile', 'MyProposals', 'BrandProfile', 'BrandTeam', 'BrandBilling'],
};

// expo-notifications has no web implementation: getLastNotificationResponse
// and getExpoPushTokenAsync both throw UnavailabilityError there instead of
// rejecting, so they crash past the try/catch below. Platform.OS is fixed
// for the process lifetime, so branching on it here never changes the
// hook-call order for a given mounted instance.
const isWeb = Platform.OS === 'web';

/**
 * TASK-P1-013, TASK-P4-07: REQ-009, EDGE-P1-003, PAT-403.
 * Deep link routing with route allow list and fallback to collaborationId.
 */
export function usePushRegistration(): void {
  const user = useAuthStore((state) => state.user);
  const registerPushToken = useRegisterPushToken();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lastResponse = isWeb ? undefined : Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (isWeb || !user || !isFeatureEnabled('pushNotifications')) return;

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

    try {
      const data = lastResponse.notification?.request?.content?.data as NotificationData | undefined;
      if (!data) return;

      // 1. Check deepLink from push payload
      if (data.deepLink && typeof data.deepLink === 'object') {
        const { stack, screen, params } = data.deepLink;
        const allowedScreens = ALLOWED_DEEP_LINKS[stack];

        if (allowedScreens && allowedScreens.includes(screen)) {
          navigationRef.dispatch(
            CommonActions.navigate({
              name: stack,
              params: { screen, params },
            }),
          );
          return;
        } else {
          logger.warn(`Push deep link disallowed or unknown: stack=${stack}, screen=${screen}`);
          return;
        }
      }

      // 2. Fallback: collaborationId branch for backwards compatibility
      if (data.collaborationId) {
        const tabName = user.role === 'brand' ? 'BriefsTab' : 'WorkTab';
        const screenName = user.role === 'brand' ? 'CollaborationDetail' : 'WorkStatus';
        navigationRef.dispatch(
          CommonActions.navigate({
            name: tabName,
            params: { screen: screenName, params: { id: data.collaborationId } },
          }),
        );
      }
    } catch (err) {
      logger.warn('Failed to handle notification response', err);
    }
  }, [lastResponse, user]);
}
