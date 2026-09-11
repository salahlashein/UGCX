export type AuthStackParamList = {
  OnboardingRole: undefined;
  OnboardingPhoneNumber: { role: 'brand' | 'creator' };
  OnboardingOtp: { role: 'brand' | 'creator'; phone: string };
  OnboardingBasics: { role: 'brand' | 'creator' };
  OnboardingPortfolio: { role: 'brand' | 'creator' };
};

export type BrandCampaignsStackParamList = {
  CampaignsList: undefined;
  CampaignWizard: { campaignId?: string } | undefined;
  ProposalsInbox: { campaignId: string };
  AcceptProposal: { proposalId: string };
  CollaborationDetail: { collaborationId: string };
  CollaborationChat: { collaborationId: string };
};

export type BrandProductsStackParamList = {
  ProductsList: undefined;
  ProductForm: { productId?: string } | undefined;
};

export type BrandProfileStackParamList = {
  BrandProfile: undefined;
};

export type CreatorHomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  PendingVetting: undefined;
};

export type CreatorDiscoverStackParamList = {
  Discover: undefined;
  CampaignDetail: { campaignId: string };
};

export type CreatorWorkStackParamList = {
  WorkStatus: undefined;
  DeliverableUpload: { collaborationId: string };
  CollaborationChat: { collaborationId: string };
};

export type CreatorEarningsStackParamList = {
  Earnings: undefined;
};

export type CreatorProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyProposals: undefined;
  Settings: undefined;
};
