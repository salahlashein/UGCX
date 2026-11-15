# Web Ledger Mono: Visual Review of the Built Screens

# Document Control

- **Version**: 1.0.0
- **Date**: 2026-10-30
- **Scope**: Visual only. Alignment, sizing, color, and wrong or placeholder content. Feature behavior is out of scope.
- **Method**: Each screen opened at 1280x900 in the browser and compared with its picked layout in `layout-studio.html`.
- **Coverage**: 23 of 23 screens, plus `/dev/components`.
- **Build state**: W1 and W2 are in. Some W3 and W4 parts are in (revision limit, creator stats, billing totals, due chips).

---

# Executive Summary

The design system itself is correct. `/dev/components` renders every primitive the way the studio does. Almost every page defect comes from **five root causes in shared code**. Fix those five and most of the 60+ findings below disappear.

| Rank | Root cause | Screens hit | Fix size |
|---|---|---|---|
| R1 | `AppText` renders an inline `<span>`, and pages stack two of them in a plain `<div>`, so the overline and the title print on one line with no gap | 14 | S |
| R2 | `Button` lets its icon and label wrap, so narrow buttons stack the icon above the text | 12 | S |
| R3 | `colors.infoSurface` (`#e3ebfb`, a blue) is used as a block background in 14 places, which clashes with the sage palette | 11 | S |
| R4 | Table and row grids give text columns too little width, so titles and money values clip or wrap mid-value | 8 | M |
| R5 | Raw values reach the screen: enum tokens, ISO timestamps, tone words, and event keys | 9 | M |

One screen is **down**: Creator earnings throws and renders nothing.

---

# Blocking Defect

## B1. Creator earnings crashes (`/creator/earnings`)

```
Uncaught Error: toCents: "+ 1000.00" is not a valid numeric(10,2) amount
  at toCents (src/utils/money.ts:22)
  at runningBalance (src/utils/ledger.ts:18)
  at CreatorEarningsPage.useMemo[chronologicalBalances] (src/app/creator/earnings/page.tsx:104)
```

`CreatorsService.getLedger` returns `amount` as a **display string** with a sign and a space: `"+ 1000.00"`, `"− 5000.00"`. The page passes it straight to `toCents`, which only accepts `^-?\d+(\.\d{1,2})?$`.

**Fix**: in `runningBalance`, read the sign from `row.sign` and strip it before the conversion (`row.amount.replace(/[+−-]\s*/, '')`), or better, add a raw `amountCents` field to the ledger row in BG-26 and use it. Add a unit test with `"+ 1000.00"`, `"− 5,000.00"`, and `"1000.00"`.

---

# Root Causes

## R1. Overline and title collide

```tsx
// app/brand/dashboard/page.tsx:199
<div>
  <AppText variant="caption">Brand Workspace</AppText>
  <AppText variant="h2">{brandName}</AppText>
</div>
```

`AppText` defaults to `as="span"`. Two spans in a plain `div` flow inline, so the screen reads **"Brand WorkspaceGlow Lab"** with no space and no line break.

Seen on: login logo, brand dashboard, briefs list, all proposals, brief detail, proposals inbox, new brief, notifications, discover, apply, creator profile preview, proposal detail name, fund total row, work detail meta.

Four pages already do it right (fund, settings, brand profile, creator profile header). They wrap in a flex column.

**Fix**: add a shared `PageHeader` component (`overline`, `title`, `subtitle`, `badges`, `actions`) and use it on every page. It also removes the current inconsistency where each page builds its own header.

## R2. Button icon stacks above the label

```tsx
// components/ui/Button.tsx:104, 128
className="inline-flex items-center justify-center gap-2 ..."
...
<span>{title ?? children}</span>
```

The button has no `whitespace-nowrap` and no `shrink-0`. When a page passes the icon as a **child** instead of the `icon` prop, the icon and the label land inside one inline `<span>`, and they wrap as soon as a flex parent squeezes the button.

Worst instances: "← Work" (the arrow sits above the word), "Send" in chat (the icon overflows the button edge), "View →" on all 8 notification rows, "New brief", "Edit brief", "Chat", "Review deliverable", "Read full brief", "Search", "Submit deliverable" (label wraps to two lines on every work row).

**Fix**: add `whitespace-nowrap shrink-0` to the button and make the inner span `inline-flex items-center gap-2`. One change repairs every call site. The gallery already proves the `icon` prop path is correct.

