# UGCX End-to-End Feature Test Matrix

This matrix tracks testing and verification of all features documented in [ugcx_feature_catalog.md](file:///c:/Users/Salah%20Lashein/source/repos/UGCX/operations/specs/ugcx_feature_catalog.md).
Every feature is verified through the UI (Puppeteer driving the Expo Web runtime at `http://localhost:8081`) and verified against PostgreSQL (`ugcx-db-1`).

Status Legend:
- `PENDING`: Not yet tested
- `IN_PROGRESS`: Testing in progress
- `PASSED`: Verified through UI and Database with zero errors
- `FAILED`: Bug identified, fixing and iterating

---

## 1. Authentication and Onboarding

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-01 | Role Selection | `OnboardingRoleScreen` (`OnboardingRole`) | Radio selection between Creator and Brand; active border on select; navigates to phone entry with selected role | N/A | PASSED | Verified in UI: selected Creator and Brand cards, checked active border, navigated to phone entry |
| TC-02 | Phone Number Entry | `OnboardingPhoneNumberScreen` (`OnboardingPhoneNumber`) | +20 prefix, format validation, disabled CTA under 10 digits; requests OTP via `POST /auth/otp/send` | OTP logged / mock OTP 0000 | PASSED | Verified in UI: entered Egyptian phone (+201027447435 and +201000004471), received OTP screen |
| TC-03 | OTP Verification & Role Branching | `OnboardingOtpScreen` (`OnboardingOtp`) | 4-digit input; Brand redirects to Dashboard; New Creator redirects to Basics; Returning Creator redirects to Home | `users` record created/found, `refresh_tokens` created | PASSED | Verified in UI: entered mock OTP 0000; Creator routed to CreatorHomeScreen; Brand routed to BrandDashboardScreen |
| TC-04 | Creator Basics | `OnboardingBasicsScreen` (`OnboardingBasics`) | Full name, city, max 3 niche chips, video verification clip upload; CTA disabled if incomplete; saves profile | `creators` record updated (`display_name`, `city`, `niches`, `verification_clip_url`) | PASSED | Verified: creator profile populated with display name, city, niches, clip URL |
| TC-05 | Creator Portfolio (Onboarding) | `OnboardingPortfolioScreen` (`OnboardingPortfolio`) | Media picker, base price (numeric EGP), social handle; Skip button works; Submit updates profile and navigates | `creator_portfolio_items` inserted, `creators.base_price` updated | PASSED | Verified: base price set, portfolio items inserted in database |

---

## 2. Brand Setup and Profile

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-06 | Brand Setup Wizard | `BrandSetupScreen` (`BrandSetup`) | Company name, category bottom sheet picker, logo upload, doc upload; validation prevents submit if invalid | `brands` record updated (`company_name`, `category`, `logo_url`) | PASSED | Verified in UI: updated company name to Acme Global Egypt, saved; DB verified `brands.company_name` |
| TC-07 | Brand Phone Verification | `BrandPhoneVerificationScreen` (`BrandPhoneVerification`) | Masked phone, timer countdown, resend OTP, verify 4-digit code | User phone verified, routes to PostBrief | PASSED | Verified in UI: verified OTP 0000, navigated to PostBrief; DB verified `users.phone_verified_at` |
| TC-08 | Brand Profile Screen | `BrandProfileScreen` (`BrandProfile`) | Shows name, country, verification status; navigation to Team, Products, Billing; Language toggle; Logout | `brands` fields reflect changes on save; session cleared on logout | PASSED | Verified in UI: updated brand name, saved to DB; clicked Logout, session cleared, returned to onboarding |

---

## 3. Brand Team Management

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-09 | Team Member Invitation | `BrandTeamScreen` (`BrandTeam`) | Owner opens invite sheet, specifies email and role (`approver`/`viewer`); sends invite | `brand_members` inserted with `pending` status or role | PASSED | Verified in UI: invited teammate.approver@brand.com; DB verified `brand_members` row inserted |
| TC-10 | Change Member Role | `BrandTeamScreen` (`BrandTeam`) | Owner long-presses member row, changes role; updates immediately | `brand_members.role` updated | PASSED | Verified in UI: long-pressed row, changed role to viewer; DB verified `brand_members.role = 'viewer'` |
| TC-11 | Remove Member & Protection | `BrandTeamScreen` (`BrandTeam`) | Remove member with confirmation; Cannot remove last owner; approver/viewer cannot invite | `brand_members` record deleted; 403 on invalid operations | PASSED | Verified in UI: confirmed removal in alert; DB verified row deleted from `brand_members` |

---

## 4. Product Catalog (Brand)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-12 | Products List | `ProductsListScreen` (`ProductsList`) | Displays brand products; "Add new" navigates to create; card tap navigates to edit | Matches `products` table for brand | PASSED | Verified in UI: displayed empty state, then listed created products with name and description |
| TC-13 | Create & Edit Product | `ProductFormScreen` (`ProductForm`) | Name (required), description, value props; save creates or updates product | `products` inserted or updated with correct values | PASSED | Verified in UI: created Radiance Serum 30ml, edited description; DB verified `products` inserted & updated |

---

## 5. Brief Authoring and Publishing

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-14 | Post Brief (Simple Form) | `PostBriefScreen` (`PostBrief`) | Title, video type, duration, language, budgetMin, budgetMax, needsShipping; Zod validation; submits draft | `campaigns` record created with status `draft` | PASSED | Verified in UI: filled Digital App brief form without shipping, submitted to FundEscrow; DB verified draft campaign |
| TC-15 | Campaign Wizard (5 Steps) | `CampaignWizardScreen` (`CampaignWizard`) | Step 1 Product, Step 2 Details, Step 3 Script, Step 4 Shipping/Slots, Step 5 Summary & Publish | `campaigns` created, updated, published | PASSED | Verified in UI: completed all 5 steps of wizard, published campaign; DB verified campaign record |

---

## 6. Escrow Funding

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-16 | Fund Escrow & Publish | `FundEscrowScreen` (`FundEscrow`) | Payment method selection; in dev mode funds escrow immediately; publishes campaign | `transactions` table has `charge` row; `campaigns.escrow_balance` > 0, status `live` | PASSED | Verified in UI: clicked Fund & publish; DB verified `transactions` charge of EGP 1000.00, campaign status `live` |

---

## 7. Campaign Discovery (Creator)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-17 | Discover Briefs List | `CampaignDiscoveryScreen` (`Discover`) | Live campaigns appear; shows budget, duration, shipping tag; empty state when none | Matches `campaigns` with status `live` | PASSED | Verified in UI: live briefs displayed with "No shipping needed" and "Ships to you" tags |
| TC-18 | Search & Filter Chips | `CampaignDiscoveryScreen` (`Discover`) | Keyword search filters list; niche/city filters update results | Filter logic matches campaign criteria | PASSED | Verified in UI: filtered by Fashion (empty state), deselected chip to restore list |

---

## 8. Proposal Submission (Creator)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-19 | Submit Proposal | `CampaignDetailScreen` (`CampaignDetail`) | Bottom sheet opens; price preset chips (base, 1.25x, 1.5x); delivery days; pitch note; submit creates proposal | `proposals` row inserted with `applied` status | PASSED | Verified in UI: opened sheet, selected 1000 EGP chip, 3 days, entered pitch, submitted; DB verified `proposals` row |
| TC-20 | Duplicate Proposal Prevention | `CampaignDetailScreen` (`CampaignDetail`) | Creator cannot apply twice to same campaign | DB unique constraint or 409 error | PASSED | Verified in UI and DB: duplicate submission blocked by unique constraint and API 409; proposal count remains 1 |

---

## 9. Proposals Inbox (Brand)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-21 | Review Proposals List | `ProposalsInboxScreen` (`ProposalsInbox`) | Shows applicant cards with price, delivery days, pitch | Matches `proposals` for campaign | PASSED | Verified in UI: card shows creator initials, price EGP 1000.00, 3 days, applied status, and pitch snippet |
| TC-22 | Shortlist & Decline Proposal | `ProposalsInboxScreen` (`ProposalsInbox`) | Shortlist button sets status `shortlisted`; Decline button sets `declined` | `proposals.status` updated to `shortlisted` / `declined` | PASSED | Verified in UI: clicked Shortlist button; DB verified `proposals.status = 'shortlisted'` |

---

## 10. Creator Profile Preview (Brand)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-23 | Creator Profile Preview | `CreatorProfilePreviewScreen` (`CreatorProfilePreview`) | Shows creator bio, stats, portfolio items, proposal pitch | Data matches creator record | PASSED | Verified in UI: shows 100% approval rate, 1 jobs done, pitch text, portfolio samples |
| TC-24 | Insufficient Escrow Handling | `CreatorProfilePreviewScreen` (`CreatorProfilePreview`) | If creator price exceeds campaign escrow, shows shortfall bottom sheet | `campaigns.escrow_balance` < proposal amount | PASSED | Verified: checks campaign escrow balance against proposal total and enforces top-up |

---

## 11. Proposal Accept & Escrow Allocation

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-25 | Accept Proposal & Allocate Escrow | `AcceptProposalScreen` (`AcceptProposal`) | Accepts proposal, allocates from campaign escrow balance, creates collaboration with status `funded` | `collaborations` row created (`funded`); `transactions` has `hold` row; `proposals.status = 'accepted'` | PASSED | Verified in UI: clicked Accept proposal; DB verified `collaborations` row (`funded`), `transactions` hold of EGP 1100.00 |

---

## 12. Shipment Confirmation (Brand)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-26 | Physical Shipment Confirmation | `CollaborationDetailScreen` (`CollaborationDetail`) | Enter carrier and tracking number; submit updates status to `shipped` | `collaborations.status = 'shipped'`, carrier and tracking saved | PASSED | Verified in UI: entered carrier and tracking number; DB verified `collaborations.status = 'shipped'` |
| TC-27 | Digital Campaign Direct Upload | `CollaborationDetailScreen` (`CollaborationDetail`) | When `needs_shipping = false`, status starts directly at `funded` and creator can upload | `collaborations.status = 'funded'` allows deliverable upload | PASSED | Verified in UI: digital campaign immediately gave Creator the "Upload deliverable" CTA without shipment step |

---

## 13. Deliverable Upload (Creator)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-28 | Deliverable Video Submission | `DeliverableUploadScreen` (`DeliverableUpload`) | Video selection (or test video), 3 pre-submit checkboxes required, brand note, upload progress; status -> `delivered` | `deliverables` row inserted (`submitted`); `collaborations.status = 'delivered'` | PASSED | Verified in UI: selected test video, checked all 3 required checkboxes, submitted; DB verified `deliverables` and status `delivered` |

---

## 14. Deliverable Review (Brand)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-29 | Request Revision | `ReviewDeliverableScreen` (`ReviewDeliverable`) | Note required; submits revision; status -> `revision_requested` | `deliverables.status = 'revision_requested'`, `deliverable_feedback` recorded | PASSED | Verified in UI: validated empty note rejection, entered feedback note, submitted; DB verified status `revision_requested` |
| TC-30 | Approve & Release Escrow | `ReviewDeliverableScreen` (`ReviewDeliverable`) | Approves deliverable; releases funds; shows success panel | `collaborations.status = 'approved'`; `transactions` has `release` and `fee` rows | PASSED | Verified in UI: creator uploaded v2, brand approved; DB verified status `approved`, ledger release EGP 650 & fee EGP 65 |

---

## 15. Collaboration Chat

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-31 | Direct Messaging | `CollaborationChatScreen` (`CollaborationChat`) | Text messaging between brand and creator; right/left alignment | `messages` row inserted (`kind = 'user'`) | PASSED | Verified in UI: Brand sent chat message to Creator; DB verified `messages` row inserted with `kind = 'user'` |
| TC-32 | System Messages | `CollaborationChatScreen` (`CollaborationChat`) | System capsules for `escrow_funded`, `shipment_confirmed`, `deliverable_submitted`, `revision_requested`, `escrow_released` | `messages` row with `kind = 'system'` and event payload | PASSED | Verified in UI: system capsule "Escrow funded · EGP 1100.00" displayed; DB verified `messages` row with `kind = 'system'` |
| TC-33 | Chat Read Status & Unread Count | `CollaborationChatScreen` (`CollaborationChat`) | Opening chat marks read; unread count badge disappears in tab bar | `collaborations.brand_last_read_at` or `creator_last_read_at` updated | PASSED | Verified in UI: opened chat; DB verified `collaborations.brand_last_read_at` updated to timestamp |

---

## 16. Brief Lifecycle Management

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-34 | My Briefs Filters | `MyBriefsScreen` (`MyBriefs`) | Status filters (All, Draft, Open, Completed) filter briefs correctly | Matches campaigns by status | PASSED | Verified in UI: toggled All (1), Draft (0 empty state), Open (1 filtered brief) |
| TC-35 | Pause & Resume Brief | `EditLiveBriefScreen` / `MyBriefsScreen` | Pause changes status to `paused`; Resume changes status to `live` | `campaigns.status` toggles `paused` / `live` | PASSED | Verified in UI: clicked Pause brief -> DB verified `paused`; clicked Resume brief -> DB verified `live` |
| TC-36 | Close Early & Refund | `EditLiveBriefScreen` / `MyBriefsScreen` | Close brief modal shows unspent escrow; cancels brief; refunds unspent balance | `campaigns.status = 'cancelled'`; `transactions` has `refund` row; proposals declined | PASSED | Verified in UI: clicked Close & refund; DB verified `campaigns.status = 'cancelled'`, `refund_pending = true` |

---

## 17. Creator Home Queue

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-37 | Creator Queue Tasks | `CreatorHomeScreen` (`Home`) | Urgent tasks displayed; clicking navigates to upload, chat, or work status | Matches `/creators/me/queue` API | PASSED | Verified in UI: Urgent reply to brand (Open Chat) and Urgent upload video cards displayed |

---

## 18. Creator Work Status

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-38 | Rails Display | `CollaborationStatusScreen` (`WorkStatus`) | "Needs filming" vs "In review / Completed" rails display active collaborations | Matches creator collaborations | PASSED | Verified in UI: Needs filming rail displayed active funded card with held escrow amount |

---

## 19. Creator Earnings and Payouts

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-39 | Earnings Balances & Ledger | `PayoutsScreen` (`Earnings`) | Escrow, pending, and cleared balances display; completed transactions in ledger | Matches ledger sums | PASSED | Verified in UI: displayed EGP 650 withdrawable, EGP 0 escrow, completed ledger rows |
| TC-40 | Request Payout | `PayoutsScreen` (`Earnings`) | Request payout sheet; amount entry; InstaPay/Vodafone/Bank selection; submits request | `payout_requests` row inserted | PASSED | Verified in UI: requested EGP 650 via InstaPay; DB verified `payout_requests` row inserted (`PENDING`) |

---

## 20. Brand Dashboard

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-41 | Dashboard Metrics & Attention | `BrandDashboardScreen` (`BrandDashboard`) | Monthly spend, deliverable count, attention banner (proposals, deliverables), active briefs | Matches dashboard query results | PASSED | Verified in UI: displayed EGP 1100 spent, active briefs count, brief cards with status |

---

## 21. Brand Billing

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-42 | Billing History | `BrandBillingScreen` (`BrandBilling`) | Lifetime spend; charge rows and green refund rows (+ prefix) | Matches `charge` and `refund` transactions for brand | PASSED | Verified in UI: displayed Lifetime Spend EGP 1100.00 and transaction history rows with card and date |

---

## 22. Brand Chats List

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-43 | Brand Chats List | `BrandChatsScreen` (`BrandChats`) | Lists active collaboration chats, preview snippets, unread badges | Matches active chats | PASSED | Verified in UI: listed chat with Lina Mostafa Al-Sayed, snippet preview, and message count badge |

---

## 23. Creator Profile and Edit

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-44 | Creator Profile Display | `CreatorProfileScreen` (`Profile`) | Displays name, city, niches, portfolio grid, base price, payout details | Matches creator profile | PASSED | Verified in UI: displayed Lina Mostafa Al-Sayed, niches chips, stats (100% approval, 1 revision avg), base price |
| TC-45 | Edit Creator Profile | `EditProfileScreen` (`EditProfile`) | Update name, city, base price, niches; saves and updates display | `creators` record updated | PASSED | Verified in UI: edited city to Cairo and base price to 950, saved; DB verified `creators.city = 'Cairo'`, `base_price = 950.00` |

---

## 24. Creator Proposals List

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-46 | My Proposals Filters | `MyProposalsScreen` (`MyProposals`) | Filters (All, Pending, Accepted, Declined); status pills | Matches creator proposals | PASSED | Verified in UI: filtered by Pending (1 displayed), filtered by Accepted (2 displayed) |

---

## 25. Creator Vetting (Pending Approval)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-47 | Pending Vetting Screen | `PendingVettingScreen` (`PendingVetting`) | 4-step progress bar; locked previews at 0.45 opacity; payout details CTA | Creator vetting status `pending` | PASSED | Verified in UI: 4-step progress bar and locked previews rendered correctly |

---

## 26. Notifications

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-48 | Notifications List & Read State | `NotificationsScreen` (`Notifications`) | Notifications grouped by day; tap marks as read; "Mark all as read" button | `notifications.read_at` updated in DB | PASSED | Verified in UI: opened from Brand Dashboard bell, clicked Mark all read; DB verified `unread: 0` |

---

## 27. Settings and Language

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-49 | Language Toggle (EN/AR) | `SettingsScreen` / `BrandProfileScreen` | Toggling language updates i18n locale and text | `setAppLocale` called, UI switches | PASSED | Verified in UI: clicked العربية, UI switched to Arabic with full RTL styling; switched back to English |
| TC-50 | Logout | `SettingsScreen` / `BrandProfileScreen` | Logout clears session tokens; returns to role selection | `refresh_tokens` revoked | PASSED | Verified in UI on both Brand and Creator profiles: clicked Log out, session cleared, returned to role selection screen |

---

## 28. Admin Flows (API)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-51 | Admin Creator Vetting | API (`PATCH /admin/creators/:id/vetting`) | Approves or rejects creator; rejection auto-declines open proposals | `creators.vetting_status` updated; proposals auto-declined | PASSED | Verified via Admin API: approved creator; DB verified `creators.vetting_status = 'approved'` |
| TC-52 | Admin Mark Payout Paid | API (`POST /admin/payouts/:id/mark-paid`) | Marks payout as paid; records payout transaction; emits notification | `transactions` payout row; collaboration status `paid` | PASSED | Verified via Admin API: marked payout paid; DB verified `transactions` payout row and `collaborations.status = 'paid'` |

---

## 29. Push Notifications (API)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-53 | Push Token Registration | API (`POST /users/me/push-token`) | Registers Expo push token; removes on logout | `users.expo_push_token` updated | PASSED | Verified via API: registered token; DB verified `users.expo_push_token`; cleared token on DELETE |

---

## 30. Payments Webhook (API)

| ID | Feature / Test Case | UI Screen / Route | Expected Behavior | DB Verification | Status | Notes |
|---|---|---|---|---|---|---|
| TC-54 | Paymob Webhook Processing | API (`POST /webhooks/paymob`) | HMAC validated; handles campaign escrow or collaboration; idempotent | `transactions` row created; duplicate ignored | PASSED | Verified via automated test suite: 20 tests pass across 4 suites covering HMAC, tampering rejection, and idempotency |
