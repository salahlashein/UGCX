# Creator — Active work

**Route:** `/creator/work` · **Code:** `apps/web/src/app/creator/work/page.tsx`
**Screenshots:** [1280](../shots/creator-work-1280.png) · [768](../shots/creator-work-768.png) · [360](../shots/creator-work-360.png)
**Score:** `100 − (2×4) = 92/100` · **Verdict:** Ready to ship after G2
**Also affected by:** G2 (174px overflow at 768), G5, G9 ("IN REVIEW" here, "DELIVERED" on the detail page)

## Warning (2)

**W1. Warning colours for a normal state.** "IN REVIEW" and "IN 5 DAYS" are orange dashed chips although nothing is wrong (the video is with the brand, the due date no longer applies). Neutral chip for in-review; hide "due" after delivery or show "Delivered 25 Nov".
**W2. Rows don't look clickable.** No arrow or hover cue; "Waiting for brand review" is grey text. Make the row a link with a chevron.
