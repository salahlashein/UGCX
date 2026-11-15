export type AuthStackParamList = {
  OnboardingRole: undefined;
  OnboardingPhoneNumber: { role: 'brand' | 'creator' };
  OnboardingOtp: { role: 'brand' | 'creator'; phone?: string; email?: string };
  OnboardingBasics: { role: 'brand' | 'creator' };
  OnboardingPortfolio: { role: 'brand' | 'creator' };
};

export type BrandDashboardStackParamList = {
  BrandDashboard: undefined;
  Notifications: undefined;
};

export type BrandBriefsStackParamList = {
  MyBriefs: undefined;
  PostBrief: { campaignId?: string } | undefined;
  CampaignWizard: { campaignId?: string } | undefined;
  EditLiveBrief: { campaignId: string }; // Phase 2
  FundEscrow: { campaignId: string }; // Phase 2
  ProposalsInbox: { campaignId: string };
  AcceptProposal: { proposalId: string };
  CreatorProfilePreview: { proposalId: string }; // Phase 2
  CollaborationDetail: { collaborationId: string };
  CollaborationChat: { collaborationId: string };
  ReviewDeliverable: { deliverableId: string; collaborationId?: string }; // Phase 3
};

// Kept for backward compatibility with existing screen props
export type BrandCampaignsStackParamList = BrandBriefsStackParamList;

export type BrandProposalsStackParamList = {
  ProposalsAcrossBriefs: undefined;
  ProposalsInbox: { campaignId: string };
  CreatorProfilePreview: { proposalId: string }; // Phase 2
  AcceptProposal: { proposalId: string };
  CollaborationDetail: { collaborationId: string };
  ReviewDeliverable: { deliverableId: string; collaborationId?: string };
  CollaborationChat: { collaborationId: string };
};

export type BrandChatsStackParamList = {
  BrandChats: undefined;
  CollaborationChat: { collaborationId: string };
};

export type BrandProfileStackParamList = {
  BrandProfile: undefined;
  EditBrandProfile: undefined;
  BrandSetup: undefined;
  BrandPhoneVerification: undefined;
  BrandTeam: undefined;
  BrandBilling: undefined; // Phase 2
  ProductsList: undefined;
  ProductForm: { productId?: string } | undefined;
};

export type BrandProductsStackParamList = {
  ProductsList: undefined;
  ProductForm: { productId?: string } | undefined;
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
};
