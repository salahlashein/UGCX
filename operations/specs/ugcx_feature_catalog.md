# UGCX System Feature Catalog and End-to-End Workflow Map

```
========================================================================================
                          UGCX APPLICATION ARCHITECTURE
========================================================================================

    ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
    │          BRAND MOBILE APP         │       │         CREATOR MOBILE APP        │
    │  (Dashboard, Briefs, Proposals,   │       │   (Home Queue, Discover, Work,    │
    │        Chats, Team/Billing)       │       │       Earnings, Portfolio)         │
    └───────────────┬───────────────────┘       └───────────────┬───────────────────┘
                    │                                           │
                    └──────────────┬────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      NestJS API Server      │
                    │    17 modules · 50+ routes   │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
    ┌─────────▼───────┐  ┌────────▼────────┐  ┌───────▼────────┐
    │   PostgreSQL     │  │  Cloudflare R2  │  │   Paymob PSP   │
    │   17 entities    │  │  File storage   │  │   Payments     │
    └─────────────────┘  └─────────────────┘  └────────────────┘
```

---

## Table of Contents

1. [Authentication and Onboarding](#1-authentication-and-onboarding)
2. [Brand Setup and Profile](#2-brand-setup-and-profile)
3. [Brand Team Management](#3-brand-team-management)
4. [Product Catalog (Brand)](#4-product-catalog-brand)
5. [Brief Authoring and Publishing](#5-brief-authoring-and-publishing)
6. [Escrow Funding](#6-escrow-funding)
7. [Campaign Discovery (Creator)](#7-campaign-discovery-creator)
8. [Proposal Submission (Creator)](#8-proposal-submission-creator)
9. [Proposals Inbox (Brand)](#9-proposals-inbox-brand)
10. [Creator Profile Preview (Brand)](#10-creator-profile-preview-brand)
11. [Proposal Accept and Escrow Allocation](#11-proposal-accept-and-escrow-allocation)
12. [Shipment Confirmation (Brand)](#12-shipment-confirmation-brand)
13. [Deliverable Upload (Creator)](#13-deliverable-upload-creator)
14. [Deliverable Review (Brand)](#14-deliverable-review-brand)
15. [Collaboration Chat](#15-collaboration-chat)
16. [Brief Lifecycle Management](#16-brief-lifecycle-management)
17. [Creator Home Queue](#17-creator-home-queue)
18. [Creator Work Status](#18-creator-work-status)
19. [Creator Earnings and Payouts](#19-creator-earnings-and-payouts)
20. [Brand Dashboard](#20-brand-dashboard)
21. [Brand Billing](#21-brand-billing)
22. [Brand Chats List](#22-brand-chats-list)
23. [Creator Profile and Edit](#23-creator-profile-and-edit)
24. [Creator Proposals List](#24-creator-proposals-list)
25. [Creator Vetting (Pending Approval)](#25-creator-vetting-pending-approval)
26. [Notifications](#26-notifications)
27. [Settings and Language](#27-settings-and-language)
28. [Admin Flows](#28-admin-flows)
29. [Push Notifications](#29-push-notifications)
30. [Payments Webhook](#30-payments-webhook)
31. [Status Enums and Transitions](#31-status-enums-and-transitions)
32. [Database Entity Map](#32-database-entity-map)

---

## 1. Authentication and Onboarding

### 1.1 Role Selection

| Item | Detail |
|---|---|
| Screen | `OnboardingRoleScreen` |
| Route | `OnboardingRole` |
| Navigator | `AuthStack` (initial screen) |

**Form fields:**
- Role radio cards: `creator` (default) or `brand`

**Buttons:**
- Creator card press: sets role to `creator`
- Brand card press: sets role to `brand`
- Continue: navigates to `OnboardingPhoneNumber` with `{ role }`

**Conditional UI:**
- Selected card shows active border and filled radio circle

**Test steps:**
1. Open the app without a session.
2. Verify `OnboardingRole` screen appears.
3. Tap "Creator" card. Verify active border.
4. Tap "Brand" card. Verify active border switches.
5. Tap Continue. Verify navigation to phone number screen with correct role param.

---

### 1.2 Phone Number Entry

| Item | Detail |
|---|---|
| Screen | `OnboardingPhoneNumberScreen` |
| Route | `OnboardingPhoneNumber` |
| API | `POST /auth/otp/send` via `useSendOtp()` |

**Form fields:**
- Phone input (`phone-pad` keyboard), prefix `+20`
- Format logic: strips non-digits and leading zeros

**Buttons:**
- Send code: disabled when digit count < 10. Calls `sendOtp.mutate({ phone, role })`

**State transitions:**
- `canContinue` is true when phone has at least 10 digits
- On success: navigates to `OnboardingOtp` with `{ role, phone }`
- On dev error: still navigates (fallback behavior)

**Test steps:**
1. Enter phone `1001234471`.
2. Verify the CTA button activates (not disabled).
3. Tap Send code.
4. Verify navigation to OTP screen. Backend logs OTP code `0000`.
5. Enter fewer than 10 digits. Verify the button stays disabled.

---

### 1.3 OTP Verification

| Item | Detail |
|---|---|
| Screen | `OnboardingOtpScreen` |
| Route | `OnboardingOtp` |
| API | `POST /auth/otp/verify` via `useVerifyOtp()` |

**Form fields:**
- 4-digit OTP input (`OtpInput` component, `length={4}`)
- Default value: `0000`

**Buttons:**
- Continue: disabled when `otp.length !== 4`. Calls `verifyOtp.mutate({ phone, otp, role })`
- Resend text: display only (countdown timer)

**State transitions (role-based branching):**
- Brand role: calls `saveSession()` immediately. RootNavigator mounts `BrandTabNavigator`.
- Creator role: fetches `/creators/me`. If `displayName` is empty or fetch fails, navigates to `OnboardingBasics`. If profile is complete, calls `saveSession()`. RootNavigator mounts `CreatorTabNavigator`.

**Test steps:**
1. On the OTP screen, verify 4 digit boxes appear.
2. Enter `0000`. Tap Continue.
3. For brand: verify redirect to Brand Dashboard.
4. For new creator: verify redirect to `OnboardingBasics`.
5. For returning creator with profile: verify redirect to Creator Home.

---

### 1.4 Creator Basics (Onboarding)

| Item | Detail |
|---|---|
| Screen | `OnboardingBasicsScreen` |
| Route | `OnboardingBasics` |
| API | `POST /storage/upload-url`, `PATCH /creators/me` |

**Form fields:**
- Full name (`TextInput`)
- City (`TextInput`)
- Niche chips (max 3): Beauty & Skincare, Mom & baby, Food & FMCG, Fashion, Home & Lifestyle
- Video upload dropzone (system `ImagePicker`, video only)

**Buttons:**
- Niche chip press: toggles niche in selection (max 3)
- Dropzone press: opens gallery picker
- Continue: disabled when any required field is empty or upload is running.
  1. Requests presigned URL via `useRequestUploadUrl()`
  2. Uploads video via `uploadFileToPresignedUrl()`
  3. Calls `useUpdateCreatorProfile()` with `{ displayName, city, niches, verificationClipUrl }`

**Error states:**
- Upload failure: `Alert.alert('Upload Failed', ...)`
- Profile save failure: `Alert.alert('Save Failed', ...)`

**Loading states:**
- `isUploading`: CTA shows `ActivityIndicator`, button disabled

**Test steps:**
1. Enter name, city, select 2 niches.
2. Tap dropzone, select a video file.
3. Verify "Video selected" text appears.
4. Tap Continue. Verify upload progress indicator.
5. Verify navigation to `OnboardingPortfolio`.
6. Try selecting 4 niches. Verify the 4th chip does not activate.
7. Leave name empty. Verify Continue is disabled.

---

### 1.5 Creator Portfolio (Onboarding)

| Item | Detail |
|---|---|
| Screen | `OnboardingPortfolioScreen` |
| Route | `OnboardingPortfolio` |
| API | `POST /storage/upload-url`, `POST /creators/me/portfolio-items`, `PATCH /creators/me` |

**Form fields:**
- Media picker tile (image or video via `ImagePicker`)
- Base price input (`RNTextInput`, numeric, prefix `EGP`)
- Social handle input (`RNTextInput`, text)

**Buttons:**
- "Skip for now" header button: calls `hydrateSession()`, skips portfolio
- "+ Add media" tile: opens gallery picker
- "Submit for review" CTA:
  1. Uploads each media item to S3
  2. Registers each item via `useAddPortfolioItem()`
  3. Updates profile with base price via `useUpdateCreatorProfile()`
  4. Calls `hydrateSession()` to complete onboarding

**State transitions:**
- On `hydrateSession()`: RootNavigator switches to `CreatorTabNavigator`

**Error states:**
- Upload or submit failure: `Alert.alert('Upload Failed', ...)`

**Loading states:**
- `isSubmitting`: CTA shows spinner, button disabled

**Test steps:**
1. Tap "Skip for now". Verify redirect to Creator Home.
2. Go back. Tap "+ Add media". Select an image. Verify thumbnail appears.
3. Enter base price `500`. Enter social handle.
4. Tap "Submit for review". Verify upload completes.
5. Verify redirect to Creator Home (or PendingVetting if vetting is pending).

---

## 2. Brand Setup and Profile

### 2.1 Brand Setup Wizard

| Item | Detail |
|---|---|
| Screen | `BrandSetupScreen` |
| Route | `BrandSetup` |
| Navigator | `BrandProfileTab -> ProfileStackNavigator` |
| API | `PATCH /brands/me`, `POST /storage/upload-url` |

**Form fields:**
- Logo selector: tile opening `ImagePicker` (image only)
- Brand name (`TextInput` for `companyName`)
- Category: read-only input opening bottom sheet with `ChipSelect` (6 niche options)
- Business document: card opening `DocumentPicker` (PDF only)

**Buttons:**
- Pick logo: opens image library
- Pick document: opens document picker (PDF)
- Category field: opens bottom sheet picker
- Retry logo upload: retries image selection
- Continue: saves profile and navigates to `BrandPhoneVerification`

**State transitions:**
- Image upload progresses through 10%, 50%, 90%, 100%
- Selecting a category chip closes the sheet and sets the value
- Continue saves profile via `useUpdateBrandProfile()` and navigates forward

**Error states:**
- Logo upload failure: shows retry button and error text
- Submission error: inline error text above Continue

**Loading states:**
- Profile loading: `LoadingState`
- Logo uploading: progress percentage
- Document uploading: card disabled
- Saving: spinner on button

**Conditional UI:**
- Logo card shows image preview if uploaded, placeholder otherwise
- Continue disabled if company name is empty or files are uploading

**Test steps:**
1. Navigate to Brand Profile > Brand Setup.
2. Tap logo area. Select an image. Verify preview appears.
3. Enter brand name.
4. Tap Category field. Verify bottom sheet with 6 niche options appears.
5. Select a category. Verify the sheet closes and the value populates.
6. Tap document card. Select a PDF. Verify "uploaded" state.
7. Tap Continue. Verify navigation to Phone Verification.
8. Leave brand name empty. Verify Continue is disabled.

---

### 2.2 Brand Phone Verification

| Item | Detail |
|---|---|
| Screen | `BrandPhoneVerificationScreen` |
| Route | `BrandPhoneVerification` |
| API | `POST /auth/otp/send`, `POST /auth/otp/verify` |

**Form fields:**
- OTP code input (`OtpInput`, 4-digit)

**Buttons:**
- Resend: calls `sendOtp.mutateAsync({ phone, role: 'brand' })`. Resets countdown to 60.
- Continue: calls `verifyOtp.mutateAsync({ phone, otp, role: 'brand' })`

**State transitions:**
- Timer counts down from 38 seconds
- 4 or 6 digit entry enables Continue
- Successful verification invalidates `['brand', 'me']` cache, routes to `PostBrief`

**Error states:**
- `errorMessage` displays inline in red above submit button

**Loading states:**
- `verifyOtp.isPending`: button loading, OTP input disabled
- `sendOtp.isPending`: resend link disabled

**Conditional UI:**
- Shows countdown while active. Shows resend link when countdown hits 0.
- Button disabled when OTP length is not 4 or 6
- Displays masked phone number (`+20 10 •••• 4471`)

**Test steps:**
1. Verify masked phone number displays.
2. Verify countdown timer runs.
3. Enter `0000`. Verify Continue activates.
4. Tap Continue. Verify navigation to PostBrief.
5. Wait for countdown to reach 0. Verify Resend link appears.
6. Tap Resend. Verify countdown restarts.

---

### 2.3 Brand Profile Screen

| Item | Detail |
|---|---|
| Screen | `BrandProfileScreen` |
| Route | `BrandProfile` |
| Navigator | `BrandProfileTab` (tab root) |
| API | `GET /brands/me`, `PATCH /brands/me`, `GET /brands/me/members`, `POST /auth/logout` |

**Form fields:**
- `companyName`: `FormTextInput`
- `country`: `FormTextInput`
- Language toggle: segmented control (English / Arabic)

**Buttons:**
- Save: submits via `useUpdateBrandProfile()`
- Team members row: navigates to `BrandTeam`
- Products row: navigates to `ProductsList`
- Payment methods row: shows Paymob card alert
- Billing & invoices row: navigates to `BrandBilling`
- Language segments: calls `setAppLocale`
- Log out: calls `logout.mutate()`

**Conditional UI:**
- Verified badge only when `verificationStatus === 'verified'`
- Team member count or default 1
- Active language segment highlighted

**Test steps:**
1. Navigate to Profile tab. Verify brand name and country load.
2. Edit company name. Tap Save. Verify success.
3. Tap Team members. Verify navigation to team screen.
4. Tap Products. Verify navigation to products list.
5. Tap Billing. Verify navigation to billing screen.
6. Toggle language to Arabic. Verify alert about restart.
7. Tap Log out. Verify redirect to auth screen.

---

## 3. Brand Team Management

| Item | Detail |
|---|---|
| Screen | `BrandTeamScreen` |
| Route | `BrandTeam` |
| API | `GET /brands/me/members`, `POST /brands/me/members`, `PATCH /brands/me/members/:id`, `DELETE /brands/me/members/:id` |

**Form fields (invite sheet):**
- Email: `TextInput`
- Role: `ChipSelect` (`approver` or `viewer`)

**Buttons:**
- "Invite" header: opens invite bottom sheet (owner only)
- "Send invite": calls `useInviteMember()`
- Member row long press: opens action bottom sheet (owner only, on non-self members)
- "Change role": calls `useUpdateMemberRole()`
- "Remove member": triggers confirmation alert, then calls `useRemoveMember()`
- Pull to refresh

**Role-based access:**
- Invite button visible only for owners
- Long press works only for owners on other members
- Cannot invite as owner role
- Cannot alter or delete the last owner

**Conditional UI:**
- "You" label on current user row
- "Invited" label on pending members

**Error states:**
- Invite error: inline in invite sheet
- Role/delete error: inline in action sheet
- Query error: `ErrorState` with retry

**Test steps:**
1. Open team screen as owner. Verify Invite button in header.
2. Tap Invite. Enter email and select "approver". Tap Send invite. Verify new member appears.
3. Long press a non-owner member. Verify action sheet opens with "Change role" and "Remove member".
4. Change role to "viewer". Verify the role updates.
5. Remove a member. Verify confirmation dialog. Confirm. Verify member disappears.
6. Verify "You" label on the current user row.
7. Open team screen as approver/viewer. Verify Invite button is hidden.
8. Try to remove the only owner. Verify the backend rejects the request.

---

## 4. Product Catalog (Brand)

### 4.1 Products List

| Item | Detail |
|---|---|
| Screen | `ProductsListScreen` |
| Route | `ProductsList` |
| API | `GET /products` |

**Buttons:**
- "Add new" header: navigates to `ProductForm` (create mode)
- Product card press: navigates to `ProductForm` with `{ productId }` (edit mode)

**Test steps:**
1. Navigate to Profile > Products. Verify list loads.
2. Tap "Add new". Verify navigation to product form (empty).
3. Return. Tap an existing product card. Verify navigation to product form (prefilled).

### 4.2 Product Form

| Item | Detail |
|---|---|
| Screen | `ProductFormScreen` |
| Route | `ProductForm` |
| API | `POST /products`, `GET /products/:id`, `PATCH /products/:id` |

**Form fields:**
- Name (`FormTextInput`, required)
- Description (`FormTextInput`, multiline, optional)
- Value props (`FormTextInput`, multiline, newline-separated, optional)

**Buttons:**
- Save: creates or updates product. Returns to previous screen.

**State transitions:**
- If `productId` is provided: loads existing product into form fields
- If no `productId`: form starts empty (create mode)

**Error states:**
- `formError`: red text at top of form

**Test steps:**
1. Open product form in create mode. Enter name "Test Product". Tap Save. Verify product appears in list.
2. Open product form in edit mode. Verify fields are prefilled. Change description. Tap Save. Verify update.
3. Leave name empty. Tap Save. Verify validation error.

---

## 5. Brief Authoring and Publishing

### 5.1 Post Brief (Simple Form)

| Item | Detail |
|---|---|
| Screen | `PostBriefScreen` |
| Route | `PostBrief` |
| API | `POST /campaigns` via `useCreateCampaign()` |

**Form fields:**
- `title` (`FormTextInput`, 3-140 chars)
- `videoType` (`ChipSelect`: talking_head, try_on, unboxing)
- `durationSeconds` (`FormTextInput`, integer, 5-600)
- `language` (`ChipSelect`: ar, en)
- `budgetMin` (`FormTextInput`, minimum 100)
- `budgetMax` (`FormTextInput`, >= budgetMin)
- `needsShipping` (checkbox toggle)

**Buttons:**
- Shipping checkbox: toggles boolean
- "Review and fund brief": validates via Zod, calls `createCampaign.mutateAsync`

**State transitions:**
- On success: navigates to `FundEscrow` with `{ campaignId }`

**Error states:**
- Zod validation errors on fields
- Cross-field: `budgetMax < budgetMin`
- `submitError`: inline error text above button

**Test steps:**
1. Navigate to Briefs tab. Tap + button. Verify PostBrief screen.
2. Fill all fields: title "Test Brief", video type "talking_head", duration 30, language "en", budget min 500, budget max 1000.
3. Toggle shipping on. Tap "Review and fund brief".
4. Verify navigation to FundEscrow.
5. Leave title empty. Verify validation error.
6. Set budgetMax < budgetMin. Verify cross-field validation error.

### 5.2 Campaign Wizard (Multi-Step)

| Item | Detail |
|---|---|
| Screen | `CampaignWizardScreen` |
| Route | `CampaignWizard` |
| API | `POST /campaigns`, `PATCH /campaigns/:id`, `POST /campaigns/:id/publish`, `GET /products` |

**5 steps:**

| Step | Fields |
|---|---|
| 1. Product | `productId` via `ChipSelect` from product catalog |
| 2. Details | `niche`, `language`, `videoType`, `durationSeconds` |
| 3. Script | `scriptMode` (brand/creator), `script`, `talkingPoints`, `doNotSay` |
| 4. Shipping | `needsShipping` (yes/no), `slots` |
| 5. Review | Read-only summary |

**Buttons:**
- Back: decrements step (hidden on step 1)
- Next: validates current step, increments step. Creates draft after step 1.
- Publish (step 5): saves changes and calls `usePublishCampaign()`

**State transitions:**
- Step 1 creates a draft campaign if none exists
- Step 5 updates and publishes, then navigates to `MyBriefs`

**Test steps:**
1. Navigate to Briefs > CampaignWizard.
2. Step 1: select a product. Tap Next. Verify draft creation.
3. Step 2: fill niche, language, video type, duration. Tap Next.
4. Step 3: select script mode, enter talking points. Tap Next.
5. Step 4: toggle shipping, set slots. Tap Next.
6. Step 5: verify summary shows all entered values. Tap Publish.
7. Verify navigation to MyBriefs. Verify the brief appears with `live` status.
8. On step 1, if no products exist, verify hint message.

---

## 6. Escrow Funding

| Item | Detail |
|---|---|
| Screen | `FundEscrowScreen` |
| Route | `FundEscrow` |
| API | `POST /campaigns/:id/escrow/checkout`, `POST /campaigns/:id/publish`, `GET /campaigns/:id/escrow` |

**Form fields:**
- Payment method radio cards: `card` ("Corporate card •• 4471") and `bank_transfer`

**Buttons:**
- Method cards: selects payment method
- "Fund & publish brief": calls `handleStartCheckout()`
- "Try again" (on declined screen): resets state
- "Refresh" (on timeout screen): calls `escrowQuery.refetch()`

**State transitions:**
- Funding creates checkout URL
- If mock/dev: publishes immediately, navigates to `MyBriefs`
- If production: opens `PaymobCheckout` webview, starts 90s polling
- When escrow balance > 0: stops polling, publishes, navigates to `MyBriefs`

**Error states:**
- Payment decline: full-screen error with "Try again"
- 90s timeout: full-screen error with "Refresh"

**Test steps (dev mode):**
1. Arrive at FundEscrow from PostBrief.
2. Select "card" method. Tap "Fund & publish brief".
3. In dev mode: verify mock funding and immediate navigation to MyBriefs.
4. Verify the brief shows `live` status.
5. Verify the escrow balance matches the budget midpoint.

**Test steps (production):**
1. Select method. Tap Fund.
2. Verify Paymob webview opens.
3. Complete payment in webview.
4. Verify polling detects the funded amount.
5. Verify brief publishes and navigation to MyBriefs.

---

## 7. Campaign Discovery (Creator)

| Item | Detail |
|---|---|
| Screen | `CampaignDiscoveryScreen` |
| Route | `Discover` |
| Navigator | `CreatorDiscoverTab` (tab root) |
| API | `GET /campaigns`, `GET /creators/me/earnings`, `GET /creators/me` |

**Form fields:**
- Search input (text for briefs, brands, niches)
- Filter chips row (niche, city, shipping status, price)

**Buttons:**
- Search input: filters campaigns
- Filter chip press: updates selected filter
- Campaign card press: navigates to `CampaignDetail` with `{ campaignId }`

**Conditional UI:**
- Escrow strip appears when `earnings.escrowBalance > 0`
- Filter chips populate from creator profile (niches, city, base price)
- Shipping text: "Ships to you" or "No shipping needed"
- Empty list: "No open briefs right now."

**Test steps:**
1. Open Discover tab as creator. Verify live campaigns load.
2. Tap a campaign card. Verify navigation to CampaignDetail.
3. Use search input. Verify filtering.
4. Tap a filter chip. Verify results update.
5. If no campaigns: verify empty state message.

---

## 8. Proposal Submission (Creator)

| Item | Detail |
|---|---|
| Screen | `CampaignDetailScreen` |
| Route | `CampaignDetail` |
| API | `GET /campaigns/:id`, `POST /campaigns/:campaignId/proposals`, `GET /creators/me` |

**Form fields (inside bottom sheet):**
- Price (`RNTextInput`, numeric keyboard)
- Preset price chips (base price, 1.25x, 1.5x)
- Delivery days selector (3, 5, or 7 days)
- Pitch note (`RNTextInput`, multiline)

**Buttons:**
- "Apply - set your price": opens bottom sheet (85% height)
- Price preset chips: sets price to chosen preset
- Delivery days chips: sets days to 3, 5, or 7
- "Send proposal" CTA: calls `useCreateProposal()`. On success, closes sheet and calls `navigation.goBack()`

**State transitions:**
- `price` initialized from profile base price
- `days` defaults to 5
- Bottom sheet opens and closes

**Conditional UI:**
- Status badge shown if campaign has a status
- Talking points section hidden if array is empty
- Shipping row text changes based on `needsShipping`

**Error states:**
- Campaign fails to load: activity indicator
- Submit button shows "Sending..." while pending

**Test steps:**
1. Tap a campaign card from Discover. Verify detail screen loads.
2. Verify brief details: title, video type, duration, budget range, shipping status.
3. Tap "Apply - set your price". Verify bottom sheet opens.
4. Verify price prefilled from profile base price.
5. Tap 1.5x preset chip. Verify price updates.
6. Select 7-day delivery. Enter pitch note.
7. Tap "Send proposal". Verify sheet closes and navigation goes back.
8. Verify the proposal appears in creator's My Proposals with `applied` status.
9. Try submitting a second proposal to the same campaign. Verify backend rejects it.

---

## 9. Proposals Inbox (Brand)

| Item | Detail |
|---|---|
| Screen | `ProposalsInboxScreen` |
| Route | `ProposalsInbox` / `ProposalsAcrossBriefs` |
| API | `GET /campaigns/:campaignId/proposals`, `PATCH /proposals/:id/status`, `GET /collaborations/mine` |

**Buttons:**
- Proposal card header/pitch: navigates to `CreatorProfilePreview`
- "Shortlist": updates proposal status to `shortlisted`
- "Decline": updates proposal status to `declined`
- "Accept": navigates to `AcceptProposal` with `{ proposalId }`
- "View collaboration": navigates to `CollaborationDetail`

**Conditional UI by proposal status:**
- `applied`: shows Shortlist, Decline, Accept buttons
- `shortlisted`: shows Decline, Accept buttons
- `accepted` + collaboration exists: shows "View collaboration" button
- Empty inbox: shows empty message

**Test steps:**
1. Open Briefs tab. Tap a live brief. Verify proposals inbox loads.
2. Verify proposal cards show creator name, price, pitch, delivery days.
3. Tap "Shortlist" on a proposal. Verify status updates to `shortlisted`.
4. Tap "Decline" on a proposal. Verify status updates to `declined`.
5. Tap proposal header. Verify navigation to creator profile preview.
6. Tap "Accept". Verify navigation to AcceptProposal screen.
7. After accept: verify "View collaboration" button appears on accepted proposal.

---

## 10. Creator Profile Preview (Brand)

| Item | Detail |
|---|---|
| Screen | `CreatorProfilePreviewScreen` |
| Route | `CreatorProfilePreview` |
| API | `GET /proposals/:id/creator-profile`, `POST /proposals/:id/accept` |

**Display fields:**
- Creator display name, city, niches
- Stats: approval rate, average revisions, jobs done
- Portfolio grid (up to 4 items)
- Proposal pitch card

**Buttons:**
- "Accept proposal · EGP {price}": calls `useAcceptProposal()`
- "Add EGP {amount} to escrow" (in insufficient escrow sheet): navigates to `AcceptProposal`

**State transitions:**
- Accept success with `funded` status: replaces screen with `CollaborationDetail`
- Insufficient escrow error (`insufficient_escrow` code): opens shortfall bottom sheet

**Modals:**
- Shortfall bottom sheet (35% snap): shows calculated shortfall amount and top-up CTA

**Test steps:**
1. From Proposals Inbox, tap a proposal card header. Verify creator preview loads.
2. Verify portfolio items display (images/video placeholders).
3. Verify stats display.
4. Tap "Accept proposal". If escrow is sufficient: verify navigation to CollaborationDetail.
5. If escrow is insufficient: verify shortfall sheet appears with correct amount.

---

## 11. Proposal Accept and Escrow Allocation

| Item | Detail |
|---|---|
| Screen | `AcceptProposalScreen` |
| Route | `AcceptProposal` |
| API | `POST /proposals/:id/accept`, `GET /collaborations/:id` (polling) |

**State machine:**
1. Mount triggers `acceptProposal.mutate(proposalId)`
2. If response has `checkoutUrl`: shows `PaymobCheckout` webview
3. Webview redirect starts 60s polling
4. Polling stops when status moves away from `pending_payment`
5. If status is `funded`: shows success card with fee split
6. If status is `payment_failed`: shows error card with Back button
7. If 60s timeout: shows timeout card with Back button

**Buttons:**
- "Go to collaboration": replaces screen with `CollaborationDetail`
- "Back" (on failure/timeout): calls `navigation.goBack()`

**Business rules:**
- 10% platform fee calculated by `EscrowService.quote()`
- Allocation deducted from campaign escrow balance
- `hold` transaction recorded
- System message `escrow_funded` posted to chat
- Notifications sent to both brand and creator

**Test steps:**
1. Accept a proposal with sufficient escrow.
2. Verify loading state, then success card.
3. Verify fee split display (creator price, platform fee, total).
4. Tap "Go to collaboration". Verify CollaborationDetail loads.
5. Verify system message `escrow_funded` in chat.
6. Verify notifications sent to both parties.

---

## 12. Shipment Confirmation (Brand)

| Item | Detail |
|---|---|
| Screen | `CollaborationDetailScreen` |
| Route | `CollaborationDetail` |
| API | `POST /collaborations/:id/confirm-shipment` |

**Form fields (shown only when status is `funded` and campaign `needsShipping`):**
- Carrier (`FormTextInput`)
- Tracking number (`FormTextInput`)

**Buttons:**
- "Confirm shipment": calls `useConfirmShipment()` with `{ carrier, trackingNumber }`
- "Review Deliverable": navigates to `ReviewDeliverable` (shown when status is `delivered`)
- "Open chat": navigates to `CollaborationChat`

**State transitions:**
- Submitting shipment: status moves from `funded` to `shipped`
- System message `shipment_confirmed` posted
- Creator notification sent

**Conditional UI:**
- Shipment card only when status is `funded`
- Review deliverable card only when status is `delivered` and deliverable exists

**Test steps:**
1. Open a collaboration with `funded` status and `needsShipping=true`.
2. Verify shipment form appears (carrier + tracking number fields).
3. Enter carrier "FedEx" and tracking "ABC123".
4. Tap "Confirm shipment". Verify status changes to `shipped`.
5. Verify chat shows `shipment_confirmed` system message.
6. For digital campaigns (`needsShipping=false`): verify no shipment form. Creator can upload directly.

---

## 13. Deliverable Upload (Creator)

| Item | Detail |
|---|---|
| Screen | `DeliverableUploadScreen` |
| Route | `DeliverableUpload` |
| API | `POST /collaborations/:id/deliverables/upload-url`, `POST /collaborations/:id/deliverables` |

**Form fields:**
- Video file picker (`ImagePicker.launchImageLibraryAsync`, video only)
- Pre-submit checklist (3 checkboxes):
  1. 9:16 vertical format
  2. Audio and lighting quality
  3. Brief requirements met
- Brand note (`RNTextInput`, multiline)

**Buttons:**
- Video dropzone: opens file picker
- Test video button (DEV/web only): creates mock blob URI
- Change video: re-opens picker
- Submit CTA: runs `executeUpload()`. Disabled until all conditions met.

**Upload flow:**
1. Request presigned URL via `useRequestUploadUrl()`
2. Upload binary via `uploadFileToPresignedUrl()` with progress tracking
3. Register deliverable via `useRegisterDeliverable()` with `{ type, fileUrl, note }`

**State transitions:**
- `videoUri` selection/clear
- `checkedItems` dictionary
- `isUploading` boolean
- `uploadProgress` (0-100)
- `uploadFailedPercent` (null or number)

**Conditional UI:**
- Revision banner: shows latest review feedback when revision requested
- Dropzone: dashed border when no video, file preview when selected
- CTA text: "Submit for review", "Retry upload", or "Submitting..."
- Mock video button: only in DEV or web

**Eligibility rules (backend):**
- `shipped` status: allowed
- `revision_requested` status: allowed
- `funded` status: allowed only when `needsShipping === false` (digital campaign)
- All other statuses: rejected

**Test steps:**
1. Open a collaboration with `shipped` or `funded` (digital) status.
2. Tap dropzone. Select a video (or use test video on web).
3. Verify video preview appears with "Change" button.
4. Check all 3 checklist items.
5. Enter a note.
6. Tap Submit. Verify progress bar animation.
7. Verify status changes to `delivered`.
8. Verify chat shows `deliverable_submitted` system message.
9. Verify brand receives notification.
10. Test upload failure: verify retry CTA and red progress bar.
11. After revision request: verify revision banner with feedback text.

---

## 14. Deliverable Review (Brand)

| Item | Detail |
|---|---|
| Screen | `ReviewDeliverableScreen` |
| Route | `ReviewDeliverable` |
| API | `GET /collaborations/:id/deliverables`, `POST /deliverables/:id/review` |

**Form fields:**
- Feedback note (`RNTextInput`, multiline)

**Buttons:**
- "Request revision": submits `{ action: 'request_revision', feedback }`. Requires note text.
- "Approve & release": submits `{ action: 'approve', feedback }`. Triggers escrow release.
- "Done" (on success panel): calls `navigation.goBack()`

**State transitions on approve:**
1. Deliverable status -> `approved`
2. Collaboration status -> `approved`
3. `release` transaction recorded (creator payment)
4. `fee` transaction recorded (platform commission)
5. Campaign auto-completes if all slots are done
6. System message `escrow_released` posted
7. Both roles notified

**State transitions on revision request:**
1. Deliverable status -> `revision_requested`
2. Collaboration status -> `revision_requested`
3. Feedback stored as `DeliverableFeedback`
4. System message `revision_requested` posted
5. Creator notified

**Conditional UI:**
- Full-screen success panel on approval
- Previous version feedback card when `version > 1`
- Approve button disabled until video signals ready

**Test steps:**
1. Open a collaboration with `delivered` status. Tap "Review Deliverable".
2. Verify video player loads deliverable.
3. Enter feedback note. Tap "Request revision".
4. Verify collaboration returns to `revision_requested`.
5. Creator uploads new version. Return to review.
6. Verify previous feedback card shows version 1 note.
7. Tap "Approve & release". Verify success panel with released amount.
8. Verify escrow transactions: `release` and `fee` both `completed`.
9. Try requesting revision without note. Verify error.

---

## 15. Collaboration Chat

| Item | Detail |
|---|---|
| Screen | `CollaborationChatScreen` |
| Route | `CollaborationChat` |
| API | `GET /collaborations/:id/messages`, `POST /collaborations/:id/messages`, `POST /collaborations/:id/read`, `POST /collaborations/:id/chat-token` |

**Form fields:**
- Message draft input (`RNTextInput`)

**Buttons:**
- Back: calls `navigation.goBack()`
- Send: calls `useSendMessage()`. Disabled when pending or draft is empty.

**Chat-eligible statuses:**
`funded`, `shipped`, `delivered`, `revision_requested`, `approved`, `paid`

**Message types:**
- User messages: aligned right (sender) or left (counterparty)
- System messages: centered capsule with event copy

**System message events:**
- `escrow_funded`
- `shipment_confirmed`
- `deliverable_submitted`
- `revision_requested`
- `escrow_released`

**On mount:** calls `useMarkChatRead()` to update `brandLastReadAt` or `creatorLastReadAt`

**Conditional UI:**
- Header shows counterparty name based on role
- Header shows collaboration status pill
- Unread notification suppressed if existing unread notification is pending

**Test steps:**
1. Open a collaboration chat from either side.
2. Verify header shows counterparty name and status pill.
3. Type a message. Tap Send. Verify message appears right-aligned.
4. Switch to the other role. Verify message appears left-aligned.
5. Verify system messages appear as centered capsules.
6. Verify unread count clears on chat open.

---

## 16. Brief Lifecycle Management

### 16.1 My Briefs List

| Item | Detail |
|---|---|
| Screen | `MyBriefsScreen` |
| Route | `MyBriefs` |
| API | `GET /campaigns/mine` via `useMyBriefs()` |

**Form fields:**
- Status filter chips: All, Draft, Open, Completed (with counts)

**Buttons:**
- Header + button: navigates to `PostBrief`
- Filter chips: update `selectedFilter`, re-query
- Brief card press:
  - Draft status -> navigates to `FundEscrow`
  - Other status -> navigates to `ProposalsInbox`
- Empty state "New brief": navigates to `PostBrief`
- Pull to refresh

**Conditional UI:**
- Draft cards show reduced opacity
- Meta caption changes: draft, completed, active collaborations, awaiting proposals
- Loading: 3 skeleton placeholder cards

**Test steps:**
1. Open Briefs tab. Verify brief list loads with correct counts.
2. Tap "Draft" filter. Verify only draft briefs show.
3. Tap "Open" filter. Verify only live/paused briefs show.
4. Tap a draft brief. Verify navigation to FundEscrow.
5. Tap a live brief. Verify navigation to ProposalsInbox.
6. Tap + button. Verify navigation to PostBrief.
7. Pull to refresh. Verify data reloads.

### 16.2 Edit Live Brief (Pause/Resume/Close)

| Item | Detail |
|---|---|
| Screen | `EditLiveBriefScreen` |
| Route | `EditLiveBrief` |
| API | `GET /campaigns/:id`, `GET /campaigns/:id/escrow`, `POST /campaigns/:id/pause`, `POST /campaigns/:id/resume`, `POST /campaigns/:id/close` |

**Buttons:**
- "Pause brief" / "Resume brief": toggles between `live` and `paused`
- "Close early & refund unspent escrow": opens confirmation modal
- Modal "Cancel": closes modal
- Modal "Close & refund": calls `useCloseBrief()`. Navigates back.

**Close brief rules (backend):**
- Status must be `live` or `paused`
- No in-flight collaborations (`funded`, `shipped`, `delivered`, `revision_requested`)
- Sets status to `cancelled`
- Declines all open proposals
- Initiates Paymob refund on unallocated escrow

**Conditional UI:**
- Button text alternates based on `campaign.status === 'paused'`
- Modal shows live available refund amount

**Test steps:**
1. Open a live brief. Navigate to EditLiveBrief.
2. Tap "Pause brief". Verify status changes to `paused`.
3. Tap "Resume brief". Verify status changes to `live`.
4. Tap "Close early". Verify confirmation modal with refund amount.
5. Tap "Close & refund". Verify brief closes, escrow refunds, and navigation back.
6. Try closing with in-flight collaborations. Verify backend rejects.

---

## 17. Creator Home Queue

| Item | Detail |
|---|---|
| Screen | `CreatorHomeScreen` |
| Route | `Home` |
| Navigator | `CreatorHomeTab` (tab root) |
| API | `GET /creators/me`, `GET /creators/me/queue` |

**Display:**
- Urgent task cards with action buttons
- Upcoming task rows

**Task routing by URL prefix:**
- `/upload` -> `WorkTab -> DeliverableUpload` with `collaborationId`
- `/chat` -> `WorkTab -> CollaborationChat` with `id`
- Other -> `WorkTab -> WorkStatus`

**Queue task sources (backend):**
- Chat replies awaiting response
- Missing deliverable uploads
- Shipment confirmations pending

**Conditional UI:**
- Header: "{count} things need you" or "All caught up!"
- Task icon background depends on `task.theme`

**Test steps:**
1. Open Home tab as creator. Verify queue loads.
2. If tasks exist: tap an urgent task. Verify correct cross-tab navigation.
3. If no tasks: verify "All caught up!" message.
4. Create a collaboration that needs a deliverable. Verify it appears in queue.
5. Tap it. Verify navigation to DeliverableUpload in Work tab.

---

## 18. Creator Work Status

| Item | Detail |
|---|---|
| Screen | `CollaborationStatusScreen` |
| Route | `WorkStatus` |
| Navigator | `CreatorWorkTab` (tab root) |
| API | `GET /collaborations/mine`, `GET /creators/me/earnings`, `GET /creators/me` |

**Display:**
- Escrow card with earnings
- Two rails:
  - "Needs filming": `funded`, `shipped`, `delivered` status items
  - "In review / Completed": `approved` status items

**Buttons:**
- Collaboration card press: navigates to `DeliverableUpload` with `collaborationId`

**Conditional UI:**
- Rails hide if count is zero
- Status tag colors: `shipped` is yellow, `funded` is peach
- Empty: "You have no active collaborations."

**Test steps:**
1. Open Work tab. Verify collaborations load in correct rails.
2. Tap a "Needs filming" card. Verify navigation to DeliverableUpload.
3. Verify status tags have correct colors.
4. With no collaborations: verify empty state.

---

## 19. Creator Earnings and Payouts

| Item | Detail |
|---|---|
| Screen | `PayoutsScreen` |
| Route | `Earnings` |
| Navigator | `CreatorEarningsTab` (tab root) |
| API | `GET /creators/me/earnings`, `GET /creators/me/ledger`, `POST /creators/me/payout-requests` |

**Display:**
- Earnings summary: escrow balance, pending balance, cleared balance
- Transaction ledger list

**Form fields (in bottom sheet):**
- Amount (`RNTextInput`, numeric)
- Method radio options: `instapay`, `vodafone`, `bank`

**Buttons:**
- "Request payout" CTA: validates balance. Opens bottom sheet.
- "All" button: sets amount to full pending balance
- Method options: select payout method
- Sheet "Request {amount}" CTA: submits payout mutation

**Error states:**
- Alert when balance is zero
- Alert when payout request fails
- Empty: "No transactions yet."

**Conditional UI:**
- Selected method highlights with primary border
- "Fastest" pill on InstaPay option
- Ledger item status color: `colors.success` or `colors.muted`

**Test steps:**
1. Open Earnings tab. Verify earnings summary loads.
2. Verify ledger shows completed transactions.
3. Tap "Request payout". If balance is zero: verify alert.
4. If balance > 0: verify bottom sheet opens.
5. Tap "All". Verify amount fills to pending balance.
6. Select InstaPay method. Tap "Request {amount}". Verify success alert.
7. Verify transaction appears in ledger.

---

## 20. Brand Dashboard

| Item | Detail |
|---|---|
| Screen | `BrandDashboardScreen` |
| Route | `BrandDashboard` |
| Navigator | `BrandDashboardTab` (tab root) |
| API | `GET /brands/me/dashboard` |

**Display:**
- Monthly spend card
- Attention banner (proposals to review, deliverables to review)
- Active briefs list

**Buttons:**
- Attention banner press: navigates to `BrandBriefsTab -> MyBriefs`
- "New brief" (empty state): navigates to `BrandBriefsTab -> PostBrief`
- Active brief card press: navigates to `BrandBriefsTab -> ProposalsInbox` with `campaignId`

**Dashboard data (backend):**
- Current month net spend (`charge - refund`)
- Deliverable count
- Attention counts: `applied` proposals, `delivered` collaborations
- 5 active briefs

**Test steps:**
1. Open Dashboard tab. Verify spend, deliverable count, and attention counts load.
2. If attention banner shows: tap it. Verify navigation to MyBriefs.
3. Tap an active brief card. Verify navigation to ProposalsInbox.
4. With no briefs: verify "New brief" empty state action.

---

## 21. Brand Billing

| Item | Detail |
|---|---|
| Screen | `BrandBillingScreen` |
| Route | `BrandBilling` |
| API | `GET /brands/me/billing` |

**Display:**
- Lifetime spend summary
- Transaction history ledger

**Buttons:**
- Pull to refresh
- Error retry

**Conditional UI:**
- Refund rows: green amount with + prefix
- Charge rows: ink color with - prefix
- Empty: fallback text
- Only `charge` and `refund` types shown (no internal `hold` transactions)

**Test steps:**
1. Navigate to Profile > Billing. Verify lifetime spend loads.
2. Verify transaction ledger shows charges and refunds.
3. Verify refunds display in green with + prefix.
4. Pull to refresh. Verify data reloads.

---

## 22. Brand Chats List

| Item | Detail |
|---|---|
| Screen | `BrandChatsScreen` |
| Route | `BrandChats` |
| Navigator | `BrandChatsTab` (tab root) |
| API | `GET /chats` (polls every 10s) |

**Buttons:**
- Chat row press: navigates to `CollaborationChat` with `collaborationId`

**Conditional UI:**
- Unread count > 0: badge pill with number
- Empty chats: `EmptyState` component
- Fallback text for missing preview or initials

**Test steps:**
1. Open Chats tab as brand. Verify chat list loads.
2. Tap a chat row. Verify navigation to CollaborationChat.
3. Send a message from the creator side. Verify unread badge appears on brand side.
4. Open the chat. Verify unread count clears.

---

## 23. Creator Profile and Edit

### 23.1 Creator Profile

| Item | Detail |
|---|---|
| Screen | `CreatorProfileScreen` |
| Route | `Profile` |
| Navigator | `CreatorProfileTab` (tab root) |
| API | `GET /creators/me`, `GET /creators/me/portfolio-items`, `GET /creators/:id/payout-details`, `POST /auth/logout` |

**Display:**
- Display name, city, niches (pills)
- Stats (jobs, approval rate, etc.)
- Portfolio grid (images/video)
- Base price
- Payout details

**Buttons:**
- Edit: navigates to `EditProfile`
- "Add video" link: placeholder
- Log out: calls `logout.mutate()`

**Conditional UI:**
- Portfolio empty: "No portfolio items yet."
- Base price/payout missing: "Not set"
- Image items show `<Image>`, video items show placeholder

**Test steps:**
1. Open Profile tab. Verify profile data loads.
2. Verify niches display as pills.
3. Verify portfolio items display.
4. Tap Edit. Verify navigation to EditProfile.
5. Tap Log out. Verify redirect to auth screen.

### 23.2 Edit Creator Profile

| Item | Detail |
|---|---|
| Screen | `EditProfileScreen` |
| Route | `EditProfile` |
| API | `GET /creators/me`, `PATCH /creators/me` |

**Form fields:**
- Display Name (`TextInput`)
- City (`TextInput`)
- Base Price (`TextInput`, numeric)
- Niche selection chips (5 options)

**Buttons:**
- Back: calls `navigation.goBack()`
- Save: calls `useUpdateCreatorProfile()`. On success, goes back.
- Niche chips: toggle niche in selection

**Test steps:**
1. Open Edit Profile. Verify fields prefilled.
2. Change display name. Tap Save. Verify success and return.
3. Toggle a niche on/off. Save. Verify update.
4. Change base price. Save. Verify update on profile screen.

---

## 24. Creator Proposals List

| Item | Detail |
|---|---|
| Screen | `MyProposalsScreen` |
| Route | `MyProposals` |
| API | `GET /proposals/mine` |

**Form fields:**
- Status filter chips: All, Pending, Accepted, Declined

**Conditional UI:**
- Active chip: primary color
- Status pills: `accepted` = mint, `declined` = danger, `applied` = neutral
- Declined rows: 0.6 opacity
- Empty: "No proposals found."

**Test steps:**
1. Navigate to Profile > My Proposals. Verify proposals list loads.
2. Tap "Accepted" filter. Verify only accepted proposals show.
3. Tap "Declined" filter. Verify declined proposals show with reduced opacity.
4. Verify each proposal shows campaign name, price, delivery days, status.

---

## 25. Creator Vetting (Pending Approval)

| Item | Detail |
|---|---|
| Screen | `PendingVettingScreen` |
| Route | `PendingVetting` |
| API | `GET /creators/me`, `GET /creators/me/portfolio-items`, `GET /creators/:id/payout-details`, `GET /campaigns` |

**Display:**
- Progress bar (4 segments): profile, portfolio, base price, payout
- Checklist with green checkmarks (completed) or empty circles (incomplete)
- Locked campaign previews (0.45 opacity)

**Buttons:**
- "Add payout details" CTA: navigates to `EarningsTab -> PayoutDetails`. Only visible when payout details are missing.

**Test steps:**
1. Log in as a new creator. Verify PendingVetting screen appears.
2. Verify progress bar shows completed and incomplete items.
3. Complete profile basics. Verify checkmark updates.
4. Add payout details. Verify checkmark updates.
5. Verify locked campaign previews show at reduced opacity.
6. After admin approves vetting: verify creator can access full Home screen.

---

## 26. Notifications

| Item | Detail |
|---|---|
| Screen | `NotificationsScreen` |
| Route | `Notifications` |
| API | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all` |

**Buttons:**
- "Mark all as read": visible when `unreadCount > 0`. Calls `useMarkAllNotificationsRead()`
- Notification card press:
  1. Marks item as read
  2. Routes to deep link target if in `ALLOWED_DEEP_LINKS`
  3. Fallback: Brand -> `CollaborationDetail`, Creator -> `WorkStatus`
- Pull to refresh

**Notification events catalog:**

| Event | Brand Copy | Creator Copy |
|---|---|---|
| `brief_published` | - | "A new brief matches your niche" |
| `proposal_received` | "New proposal on {brief}" | - |
| `proposal_shortlisted` | - | "You were shortlisted for {brief}" |
| `proposal_declined` | - | "Your proposal was declined" |
| `escrow_funded` | "Escrow funded for {creator}" | "You got accepted for {brief}" |
| `shipment_confirmed` | - | "Product shipped to you" |
| `deliverable_submitted` | "New deliverable from {creator}" | - |
| `revision_requested` | - | "Revision requested on {brief}" |
| `escrow_released` | "Payment released for {creator}" | "Payment received for {brief}" |
| `message_received` | "New message from {creator}" | "New message from {brand}" |
| `payout_sent` | - | "Payout sent" |

**Conditional UI:**
- Unread dot: black for brand, coral for creator
- Grouped by day: TODAY, YESTERDAY, or formatted date
- Empty: bell icon empty state
- Loading: 3 skeleton bars

**Deep link targets:** `BriefsTab`, `ProposalsTab`, `ChatsTab`, `DashboardTab`, `HomeTab`, `DiscoverTab`, `WorkTab`, `EarningsTab`, `ProfileTab`

**Test steps:**
1. Open Notifications screen. Verify notifications load grouped by day.
2. Tap a notification. Verify it marks as read (dot disappears).
3. Verify navigation to correct deep link target.
4. Tap "Mark all as read". Verify all dots disappear.
5. Pull to refresh. Verify data reloads.
6. With no notifications: verify empty state.

---

## 27. Settings and Language

| Item | Detail |
|---|---|
| Screen | `SettingsScreen` |
| Route | `Settings` |
| API | `POST /auth/logout` |

**Controls:**
- Language segmented control: English / Arabic
- Log out row (danger styled)
- Static rows: Payout details, Phone number, Notifications, Help center

**State transitions:**
- Language change: `i18n.changeLanguage('en' | 'ar')`
- Logout: `clearSession()` triggers RootNavigator switch to `AuthStack`
- Logout uses `onSettled` to guarantee session clearing even on network failure

**Test steps:**
1. Navigate to Settings.
2. Toggle language to Arabic. Verify UI direction changes.
3. Toggle back to English. Verify UI direction changes.
4. Tap Log out. Verify redirect to auth screen.

---

## 28. Admin Flows

> [!NOTE]
> Admin screens are API-only. No mobile screens exist for admin. Test via API calls.

### 28.1 Creator Vetting

| Endpoint | Method | Path |
|---|---|---|
| List creators | GET | `/admin/creators?vetting_status=pending` |
| Approve creator | PATCH | `/admin/creators/:id/vetting` with `{ status: 'approved' }` |
| Reject creator | PATCH | `/admin/creators/:id/vetting` with `{ status: 'rejected', reason: '...' }` |

**Rejection side-effects:**
- Auto-declines all open proposals (`applied`, `shortlisted`) with reason `creator_rejected`

### 28.2 Payout Queue

| Endpoint | Method | Path |
|---|---|---|
| List pending payouts | GET | `/admin/payouts` |
| Mark paid | POST | `/admin/payouts/:collaborationId/mark-paid` with `{ method, reference, paidAt }` |

**Mark paid side-effects:**
- Inserts `payout` transaction
- Sets collaboration status to `paid`
- Emits `payout_sent` notification to creator

**Test steps:**
1. Call `GET /admin/creators?vetting_status=pending`. Verify pending creators list.
2. Call `PATCH /admin/creators/:id/vetting` with `approved`. Verify creator status updates.
3. Reject a creator. Verify open proposals auto-decline.
4. Complete a collaboration through approval. Call `GET /admin/payouts`. Verify it appears.
5. Call `POST /admin/payouts/:id/mark-paid`. Verify `paid` status and `payout` transaction.

---

## 29. Push Notifications

| Item | Detail |
|---|---|
| Hook | `usePushRegistration()` |
| API | `POST /users/me/push-token`, `DELETE /users/me/push-token` |

**Flow:**
1. On app start: request push permissions
2. Get Expo push token
3. Register via `POST /users/me/push-token`
4. Subscribe to `Notifications.useLastNotificationResponse()`
5. Route deep links from push tap

**Token validation:** Must match `^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$`

**Dead token handling:** On `DeviceNotRegistered` error, clears token from database.

---

## 30. Payments Webhook

| Item | Detail |
|---|---|
| Endpoint | `POST /webhooks/paymob` |
| Auth | HMAC signature validation |

**Routing logic:**
- If merchant order starts with `campaign_escrow`: calls `CampaignsService.applyEscrowWebhook`
- Otherwise: calls `CollaborationsService.applyPaymentWebhook`

**Test steps:**
1. Fund an escrow via Paymob. Verify webhook fires and escrow balance updates.
2. Verify `charge` transaction recorded with correct Paymob reference.
3. Verify deduplication: send same webhook twice. Verify no duplicate transaction.

---

## 31. Status Enums and Transitions

### Campaign Status

```
draft -> live -> paused -> live (resume)
                        -> cancelled (close)
live -> completed (auto, all slots done)
live -> cancelled (close)
```

### Proposal Status

```
applied -> shortlisted -> accepted
applied -> shortlisted -> declined
applied -> accepted
applied -> declined
```

### Collaboration Status

```
pending_payment -> funded (escrow allocated or payment completed)
pending_payment -> payment_failed
funded -> shipped (brand confirms shipment, physical product)
funded -> delivered (creator uploads, digital product)
shipped -> delivered (creator uploads)
delivered -> approved (brand approves)
delivered -> revision_requested (brand requests revision)
revision_requested -> delivered (creator re-uploads)
approved -> paid (admin marks paid)
```

### Deliverable Status

```
submitted -> approved
submitted -> revision_requested
submitted -> declined
revision_requested -> submitted (new version)
```

### Vetting Status

```
pending -> approved
pending -> rejected
```

### Brand Verification Status

```
unverified -> pending -> verified
```

---

## 32. Database Entity Map

| # | Entity | Table | Key Relations |
|---|---|---|---|
| 1 | User | `users` | Has Brand or Creator profile |
| 2 | RefreshToken | `refresh_tokens` | Belongs to User |
| 3 | Brand | `brands` | Has BrandMembers, Campaigns, Products |
| 4 | BrandMember | `brand_members` | Belongs to Brand and User. Roles: owner, approver, viewer |
| 5 | Creator | `creators` | Has PortfolioItems, PayoutDetails |
| 6 | CreatorPortfolioItem | `creator_portfolio_items` | Belongs to Creator |
| 7 | CreatorPayoutDetail | `creator_payout_details` | Belongs to Creator |
| 8 | PayoutRequest | `payout_requests` | Belongs to Creator |
| 9 | Product | `products` | Belongs to Brand |
| 10 | Campaign | `campaigns` | Belongs to Brand. Has Proposals, Collaborations |
| 11 | Proposal | `proposals` | Belongs to Campaign and Creator |
| 12 | Collaboration | `collaborations` | Belongs to Campaign. Links Proposal, Brand, Creator |
| 13 | Deliverable | `deliverables` | Belongs to Collaboration |
| 14 | DeliverableFeedback | `deliverable_feedback` | Belongs to Deliverable |
| 15 | Transaction | `transactions` | Single ledger. Campaign or Collaboration scoped |
| 16 | Message | `messages` | Belongs to Collaboration. Kind: user or system |
| 17 | Notification | `notifications` | Belongs to User. 11 event types |

---

## Appendix A: Full API Endpoint Reference

| # | Method | Path | Auth | Roles |
|---|---|---|---|---|
| 1 | POST | `/auth/otp/send` | Public | - |
| 2 | POST | `/auth/otp/verify` | Public | - |
| 3 | POST | `/auth/register` | Public | - |
| 4 | POST | `/auth/login` | Public | - |
| 5 | POST | `/auth/refresh` | Public | - |
| 6 | POST | `/auth/logout` | JWT | Any |
| 7 | GET | `/brands/me` | JWT | brand |
| 8 | PATCH | `/brands/me` | JWT | brand (owner) |
| 9 | GET | `/brands/me/dashboard` | JWT | brand |
| 10 | GET | `/brands/me/billing` | JWT | brand (owner, approver) |
| 11 | GET | `/brands/me/members` | JWT | brand |
| 12 | POST | `/brands/me/members` | JWT | brand (owner) |
| 13 | PATCH | `/brands/me/members/:id` | JWT | brand (owner) |
| 14 | DELETE | `/brands/me/members/:id` | JWT | brand (owner) |
| 15 | POST | `/campaigns` | JWT | brand (owner, approver) |
| 16 | GET | `/campaigns/mine` | JWT | brand |
| 17 | GET | `/campaigns` | JWT | creator |
| 18 | GET | `/campaigns/:id` | JWT | brand, creator, admin |
| 19 | PATCH | `/campaigns/:id` | JWT | brand (owner, approver) |
| 20 | POST | `/campaigns/:id/publish` | JWT | brand (owner, approver) |
| 21 | POST | `/campaigns/:id/pause` | JWT | brand (owner, approver) |
| 22 | POST | `/campaigns/:id/resume` | JWT | brand (owner, approver) |
| 23 | POST | `/campaigns/:id/escrow/checkout` | JWT | brand (owner) |
| 24 | POST | `/campaigns/:id/escrow/top-up` | JWT | brand (owner) |
| 25 | POST | `/campaigns/:id/close` | JWT | brand (owner) |
| 26 | GET | `/campaigns/:id/escrow` | JWT | brand |
| 27 | GET | `/collaborations/mine` | JWT | brand, creator |
| 28 | GET | `/collaborations/:id` | JWT | brand, creator |
| 29 | POST | `/proposals/:id/accept` | JWT | brand (owner, approver) |
| 30 | POST | `/collaborations/:id/confirm-shipment` | JWT | brand |
| 31 | GET | `/creators/me` | JWT | creator |
| 32 | PATCH | `/creators/me` | JWT | creator |
| 33 | GET | `/creators/me/portfolio-items` | JWT | creator |
| 34 | POST | `/creators/me/portfolio-items` | JWT | creator |
| 35 | PUT | `/creators/me/payout-details` | JWT | creator |
| 36 | GET | `/creators/:id/payout-details` | JWT | creator, admin |
| 37 | GET | `/creators/me/queue` | JWT | creator |
| 38 | GET | `/creators/me/earnings` | JWT | creator |
| 39 | GET | `/creators/me/ledger` | JWT | creator |
| 40 | POST | `/creators/me/payout-requests` | JWT | creator |
| 41 | POST | `/collaborations/:id/deliverables` | JWT | creator |
| 42 | GET | `/collaborations/:id/deliverables` | JWT | brand, creator |
| 43 | POST | `/deliverables/:id/review` | JWT | brand (owner, approver) |
| 44 | POST | `/collaborations/:id/chat-token` | JWT | brand, creator |
| 45 | GET | `/collaborations/:id/messages` | JWT | brand, creator |
| 46 | POST | `/collaborations/:id/messages` | JWT | brand, creator |
| 47 | GET | `/chats` | JWT | brand, creator |
| 48 | POST | `/collaborations/:id/read` | JWT | brand, creator |
| 49 | GET | `/notifications` | JWT | Any |
| 50 | GET | `/notifications/unread-count` | JWT | Any |
| 51 | POST | `/notifications/:id/read` | JWT | Any |
| 52 | POST | `/notifications/read-all` | JWT | Any |
| 53 | POST | `/webhooks/paymob` | HMAC | - |
| 54 | POST | `/products` | JWT | brand |
| 55 | GET | `/products` | JWT | brand |
| 56 | GET | `/products/:id` | JWT | brand |
| 57 | PATCH | `/products/:id` | JWT | brand |
| 58 | DELETE | `/products/:id` | JWT | brand |
| 59 | POST | `/storage/upload-url` | JWT | Any |
| 60 | POST | `/collaborations/:id/deliverables/upload-url` | JWT | creator |
| 61 | GET | `/deliverables/:id/play-url` | JWT | brand, creator |
| 62 | POST | `/users/me/push-token` | JWT | Any |
| 63 | DELETE | `/users/me/push-token` | JWT | Any |
| 64 | GET | `/admin/creators` | JWT | admin |
| 65 | PATCH | `/admin/creators/:id/vetting` | JWT | admin |
| 66 | GET | `/admin/payouts` | JWT | admin |
| 67 | POST | `/admin/payouts/:collaborationId/mark-paid` | JWT | admin |
| 68 | GET | `/health` | Public | - |

---

## Appendix B: Complete Screen Inventory

### Auth Stack (5 screens)

| # | Screen | Route | File |
|---|---|---|---|
| 1 | OnboardingRoleScreen | OnboardingRole | `screens/auth/OnboardingRoleScreen.tsx` |
| 2 | OnboardingPhoneNumberScreen | OnboardingPhoneNumber | `screens/auth/OnboardingPhoneNumberScreen.tsx` |
| 3 | OnboardingOtpScreen | OnboardingOtp | `screens/auth/OnboardingOtpScreen.tsx` |
| 4 | OnboardingBasicsScreen | OnboardingBasics | `screens/auth/OnboardingBasicsScreen.tsx` |
| 5 | OnboardingPortfolioScreen | OnboardingPortfolio | `screens/auth/OnboardingPortfolioScreen.tsx` |

### Brand Screens (19 screens across 5 tabs)

| # | Screen | Route | Tab |
|---|---|---|---|
| 1 | BrandDashboardScreen | BrandDashboard | Dashboard |
| 2 | MyBriefsScreen | MyBriefs | Briefs |
| 3 | PostBriefScreen | PostBrief | Briefs |
| 4 | CampaignWizardScreen | CampaignWizard | Briefs |
| 5 | EditLiveBriefScreen | EditLiveBrief | Briefs |
| 6 | FundEscrowScreen | FundEscrow | Briefs |
| 7 | ProposalsInboxScreen | ProposalsInbox | Briefs / Proposals |
| 8 | CreatorProfilePreviewScreen | CreatorProfilePreview | Briefs / Proposals |
| 9 | AcceptProposalScreen | AcceptProposal | Briefs / Proposals |
| 10 | CollaborationDetailScreen | CollaborationDetail | Briefs / Proposals |
| 11 | ReviewDeliverableScreen | ReviewDeliverable | Briefs / Proposals |
| 12 | BrandChatsScreen | BrandChats | Chats |
| 13 | BrandProfileScreen | BrandProfile | Profile |
| 14 | BrandSetupScreen | BrandSetup | Profile |
| 15 | BrandPhoneVerificationScreen | BrandPhoneVerification | Profile |
| 16 | BrandTeamScreen | BrandTeam | Profile |
| 17 | BrandBillingScreen | BrandBilling | Profile |
| 18 | ProductsListScreen | ProductsList | Profile |
| 19 | ProductFormScreen | ProductForm | Profile |

### Creator Screens (13 screens across 5 tabs)

| # | Screen | Route | Tab |
|---|---|---|---|
| 1 | CreatorHomeScreen | Home | Home |
| 2 | PendingVettingScreen | PendingVetting | Home |
| 3 | CampaignDiscoveryScreen | Discover | Discover |
| 4 | CampaignDetailScreen | CampaignDetail | Discover |
| 5 | CollaborationStatusScreen | WorkStatus | Work |
| 6 | DeliverableUploadScreen | DeliverableUpload | Work |
| 7 | PayoutsScreen | Earnings | Earnings |
| 8 | CreatorProfileScreen | Profile | Profile |
| 9 | EditProfileScreen | EditProfile | Profile |
| 10 | MyProposalsScreen | MyProposals | Profile |
| 11 | NoOpenBriefsStateScreen | (inline) | Discover |
| 12 | UploadFailedStateScreen | (inline) | Work |

### Shared Screens (3 screens)

| # | Screen | Route | Available In |
|---|---|---|---|
| 1 | CollaborationChatScreen | CollaborationChat | Brand (Briefs, Proposals, Chats), Creator (Work) |
| 2 | NotificationsScreen | Notifications | Brand (Dashboard), Creator (Home) |
| 3 | SettingsScreen | Settings | Brand (Profile), Creator (Profile) |

---

## Appendix C: End-to-End Master Flow

This is the full happy-path flow from brand brief creation to creator payout.

```
Brand                              API                                Creator
──────                           ──────                             ─────────
1. Login (OTP)                     ← auth tokens →
2. Brand Setup                     ← profile saved →
   (logo, name, category, doc)
3. Phone Verification              ← OTP verified →
4. Create Product                  ← product saved →
5. Post Brief                      ← campaign draft →
6. Fund Escrow                     ← charge transaction →
   (Paymob checkout or mock)       ← campaign published →
                                                                     7. Login (OTP)
                                                                     8. Onboarding Basics
                                                                        (name, city, niches, clip)
                                                                     9. Onboarding Portfolio
                                                                        (media, price, handle)
                                                                     10. Admin approves vetting
                                                                     11. Discover brief
                                                                     12. Submit proposal
                                   ← proposal created →                 (price, days, pitch)
13. Review proposals
14. Shortlist proposal             ← status: shortlisted →
15. Preview creator profile
16. Accept proposal                ← hold transaction →
                                   ← collaboration: funded →
                                   ← system msg: escrow_funded →
17. Confirm shipment               ← collaboration: shipped →       18. Receive notification
    (carrier, tracking)            ← system msg: shipment_confirmed →
                                                                     19. Upload deliverable
                                   ← collaboration: delivered →          (video, checklist, note)
                                   ← system msg: deliverable_submitted →
20. Review deliverable
    Option A: Request revision     ← collaboration: revision_requested →
                                   ← system msg: revision_requested →
                                                                     21. Upload new version
                                   ← collaboration: delivered →
    Option B: Approve & release    ← release + fee transactions →
                                   ← collaboration: approved →
                                   ← system msg: escrow_released →
                                                                     22. View earnings
                                                                     23. Request payout
                                   ← payout request →
24. Admin: mark paid               ← payout transaction →
                                   ← collaboration: paid →
                                   ← notification: payout_sent →
```

**Total screens touched:** 42  
**Total API endpoints:** 68  
**Total database entities:** 17  
**Total notification events:** 11  
**Total collaboration status transitions:** 9  
