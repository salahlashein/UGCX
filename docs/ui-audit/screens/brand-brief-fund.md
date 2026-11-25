# Brand — Fund campaign escrow

**Route:** `/brand/briefs/[id]/fund` (and `?topup=` for top-ups) · **Code:** `apps/web/src/app/brand/briefs/[id]/fund/page.tsx`, `utils/fundTotal.ts`, `config/payments.ts`
**Screenshots:** draft [1280](../shots/brand-brief-fund-1280.png) · [360](../shots/brand-brief-fund-360.png) · pending transfer [1280](../shots/brand-brief-fund-pending-1280.png) · [360](../shots/brand-brief-fund-pending-360.png)
**Score:** `100 − 8 − 4 − 1 = 87/100` · **Verdict:** Ship after fixing C1 (it is the screen-level part of G8)
**Also affected by:** G8, G9 (receipt shows `demo · 45s · ar`), G12 (narrower centred container than other pages)

## Critical (1)

**C1. Fresh payment form while a transfer is pending** (brief "Back to school snack bundle")
**Found:** an InstaPay reference for EGP 1,430 was already submitted and is waiting for the admin; reopening this page shows the full payment form again ("Send EGP 1,430.00 by InstaPay…", empty reference field). The "Waiting for transfer check" state exists only in the session that submitted.
**Why:** the most likely path to a duplicate transfer.
**Fix:** load the pending state from the API (`fundingPaymobOrderId` starts with `manual:`): show "Payment being checked — EGP 1,430 · reference IP-… · submitted 25 Nov", hide the form, offer "Wrong reference? Contact us". See G8.

## Warning (1)

**W1. Total label and value run together.** "Total deposit requiredEGP 1,430.00" — no gap between label and amount in the total row. Use the receipt's two-column layout (label left, amount right) like the lines above.

## Polish (1)
- P1. "Submit Transfer for Verification" is disabled until a reference is typed, with no hint; add helper text under the field ("Find it in your InstaPay history").

## User walk
The receipt is clear (creator price, 10% fee, total) since the fee fix. The copy button for the InstaPay address works. The risky moment is coming back later: nothing says the money is being checked.

## Fix checklist
- [ ] C1 persistent pending state
- [ ] W1 total row layout
- [ ] P1 helper text
