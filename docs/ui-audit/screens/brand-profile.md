# Brand — Profile

**Route:** `/brand/profile` · **Code:** `apps/web/src/app/brand/profile/page.tsx`, `hooks/api/useBrand.ts`
**Screenshots:** [1280](../shots/brand-profile-1280.png) · [768](../shots/brand-profile-768.png) · [360](../shots/brand-profile-360.png)
**Score:** `100 − 8 − (3×4) = 80/100` · **Verdict:** Ship after fixing the top findings
**Also affected by:** G5, G12

## Critical (1)

**C1. "Pays in 0d" with no payment history** ("What creators see")
**Found:** the creator-facing card claims the brand pays in 0 days. This brand has one payout; a new brand shows the same.
**Why:** creators read it as a promise; it is computed from too little data.
**Fix:** show it only after N completed payouts (e.g. 3); otherwise "New on ReelPal". Same rule as G10.

## Warning (3)

**W1. "Briefs 1"** while the brand has 3 briefs (it counts live ones). Label "Live briefs".
**W2. Country is free text** ("EG"), shown to creators as "EG". Use a select (Egypt, Saudi Arabia, UAE…) and show the name.
**W3. "Unverified" twice and no way to verify.** The badge appears in the header and on the card; the business-document upload exists only in the mobile app. Add the upload here and say what verification unlocks.

## Good
- Save no longer drops the owner role (fixed in `03ba8f9`); the current logo is shown.

## Fix checklist
- [ ] C1 hide/qualify pay speed
- [ ] W1–W3
