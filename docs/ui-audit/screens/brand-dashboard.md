# Brand dashboard

**Route:** `/brand/dashboard` · **Role:** brand owner · **Code:** `apps/web/src/app/brand/dashboard/page.tsx`, `components/brand/*` (hero, pipeline, action list, quick tiles)
**Screenshots:** [1280](../shots/brand-dashboard-1280.png) · [768](../shots/brand-dashboard-768.png) · [360](../shots/brand-dashboard-360.png) · [Arabic 1280](../shots/ar-brand-dashboard-1280.png)
**Score:** `100 − (4×8) − (4×4) − 2 = 50/100` · **Verdict:** Significant rework
**Also affected by:** G3 (phone nav), G4 ("Based on latest collaboration" 2.72:1), G5, G8 ("Back to school" shows *Fund* though its transfer is pending), G12, G13, G16

**Seed state seen:** 1 live brief (2 creators hired: one video waiting for review, one paid), 1 draft, 1 draft with a pending InstaPay transfer.

## Critical (4)

**C1. Pipeline contradicts the action list** (`Brief pipeline`)
**Found:** pipeline shows *In production 0* and *In review 0*, while "Needs your action" says *1 video is ready for review* and two creators are hired. The pipeline counts each brief once, by its "latest collaboration" (caption, 2.72:1).
**Why:** the brand reads the pipeline as "nothing to review" and misses the video; figures that should agree don't.
**Fix:** count collaborations, not briefs, in the production/review/completed columns (or label the widget "Briefs by stage" and move hired work to its own row). Drop the "Based on latest collaboration" caption once the count is right.

**C2. "EGP 440.00 still in escrow" mislabels the money** (hero subline)
**Found:** 440 is the *unallocated* balance. EGP 2,200 is also still held in escrow for Mariam's pending video.
**Why:** the brand thinks only 440 is at risk/available and cannot reconcile with Billing.
**Fix:** "EGP 440 unallocated · EGP 2,200 held for 1 video in review". Use the same terms as Billing (Available / Allocated / Released).

**C3. Hero amount clipped on phones** (`EGP 4,400.00`, 360px)
**Found:** the 48px mono figure runs past the card edge ("EGP 4,400.0").
**Why:** the headline number of the page is cut off.
**Fix:** `font-size: clamp(28px, 9vw, 48px)` on the hero value, or drop decimals on the hero ("EGP 4,400").

**C4. Action rows starve their text on phones** (`Needs your action`, 360px)
**Found:** title, URGENT tag and Review button share one row: "Proposals awaiting…" and "Deliverabl es…" break mid-word, and the button overlaps the subtitle.
**Fix:** at < 480px stack: title + subtitle on top, tag and button on their own row (`flex-wrap` with `min-width: 0` on the text, button full width).

## Warning (4)

**W1. Four entry points for one action.** "New brief" appears in the header, in the hero, and as a quick tile, next to "Fund a brief". Keep the header button; let the hero show the money state.
**W2. The chart takes prime space with little to say.** 6-month bars where 5 months are empty, y-axis "4.4K" without currency, neutral title "6-Month Financial Activity". Move it below the action list or replace it with an escrow breakdown (held / released / available) until there is history. If kept: title states the point, axis in EGP.
**W3. "URGENT" on routine work.** Red dashed tags on every review item make red meaningless. Use a neutral count chip; reserve red/amber for overdue items (e.g. "Review in 2 days or it auto-approves", if that rule exists).
**W4. Quick tiles repeat the sidebar** and carry cryptic letter badges ("N", "W"), likely keyboard shortcuts with no explanation. Remove the tiles or replace with genuinely different shortcuts; remove letter badges on touch.

## Polish (2)

- P1. "1 approved deliverables" — singular/plural.
- P2. Pipeline chips truncate titles ("Back to school snack …") with no title tooltip.

## User walk

A brand logs in after a creator delivered. The first thing seen is the dark money card and a chart; the video waiting for approval is the fourth block down and the pipeline says *In review 0*. On a phone the hero number is clipped and the action list is hard to read. The right first screen answers "what needs me now": lead with the action list.

## Visual note (unscored)

The dark "terminal grid" hero is the loudest element but answers the least urgent question. Make "Needs your action" the dominant block; demote money to a calm summary strip.

## Fix checklist
- [ ] C1 pipeline counts collaborations
- [ ] C2 hero subline wording matches Billing
- [ ] C3 hero value responsive size
- [ ] C4 action rows stack on phones
- [ ] W1–W4, P1–P2
