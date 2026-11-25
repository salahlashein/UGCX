# Creator — Brief detail and proposal

**Route:** `/creator/discover/[id]` · **Code:** `apps/web/src/app/creator/discover/[id]/page.tsx`
**Screenshots:** [1280](../shots/creator-discover-detail-1280.png) · [768](../shots/creator-discover-detail-768.png) · [360](../shots/creator-discover-detail-360.png) · [Arabic 1280](../shots/ar-creator-discover-detail-1280.png)
**Score:** `100 − (2×8) − (3×4) = 72/100` · **Verdict:** Do not ship (G1: at 360 words split mid-letter, "unboxi ng", "produc t shippi ng", "EGP 1, 500.00", and the pitch runs one word per line beside the preview card)
**Also affected by:** G1 (`:208`, inner `repeat(3, 1fr)` at `:527`), G9 (`unboxing`, `AR` raw values), G10 ("Approval rate 100%" with 0 jobs), G11

## Critical (2)

**C1. Two statuses for one proposal**
**Found:** the left card says **ACCEPTED**; the "How Nile Coffee Co. sees your proposal" card says **APPLIED**.
**Fix:** the preview card reads the same status (or hides the chip once the proposal is decided).

**C2. "Closes in —" although the brief has a deadline** (9 Dec 2026).
**Fix:** "Closes in 14 days (9 Dec)"; "Closed" after the date.

## Warning (3)

**W1. The brief is hidden behind a modal.** The description, talking points and "do not say" rules — what the creator must deliver — sit behind "Read full brief". Creators decide to apply without reading it. Show them on the page, above the proposal form.
**W2. Budget range wraps over three lines** in 24px mono ("EGP 1,500.00 / - / EGP 2,500.00"). "EGP 1,500 – 2,500" on one line.
**W3. After acceptance there is no way forward.** The page says "Proposal submitted" with the accepted price but no "Go to your job" link to `/creator/work/[id]`.

## Fix checklist
- [x] C1 one status
- [x] C2 deadline
- [ ] W1 brief inline
- [x] W2 budget format
- [x] W3 link to work
