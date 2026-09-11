# Handoff: UGCX Creator App (Mobile)

## Overview
Creator-mode screens for UGCX, a two-sided UGC marketplace (Egypt-first, Phase 1). Covers onboarding, home/discovery, brief detail + apply, collaboration lifecycle (funded → shipped → delivered → revision → approved), chat, earnings/payout, profile, notifications, proposal history, settings, and empty/error states. English LTR + Arabic RTL pairs included for two key screens.

## About the Design Files
The bundled file (`UGCX-Creator-App.dc.html`) is a **design reference built in HTML** — a prototype showing intended look, content, and states, not production code to copy directly. The task is to recreate these designs in the target codebase's real environment (React Native / Expo per the project's stated stack) using its existing component patterns, not to embed this HTML.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final per the attached DESIGN.md (Airtable-derived system) and its Mobile & RTL Addendum. Recreate pixel-close using the target app's component library; where no equivalent component exists yet, build it to these specs.

## Design Tokens

### Colors
- Primary / Ink: `#181d26` — primary buttons, headings, dark surfaces
- Primary Active: `#0d1218`
- Canvas: `#ffffff` · Surface Soft: `#f8fafc` · Surface Strong: `#e0e2e6`
- Body text: `#333840` · Muted: `#41454d` · Border Strong: `#9297a0`
- Hairline: `#dddddd` · Input border: `#8a8f99` (new mobile token, 3.25:1 contrast)
- Link: `#1b61c9` / active `#1a3866`
- Success: `#006400` · Danger: `#b3261e` · Danger surface: `#fdecea`
- Signature surfaces: Coral `#aa2d00`, Forest `#0a2e0e`, Cream `#f5e9d4`, Peach `#fcab79`, Mint `#a8d8c4`, Yellow `#f4d35e`, Mustard `#d9a441`

### Typography
- Latin: **Inter** (400, 500). Arabic: **IBM Plex Sans Arabic** (400, 500) — Arabic line-heights are Latin × 1.15.
- Mobile scale: displayLg 32/38, displayMd 28/34, titleLg 22/30, titleMd 20/28, body 15/22.
- Never bolder than 500. Weight/size/color carry emphasis, not boldness.

### Spacing & Shape
- Base unit 4px. Band separation: 48px (not desktop's 96px) — except onboarding's role-select/OTP screens, which keep 96px vertical centering.
- Radius: 12px cards/primary buttons, 10px content cards, 6px inputs, full/9999px pills and avatars.
- Elevation: flat by default; one raised surface (bottom action bar) uses `shadowOpacity:0.06, shadowRadius:8, offset(0,2)` iOS / `elevation:3` Android.

### RTL rules (Arabic build)
Use logical CSS/RN properties only (`marginStart/End`, `paddingStart/End`, `start/end`) — never `left/right`. Never set explicit `textAlign:left/right`. `flexDirection:row` mirrors automatically — no `row-reverse`. Directional icons (chevrons, send) flip; non-directional icons (search, checkmark) don't. Money/counts render as Latin digits in their own text run inside Arabic sentences.

## Screens

1. **Onboarding** (4 steps) — role select (creator/brand, full-height centered), phone/OTP, **required** basics (name, city, up to 3 niches, 15s verification video), **optional/skippable** portfolio + base price + social handle. Skip returns to pending-vetting home.
2. **Home — work queue** — urgent task as full-bleed coral (`#aa2d00`) card; secondary tasks as hairline rows; open briefs teaser below.
3. **Home — discovery feed** — search + filter chips, one compact "needs action" banner, then a card feed with deliberately uneven heights and pastel demo surfaces.
4. **Home — status board** — escrow summary card (dark `#181d26`), then horizontal rails per stage (Needs filming / In review / Applied).
5. **Brief detail → Apply** — hero image, spec rows, brand's "three things to hit" callout on cream, sticky bottom price+CTA bar; apply sheet has price stepper, delivery-time segmented control, note field, escrow disclosure.
6. **Collaboration detail → Upload** — vertical timeline (accepted → funded → shipped/confirm → film&upload), escrow amount on forest-green card; upload screen shows a revision-request banner (danger tokens), file progress, a pre-submit checklist, optional note.
7. **Collaboration chat** — centered hairline "system message" capsules for escrow/shipment/revision events; normal bubbles for brand↔creator messages; brand contact info never shown.
8. **Earnings → Payout** — withdrawable balance on cream card, escrow/paid-to-date stat row, ledger list (held/released/paid); payout sheet with amount + InstaPay/Vodafone Cash/bank radio + "reviewed within 2 business days" disclosure.
9. **Profile / Portfolio** — avatar, vetted badge, niche chips, stat row (collaborations / approval % / revision avg — no follower counts), portfolio grid, payout/language info rows.
10. **Pending vetting home** — checklist of 4 onboarding steps (3 done, payout details outstanding), open briefs shown at 45% opacity (locked).
11. **Notifications** — grouped by day, unread marked with a leading dot (not a badge).
12. **My proposals** — filter chips (All/Pending/Accepted/Declined), list with status pill per row.
13. **Settings** — language segmented control (English/العربية), account rows, support rows.
14. **Empty state** (no open briefs) and **error state** (upload failed at 42%, retry) — both styled as text + a plain hairline square, no illustration.

Exact colors, spacing, and copy for each element are in the DESIGN.md system doc and its Mobile & RTL Addendum (attached to this project) — treat that as the source of truth for anything not covered above.

## Interactions & Behavior
- Bottom tab bar (Home/Discover/Work/Earnings/Profile): flat, no shadow, no switch animation.
- Sheets (apply, payout, portfolio steps) are bottom sheets over a 45%-opacity scrim.
- Disabled state = 45% opacity system-wide.
- Chat: system messages are non-interactive records; only brand/creator bubbles are conversational.
- Skip on onboarding step 2 must be reachable again later from the pending-vetting screen or profile.

## Files
- `UGCX-Creator-App.dc.html` — all screens (English + Arabic pairs), single reference file.
