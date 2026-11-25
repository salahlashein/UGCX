# Brand — Create new brief

**Route:** `/brand/briefs/new` · **Code:** `apps/web/src/app/brand/briefs/new/page.tsx`, `apps/web/src/components/brand/BriefForm.tsx`
**Screenshots:** [1280](../shots/brand-brief-new-1280.png) · [768](../shots/brand-brief-new-768.png) · [360](../shots/brand-brief-new-360.png) · [Arabic 1280](../shots/ar-brand-brief-new-1280.png)
**Score:** `100 − (6×4) − 2 = 74/100` · **Verdict:** Ship after fixing the top findings
**Also affected by:** G5 (REQUIRED/COMPLETE chips), G11 (Arabic labels in mono caps), G12, G14 (circle icons for Unboxing, Try-On Haul, Other)

## Warning (6)

**W1. Primary CTA disabled with no reason, and buried on phones**
**Found:** "Review & fund escrow" is greyed out until the form is valid, with no message saying what is missing; on phones it sits at the very bottom, after the whole form *and* the summary.
**Fix:** keep the button enabled; on click scroll to the first invalid field with an inline error. On phones use a sticky bottom bar with the total and the CTA.

**W2. Choices made for the brand.** Niche is pre-selected ("Beauty & Care") and budget prefilled (1,500 – 3,500). A coffee brand can publish under Beauty without touching it.
**Fix:** no niche selected by default (required); budget empty with a hint ("Most UGC videos in Egypt: EGP 1,000 – 3,000"), or prefill from the brand's category.

**W3. Video type grid.** 7 options in 4 columns leave a lone row of 3, and three of them share the same circle placeholder icon (G14). Use 4 + 4 with "Other", or a 2-column list with descriptions ("Unboxing — open and react on camera").

**W4. Two label systems.** Section fields use sentence case ("Brief title") while others use mono caps ("NICHE", "DURATION", "LANGUAGE"). Pick one (sentence case reads better and works in Arabic).

**W5. Summary card scrolls away.** On desktop the summary + CTA is not sticky; after the long form the brand scrolls back up to submit. Make the right column `position: sticky; top: 24px`.

**W6. US date format.** Proposals deadline shows `12/09/2026` (mm/dd). Egyptian users read 12 September. Use a date picker with day-month and a label ("Closes on 9 Dec 2026").

## Polish (2)
- P1. "Tutorial / How-To" wraps to two lines in its tile.
- P2. At 360 the "Do not say" textarea clips its placeholder (fixed height).

## User walk
First-time brand: the form is clear and the live "Creator discover preview" is a good idea. The brand doesn't know what a fair budget is, can't attach a product photo or reference video, and gets a dead grey button when something is missing.

## Product suggestions (unscored)
- Optional reference link/video and product photo upload.
- Show the total including the 10% fee next to the budget ("Creators see 1,500 – 3,500; you fund up to 3,850 per slot").

## Fix checklist
- [ ] W1 enabled CTA + inline errors + sticky phone bar
- [ ] W2 no default niche, budget hint
- [ ] W3 video type grid + icons
- [ ] W4 one label style
- [ ] W5 sticky summary
- [ ] W6 date format
- [ ] P1–P2
