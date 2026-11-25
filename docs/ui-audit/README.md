# ReelPal UI/UX audit — brand and creator views

**Date:** 25 Nov 2026 · **Branch audited:** `launch-v1` at `03ba8f9`
**Method:** [ui-ux-audit skill](https://github.com/EnchStyle/ui-ux-audit-skill) (full-audit mode, SaaS/dashboard profile) plus the No-Slop design rules for the visual-direction section.
**Checked:** every brand and creator screen rendered locally against a seeded copy of production (Neon branch `ui-audit`), measured with `uicheck` at 360, 768 and 1280px, screenshots at all three widths, a user walk per role, six screens again in Arabic, and the code of each page.

This file is the map. Each screen has its own file under [`screens/`](screens/) with scored findings. Findings that repeat across many screens live here once, as **G-findings**, and the screen files point to them.

---

## How Claude should work from this audit

1. **Fix root causes first.** Start with the G-findings in the priority order below; G1 alone fixes the phone layout of 12 screens.
2. **Reference findings by ID** in commits and PRs: `G1`, `creator-home/C1`, `brand-review/B1`.
3. **Update the status column** in the tables below (`open` → `fixed` → `verified`) in the same commit as the fix.
4. **Verify against the render, not the code.** Re-run the measurement (see *Re-running the audit*) and look at the 360px and 1280px screenshot of every screen you touched. A fix is `verified` only when the screenshot shows it.
5. **Stay inside the design system** (C3 Sage tokens in `apps/web/src/theme/tokens.ts`) for scored fixes. Changing fonts or palette is a separate decision; see *Visual direction*.
6. **Ask before** changing product behaviour (slots, vetting, payment rules). Those findings are marked *product decision*.

## Severity and scoring (from the skill)

| Severity | Points | Meaning |
|---|---|---|
| **Blocker (B)** | 12 | Stops a core task, misleads about money, or hides content/actions |
| **Critical (C)** | 8 | Major harm on a common path |
| **Warning (W)** | 4 | Degrades the experience |
| **Polish (P)** | 1 | Refinement (max 5 points total per screen) |

Score = 100 − points. Verdicts: 90+ ship · 70–89 ship after top fixes · 40–69 significant rework · <40 do not ship. **Any Blocker = do not ship.** Screen scores below count only that screen's own findings; the G-findings are scored once, here.

---

## Global findings (G)

| ID | Sev | Finding | Screens | Status |
|---|---|---|---|---|
| [G1](#g1) | **B** | Two-column layouts never collapse on phones; columns overlap or overflow | 12 screens | fixed `0a449d1` |
| [G2](#g2) | C | Tablet (768px): desktop sidebar squeezes content; 6 screens scroll sideways | 6 screens | fixed `0a449d1` |
| [G3](#g3) | C | Phone navigation hides Billing, Notifications, Settings, Proposals, Log out, language | all (phone) | fixed `4b753b6` |
| [G4](#g4) | C | `textTertiary` grey `#93a097` is 2.72:1 on white, used for real data | ~all | fixed `0653925` |
| [G5](#g5) | W | 10px uppercase mono chips for status and labels | ~all | fixed `0653925` |
| [G6](#g6) | C | Search inputs have only a placeholder, no label or accessible name | briefs, discover, chats | fixed `0653925` |
| [G7](#g7) | W | Some inputs show no visible focus ring | briefs, discover, chats, profile | fixed `0653925` |
| [G8](#g8) | C | A submitted (pending) manual payment is invisible everywhere; brand is asked to pay again | dashboard, briefs, fund, proposals, billing | fixed `4b753b6` |
| [G9](#g9) | C | Status vocabulary drifts and raw enum values leak into the UI | 10+ screens | partial (proposals, collab, discover) |
| [G10](#g10) | C | "Approval 100%" shown for creators with 0 jobs | creator profile, proposal cards | fixed `a3a743a` |
| [G11](#g11) | C | Arabic/RTL is broken in several ways (letter joining, raw English, truncation, arrows) and not Egyptian | all (Arabic) | partial (joining, arrows fixed; Egyptian copy left) |
| [G12](#g12) | W | Layout system drift: page widths, 8 radii, 13 font sizes, two label styles | all | open |
| [G13](#g13) | W | Desktop sidebar background stops at viewport height | all (desktop) | fixed `4b753b6` |
| [G14](#g14) | P | Placeholder circle icon used for Search, Edit, Unboxing, Try-On, Other | brief form, discover, brief detail | fixed `0a449d1` |
| [G15](#g15) | W | Duplicated chrome: language toggle ×2, notification entry ×2, Log out ×2 | all | fixed `4b753b6` |
| [G16](#g16) | W | Logo is still the "U" from UGCX | all | open |
| [G17](#g17) | P | Keyboard hints ("J/K", "/") shown on touch devices | briefs, inbox | fixed `0a449d1` |
| [G18](#g18) | W | Pages call the other role's API (`/brands/me` as creator, `/creators/me` as brand): 30 × 403 per session | shared pages | fixed `ba866ce` |
| [G19](#g19) | W | Generic error state "Something went wrong. Please try again." with no cause or next step | all detail pages | open |

**G score:** 1 B + 8 C + 8 W + 2 P → `100 − 12 − (8×8) − (8×4) − 2 = −10` → floored **0/100**. **Verdict: do not ship to real users until G1, G3 and G8 are fixed.**

### G1 — Two-column layouts never collapse on phones (Blocker) <a id="g1"></a>
**Found:** 12 pages build their two-column layout with an inline style, e.g. `gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)'` (`apps/web/src/app/creator/home/page.tsx:41`). Inline styles cannot respond to breakpoints, and `minmax(300px, …)` forces the side column to stay. At 360px the columns overlap (creator home, work detail, brand collaboration), squeeze to one word per line (discover detail, creator profile) or push the page sideways (discover 309px, earnings 58px). On the brand review screen the video collapses to a ~30px black strip.
**Why:** creators (and brands checking on the go) use phones; the core flows (find a brief, apply, deliver, review a video, edit profile) are unusable there.
**Where:** `creator/home:41`, `creator/discover:156`, `creator/discover/[id]:208`, `creator/earnings:295`, `creator/profile:205`, `creator/work/[id]:293`, `brand/briefs/[id]:197`, `brand/collaborations/[id]:319`, `brand/deliverables/[id]/review:255`, `creator/loading.tsx:57`, `brand/loading.tsx:60`, plus inner `repeat(3, 1fr)` / `repeat(4, 1fr)` grids in `brand/briefs/[id]/proposals:537,651`, `brand/collaborations/[id]:391`, `creator/profile:233,495,579`, `creator/earnings:306`, `creator/discover/[id]:527`.
**Fix:** one shared `<SplitLayout main side ratio>` component (or a `.split-layout` class) that is a single column below 1024px and `minmax(0, 1.4fr) minmax(300px, 1fr)` above; side column goes *after* main on phones, except the review page where the video goes first. Replace every inline `gridTemplateColumns` above. Inner stat grids: `repeat(auto-fit, minmax(120px, 1fr))`.
**Prevent:** lint rule or code review rule: no inline `gridTemplateColumns`; layout goes through the shared component. Re-run `uicheck` at 360 (overflow must be 0 and screenshots must show no overlap).

### G2 — Tablet width squeezes content (Critical) <a id="g2"></a>
**Found:** the 260px desktop sidebar appears from 768px (`.ugcx-desktop-sidebar` at `@media (min-width: 768px)` in `globals.css:109`), leaving ~508px for content. Measured horizontal overflow at 768: brief list 192px, creator earnings 260px, notifications 174px, creator work 174px, discover 161px, creator proposals 72px. Brief names wrap one word per line.
**Fix:** show the sidebar from 1024px; use the bottom nav (or a collapsed icon rail) from 768 to 1023. Tables get a card layout below 1024 (the brief list already has one at 360 — reuse it).

### G3 — Phone navigation hides destinations (Critical) <a id="g3"></a>
**Found:** brand bottom nav = Dashboard, Briefs, Proposals, Chats, Profile. Billing, Notifications, Settings, language and Log out are unreachable on a phone. Creator bottom nav = Home, Discover, Work, Chats, Earnings, Profile; My Proposals, Notifications, Settings and Log out are unreachable.
**Fix:** add a "More" tab (sheet with Billing/Earnings, Proposals, Notifications with badge, Settings, language, Log out), or a header bell + avatar menu on phones. Keep 5 tabs max.

### G4 — Tertiary grey fails contrast (Critical) <a id="g4"></a>
**Found:** `colors.textTertiary = '#93a097'` (`theme/tokens.ts:54`) measures 2.72:1 on white. It carries real information: "Not funded", hired count "0", "Based on latest collaboration", row arrows, helper text, timestamps.
**Fix:** darken the token until it reaches 4.5:1 on both `#ffffff` and `canvas #eff2ed` (verify with a checker; `textSecondary #5d6b62` already passes), or use it only for decoration. One token change fixes every screen.

### G5 — 10px status chips (Warning) <a id="g5"></a>
**Found:** `Tag` / status chips render 10px uppercase JetBrains Mono with letter spacing (DRAFT 4.47:1, URGENT, REQUIRED, COMPLETE, APPLIED). Below the 12px floor and hard to read; in Arabic the same style breaks letter joining (see G11).
**Fix:** 12px minimum, sentence case for English status ("Draft", "In review"), no letter-spacing on Arabic.

### G6 — Search inputs without a label (Critical) <a id="g6"></a>
**Found:** `Search briefs...` (brand briefs), `Search briefs or brands...` (discover), `Search chats...` (chats) have only a placeholder (`names` check: input with no accessible name).
**Fix:** `aria-label` (or a visually hidden `<label>`) on the shared search input; keep the placeholder as an example.

### G7 — Invisible focus on some inputs (Warning)
**Found:** `focus_invisible` on the search inputs and on profile fields at 1280px. Keyboard users lose their place.
**Fix:** `:focus-visible` ring from the tokens on `TextInput` (2px `primary` outline, 2px offset).

### G8 — Pending manual payments are invisible (Critical) <a id="g8"></a>
**Found:** after a brand submits an InstaPay/Vodafone Cash reference, the brief keeps showing as a plain draft: dashboard "Draft brief pending escrow funding" + **Fund**, brief list "Needs escrow funding", proposals overview "Fund escrow", the fund page shows a **fresh payment form**, and billing lists nothing. Only the session that submitted sees "Waiting for transfer check".
**Why:** the brand cannot tell their money arrived and is invited to pay again — a double payment, then a refund by hand.
**Fix:** a `funding_pending` state from the API (`fundingPaymobOrderId` starts with `manual:` and `fundingRequestedAmount` set): status chip "Payment being checked", the amount and reference, expected time, and no Fund button. Billing shows a "Pending" row. *Product decision:* say how long checks take ("usually within 2 hours, 10am–10pm").

### G9 — Status vocabulary drift and raw enums (Critical) <a id="g9"></a>
**Found:** the same collaboration is "DELIVERED" (work detail, chats), "IN REVIEW" (work list), "urgent"/"pend" (brand proposals overview), and a proposal is "ACCEPTED" and "APPLIED" on the same screen. Raw values leak: `demo · 45s · ar`, `unboxing`, `pend`, `urgent`, `accepted` in the Arabic UI, `brand · owner`.
**Fix:** one `statusLabel(entity, status, locale)` map in `apps/web/src/utils/labels.ts` used everywhere; one colour per meaning (neutral for normal progress, amber only when the user must act, red only for problems).

### G10 — Honest creator stats (Critical) <a id="g10"></a>
**Found:** creators with 0 jobs show "Approval 100%" (creator profile preview, "How the brand sees your proposal"), while the brand inbox shows "—" for the same creator.
**Fix:** with 0 completed jobs show "New creator" instead of rates; never compute a percentage from 0.

### G11 — Arabic and RTL (Critical for Arabic users) <a id="g11"></a>
**Found (Arabic captures `shots/ar-*`):**
- Monospace uppercase labels with letter spacing are applied to Arabic text, breaking letter joining ("بـدون شحن").
- Raw English inside the Arabic UI: `accepted`, `unboxing`, `AR`, `30s`, `brand · owner`, `creator`, "Cairo · 5 أيام".
- Truncation cuts the wrong end ("…adan cold brew launch").
- Missing bidi isolation: ".Nile Coffee Co".
- Directional arrows not mirrored ("← البريفات").
- Chart month labels clipped.
- Copy is Modern Standard Arabic ("موجزات", "تمويل بريف"); the product brief calls for Egyptian Arabic.
- Translation is done with ~550 inline `locale === 'ar' ? … : …` checks instead of `i18n/ar.json`, so strings drift and some stay English.
**Fix:** move strings to `ar.json`/`en.json` with `t()`; IBM Plex Sans Arabic for Arabic labels with `letter-spacing: 0` and no uppercase; `unicode-bidi: isolate` (`<bdi>`) around user content; logical properties and mirrored arrow icons; rewrite Arabic copy in Egyptian (use the `egyptian-arabic` skill).

### G12 — Layout system drift (Warning)
**Found:** content width differs per page (full width; Settings ~670px centred; fund ~736px centred; creator proposals ~896px with a different left edge). The census finds 8 radii (2, 4, 6, 8, 10, 14, 16, 9999px), 3 shadows and 13 font sizes on the dashboard alone. Two label systems compete (mono caps "NICHE" vs sentence-case "Brief title"). Two hero styles (dashboard dark grid card vs billing dark card).
**Fix:** one page container (`max-width` + gutter) for all app pages, 3 radius steps (8 / 14 / pill), one label style per role, one hero component.

### G13 — Sidebar background stops at the fold (Warning)
**Found:** on long pages the white sidebar ends at 900px and the grey canvas shows below it (`sticky top-0 h-screen` inside a `min-h-screen` row).
**Fix:** let the sidebar column stretch (`align-self: stretch`) and keep the inner nav sticky.

### G14 — Placeholder icons (Polish)
**Found:** a plain circle stands in for Search (discover), Edit brief, and the Unboxing / Try-On Haul / Other video types.
**Fix:** map real icons (search, pencil, package, shirt, dots).

### G15 — Duplicated chrome (Warning)
**Found:** language toggle in the sidebar header and in Settings; creator notifications as a header bell and a sidebar item; Log out in the sidebar and as a large red button in Settings.
**Fix:** language and Log out live in Settings (and the phone "More" sheet); one notifications entry.

### G16 — Logo still "U" (Warning)
**Found:** sidebar, login and loading states show a "U" tile (from UGCX) and the tagline "Creator videos · Escrow". Already on the launch board (logo task).

### G17 — Keyboard hints on touch (Polish)
**Found:** "Use J and K to move between proposals" and the "/" search hint render at 360px.
**Fix:** show only on `(hover: hover) and (pointer: fine)`.

### G18 — Cross-role API calls (Warning)
**Found:** during the creator run the API logged 18 × `403 GET /brands/me`; during the brand run 12 × `403 GET /creators/me` (shared pages: notifications, settings, shell). Console noise, wasted requests on slow phones, and a risk of a blank state if a 403 is treated as an error.
**Fix:** gate those queries on `user.role`.

### G19 — Generic error state (Warning)
**Found:** when the API timed out, detail pages showed only "Something went wrong. Please try again." with Retry.
**Fix:** say what failed ("Couldn't load this brief"), keep the page chrome and any cached data, and offer Retry plus a way back.

---

## Screens

Scores count each screen's own findings (G-findings excluded). "Do not ship" when a G-Blocker hits the screen.

### Brand

| Screen | File | Route | Score | Verdict | Top issue |
|---|---|---|---|---|---|
| Dashboard | [brand-dashboard](screens/brand-dashboard.md) | `/brand/dashboard` | 50 | Significant rework | Pipeline contradicts "awaiting review"; hero amount clipped on phone |
| Briefs list | [brand-briefs](screens/brand-briefs.md) | `/brand/briefs` | 83 | Ship after fixes | Escrow cell breaks; "Ends" empty |
| New brief | [brand-brief-new](screens/brand-brief-new.md) | `/brand/briefs/new` | 74 | Ship after fixes | Disabled CTA with no reason; pre-selected niche |
| Edit brief | [brand-brief-edit](screens/brand-brief-edit.md) | `/brand/briefs/[id]/edit` | 92 | Ship | Save disabled with no reason |
| Brief detail | [brand-brief-detail](screens/brand-brief-detail.md) | `/brand/briefs/[id]` | 68 | Significant rework | Proposal counts disagree; CTA clipped on phone |
| Fund escrow | [brand-brief-fund](screens/brand-brief-fund.md) | `/brand/briefs/[id]/fund` | 87 | Ship after fixes (G8 first) | Fresh form while a payment is pending |
| Proposals inbox | [brand-brief-proposals](screens/brand-brief-proposals.md) | `/brand/briefs/[id]/proposals` | 72 | Ship after fixes | Can hire an unvetted creator and over-fill slots |
| Proposals overview | [brand-proposals](screens/brand-proposals.md) | `/brand/proposals` | 80 | Ship after fixes | Raw "pend"/"urgent"; wrong "Lowest" |
| Collaboration | [brand-collaboration](screens/brand-collaboration.md) | `/brand/collaborations/[id]` | 68 | Do not ship (G1) | Paid job still "held in escrow"; wrong base rate |
| Review deliverable | [brand-review](screens/brand-review.md) | `/brand/deliverables/[id]/review` | 72 | **Do not ship** | Video collapses on phone; creator note missing |
| Billing | [brand-billing](screens/brand-billing.md) | `/brand/billing` | 80 | Ship after fixes | Allocated rows have no amount |
| Brand profile | [brand-profile](screens/brand-profile.md) | `/brand/profile` | 80 | Ship after fixes | "Pays in 0d" with no history |

### Creator

| Screen | File | Route | Score | Verdict | Top issue |
|---|---|---|---|---|---|
| Home | [creator-home](screens/creator-home.md) | `/creator/home` | 84 | Do not ship (G1) | Layout overlaps on phone; recommends a brief already won |
| Discover | [creator-discover](screens/creator-discover.md) | `/creator/discover` | 80 | Do not ship (G1) | "Apply" on a brief already won; 309px overflow |
| Brief detail / apply | [creator-discover-detail](screens/creator-discover-detail.md) | `/creator/discover/[id]` | 72 | Do not ship (G1) | ACCEPTED and APPLIED on one screen; brief text hidden |
| My proposals | [creator-proposals](screens/creator-proposals.md) | `/creator/proposals` | 96 | Ship | Meaningless KPI percentages |
| Work list | [creator-work](screens/creator-work.md) | `/creator/work` | 92 | Ship after G2 | Warning colours for normal states |
| Work detail | [creator-work-detail](screens/creator-work-detail.md) | `/creator/work/[id]` | 80 | Do not ship (G1) | Upload form still shown after V1 sent |
| Earnings | [creator-earnings](screens/creator-earnings.md) | `/creator/earnings` | 84 | Do not ship (G1) | Payout disabled with no reason; held money looks earned |
| Profile | [creator-profile](screens/creator-profile.md) | `/creator/profile` | 84 | Do not ship (G1) | Edit fields hidden on phone; no social proof |

### Shared

| Screen | File | Route | Score | Verdict | Top issue |
|---|---|---|---|---|---|
| Chats | [shared-chats](screens/shared-chats.md) | `/brand/chats`, `/creator/chats` | 96 | Ship | System events mixed into the conversation |
| Notifications | [shared-notifications](screens/shared-notifications.md) | `/notifications` | 80 | Ship after fixes | Amount contradicts the text |
| Settings | [shared-settings](screens/shared-settings.md) | `/settings` | 92 | Ship | Read-only row looks editable |
| Login | [login](screens/login.md) | `/login` | 88 | Ship after fixes | "Use password instead" can never work |

---

## Priority order (what to fix first)

| Order | Do | Why | Effort |
|---|---|---|---|
| 1 | **G1** shared split layout | 12 screens unusable on phones | M |
| 2 | **G8** pending-payment state | Prevents double payments | M |
| 3 | **G3** phone "More" tab | Billing/Settings/Notifications unreachable on phones | S |
| 4 | Money truth: `brand-collaboration/C1,C2,C3`, `shared-notifications/C1`, `brand-billing/C1`, `brand-dashboard/C1,C2`, `brand-proposals/C2` | Wrong or missing figures erode trust in escrow | M |
| 5 | State truth: `creator-work-detail/C1`, `creator-discover/C1`, `creator-discover-detail/C1`, **G9**, **G10** | Users act on wrong states | M |
| 6 | `brand-brief-proposals/C1,C2` *(product decision)*, `brand-review/C1` | Hiring the wrong creator; reviewing without context | S |
| 7 | **G4, G5, G6, G7** (tokens + shared inputs) | Accessibility, one-file fixes | S |
| 8 | **G2** tablet breakpoint | iPads and small laptops | S |
| 9 | **G11** Arabic | Core market | L |
| 10 | Remaining Warnings, then Visual direction | Polish and brand | M–L |

---

## Visual direction (No-Slop review, not scored)

**Current system ("C3 Sage"):** sage green `#2f5d46` on a grey-green canvas, Inter for UI, JetBrains Mono uppercase micro-labels, dashed hairlines, white rounded cards, and a near-black "terminal grid" hero card.
**Rating:** *Competent but forgettable*, with one reflex the No-Slop rules flag: Inter as the main face, plus the "near-black + monospace labels" fintech look applied to a creator marketplace. Each part is tidy, but nothing on screen says *video*, *creators* or *Egypt*. It also clashes with Arabic: mono caps can't render Arabic well (G11), so half the product loses its type system in Arabic.

Three directions for the founder to pick from (**don't build before one is chosen**):

| | Direction | Type | Palette | Signature element | Vibe |
|---|---|---|---|---|---|
| **A** | *Sharpen the Sage* (lowest effort) | **IBM Plex Sans + IBM Plex Sans Arabic** (one family designed for both scripts), Plex Mono only for money | Keep sage `#2f5d46` for actions; ink `#17241c`; replace grey-green canvas with warm paper `#f7f6f2`; one warm alert amber | Real video thumbnails everywhere a deliverable or portfolio appears | Calm, bilingual, trustworthy |
| **B** | *Production call sheet* | Condensed display (Barlow Condensed / Archivo Narrow) for titles and numbers, Plex Sans body, Plex Sans Arabic | Off-white `#f6f3ec`, ink `#1b1b1b`, gaffer-tape yellow `#f2c230` for the one primary action | Briefs rendered like a film call sheet: timecodes, shot list, "take V1/V2" | Made for creators, feels like a set |
| **C** | *Nile & sun* | Bold grotesk display (e.g. Bricolage Grotesque) + Plex Sans/Plex Arabic | Nile blue `#0e4d64` base, sun orange `#f28c28` accent on white | Big bilingual numbers on money screens (escrow, earnings) | Confident, local, energetic |

**Recommendation:** A now (it also fixes G11's font problem and costs a token change plus a font swap), B for the marketing landing page where personality matters most. Whatever is chosen, three moves apply in all directions:
1. **Product-led screens:** show the video. Review, work detail, portfolio and proposal cards should lead with the thumbnail/player, not with stat tiles.
2. **One dominant answer per screen:** the brand dashboard leads with "what needs your action" (it is currently below a mostly empty chart); the creator home leads with the next task or the best matching brief.
3. **Fewer boxes:** drop the dashed borders around every stat group; use spacing and one surface step.

---

## Verify (not confirmed by this audit)

| Item | Becomes if confirmed |
|---|---|
| Real video playback on the review page (local test files had no real object, so the player stayed empty) | Critical if a failed load shows no error state |
| Tapping a proposal at 360px in the inbox opens the detail (only the list was visible) | Critical if the detail is unreachable on phones |
| The "1 Issue" Next.js dev overlay on the review page (a runtime warning in development) | Depends on the warning |
| Screen-reader output, real network latency on 3G, iOS Safari rendering | — |
| Brief checklist checkboxes on work detail are not saved | Warning |

## Re-running the audit

Tools are in [`tools/`](tools/) (`uicheck_auth.py` is adapted from the MIT-licensed skill; licence in `tools/LICENSE-uicheck.txt`).

1. Create or reset a Neon branch (never prod) and write its URL to `apps/api/.env.audit.local` as `DATABASE_URL='…'`.
2. Run the API in dev mode against it on port 4000 (`NODE_ENV=development PORT=4000 CORS_ORIGINS=http://localhost:3001`, empty `SMTP_USER`), seed with `npx ts-node src/database/seeder.ts`, then `node docs/ui-audit/tools/audit-seed.js` and `audit-seed-finish.js` (both refuse to run unless the URL is the audit branch; update the endpoint id inside them).
3. Run the web app with `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 next dev -p 3001`.
4. `python tools/audit_login.py brand creator` (dev mode accepts code `000000`), then `PYTHONUTF8=1 python tools/audit_run.py brand creator public` and `python tools/audit_extract.py <out> <screen>`. Update the IDs at the top of `audit_run.py` from the seeded data.
5. Compare the new screenshots with `shots/`.
