# Brand — Review deliverable

**Route:** `/brand/deliverables/[id]/review` · **Code:** `apps/web/src/app/brand/deliverables/[id]/review/page.tsx`
**Screenshots:** [1280](../shots/brand-review-1280.png) · [768](../shots/brand-review-768.png) · [360](../shots/brand-review-360.png)
**Score:** `100 − 12 − 8 − (2×4) = 72/100` · **Verdict:** **Do not ship** (Blocker)
**Also affected by:** G1 (`:255`), G5 ("0 OF 2" chip)

## Blocker (1)

**B1. On a phone the video is a 30px black strip** (360px)
**Found:** the review grid keeps `minmax(320px, 1fr)` for the decision panel, so the video column shrinks to ~30px. The brand sees the checklist and the **Approve deliverable** button, but not the video.
**Why:** approving releases EGP 2,000 to the creator; the brand can do it without watching what they pay for. This is the most important screen of the product.
**Fix:** part of G1, with this order on phones: video full width first (9:16 frame, max-height 70vh), then the creator's note, then the checklist, then the decision panel. The decision buttons can be a sticky bottom bar.

## Critical (1)

**C1. The creator's note on the version is missing**
**Found:** Mariam submitted V1 with "V1 with the bottle opening in the first 2 seconds." The review screen doesn't show it anywhere.
**Fix:** show the note under the player ("Creator's note for V1"), plus the version history (V1, V2…) with their notes and the brand's feedback.

## Warning (2)

**W1. The checklist skips "Do not say".** Only the talking points appear; the "Do not mention other coffee brands" rule isn't there to check against.
**W2. Destructive action sits beside the safe one.** "Decline" (red outline) is directly next to "Request revision" at the same size. Move Decline under a "More" menu or below with spacing; it ends the collaboration.

## Verify
- With a real file, does a failed or slow video load show an error/loading state? Locally the player stayed at 0:00 with no message (test files have no object in R2). Critical if confirmed.
- The Next.js dev overlay showed "1 Issue" on this page; read it in `next dev`.

## Good
- Approve now asks for confirmation and shows the exact amount (fixed in `03ba8f9`).

## Fix checklist
- [ ] B1 phone layout, video first
- [ ] C1 creator note + version history
- [ ] W1 do-not-say in checklist
- [ ] W2 decline placement
