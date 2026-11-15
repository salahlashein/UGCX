# UGCX V1 Simplification and Feature Decommissioning Plan

## Executive Summary

The purpose of UGCX is simple: **connect brands with creators to produce user-generated content safely and get paid**.

The current application contains 32 implemented feature modules. Several features introduce high complexity, external service failure points, and onboarding drop-offs.

This document lists every implemented feature. It classifies each feature into three action buckets:
- **Bucket A (Core MVP - Keep)**: Essential to the core flow (Brief -> Proposal -> Accept -> Content Delivery -> Payment).
- **Bucket B (Decommission via Feature Flag - High Risk)**: High complexity or third-party dependencies that can break in production.
- **Bucket C (Defer / Simplify - Low Risk)**: Secondary features that add cognitive load without helping the first transaction.

---

## Minimalist V1 Core Flow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        UGCX V1 STREAMLINED CORE                        │
└────────────────────────────────────────────────────────────────────────┘

    [ Brand User ]                                  [ Creator User ]
          │                                                │
    1. Quick Phone OTP                               1. Quick Phone OTP
          │                                                │
    2. Post Brief (1-Page Form)                            │
          │                                                │
    3. Fund Escrow (Staged / Direct)                       │
          │                                                │
          └───────────────▶ 4. Discover Brief ─────────────┘
                                   │
                            5. Send Proposal (Price + Pitch)
                                   │
    6. Accept Proposal ◀───────────┘
          │
    7. Escrow Held Automatically
          │
          ├──────────────── Chat & Coordinate ─────────────┤
          │                                                │
          │                                          8. Upload Video
          │                                                │
    9. Review & Approve Video ◀────────────────────────────┘
          │
   10. Balance Released to Creator Earnings
