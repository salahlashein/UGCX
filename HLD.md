# UGCX — High-Level Design & Phased Roadmap

## Executive Summary

- **Title**: UGCX — UGC creative marketplace for MENA (Egypt-first)
- **Description**: A two-sided marketplace app. Brands post video briefs. Vetted creators apply, ship gets sent, creators film, brands approve and pay through escrow.
- **Business Context**: Adapts the Influee.co model for the MENA region, with Arabic and English support, starting in Egypt.
- **Version**: 0.1 (draft)
- **Date**: 2026-08-31
- **Problem Statement**: Egyptian and MENA e-commerce brands cannot source authentic, localized UGC video ads at speed. Existing options are slow agencies, ad-hoc DMs, or platforms built for the US/EU market with no Arabic support and no local payment rails.
- **Proposed Solution**: One mobile app (brand mode and creator mode) backed by a shared API and database. The API also serves a website in a later phase, so the mobile app is not a dead end.
- **Success Criteria**:
  1. First paid collaboration completed end-to-end (brief → apply → ship → deliver → approve → escrow release) within 8 weeks of Phase 1 start.
  2. 20 active brands and 100 vetted creators in the launch niche within 90 days of public Phase 1 launch.
  3. Median time from campaign publish to first proposal under 48 hours.
  4. Zero unresolved payment disputes at launch (manual ops can absorb early volume).
- **Goals**: Prove the marketplace loop works in one Egyptian niche with mostly manual ops, then automate and expand.
- **Personas**: Brand user (posts campaigns, funds escrow, reviews content), Creator user (applies, ships address, delivers video, requests payout), Admin/Ops (vets creators, resolves disputes, runs manual payouts, moderates content).
- **Tech Stack**: React Native (Expo) mobile app, NestJS + TypeScript API, PostgreSQL + TypeORM, Cloudflare R2 for media, Paymob for payment collection, Ably for chat, Expo Push for notifications.
- **Architecture**: Modular monolith API behind a versioned REST contract, one client app for both roles, database and API designed so a future website consumes the same endpoints unchanged.

---

## Scope

### Definitions & Ubiquitous Language

| Term | Definition |
|---|---|
| Brand | The paying customer who posts a campaign and buys content. |
| Creator | The person who films content and gets paid per collaboration. |
| Campaign | A brief posted by a brand describing the video it wants. |
| Proposal | A creator's application to a campaign, with their price. |
| Collaboration | An accepted proposal. This is the billing and escrow unit. |
| Escrow | Funds captured from the brand and held by the platform until the brand approves the delivered content. |
| Deliverable | A file a creator submits against a collaboration. |

### Project Context

MENA e-commerce brands run paid social (Meta, TikTok) and need a constant stream of native-feeling video ads. Egypt has a large, low-cost creator base and a fast-growing DTC scene, but no dedicated Arabic-first UGC marketplace exists yet. The user (solo or a 1-2 person team) wants to launch narrow, then widen to other MENA markets and a companion website, reusing the same backend.

### System Boundaries

**In Scope (Phase 1):**
- Brand campaign creation, one niche, Egypt only, Arabic + English UI.
- Creator profile, portfolio, and application flow.
- Manual creator vetting by an admin (no automated scoring yet).
- Escrow-style payment: full charge to the platform on acceptance, held internally, released on approval.
- Manual, ops-recorded creator payouts (bank transfer / InstaPay / mobile wallet).
- Delivery upload, revision requests, approval.
- In-app chat between a brand and a creator on a collaboration.

**Out of Scope (Phase 1, revisit later):**
- Video editor / auto-captioning product.
- Influencer marketing product (audience scoring, Influee-Score equivalent).
- Automated payout rails, automated escrow splitting.
- MCP / agent layer.
- Public website (backend is built so this is additive later, not rebuilt).
- Multi-country expansion beyond Egypt.

### Target Users

**Primary Users:** Egyptian DTC/e-commerce brands running paid social; Egyptian content creators (no follower minimum, "filmmakers not influencers").