## R3. A blue surface in a sage palette

`colors.infoSurface: '#e3ebfb'` is correct for the `info` status badge. It is used as a **panel background** in 14 places:

`brand/briefs/[id]`, `brand/briefs/[id]/proposals` (x2), `brand/deliverables/[id]/review`, `brand/proposals`, `creator/discover/[id]` (x2), `creator/earnings` (x3), `creator/home`, `creator/profile`, `creator/work`, `creator/work/[id]`.

Every one of them reads as a mistake next to the sage greens: the escrow card on the brief, the creator stat cells, the earnings balance block, the "available balance" panel, the starting-rate block.

**Fix**: use `colors.surfaceSoft` (`#f6f8f5`) or `colors.accentSoft` (`#e1ebe4`) for these panels. Keep `infoSurface` inside `StatusBadge` only.

## R4. Columns too narrow

- **Discover rows**: brief titles render as `Man...` and `Sum...`, brand as `Glow ...`. The title column collapses to about 35 px. The screen is unusable.
- **Creator home tasks**: six rows all read `Upload your video for S...`, meta `EGP 800.00 is held in escro...`.
- **Briefs list, notifications, work list**: the money cell breaks between the currency and the number, so one row shows `EGP` on line 1 and `1,650.00` on line 2 while the next row fits on one line.
- **Dashboard "Needs your action"**: the card is the same width as the shortcut tiles, so titles clip. The studio gives it 2fr against 1fr.

**Fix**: give the text column `min-width: 0` plus `flex: 1`, set the money cell `white-space: nowrap`, and widen the action card to 2fr.

## R5. Raw values on screen

| Value seen | Where | Should be |
|---|---|---|
| `2026-10-29T19:47:04.249Z` | Brief detail lifecycle, every step | `Oct 29` |
| `IN_PRODUCTION` | Briefs list status badge | `In production` |
| `talking_head`, `unboxing` | Brief detail, apply fact strip, fund receipt | `Talking head`, `Unboxing` |
| `AR`, `en` | Brief detail, apply, fund receipt | `Arabic`, `English` |
| `urgent`, `pend` | Dashboard action rows, creator home tasks | A real due label, or nothing |
| `[escrow_funded]` | Chats list preview | The translated system line |
| `Creator: Creator` | Deliverable review | The creator name |
| `Brand` | Brief detail meta | `Glow Lab` |
| `1 creators`, `1 proposals`, `3 brief(s)` | Brief detail, discover, dashboard | Correct plurals |
| `Brief title` | New brief preview | The typed title, or an em dash |

---

# Per Screen

Severity: **A** blocks the look, **B** clearly wrong, **C** polish.

## Brand

### 1. Dashboard (`dashC`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | Header collides: "Brand WorkspaceGlow Lab" (R1) |
| 2 | A | "New brief" shows "+" above the label (R2) |
| 3 | B | Pipeline is a single row of count chips. The studio shows 5 stage columns with the brief names inside |
| 4 | B | Action rows show the raw tone words `urgent` and `pend` (R5) |
| 5 | B | Action card and tile block are 1:1. The studio is 2:1, so titles clip (R4) |
| 6 | B | Action rows have no leading icon tile; the studio has one per row |
| 7 | C | Chart x-axis reads `05 06 07 08 09 10`, not month names. Only one bar has value |
| 8 | C | Keyboard hints N, P, R, W are bare letters, not `Kbd` key caps |
| 9 | C | Hero and chart are split into two cards. The studio puts the chart inside the hero |

### 2. Briefs list (`listA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | Header collides (R1) |
| 2 | A | Escrow cell wraps between currency and number (R4) |
| 3 | B | Status badge prints `IN_PRODUCTION` (R5) |
| 4 | B | Hired cell shows an avatar then a loose `1`, and a bare `0` when empty. Inconsistent |
| 5 | C | Empty "Ends" cell renders blank instead of an em dash |
| 6 | C | Row end uses `→`, the studio uses a chevron |

### 3. Brief detail (`briefB`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | Lifecycle steps print full ISO timestamps, which overlap each other (R5) |
| 2 | A | Header collides: "BRAND · BRIEF DOCUMENT" runs into the title (R1) |
| 3 | A | Escrow card uses the blue surface (R3) |
| 4 | B | The proposals and hired cell block has a third empty cell |
| 5 | B | "1 / 1" wraps onto two lines inside its cell |
| 6 | B | An empty white card renders below "View all proposals" |
| 7 | B | Meta reads "Brand" instead of the company name, and "14 days left" on a completed brief |
| 8 | B | `talking_head`, `AR`, `None`, `1 creators` (R5) |
| 9 | B | "Edit brief" icon stacks above the label (R2) |

