# Brand — Collaboration detail

**Route:** `/brand/collaborations/[id]` · **Code:** `apps/web/src/app/brand/collaborations/[id]/page.tsx`
**Screenshots:** delivered [1280](../shots/brand-collab-delivered-1280.png) · [360](../shots/brand-collab-delivered-360.png) · paid [1280](../shots/brand-collab-paid-1280.png) · [360](../shots/brand-collab-paid-360.png)
**Score:** `100 − (3×8) − (2×4) = 68/100` · **Verdict:** Do not ship (G1: at 360 the timeline, escrow card and stats overlap each other)
**Also affected by:** G1 (`:319`, inner `repeat(2, 1fr)` at `:391`), G9

## Critical (3)

**C1. Paid job still says the money is held** (Youssef, status PAID)
**Found:** subline "EGP 1,600.00 held in escrow" and side card "IN ESCROW EGP 1,600.00" after the payout was recorded.
**Why:** the brand can't tell whether the creator was paid — the main promise of escrow.
**Fix:** by status: funded/delivered → "held in escrow"; approved → "released, payout pending"; paid → "Paid to creator on 25 Nov (InstaPay)".

**C2. "Base rate" shows the wrong number** (Creator statistics)
**Found:** Mariam's base rate is EGP 1,800; the card shows 2,000 (her proposal price for this job).
**Fix:** show `creator.basePrice` labelled "Usual rate", or label this value "Price for this job".

**C3. Money breaks mid-figure** (Creator statistics, 1280px)
**Found:** "EGP 2 ,000. 00" — the mono figure wraps inside a narrow third column even on desktop.
**Fix:** `white-space: nowrap` on money; stats in a list (label left, value right) instead of three narrow columns.

## Warning (2)

**W1. Paid job still leads with "Review deliverable".** After approval/payment the primary action should be "View approved video" / "Download".
**W2. Creator stats are thin.** Jobs / City / Base rate, no portfolio, no link to the creator's profile or their other work.

## Fix checklist
- [x] C1 money state by status
- [x] C2 base rate source
- [x] C3 nowrap money, stats list
- [x] W1 primary action by status
- [ ] W2 creator profile link
