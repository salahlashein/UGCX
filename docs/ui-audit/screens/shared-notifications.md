# Notifications (brand and creator)

**Route:** `/notifications` · **Code:** `apps/web/src/app/notifications/page.tsx`
**Screenshots:** brand [1280](../shots/brand-notifications-1280.png) · [768](../shots/brand-notifications-768.png) · [360](../shots/brand-notifications-360.png) · creator [1280](../shots/creator-notifications-1280.png) · [360](../shots/creator-notifications-360.png)
**Score:** `100 − 8 − (3×4) = 80/100` · **Verdict:** Ship after fixing the top findings
**Also affected by:** G2 (174px overflow at 768), G3 (not reachable from the phone nav), G5, G18 (calls the other role's profile endpoint)

## Critical (1)

**C1. Amount contradicts the text**
**Found:** "EGP 1,600.00 released to Youssef Hany" with **EGP 1,760.00** in the Amount column (1,760 includes the fee).
**Fix:** one figure per row, labelled: "Released EGP 1,760 (1,600 to Youssef · 160 fee)", and the amount column shows the same total.

## Warning (3)

**W1. Nine identical "View →" buttons.** Make each row the link; keep a small chevron.
**W2. Copy and grouping.** "2 new proposal" (plural); three separate proposal rows for the same brief. Group by brief and day ("3 new proposals on Ramadan cold brew launch").
**W3. Unread is a 6px dot only.** Bold the unread rows' text or tint the row; announce the count to screen readers.

## Fix checklist
- [x] C1 one amount per row
- [ ] W1–W3
