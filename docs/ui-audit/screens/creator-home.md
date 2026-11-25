# Creator — Home

**Route:** `/creator/home` · **Code:** `apps/web/src/app/creator/home/page.tsx` (+ `CreatorHomeHeader`, `QueueTaskSection`, earnings and proposals cards)
**Screenshots:** [1280](../shots/creator-home-1280.png) · [768](../shots/creator-home-768.png) · [360](../shots/creator-home-360.png) · [Arabic 1280](../shots/ar-creator-home-1280.png)
**Score:** `100 − (4×4) = 84/100` · **Verdict:** Do not ship (G1: at 360 the earnings card covers the main column; "Nothing to do now", "Browse briefs" and "Briefs for you" are unreadable, 11px overflow)
**Also affected by:** G1 (`:41`, `minmax(300px, 1fr)`), G3, G15 (bell in header + sidebar)

## Warning (4)

**W1. Recommends a brief the creator already won.** "Briefs for you" lists *Ramadan cold brew launch* with **View** although Mariam is hired on it. Exclude briefs with an existing proposal.

**W2. "Request payout" is enabled at EGP 0.00 available.** The earnings page disables it for the same state. Disable here too, with "Available after the brand approves your video".

**W3. "SHORTLI STED" breaks mid-word** (My proposals tile, 1280px). The three-column tile is too narrow for the mono caps label. Use sentence case and let the tiles wrap (or 2 columns).

**W4. "Nov 25 · Cairo" under the name** — the date has no meaning (member since? today?). Say "Member since Nov 2026" or drop it.

## User walk
A creator with one delivered video waiting for review opens the app on a phone: the layout overlaps (G1). On desktop the "Nothing to do now" message is accurate, but it could say *why* ("Your video for Nile Coffee is with the brand — usually reviewed within 48h") — that is the creator's real question.

## Moves (unscored)
- Lead with the creator's current job status (in review / revision requested / paid), then new matching briefs.

## Fix checklist
- [x] W1 exclude applied briefs
- [x] W2 disabled payout with reason
- [x] W3 tile labels
- [ ] W4 header meta
