# Brand — Proposals inbox (per brief)

**Route:** `/brand/briefs/[id]/proposals` · **Code:** `apps/web/src/app/brand/briefs/[id]/proposals/page.tsx`
**Screenshots:** [1280](../shots/brand-brief-proposals-1280.png) · [768](../shots/brand-brief-proposals-768.png) · [360](../shots/brand-brief-proposals-360.png) · [Arabic 1280](../shots/ar-brand-brief-proposals-1280.png)
**Score:** `100 − (2×8) − (3×4) = 72/100` · **Verdict:** Ship after fixing the top findings
**Also affected by:** G1 (inner grids `:537`, `:651`), G5, G10 ("Approval rate —" here vs "100%" on the creator's own view), G17 ("Use J and K" on phones)

## Critical (2)

**C1. A brand can hire a creator the platform hasn't vetted, without knowing it** *(product decision)*
**Found:** Salma's account is still *pending* in the admin vetting queue, but her proposal shows the same Accept button as approved creators and nothing marks her as unvetted.
**Why:** the brand trusts ReelPal's curation; hiring an unreviewed creator undermines it.
**Fix:** either block proposals from unvetted creators (API) or show "Not yet verified by ReelPal" on the card and disable Accept until vetted.

**C2. Accepting beyond the brief's slots** *(product decision)*
**Found:** the brief has 2 slots and 2 creators hired; a third proposal still offers "Accept proposal" (blocked here only by the escrow shortfall).
**Fix:** when hired = slots, replace Accept with "All 2 slots filled — add a slot" (which raises escrow), or allow it explicitly with a warning.

## Warning (3)

**W1. Accept enabled while escrow is short.** With "Short by EGP 2,310.00" the Accept button is still primary. Disable it with the reason ("Top up EGP 2,310 first") and make "Top up escrow" the primary action.
**W2. The accept formula breaks.** "Escrow now − This proposal =" puts "=" on its own and the result ("Left after accept −2,310.00") on the next row. Use a 3-row receipt (now / this proposal / left) like the fund page.
**W3. Accepted proposals don't link anywhere.** Mariam and Youssef show ACCEPTED but no "Open collaboration" link; the brand has to go back through the brief.

## Verify
- At 360 only the list is visible; confirm tapping a proposal opens its detail (Critical if not).

## User walk
Good: keyboard navigation, the cost preview with the fee, clear Decline/Shortlist/Accept. The trust gaps are who the brand is hiring (vetting, 0-job stats) and over-filling slots.

## Fix checklist
- [ ] C1 vetting status *(decide)*
- [ ] C2 slots *(decide)*
- [ ] W1 disabled accept with reason
- [ ] W2 receipt layout
- [ ] W3 link to collaboration
