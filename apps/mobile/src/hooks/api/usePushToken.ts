import { useMutation } from '@tanstack/react-query';
import type { UpdatePushTokenRequest, UpdatePushTokenResponse } from '@ugcx/shared-types';
import { apiPost } from '../../services/apiHelpers';

/** TASK-P1-013: the Dependencies-section addendum endpoint. */
export function useRegisterPushToken() {
  return useMutation({
    mutationFn: (dto: UpdatePushTokenRequest) =>
      apiPost<UpdatePushTokenResponse>('/users/me/push-token', dto),
  });
}