**Secondary Users:** Admin/ops (the founder, initially) for vetting, dispute resolution, manual payouts.

- **Scale (Phase 1)**: tens of brands, low hundreds of creators, hand-managed. No load concerns yet.
- **Roles**: `brand`, `creator`, `admin`. A single account has exactly one role in Phase 1 (an agency-style brand with multiple sub-brands is out of scope until Phase 4).
- **Core capability**: brand posts a campaign and pays; creator applies and delivers; admin vets and adjudicates.

### Roadmap

| Phase | Title | Description | Duration (solo/1-2 devs) |
|---|---|---|---|
| 1 | Prove the loop | One Egyptian niche, manual vetting, manual payouts, escrow-style payments, mobile app for both roles. | ~8-10 weeks |
| 2 | Liquidity & automation | Matching, shipping tracker, automated payouts, subscription plans + quota enforcement, money-back guarantee, basic SEO-ready web presence. | ~8-10 weeks |
| 3 | Defensibility | AI brief/script writer, caption + resize renderer, promo code / UTM attribution, creator academy content, quality score. | ~10-14 weeks |
| 4 | Infrastructure & expansion | Public API docs, MCP server, ad-platform push (Meta/TikTok), second MENA market, agency workspaces. | Open-ended |

---

# 1 · Architecture Overview

## 1.1 Component Map

| Component | Responsibility | Tech | Notes |
|---|---|---|---|
| Mobile App | Brand mode + creator mode UI, chat, uploads | React Native (Expo), TypeScript | One codebase, one App Store / Play Store listing, role-based navigation |
| API Backend | All business logic, auth, escrow ledger, matching | NestJS, TypeScript | Also serves the Phase 2+ website — no separate API needed later |
| Database | System of record | PostgreSQL, TypeORM | Relational fits escrow/financial integrity needs |
| Media Storage | Video/photo uploads | Cloudflare R2 (S3-compatible) | Cheaper egress than S3, good for video-heavy traffic |
| Payments | Card/wallet/cash collection from brands | Paymob (Egypt) | No native marketplace split — platform charges in full, holds funds as an internal ledger entry |
| Chat | Real-time brand-creator messaging | Ably (managed pub/sub) | Avoids self-hosting WebSocket infra as a solo dev |
| Push Notifications | Application updates, delivery status | Expo Push | Built into Expo, no extra service |
| Admin Tool | Vetting, disputes, manual payouts | A small internal web app (Next.js) or an admin panel framework | Not customer-facing, can be rough |

## 1.2 Architecture Diagram

```
┌──────────────────────────┐        ┌───────────────────────────┐
│   Mobile App (Expo/RN)     │        │  Website (Phase 2+, Next.js)│
│  brand mode | creator mode │        │  same API, no rebuild        │
└─────────────┬───────────────┘        └─────────────┬───────────────┘
              │                                          │
              └───────────────── HTTPS / REST (JSON) ─────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │        API Backend           │
                     │    NestJS + TypeScript       │
                     │  auth · campaigns · escrow    │
                     │  matching · chat · admin      │
                     └──────────────┬────────────────┘
                                    │
        ┌───────────────────┬───────────────────┬───────────────────┐
        ▼                   ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  PostgreSQL     │  │ Cloudflare R2  │  │     Paymob      │  │  Ably / Expo    │
│  (TypeORM)      │  │ videos/photos  │  │  card/wallet    │  │  Push chat +     │
│                 │  │                │  │  charges        │  │  notifications  │
└───────────────┘  └────────────────┘  └────────────────┘  └────────────────┘
```

## 1.3 Why this stack (for a solo/1-2 dev team)

