# Brand — Brief detail

**Route:** `/brand/briefs/[id]` · **Code:** `apps/web/src/app/brand/briefs/[id]/page.tsx`
**Screenshots:** [1280](../shots/brand-brief-detail-1280.png) · [768](../shots/brand-brief-detail-768.png) · [360](../shots/brand-brief-detail-360.png)
**Score:** `100 − (2×8) − (4×4) = 68/100` · **Verdict:** Significant rework
**Also affected by:** G1 (inline grid at `:197`; this page happens to stack at 360 but the escrow tiles collide), G9, G14 ("Edit brief" circle icon), G19 (seen when the API timed out)

## Critical (2)

**C1. Proposal counts disagree across screens**
**Found:** the side card says *Proposals 1*; the brief list says *3* and the inbox says *"3 received"*. This card counts only proposals still waiting.
**Why:** the brand thinks proposals vanished.
**Fix:** "3 proposals · 1 waiting" (total plus pending), the same numbers as the inbox tabs.

**C2. Primary CTA clipped on phones** (header, 360px)
**Found:** "Proposals inbox (1)" runs past the right edge; the back button and the title squeeze each other.
**Fix:** at < 480px put the back link above the title, the actions on their own row, full width.

## Warning (4)

**W1. Stepper doesn't fit multi-slot briefs.** "Delivered" is ticked while one of the two hired creators is still waiting for review. Use per-creator progress ("1 of 2 delivered · 1 approved") or drop the brief-level stepper after hiring.
**W2. Still taking proposals with all slots filled** *(product decision)*. Hired shows 2 / 2, yet the brief stays open and a third creator applied. Either close applications when slots are full (and say so on the brief), or say "Slots full — new proposals go to a waitlist".
**W3. Escrow values collide on phones.** "Available EGP 440.00" and "Allocated EGP 3,960.00" run together ("…440.00EGP 3,960.00"). Stack them at < 480px.
**W4. Two buttons to the same place.** "Proposals inbox (1)" in the header and "View all proposals" in the card. Keep one.

## User walk
Good: the brief reads like a document, and "Close and refund" has a confirmation modal. The brand coming back to check hiring sees conflicting counts and a stepper that claims "Delivered".

## Fix checklist
- [ ] C1 consistent proposal counts
- [ ] C2 phone header layout
- [ ] W1–W4