### 4. Proposals inbox (`propA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | Stat cells use the blue surface (R3) |
| 2 | A | Both list rows carry the "TOP APPROVAL" tag, so it means nothing |
| 3 | B | Header collides twice: page title and the creator name + meta (R1) |
| 4 | B | The Arabic pitch renders left to right, so the full stop lands at the start. Needs `dir="auto"` |
| 5 | B | "Jobs done 0" with "Approval rate 100%". With no jobs the rate should be an em dash |
| 6 | B | The accept math is a run-on sentence that wraps mid-expression. The studio uses a 3-term equation row |
| 7 | C | "Portfolio 0 of 0" above "No portfolio items uploaded" |
| 8 | C | The escrow meter at the top right renders empty |

### 5. Fund escrow (`fundB`)
| # | Sev | Finding |
|---|---|---|
| 1 | B | Total row collides: "Total deposit requiredEGP 750.00" (R1), and "TOTAL" on the left repeats it |
| 2 | C | `unboxing · 30s · en` raw values (R5) |
| 3 | C | Separators are solid rules. The studio uses dashed tear lines |

### 6. Billing (`billA`)
| # | Sev | Finding |
|---|---|---|
| 1 | B | The same four totals print twice: once in the equation strip, once in a card row below |
| 2 | B | The equation strip drops the currency and the thousands separators (`25150.00`), while the cards show `EGP 25,150.00` |
| 3 | B | The "Balance" column is an em dash on every row, and the "Status" column is empty |
| 4 | B | The "Allocated" row has no amount |
| 5 | C | Three stacked blocks of the same information push the ledger below the fold |

### 7. Collaboration (`collabA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | The creator statistics card breaks: "Cairo" is clipped by the divider, "EGP 1,500.00" wraps, and a fourth cell is empty |
| 2 | B | The badge says "Revision 0 of 2" while the card says "Revisions used 1" |
| 3 | B | "Chat" and "Review deliverable" stack their icons (R2) |
| 4 | C | Only some timeline steps carry a date |

### 8. Chats (`chatB`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | The page has no header and no top padding. The search box is clipped by the viewport edge |
| 2 | A | "Send" stacks the icon above the label and the icon overflows the button (R2) |
| 3 | B | The list preview prints the raw key `[escrow_funded]` (R5) |
| 4 | B | Thread messages sit at the top with about 300 px of dead space above the composer. They should sit above the composer |
| 5 | B | The Active and Closed filter chips are missing |

### 9. Deliverable review (`revA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | "Release upon approval EGP 0.00". The release amount is zero |
| 2 | A | "Creator: Creator" placeholder (R5) |
| 3 | B | The player is a 16:9 black box. UGC video is vertical, and the studio uses a 9:16 player |
| 4 | B | The brief checklist is missing |
| 5 | B | The release block uses the blue surface (R3) |
| 6 | C | "Revision 0 of 2" appears as both text and a badge |

### 10. New brief (`newB`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | Header collides with a long subtitle that runs to the right edge (R1) |
| 2 | B | "Tutorial / How-To" wraps, so the first tile row has uneven heights |
| 3 | B | Four format tiles use an empty circle as the icon, which reads as an unselected radio |
| 4 | B | The summary budget range wraps, leaving "3,500.00" alone on line 2 |
| 5 | C | The preview shows the literal string "Brief title" |
| 6 | C | Niche options are full-width boxes, not chips. The brand profile uses chips for the same field |

### 11. All proposals (`hubC`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | The KPI block on every card uses the blue surface (R3) |
| 2 | B | Header collides (R1) |
| 3 | B | Card heights differ in a row when a title wraps, so the buttons do not line up |
| 4 | C | "BY BRIEF 23" overline with a loose number |

### 12. Brand profile (`bpA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | The logo uploader is the **video** dropzone: a camera icon and "MP4, MOV, or WEBM up to 250 MB". It should take an image up to 5 MB |
| 2 | B | "UNVERIFIED" prints twice, in the page header and in the preview card |
| 3 | B | "Pays in 0d" is not credible. Show an em dash with no data |
| 4 | C | Country is a raw "EG" text input |
| 5 | C | The selected category chip is solid dark here and light mint on the new brief page |

