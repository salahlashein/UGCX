# Brand — Proposals overview (all briefs)

**Route:** `/brand/proposals` · **Code:** `apps/web/src/app/brand/proposals/page.tsx`
**Screenshots:** [1280](../shots/brand-proposals-1280.png) · [768](../shots/brand-proposals-768.png) · [360](../shots/brand-proposals-360.png)
**Score:** `100 − (2×8) − 4 = 80/100` · **Verdict:** Ship after fixing the top findings
**Also affected by:** G5, G8 (drafts with a pending transfer offer "Fund escrow"), G9

## Critical (2)

**C1. Raw status words** (`Collaborations in progress`)
**Found:** the two rows show "urgent" and "pend" (an enum cut off) as plain text before the amount.
**Why:** the brand can't tell what state each job is in.
**Fix:** use the shared status map (G9): "Video ready for review" / "Paid".

**C2. "Lowest" price is wrong**
**Found:** the Ramadan brief card says *Lowest EGP 2,500.00*, while the hired proposals are 1,600 and 2,000. It is the lowest *open* proposal, unlabelled.
**Fix:** "Lowest open proposal" or show the price range of all proposals; hide it when there are no open proposals.

## Warning (1)

**W1. Every row has the same "Track →" button** and no status, deadline or creator avatar. Make the row the link and show status + due date.

## Fix checklist
- [x] C1 status labels
- [x] C2 lowest price label
- [ ] W1 row design
