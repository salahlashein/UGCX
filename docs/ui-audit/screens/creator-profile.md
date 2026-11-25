# Creator — Profile

**Route:** `/creator/profile` · **Code:** `apps/web/src/app/creator/profile/page.tsx`
**Screenshots:** [1280](../shots/creator-profile-1280.png) · [768](../shots/creator-profile-768.png) · [360](../shots/creator-profile-360.png)
**Score:** `100 − (4×4) = 84/100` · **Verdict:** Do not ship (G1: at 360 the editable fields — name, city, base price — are hidden behind the "What brands see" card; only the niches and a one-word-wide upload box remain)
**Also affected by:** G1 (`:205`, inner grids `:233`, `:335`, `:495`, `:579`), G7, G10 ("Approval 100%" with 0 jobs in the preview)

## Warning (4)

**W1. Nothing a brand needs to judge a creator** *(product decision)*. No profile photo (initials only), no Instagram/TikTok handle or follower count, no languages or age range. Brands hire on these. Add photo + social handles at minimum.
**W2. "Portfolio previews" heading with nothing under it** in the preview card. Show placeholders ("Add up to 3 videos") or hide the heading.
**W3. Base price shows "1800.00"** in the input. Whole pounds ("1,800").
**W4. "Save profile" is far from the fields** (page header, top right). On long edits it scrolls away; put Save at the end of the form (and sticky on phones).

## Fix checklist
- [ ] W1 photo + social handles *(decide)*
- [ ] W2 portfolio placeholder
- [ ] W3 price format
- [ ] W4 save placement
