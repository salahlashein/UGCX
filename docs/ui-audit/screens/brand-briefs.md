# Brand — Briefs list

**Route:** `/brand/briefs` · **Code:** `apps/web/src/app/brand/briefs/page.tsx` (+ brief table component)
**Screenshots:** [1280](../shots/brand-briefs-1280.png) · [768](../shots/brand-briefs-768.png) · [360](../shots/brand-briefs-360.png)
**Score:** `100 − (4×4) − 1 = 83/100` · **Verdict:** Ship after fixing the top findings
**Also affected by:** G2 (192px overflow at 768, names wrap one word per line), G4 ("Not funded", "0" hired, arrows at 2.72:1), G5 ("DRAFT" chip 10px, 4.47:1), G6 (search has no label), G7, G8 (pending transfer shown as "Needs escrow funding"), G17 ("/" hint)

## Warning (4)

**W1. Escrow cell breaks across lines** (`ESCROW USED`)
**Found:** "EGP 3,960.00/" on one line and "EGP 4,400.00" indented on the next; at 360 the second value overflows the card edge.
**Fix:** one line "3,960 / 4,400" with the currency in the column header ("Escrow used, EGP"), progress bar under it; `white-space: nowrap` + tabular numbers.

**W2. "Ends" column is empty** for every brief, though each has a proposals deadline (9 Dec).
**Fix:** show the deadline ("Closes 9 Dec" / "in 14 days"); for drafts show "—" with a reason ("Not live").

**W3. Hired avatars clipped.** Two initials overlap and the second ("MA") is cut. Use a proper avatar stack with a white ring and `+N`.

**W4. Lone filter chip on phones.** At 360 "Completed (0)" sits alone on a second row. Make the chip row horizontally scrollable with a fade cue, or use a select.

## Polish (1)
- P1. The only row affordance is a faint "→" (2.72:1). Make the whole row a link with a hover state, and the arrow readable.

## User walk
A brand with three briefs can scan status and proposals quickly on desktop. The brief whose payment is being checked says "Needs escrow funding" (G8), the most likely cause of a duplicate transfer. On tablet the table overflows.

## Fix checklist
- [ ] W1 escrow cell
- [ ] W2 deadline in "Ends"
- [ ] W3 avatar stack
- [ ] W4 chip row on phones
- [ ] P1 row link
