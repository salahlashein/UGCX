# Later: Deferred and Decision Items

# Document Control

- **Version**: 1.0.0
- **Date Created**: 2026-10-30
- **Last Updated**: 2026-10-30
- **Status**: DRAFT
- **Parent**: `operations/specs/web_ledger_mono/01_overview.md`
- **Purpose**: Record every backend item that no phase builds. Each item names the hidden UI, the reason, and the question that unblocks it.

---

# Deferred Items

| ID | Item | Size | Hidden UI | Screens | Unblocked by |
|---|---|---|---|---|---|
| BG-17 | Platform or format field (Reel, TikTok, Story) | M | Platform tiles on the brief form and fund receipt | 7, 9, 14 | Decision Q5 says keep `videoType`. Build only if brands ask for a platform. |
| BG-18 | Niche values Fitness, Tech, Kids, Lifestyle | M | Studio niche labels | 7, 13, 16 | Decision Q4 says keep the 6 values. Needs an enum migration and Arabic copy. |
| BG-19 | Budget benchmark per format, length, and language | L | "Typical for 30s Arabic reels" band | 7 | Needs enough paid brief data. A product decision on the source of the band. |
| BG-20 | Match score between creator niches and a brief | M | Match percent tags and "sort by match" | 4, 13 | A scoring rule. A client side niche overlap may stand in. |
| BG-27 | Clearance window between release and withdrawable | L | The studio "Pending, clears Nov 01" cell | 3 | Decision Q15 says no window in v1. |
| BG-32 | Auto approve after N days with a scheduled release | L | "Auto-approves in N days" chip and line | 6, 15 | A product rule and a scheduled job that moves money. Needs a ledger review. |
| BG-35 | Structured revision reasons | S | Reason chips as a field | 6 | Optional. Chips travel as a text prefix in `feedback` today. |
| BG-36 | Media metadata: deliverable file size, portfolio clip duration | S | File size in the timeline, clip length on portfolio tiles | 2, 11, 16 | Optional. Needs a read of the file on upload. |
| BG-37 | Per talking point checklist state on a deliverable | M | "Met" and "Missing" marks and counts | 6, 15 | A decision on who ticks the points, the brand or the creator. |
| BG-38 | `brief_matched` event for creators when a matching brief goes live | M | "New brief for you" notification rows | 17, 4 | Needs BG-20 or a niche rule. Changes the notification catalog. |
| BG-40 | Notification preferences per category and channel | M | Email, in-app, and sound toggles | 22 | A product decision on defaults. `NotificationsService` must read the preferences. |
| BG-41 | Saved payment methods (Paymob card tokens) | L | "Corporate card •• 4471" labels and the Payment methods button | 9, 10, 22 | A provider contract for card tokens and a PCI review. |
| BG-42 | Real SMS OTP provider | n/a | None | 23 | CANCELLED by decision Q14. Login codes go by email. |

# Follow-ups from other phases

| Source | Item | Note |
|---|---|---|
| W0 TASK-W0-03 | Remove `tls: { rejectUnauthorized: false }` from `MailerService` | Needs the user to confirm the SMTP provider supports valid certificates. |
| W0 TASK-W0-09 | Delete the stored media file when a portfolio item is deleted | The route removes the row only. |
| W0 DEC-W001 | SMS provider for production phone login | Mobile phone login is closed in production until this ships. |
| W0 TASK-W0-08 | Link a payout request to a payout by id | v1 pairs the oldest open request. |
| W1 | Add Playwright for the screenshot pair rule | See the open items in `01_overview.md`. |
| W2 TASK-W2-18 | Replace the per-brief proposal calls | Done by W4 TASK-W4-04 and TASK-W4-11. |
| W3 DEC-W301 | Q11 sign change on the billing API | Mobile keeps the old signs. Plan a joint change with a mobile release. |

# Decisions that stay open

1. Q14 follow up: real SMS provider (only if phone login must return).
2. Whether the web gets a platform field (BG-17).
3. Whether to add the four studio niches (BG-18).