### 13. Settings (`setC`)
| # | Sev | Finding |
|---|---|---|
| 1 | C | A raw pencil glyph sits after the name, off the baseline. Use an icon button |
| 2 | C | The "Layout direction" row has a filled grey background that reads as an input |

### 14. Notifications (`notC`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | Every "View" button stacks its arrow below the word, which doubles every row height (R2) |
| 2 | A | The amount column breaks between `EGP` and the number on some rows but not others (R4) |
| 3 | B | Header collides (R1) |
| 4 | B | Event text prints `EGP 1500.00` with no separator while the amount column shows `EGP 1,650.00`, and the two values differ on the same row |
| 5 | B | Type badges are dashed outline tags, not the filled tone badges the rest of the app uses. "PROPOSALS" in coral reads as an error |
| 6 | C | "Escrow of EGP 1650.00 funded for collaboration" ends without naming it |

## Creator

### 15. Home (`homeA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | Six task rows all read "Upload your video for S..." with clipped meta. The brief name is never visible (R4) |
| 2 | A | "My proposals" cells overlap: "SHORTLISTEDWON", plus a fourth empty cell |
| 3 | A | The earnings balance block uses the blue surface (R3) |
| 4 | B | Raw tone words `urgent` and `pend` next to every task (R5) |
| 5 | B | Due chips read "DUE: OVERDUE (OCT 4)" and "DUE: IN 5 DAYS". The studio uses "Due tomorrow 18:00" |
| 6 | B | A task says "Waiting for Glow Lab to ship" and its button says "Confirm product received" |
| 7 | C | "In escrow" sits outside the balance block and does not line up with it |

### 16. Earnings (`earnA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | **The page crashes.** See B1 |

### 17. Discover (`discA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | Every brief title is clipped to "Man..." or "Sum...". The screen cannot be used (R4) |
| 2 | A | "FEW PROPOSALS" appears on every row, including rows with 0 proposals |
| 3 | B | Header collides (R1) |
| 4 | B | "Search" stacks its icon, and the box and the button have different heights (R2) |
| 5 | C | "1 proposals" plural (R5) |
| 6 | C | The result count line from the studio is missing |

### 18. Brief and apply (`applyB`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | The preview shows an invented pitch ("I will film the deliverable in natural light...") while the real pitch box is empty at "0 / 600" |
| 2 | B | The fact strip has two empty bordered cells in the second row |
| 3 | B | "No product shipping" wraps and makes its cell taller than the rest of the row |
| 4 | B | The preview name collides with the city (R1), and the pitch box is blue (R3) |
| 5 | C | `unboxing`, `AR`, and "Closes in -" (R5) |
| 6 | C | "Read full brief" stacks its icon (R2) |

### 19. Work list (`wlA`)
| # | Sev | Finding |
|---|---|---|
| 1 | B | "Submit deliverable" wraps to two lines in every row and inflates the row height (R2) |
| 2 | B | The escrow chip uses the blue surface (R3) |
| 3 | B | The last row splits `EGP` from `1,000.00` (R4) |
| 4 | C | Every row shows the same red "IN 5 DAYS" chip. Red for five days away is alarmist |

### 20. Work detail (`workA`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | The back button wraps: "←" above "Work" (R2) |
| 2 | A | The stepper marks "V1 sent" as current, but no version exists and the job is still "to shoot" |
| 3 | B | The whole left column below the stepper is empty. The studio puts the feedback card and the checklist there |
| 4 | B | "Chat with brand" sits on its own line under the header instead of in the header actions |
| 5 | B | The "Revision 0 of 2" badge is orphaned on a line between the title and the meta |
| 6 | C | The stepper has 4 steps. The plan calls for 6 |

### 21. Profile (`profA`)
| # | Sev | Finding |
|---|---|---|
| 1 | B | The starting-rate block uses the blue surface (R3) |
| 2 | B | The preview name collides with the city (R1) |
| 3 | C | "PORTFOLIO PREVIEWS" renders as a label with nothing under it |
| 4 | C | Base price shows the raw "3000.00" |

### 22. My proposals (`mpB`)
| # | Sev | Finding |
|---|---|---|
| 1 | B | "Waiting for review 8" sits above "No waiting proposals". The count and the list disagree |
| 2 | B | The funnel has no bars. It is four numbers with percentages |
| 3 | C | "Closes in 14d" prints on proposals that are already accepted |

