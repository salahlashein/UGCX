# Creator — My proposals

**Route:** `/creator/proposals` · **Code:** `apps/web/src/app/creator/proposals/page.tsx`
**Screenshots:** [1280](../shots/creator-proposals-1280.png) · [768](../shots/creator-proposals-768.png) · [360](../shots/creator-proposals-360.png)
**Score:** `100 − 4 = 96/100` · **Verdict:** Ready to ship
**Also affected by:** G2 (72px overflow at 768), G3 (not in the phone nav), G4, G12 (narrower container; left edge at 322px vs 284px on other pages)

## Warning (1)

**W1. KPI percentages say nothing.** "Sent 1 · 100%", "Shortlisted 0 · 0%", "Declined 0 · 0%". Keep only "Win rate" (won ÷ decided), and show it after a few proposals; otherwise plain counts.

## Good
- Grouping by Waiting / Won / Declined with honest empty states; "View work" from a won proposal.
