// CON-P1-001: fixed niche vocabulary for Phase 1. Adding a value is a
// low-risk additive migration (RISK-001); shared by creators.niches
// (text[]) and campaigns.niche (single enum column).
export enum Niche {
  BEAUTY_PERSONAL_CARE = 'beauty_personal_care',
  FASHION = 'fashion',
  MOM_BABY = 'mom_baby',
  FOOD_FMCG = 'food_fmcg',
  HOME_LIFESTYLE = 'home_lifestyle',
  OTHER = 'other',
}
