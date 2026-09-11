// feature_mobile_app_phase1 addendum (Schemas section): the one new
// endpoint this plan adds to the existing users module.

/** POST /api/v1/users/me/push-token */
export interface UpdatePushTokenRequest {
  expoPushToken: string;
}

export interface UpdatePushTokenResponse {
  registered: true;
}
