# Creator — Discover live briefs

**Route:** `/creator/discover` · **Code:** `apps/web/src/app/creator/discover/page.tsx`
**Screenshots:** [1280](../shots/creator-discover-1280.png) · [768](../shots/creator-discover-768.png) · [360](../shots/creator-discover-360.png)
**Score:** `100 − 8 − (3×4) = 80/100` · **Verdict:** Do not ship (G1: page is 669px wide at 360; the brief card is squeezed to a sliver beside the filters and its title disappears)
**Also affected by:** G1 (`:156`, `minmax(240px, 280px) minmax(0, 1fr)`), G2 (161px overflow at 768), G6 (search has no label), G7, G14 (Search button uses a circle icon)

## Critical (1)

**C1. "Apply" on a brief the creator already won**
**Found:** the only live brief shows **Apply** although Mariam's proposal was accepted.
**Why:** the button lies about the state; tapping it leads to a page that says "Proposal submitted / ACCEPTED".
**Fix:** per brief, show the creator's state: "Applied · EGP 2,000", "Hired", or Apply.

## Warning (3)

**W1. Filters show five empty niches** ("Beauty & Care (0)", "Fashion (0)"…). Hide or disable zero-count niches, or move counts to a tooltip.
**W2. Budget slider reads "Any" at its minimum.** It's unclear whether dragging raises the minimum or the maximum. Label it "Budget from EGP …" and show the value.
**W3. Sort sits far from the list.** Newest / Highest budget / Closing soon are top-right, above the search; put sort next to the results count.

## Moves (unscored)
- Brief cards are a single line of text. Creators choose by *brand + money + effort*: show brand logo, budget, video type icon, duration, deadline and "Ships product" in a card; on phones a full-width card list (filters in a bottom sheet).

## Fix checklist
- [x] C1 per-brief application state
- [ ] W1–W3
