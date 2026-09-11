import { useMutation } from '@tanstack/react-query';
import type {
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  TokenPairResponse,
  SendOtpRequest,
  VerifyOtpRequest,
} from '@ugcx/shared-types';
import { apiClient } from '../../services/apiClient';
import { apiPost } from '../../services/apiHelpers';
import { clearSession, saveSession, updateTokens } from '../../store/sessionPersistence';
import { useAuthStore } from '../../store/authStore';

export function useSendOtp() {
  return useMutation({
    mutationFn: (dto: SendOtpRequest) => apiPost<{ message: string }>('/auth/otp/send', dto),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (dto: VerifyOtpRequest) => apiPost<RegisterResponse>('/auth/otp/verify', dto),
    onSuccess: async (data) => {
      // Only store tokens so we don't trigger the RootNavigator switch yet
      await updateTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    },
  });
}

/** TASK-P1-005 */
export function useRegister() {
  return useMutation({
    mutationFn: (dto: RegisterRequest) => apiPost<RegisterResponse>('/auth/register', dto),
    onSuccess: async (data) => {
      await saveSession(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        { id: data.userId, role: data.role },
      );
    },
  });
}

/** TASK-P1-005: login does not return the user/role, so saveSession decodes the JWT. */
export function useLogin() {
  return useMutation({
    mutationFn: (dto: LoginRequest) => apiPost<TokenPairResponse>('/auth/login', dto),
    onSuccess: async (data) => {
      await saveSession(data);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        const body: RefreshRequest = { refreshToken };
        await apiClient.post('/auth/logout', body);
      }
    },
    onSettled: async () => {
      await clearSession();
    },
  });
}