- **One mobile codebase, both roles.** Matches the decision to ship brand and creator experiences in the same app. Role is a field on the user, and navigation branches on it. Revisit a separate lean web app for brand campaign creation in Phase 2 if brand users complain about building briefs on a phone — this is a real UX risk, tracked in the decision log below.
- **One backend, two future clients.** The API is versioned (`/v1/...`) and has no mobile-only assumptions (no client-side session state, no platform-specific payloads), so the Phase 2+ website calls the same endpoints.
- **PostgreSQL over a document store.** Escrow, collaborations, and payouts are financial records. Relational integrity and transactions matter more here than schema flexibility.
- **Paymob, not Stripe.** Stripe does not support Egyptian payouts or local cards well. Paymob is the dominant Egyptian gateway (cards, Fawry cash-in, mobile wallets). It has no built-in marketplace split, so Phase 1 escrow is a ledger built in-house: charge the brand in full, mark funds "held," release the hold record on approval, then an admin executes the actual payout (bank transfer / InstaPay / Vodafone Cash) and marks it paid. This is the simplest approach that meets Phase 1's needs. Automated payout via Paymob's payout API or an aggregator is a Phase 2 item.
- **Arabic + English from day one.** The UI is built with `react-i18next` and RTL layout support (Expo's `I18nManager`) from the first screen, because retrofitting RTL later is expensive. Translation content itself stays an ongoing ops cost, not a one-time build cost.

---

# 2 · Data Model (Phase 1 subset)

## 2.1 Core Entities

| Entity | Key Attributes | Relationships |
|---|---|---|
| User | id, role(brand\|creator\|admin), locale, phone, email | 1:1 with Brand or Creator profile |
| Brand | id, user_id, company_name, country, payment_method_ref | 1:N Campaign |
| Creator | id, user_id, name, city, niches[], base_price, portfolio_items[], vetting_status, payout_details | 1:N Proposal |
| Product | id, brand_id, name, description, value_props[], images[] | belongs to Brand, referenced by Campaign |
| Campaign | id, brand_id, product_id, status, niche, video_type, duration, script, needs_shipping | 1:N Proposal |
| Proposal | id, campaign_id, creator_id, price, delivery_days, status | belongs to Campaign and Creator |
| Collaboration | id, campaign_id, creator_id, agreed_price, platform_fee, status, shipment{}, escrow_txn_id | the billing unit |
| Deliverable | id, collaboration_id, type, file_url, status, feedback_thread[] | belongs to Collaboration |
| Message | id, collaboration_id, sender_id, body, sent_at | belongs to Collaboration |
| Transaction | id, collaboration_id, type(charge\|hold\|release\|payout\|refund), amount, status, recorded_by | the escrow ledger |

## 2.2 Escrow Flow (sequence)

```
Brand              API Backend            Paymob            Admin (ops)          Creator
 │  accept proposal    │                     │                    │                   │
 ├─────────────────────►                     │                    │                   │
 │                      │ create charge       │                    │                   │
 │                      ├─────────────────────►                    │                   │
 │                      │  webhook: success    │                    │                   │
 │                      ◄─────────────────────┤                    │                   │
 │                      │ Collaboration=funded │                    │                   │
 │                      │ Transaction=hold      │                    │                   │
 │  confirm shipment    │                      │                    │                   │
 ├─────────────────────►                      │                    │                   │
 │                      │                      │                    │  ship product      │
 │                      │                      │                    ├──────────────────►│
 │                      │                      │                    │  film + upload      │
 │                      │                      │                    │◄──────────────────┤
 │  review + approve    │                      │                    │                   │
 ├─────────────────────►                      │                    │                   │
 │                      │ Transaction=release   │                    │                   │
 │                      │ notify admin queue    │                    │                   │
 │                      ├───────────────────────────────────────────►                   │
 │                      │                      │                    │  bank/InstaPay      │
 │                      │                      │                    ├──────────────────►│
 │                      │                      │                    │  mark payout paid    │
 │                      │◄───────────────────────────────────────────┤                   │
 │                      │ Transaction=payout    │                    │                   │
```

The manual payout step is the one intentional bottleneck in Phase 1. It exists because automating Egyptian payouts requires either a Paymob payout integration or a licensed disbursement partner, and validating demand comes before that integration cost. Automate this in Phase 2 once volume makes manual payouts a real time sink.

---

# 3 · Phase 1 — Detailed Spec

## 3.1 Functional Requirements

- **REQ-001**: A brand can create a campaign with product info, niche, video type, duration, script mode, and shipping requirement.
- **REQ-002**: A creator can browse open campaigns filtered by niche and submit a proposal with their own price.
- **REQ-003**: A brand can accept a proposal, which captures full payment via Paymob and creates a Collaboration in `funded` status.
- **REQ-004**: A brand can confirm shipment with a tracking reference.
- **REQ-005**: A creator can upload one or more deliverables against a Collaboration.
- **REQ-006**: A brand can request a revision, decline, or approve a deliverable. Approval releases the escrow hold.
- **REQ-007**: An admin can view all `released` collaborations awaiting payout and mark one as paid after sending funds manually.
- **REQ-008**: A brand and a creator can exchange messages scoped to a Collaboration.
- **SEC-001**: All payment webhooks from Paymob are signature-verified before any Transaction record is created.
- **CON-001**: A creator cannot see a brand's contact details, and a brand cannot see a creator's payout details. Only the admin sees payout details.
- **GUD-001**: All user-facing text ships in Arabic and English from the first release; no hard-coded strings.

```gherkin
Feature: Escrow-backed collaboration
  Scenario: Brand accepts a proposal and funds are held
    Given a brand has an open campaign with one proposal from a creator
    When the brand accepts the proposal
    Then the platform charges the brand's payment method for the full agreed price
    And a Collaboration is created with status "funded"
    And a Transaction of type "hold" is recorded

  Scenario: Brand approves delivered content
    Given a Collaboration is in status "delivered"
    When the brand approves the deliverable
    Then the Collaboration status changes to "approved"
    And a Transaction of type "release" is recorded
    And the collaboration appears in the admin payout queue
```

## 3.2 Non-Functional Requirements (Phase 1)

| Category | Requirement | Target |
|---|---|---|
| Availability | Single-region deployment is acceptable | Best-effort, no formal SLA at this volume |
| Performance | Campaign feed and proposal actions respond quickly | Under 500ms p95 for API calls, excluding uploads |
| Localization | Arabic (primary) and English, full RTL support | Both languages ship at launch |
| Security | Payment webhook signatures verified, payout details restricted to admin role | No card data touches the backend directly (Paymob-hosted checkout) |
| Observability | Enough logging to trace a payment from charge to payout | Structured logs (pino), one log line per Transaction state change |

## 3.3 Package Dependencies (Phase 1)

| Package | Purpose |
|---|---|
| expo, react-native | Mobile app runtime |
| react-i18next, expo-localization | Arabic/English, RTL |
| @nestjs/core, @nestjs/common, @nestjs/platform-express | API backend |
| @nestjs/typeorm, typeorm, pg | Database access |
| @nestjs/jwt, @nestjs/passport, passport-jwt | Auth |
| class-validator, class-transformer | Input validation on every API boundary (NestJS DTO convention) |
| paymob SDK / REST integration | Payment collection |
| ably | Chat |
| nestjs-pino | Structured logging |

Check each package's latest version and license before installing.

---

# 4 · Phases 2-4 (lighter detail, revisit before starting each)

## Phase 2 — Liquidity & Automation
Add creator-campaign matching (niche + city), a shipping tracker with carrier tracking numbers, automated payouts (Paymob payout API or a licensed disbursement partner), subscription tiers with collaboration-quota enforcement, and the money-back guarantee mechanic. Stand up a minimal SEO-ready web presence backed by the same API, so country/niche landing pages can start compounding organic traffic early.

## Phase 3 — Defensibility
AI brief and script writer for brands. A caption/resize/template renderer for delivered videos (FFmpeg + a captioning model). Promo code and UTM attribution per creator. A structured vetting workflow and early creator-academy content. A first-pass quality score for creators, built from delivery approval rates and revision counts already captured in Phase 1 data.

## Phase 4 — Infrastructure & Expansion
Publish the API for external use and layer an MCP server on top of it, following the same tool-per-action pattern as Influee's. Add ad-platform push (Meta, TikTok). Expand to a second MENA market, reusing the Phase 1-3 platform with new payment rails and localized content. Add agency multi-brand workspaces.

---

# 5 · Risks & Open Decisions

| ID | Item | Why it matters | Recommendation |
|---|---|---|---|
| RISK-001 | Brand campaign creation on mobile may be uncomfortable for a form-heavy task | Influee itself puts this on desktop web for a reason | Ship it mobile-first per the decision made, but budget a Phase 2 lean web campaign builder if brand feedback confirms friction |
| RISK-002 | Paymob requires an Egyptian commercial registration for a merchant account | Blocks real payment collection until resolved | Confirm business registration status before Phase 1 payment integration work starts |
| RISK-003 | Manual payouts do not scale past a small number of creators | Founder becomes the bottleneck | Cap Phase 1 to the volume one person can pay out weekly; automate in Phase 2 once that cap is hit |
| RISK-004 | Niche not yet chosen | Campaign matching, creator recruiting, and SEO all depend on it | Pick one of: beauty & personal care, fashion, mom & baby, or food/FMCG based on where existing Egyptian UGC creator supply is deepest; confirm before Phase 1 creator recruiting starts |
| DEC-001 | Both brand and creator roles ship in one app | User decision, 2026-08-31 | Tracked, not open |
| DEC-002 | Egypt is the Phase 1 market | User decision, 2026-08-31 | Tracked, not open |

---

# Appendix: Glossary

| Term | Definition |
|---|---|
| Escrow | Held funds, captured from the brand and released to the creator only after content approval. |
| Ledger | The Transaction table. The internal record of every fund movement, since Paymob does not split payments natively. |
| RTL | Right-to-left layout, required for Arabic. |

---

# 6 · Architectural Audit Findings & V1 Decommissioning Baseline (2026-10-29)

### 6.1 Architecture Health Summary
- **Backend**: NestJS modular monolith with TypeORM and PostgreSQL 16. Single-table immutable ledger (`transactions`) enforces double-entry invariant (`charge`, `hold`, `release`, `fee`).
- **Frontend**: React Native Expo with Zustand client stores and TanStack Query server-state cache. Full bilingual localization with English and Arabic RTL.
- **Verification**: All 8 core marketplace flows were verified end-to-end against the real PostgreSQL database and captured via Puppeteer automation.

### 6.2 Active V1 Decommissioning Strategy
To maximize release speed and eliminate live third-party failure points, high-risk modules are isolated behind feature flags (`features.ts` / `feature-flags.ts`):
1. `brandTeamManagement`: Disabled for launch. Brands operate as single-user entities.
2. `productCatalog`: Disabled. Brands write product details directly into brief text fields.
3. `campaignWizardMultiStep`: Replaced by a streamlined 1-page PostBrief form.
4. `creatorVettingGate` & `creatorVerificationClip`: Selfie upload is optional; creators are auto-admitted to discovery.
5. `automatedPayouts`: Replaced with manual operations payout notices.
6. `pushNotifications`: APNs/FCM disabled in favor of predictable in-app notifications.

### 6.3 Technical Debt & Remediation Priorities
- **CRITICAL**: Scope deliverable review transactions strictly to database writes to prevent connection pool exhaustion during concurrent reviews.
- **HIGH**: Resolve ESLint `@typescript-eslint/no-explicit-any` errors in test specs and services to ensure CI pipeline stability.
- **HIGH**: Add IP and phone-rate throttling to `/auth/otp/send` to prevent SMS bombing.
- **MEDIUM**: Implement asynchronous webhook queue for Paymob payment confirmations.
