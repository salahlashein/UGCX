# Brand — Edit brief

**Route:** `/brand/briefs/[id]/edit` · **Code:** `apps/web/src/app/brand/briefs/[id]/edit/page.tsx` (uses `BriefForm`)
**Screenshots:** [1280](../shots/brand-brief-edit-1280.png) · [768](../shots/brand-brief-edit-768.png) · [360](../shots/brand-brief-edit-360.png)
**Score:** `100 − (2×4) = 92/100` · **Verdict:** Ready to ship (after the shared form fixes)
**Also affected by:** everything in [brand-brief-new](brand-brief-new.md) (same `BriefForm`), G14

## Warning (2)

**W1. "Save changes" disabled with no reason.** The draft has no description, so section 2 shows REQUIRED and the button is grey; nothing says the description is what's missing. Same fix as brand-brief-new W1.

**W2. No next step for a draft.** After editing an unfunded draft there is no "Fund and publish" path from this page; the brand must go back to the list or dashboard. Show a secondary "Continue to funding" when the brief is a valid draft.

## Note
The "Requires shipping" box was ticked on this seeded draft only because the seed script created it through the API without `needsShipping`; the web form itself defaults to unticked. Not a finding.
