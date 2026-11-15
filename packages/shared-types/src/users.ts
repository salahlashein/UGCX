// feature_mobile_app_phase1 addendum (Schemas section): the one new
// endpoint this plan adds to the existing users module.

/** POST /api/v1/users/me/push-token */
export interface UpdatePushTokenRequest {
  expoPushToken: string;
}

export interface UpdatePushTokenResponse {
  registered: true;
}

export interface UserMeResponse {
  id: string;
  email: string | null;
  role: 'brand' | 'creator' | 'admin';
  displayName: string | null;
  locale: 'en' | 'ar';
}

export interface UpdateMeRequest {
  displayName?: string;
  locale?: 'en' | 'ar';
}