```

---

## Complete Feature Inventory & V1 Decommissioning Recommendations

| ID | Feature | Current State | Risk / Failure Mode | V1 Recommendation | Proposed Feature Flag |
|---|---|---|---|---|---|
| **01** | Role Selection & Phone OTP | 2-step onboarding | Low risk. Reliable mock/SMS. | **KEEP (Core)** | `None` |
| **02** | Creator Video Clip Verification | Mandatory selfie clip on signup | High drop-off. Cloudflare R2 upload fails on weak mobile connections. | **DECOMMISSION** | `FF_CREATOR_VERIFICATION_CLIP` |
| **03** | Creator Mandatory Portfolio Upload | Multi-item media upload | Creators abandon onboarding before seeing briefs. | **DECOMMISSION / OPTIONAL** | `FF_ONBOARDING_PORTFOLIO_REQUIRED` |
| **04** | Creator Vetting Approval Gate | Locks app until admin approval | Creators cannot apply immediately. High admin bottleneck. | **DECOMMISSION (Auto-Approve)** | `FF_CREATOR_VETTING_GATE` |
| **05** | Brand Commercial Document Upload | PDF upload during brand setup | Brands abandon signup. Requires manual document inspection. | **DECOMMISSION** | `FF_BRAND_DOC_VERIFICATION` |
| **06** | Brand Team Management (Roles & Invites) | Owner, Approver, Viewer guards | Permission edge cases. Team invite email delivery failures. Most initial brands are 1 user. | **DECOMMISSION** | `FF_BRAND_TEAM_MANAGEMENT` |
| **07** | Product Catalog Subsystem | CRUD for brand products with value props | Extra step before posting briefs. Redundant for MVP. | **DECOMMISSION** | `FF_PRODUCT_CATALOG` |
| **08** | 5-Step Campaign Wizard | 5 screens (Script, Do Not Say, Slots) | High cognitive burden. 80% of briefs only need title, price, and description. | **DECOMMISSION (Use 1-page form)** | `FF_CAMPAIGN_WIZARD_MULTI_STEP` |
| **09** | 1-Page Post Brief Form | Clean single-screen brief creation | Fast, reliable, low validation friction. | **KEEP (Core)** | `None` |
| **10** | Paymob Live 3DS & Webhook Flow | 90s polling, HMAC webhooks, 3DS cards | Cards decline. Webhooks drop. Bank transfers take days to reconcile. | **SIMPLIFY / FLAG** | `FF_LIVE_PAYMOB_GATEWAY` |
| **11** | Internal Escrow Ledger | PostgreSQL double-entry `transactions` | Critical trust mechanism. Safe, verified, zero external dependencies. | **KEEP (Core)** | `None` |
| **12** | Campaign Discovery Feed | Search and filter briefs | Creators need to find work. Simple and fast. | **KEEP (Core)** | `None` |
| **13** | Proposal Submission | Bottom sheet with price and pitch | Clean and intuitive. | **KEEP (Core)** | `None` |
| **14** | Duplicate Proposal Constraint | Unique database index | Prevents spam and racing bugs. | **KEEP (Core)** | `None` |
| **15** | Brand Proposals Inbox & Shortlist | Review applicant cards | Essential for brand decision-making. | **KEEP (Core)** | `None` |
| **16** | Creator Profile Preview Modal | Displays creator stats and work | Helps brand evaluate creator. | **KEEP (Core)** | `None` |
| **17** | Proposal Acceptance & Allocation | Allocates escrow to collaboration | Core business transaction. | **KEEP (Core)** | `None` |
| **18** | Physical Shipment Tracking Module | Carrier name + tracking number fields | Adds friction if product is digital or brand ships via local courier without tracking. | **DECOMMISSION (Handle in chat)** | `FF_PHYSICAL_SHIPMENT_TRACKING` |
| **19** | Deliverable Video Upload | Creator uploads video deliverable | Core deliverable. | **KEEP (Core)** | `None` |
| **20** | Multi-Version Revision Loop | Versioning v1, v2, reject reasons | Complex state transitions. High dispute friction for V1. | **SIMPLIFY (Single review/revision)** | `FF_MULTI_VERSION_DELIVERABLES` |
| **21** | In-App Collaboration Chat | Direct text chat between brand & creator | Essential for alignment and sharing details. | **KEEP (Core)** | `None` |
| **22** | Ably Realtime WebSocket Layer | Live socket connection | WebSocket disconnections on mobile networks. Connection limit costs. | **DECOMMISSION (Use HTTP Polling)** | `FF_ABLY_WEBSOCKETS` |
| **23** | Creator Home Work Queue | Lists active jobs and statuses | Clear task list for creator. | **KEEP (Core)** | `None` |
| **24** | Creator Earnings Display | Displays earned and pending money | Motivates creator. Clear transparency. | **KEEP (Core)** | `None` |
| **25** | Automated Payouts Engine | Bank transfer, Vodafone Cash payout forms | Risk of financial loss, bank integration bugs, regulatory scrutiny. | **DECOMMISSION (Manual Payouts)** | `FF_AUTOMATED_PAYOUTS` |
| **26** | Brand Dashboard Advanced Metrics | ROI charts, completion rates | Unnecessary calculation overhead for small launch volume. | **DECOMMISSION (Simple counts only)** | `FF_ADVANCED_DASHBOARD_METRICS` |
| **27** | Brand Billing & Invoice Downloads | Invoices list and receipts | Brands at launch require simple receipts or manual invoicing. | **DECOMMISSION** | `FF_BRAND_BILLING_INVOICES` |
| **28** | Expo Push Notifications | APNs/FCM background pushes | Certificate expiry, silent delivery drops, permissions denial. | **DECOMMISSION (In-app only)** | `FF_PUSH_NOTIFICATIONS` |
| **29** | In-App Notification Center | Bell icon list of events | Clear, predictable, zero external dependencies. | **KEEP (Core)** | `None` |
| **30** | Dynamic RTL Language Switcher | Live Arabic / English toggle | Layout breaks on dynamic toggle without full app reload. | **SIMPLIFY (Default or clean reload)** | `FF_DYNAMIC_RTL_TOGGLE` |

---

## Detailed Rationale for Top Decommissioning Candidates

### 1. Brand Team Management (`FF_BRAND_TEAM_MANAGEMENT`)
- **Current Complexity**: Includes `BrandMember` entity, `BrandRoleGuard`, invite tokens, email notifications, role mutation endpoints, and UI sheets.
- **Why Decommission**: In the first release, 98% of onboarded brands have a single user (founder or marketing lead). Edge cases around who can approve deliverables or accept proposals create live permission blockers.
- **V1 Replacement**: The user who registers the brand is the sole owner and operator.

### 2. Product Catalog (`FF_PRODUCT_CATALOG`)
- **Current Complexity**: Dedicated CRUD endpoints, database tables, product selector in brief authoring, and product image uploads.
- **Why Decommission**: Brands find it tedious to build a product catalog before they can post a single brief.
- **V1 Replacement**: Brands type the product name and description directly into the brief form.

### 3. 5-Step Campaign Wizard (`FF_CAMPAIGN_WIZARD_MULTI_STEP`)
- **Current Complexity**: Multi-step state machine with draft persistence, script modes (`brand` vs `creator`), talking points tags, and do-not-say constraints.
- **Why Decommission**: Creators report that overly rigid briefs limit organic creativity. Brands abandon multi-step wizards due to form fatigue.
- **V1 Replacement**: Use the existing single-screen [PostBriefScreen](file:///C:/Users/Salah%20Lashein/source/repos/UGCX/apps/mobile/src/screens/brand/PostBriefScreen.tsx). It captures title, video type, duration, budget, and instructions in under 60 seconds.

### 4. Creator Video Verification & Vetting Gate (`FF_CREATOR_VETTING_GATE`)
- **Current Complexity**: New creators must upload a 10-second selfie video, wait in a `pending_vetting` state, and cannot view or apply to briefs until an administrator updates the database.
- **Why Decommission**: This is the single biggest cause of creator attrition. If the admin takes 12 hours to review, the creator never returns.
- **V1 Replacement**: Creators are active immediately upon phone OTP verification. You vet creators naturally by reviewing their proposal pitches before accepting.

### 5. Automated Payout Requests (`FF_AUTOMATED_PAYOUTS`)
- **Current Complexity**: Bank account details, wallet provider routing, payout request states (`pending`, `processing`, `paid`, `rejected`), and ledger holdbacks.
- **Why Decommission**: Live payout bugs carry direct financial risk. Early stage marketplaces in MENA operate safely by running weekly manual batch payouts via InstaPay or Vodafone Cash.
- **V1 Replacement**: Creators see their `earned_balance` on the Earnings screen. A simple "Request Payout" button opens a WhatsApp or support message with their balance pre-filled.

### 6. Ably Realtime WebSockets (`FF_ABLY_WEBSOCKETS`)
- **Current Complexity**: Persistent socket connections, presence channels, token exchange endpoints, reconnection fallbacks.
- **Why Decommission**: Mobile devices in MENA frequently switch between Wi-Fi and 4G, causing socket dropped states and missed messages.
- **V1 Replacement**: Polling using TanStack Query (e.g. 5-second interval while chat is focused). It uses plain HTTP, requires zero third-party socket infrastructure, and recovers automatically.

### 7. Push Notifications (`FF_PUSH_NOTIFICATIONS`)
- **Current Complexity**: APNs certificates, Firebase Cloud Messaging credentials, token rotation, background payload handling.
- **Why Decommission**: Push notification setup on iOS and Android requires constant maintenance and certificate renewals.
- **V1 Replacement**: In-app notifications list and SMS OTP for critical alerts.

---

## Recommended Feature Flag Architecture

We can implement a simple, typed feature flag system across the monorepo:

### In Shared Types (`packages/shared-types/src/feature-flags.ts`):
```typescript
export interface FeatureFlags {
  brandTeamManagement: boolean;
  productCatalog: boolean;
  campaignWizardMultiStep: boolean;
  creatorVettingGate: boolean;
  creatorVerificationClip: boolean;
  automatedPayouts: boolean;
  ablyWebsockets: boolean;
  pushNotifications: boolean;
  brandBillingInvoices: boolean;
  physicalShipmentTracking: boolean;
}

export const DEFAULT_V1_FEATURE_FLAGS: FeatureFlags = {
  brandTeamManagement: false,
  productCatalog: false,
  campaignWizardMultiStep: false,
  creatorVettingGate: false,
  creatorVerificationClip: false,
  automatedPayouts: false,
  ablyWebsockets: false,
  pushNotifications: false,
  brandBillingInvoices: false,
  physicalShipmentTracking: false,
};
```

---

## Next Steps for Alignment

1. **Review this document**: Confirm whether you agree with decommissioning the 7 identified high-risk modules.
2. **Implement Feature Flag Module**: Add a lightweight flag switch in API and Mobile client.
3. **Verify the Streamlined Flow**: Test the core user journey end-to-end with the flagged features hidden.
