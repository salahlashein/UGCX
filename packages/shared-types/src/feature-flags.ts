export interface FeatureFlags {
  brandTeamManagement: boolean;
  productCatalog: boolean;
  campaignWizardMultiStep: boolean;
  creatorVettingGate: boolean;
  creatorVerificationClip: boolean;
  automatedPayouts: boolean;
  ablyWebsockets: boolean;
  pushNotifications: boolean;
  brandBillingInvoices: boolean;
  physicalShipmentTracking: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  brandTeamManagement: false,
  productCatalog: false,
  campaignWizardMultiStep: false,
  creatorVettingGate: false,
  creatorVerificationClip: false,
  automatedPayouts: false,
  ablyWebsockets: false,
  pushNotifications: false,
  brandBillingInvoices: false,
  physicalShipmentTracking: false,
};
