# Brand — Billing & escrow statement

**Route:** `/brand/billing` · **Code:** `apps/web/src/app/brand/billing/page.tsx`
**Screenshots:** [1280](../shots/brand-billing-1280.png) · [768](../shots/brand-billing-768.png) · [360](../shots/brand-billing-360.png)
**Score:** `100 − (2×8) − 4 = 80/100` · **Verdict:** Ship after fixing the top findings
**Also affected by:** G3 (Billing is not reachable from the phone nav at all), G8, G12 (a second dark hero style)

## Critical (2)

**C1. Allocated rows have no amount**
**Found:** "Allocated to Youssef Hany" and "Allocated to Mariam Adel" show no figure in the Amount column; the summary says Allocated EGP 2,200.
**Why:** the statement claims "Reconciled to the cent", but the rows can't be added up.
**Fix:** show the allocated amount on each allocation row (1,760 and 2,200) in a neutral colour (money moved inside escrow, not spent).

**C2. The pending transfer is missing** (instance of G8)
**Found:** the brand sent EGP 1,430 for "Back to school snack bundle" (reference submitted); the statement shows nothing.
**Fix:** a "Pending verification" row with amount, method, reference and date; it turns into "Escrow funded" when the admin confirms.

## Warning (1)

**W1. "Released to Youssef (incl. fee)" hides the split.** 1,760 = 1,600 to the creator + 160 platform fee. Show both lines, or "1,760 (1,600 to creator · 160 fee)". This is also where the managed-fee story starts.

## Good
- The summary maths reconciles (4,400 − 0 − 1,760 − 2,200 = 440) and says so.

## Fix checklist
- [ ] C1 allocation amounts
- [ ] C2 pending row
- [ ] W1 fee split