### 23. Login (`logB`)
| # | Sev | Finding |
|---|---|---|
| 1 | A | The logo lockup breaks: "UGCX" and the tagline have no gap, and the mark reads "UG" instead of "U" |
| 2 | B | The tagline should be a small mono overline under the name, not inline text |
| 3 | C | The "Create account" link from the studio is missing |
| 4 | C | The role segment is small and left-aligned. The studio uses full width |

---

# Suggested Order

1. **B1** so the earnings screen renders at all.
2. **R2** (Button), one file, repairs 12 screens.
3. **R1** (`PageHeader`), repairs 14 screens.
4. **R3** (swap the blue panels), 14 call sites.
5. **R5** (formatters: date, enum label, language, plural), one `utils/labels.ts` plus the call sites.
6. **R4** (column widths and nowrap), per table.
7. The per-screen B items, then the C items.

Items 1 to 5 are about one day of work and remove most of what reads as unfinished.

# Not Covered

- Feature behavior. Nothing was clicked through to completion.
- Arabic and RTL. Every screen was read in English only. The Arabic pass should follow the fixes, because R1 and R4 will change the layout.
- Phone width. Every screen was read at 1280 px.
- A `viewer` role pass. Every screen was read as `owner`.

---

# Fix Pass, 2026-10-30

The blocking defect and the five root causes are fixed, with the per-screen
items that followed from them. Verified with `lint`, `typecheck`, `test` (66
pass) and `build`, then checked again in the browser.

## Shared code

| Item | File | Change |
|---|---|---|
| B1 | `utils/money.ts`, `utils/ledger.ts`, `utils/format.ts`, `app/creator/earnings/page.tsx` | New `displayToCents` reads the API display string ("+ 1,000.00"). `formatAmount` falls back to it instead of throwing, so a display value never takes a page down. |
| R2 | `components/ui/Button.tsx` | `whitespace-nowrap`, `shrink-0`, and an inline-flex label wrapper. An icon never stacks above its label. |
| R1 | `components/ui/PageHeader.tsx` (NEW), 18 call sites, login | Stacked text sits in a flex column. The overline no longer collides with the title. |
| R3 | 14 call sites | `colors.infoSurface` (blue) is out of every panel. It stays only in the `info` status badge. |
| R4 | `components/ui/ListRow.tsx`, `KpiCells.tsx`, `LedgerTable.tsx`, `utils/format.ts` | Rows give the text `flex-1`, titles wrap to two lines, KPI columns follow the item count, and `formatMoney` uses a non-breaking space so no cell splits "EGP" from its number. |
| R5 | `utils/labels.ts` (NEW), `StatusBadge`, `HStepper`, `VerticalTimeline`, 6 pages | Enum values, ISO dates, language codes, tone words and plurals all pass through a formatter. |

## Per screen

| Screen | Fixed |
|---|---|
| Login | Logo lockup stacks, mark reads "U", tagline is an overline |
| Dashboard | Header, buttons, action card width (2fr), month names on the chart, real "Urgent" tag, plurals |
| Briefs list | Header, status label, escrow cell on one line |
| Brief detail | Dates read "Oct 29", company name, "Talking head", "Arabic", "1 creator", sage escrow card, no empty cells, no empty actions card, no countdown on a closed brief |
| Proposals inbox | Header, sage stat cells, approval shows an em dash with no jobs, "Top approval" is a real comparison, Arabic pitch reads right to left |
| Billing | One set of totals, formatted equation line, no empty Status or Balance columns |
| Chats | System keys translated, panes bounded to the viewport, messages sit above the composer |
| Notifications | Inline "View", amounts formatted inside the sentence |
| Creator home | Full task titles, no raw tone words, KPI cells no longer overlap, sage balance block |
| Earnings | Page renders, holds carry no plus sign, references stay on one line |
| Discover | Titles readable, facts in the subtitle, compact budget, competition tag only when it means something |
| Brand profile | Logo dropzone accepts images and names the real limit |

## Second pass, 2026-11-01

