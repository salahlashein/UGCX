export type UserRole = 'brand' | 'creator' | 'admin';
export type UserLocale = 'ar' | 'en';

export const OTP_CODE_LENGTH = 6;

export interface RegisterRequest {
  role: Extract<UserRole, 'brand' | 'creator'>;
  email: string;
  phone: string;
  password: string;
  locale: UserLocale;
}

export interface RegisterResponse {
  userId: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

export interface SendOtpRequest {
  phone?: string;
  email?: string;
  role?: Extract<UserRole, 'brand' | 'creator'>;
}

export interface VerifyOtpRequest {
  phone?: string;
  email?: string;
  otp: string;
  role?: Extract<UserRole, 'brand' | 'creator'>;
}

export interface RefreshRequest {
  refreshToken: string;
}
