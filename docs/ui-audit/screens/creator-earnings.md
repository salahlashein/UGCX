# Creator — Earnings statement

**Route:** `/creator/earnings` · **Code:** `apps/web/src/app/creator/earnings/page.tsx`
**Screenshots:** [1280](../shots/creator-earnings-1280.png) · [768](../shots/creator-earnings-768.png) · [360](../shots/creator-earnings-360.png)
**Score:** `100 − (4×4) = 84/100` · **Verdict:** Do not ship (G1: 58px overflow at 360; G2: 260px at 768)
**Also affected by:** G1 (`:295`, inner `repeat(2, 1fr)` at `:306`), G2, G5

## Warning (4)

**W1. "Request payout" disabled with no reason.** Say why ("Nothing available yet — EGP 2,000 is held until the brand approves").
**W2. Held money looks like income.** The only statement row is "Held · Nile Coffee Co." with a green EGP 2,000.00 and a HOLD chip. Show held amounts in neutral grey with "Not yours yet — released on approval".
**W3. "1 active collaborations"** — plural.
**W4. Payout method shows a bank icon for InstaPay** and the label "InstaPay IPA". Use the method's own icon and "InstaPay · mariam@instapay".

## Good
- The "Cleared − Paid out = Available" strip explains the balance.

## Fix checklist
- [ ] W1–W4