| Item | File | Change |
|---|---|---|
| Pipeline | `components/ui/Pipeline.tsx` | Five stage columns, each naming its briefs, with a count and an arrow between stages. The dashboard already passed the names. |
| Review player | `components/ui/VideoPlayer.tsx` | 9:16 by default, capped at 340 px wide. An `orientation` prop keeps 16:9 available. |
| Direct review link | `apps/api/.../storage.controller.ts`, `packages/shared-types/src/deliverables.ts`, review page | The play URL response now carries `collaborationId` and `version`, so the screen works with no query parameter. |
| Work detail | `app/creator/work/[id]/page.tsx` | A step still to do reads "Submit V1", not "V1 sent". A "What to make" card fills the left column in every state. |
| Accept impact | `app/brand/briefs/[id]/proposals/page.tsx` | One `Equation` row: escrow now, this proposal, left after accept, with the fee split on a line below. |

Verified with `lint` (0 errors), `typecheck` (web and api), `test` (90 pass)
and `build`.

### Browser pass, 2026-11-01

Read from the live DOM, because the preview pane would not draw for a
screenshot. Each line below is the text the page actually rendered.

| Item | Evidence |
|---|---|
| Pipeline | Five columns with names: `DRAFT 5` then four brief titles and `+1`, `LIVE 4`, `IN PRODUCTION 10` with `+6`, `IN REVIEW 0`, `COMPLETED 4`. Month labels read `Jun Jul Aug Sep Oct Nov`. |
| Accept equation | `ESCROW NOW EGP 1,200.00 − THIS PROPOSAL EGP 1,210.00 = LEFT AFTER ACCEPT EGP -10.00`, then `Creator price EGP 1,100.00 plus the platform fee EGP 110.00`. |
| Direct review link | With no query parameter the page shows `E2E Web Flow Campaign 9001`, `Creator: Nour Hassan` and `RELEASE UPON APPROVAL EGP 1,500.00`. It used to show a placeholder name and `EGP 0.00`. |
| Work detail | Step 2 reads `Submit V1`, not `V1 sent`. The left column holds `WHAT TO MAKE` with `Unboxing`, `30s`, `Arabic`. The upload hint reads the real limit, `MP4, MOV, WEBM up to 500 MB`. |
| Player | The frame computes to `aspect-ratio: 9 / 16`, `max-width: 340px`, measured 340 by 604. |

Two copy fixes followed from the pass: a creator with no finished job no longer
reads "— approval" in the list, and the review no longer prints the revision
count as both a sentence and a badge.

---

# Arabic and RTL Pass, 2026-11-01

Run against the live app with `dir="rtl"` and `lang="ar"`. A script read the
DOM for four faults: Arabic text that still carries uppercase or tracking,
money that is not direction isolated, a page that scrolls sideways, and an
element wider than its own box.

## What the pass found and fixed

| Fault | Cause | Fix |
|---|---|---|
| Arabic printed uppercase and letter spaced on every badge, overline and table head, which breaks letter joining | Components set `text-transform` and `letter-spacing` inline, and an inline style beats a plain stylesheet rule | `!important` on the `:lang(ar)` override, a second rule for the utility classes `uppercase` and `tracking-*`, and `AppText` drops positive tracking in a right to left page |
| Money reordered inside Arabic lines | No direction isolation on number text | `AppText` isolates the number roles (`metric`, `metricMono`, `metricMd`, `metricSm`, `numeric`). A `.ltr-num` class covers the rest. |
| "used / funded" on the briefs list read backwards in Arabic, which changes what the number means | The two amounts were separate spans in a right to left line | The whole ratio is one isolated box |
| English API text inside Arabic rows ordered wrongly | Fixed direction on the row | `ListRow` title and subtitle use `dir="auto"` |
| The creator work page scrolled sideways | The table is a flex child, so `min-width: auto` let it widen the page instead of scrolling inside its own box | `min-w-0 max-w-full` on the `DataTable` scroll container |
| The dashboard chart tooltip and the released pill reordered | No isolation | Isolated both |
| Pipeline chips pushed their column wider | No `max-width` on a nowrap chip | `minWidth: 0` and `maxWidth: 100%` |

## Screens read clean after the fixes

`creator/earnings`, `creator/home`, `creator/work`, `creator/discover`,
`brand/dashboard`, `brand/briefs`, `brand/billing`.

The dashboard pipeline still reports a 9 px overflow. That is the stage arrow,
which sits on the divider by design.

## Still open

- Phone width and the `viewer` role still need their own pass.
- The Arabic pass covered 7 screens. The other 16 are not read yet.
- Screenshot pairs are not taken. The preview pane would not draw.
- Some task and brief text comes from the API in English and shows that way on
  an Arabic page. `dir="auto"` orders it correctly, but translating it is a
  separate job.
