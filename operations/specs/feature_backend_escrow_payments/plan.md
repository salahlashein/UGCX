# Document Control
- **Version**: 1.0
- **Date Created**: 2026-08-31
- **Last Updated**: 2026-08-31
- **Status**: Implemented

---

# Executive Summary

- **Goal**: Implement the money-touching half of the marketplace loop — accepting a proposal charges the brand, the platform holds the funds, delivery and approval release the hold, and an admin executes the manual payout to the creator. Add the chat that runs alongside a collaboration.
- **Scope**: production feature (Phase 1 slice), high-risk domain (financial correctness)
- **Domains**: backend, database, external integration (payments, chat)
- **Architecture**: New NestJS modules (`collaborations`, `deliverables`, `transactions`, `payments`, `messages`, `admin` payout extension) inside `apps/api`. Paymob is the payment collector; the platform itself is the escrow ledger, since Paymob has no marketplace-split product in Egypt. Ably issues short-lived, per-collaboration chat tokens. Cloudflare R2 receives deliverable files directly from the mobile app via presigned URLs — the API never proxies video bytes.
- **Tech Stack**: NestJS, TypeORM, PostgreSQL, Paymob Accept API (REST), Ably server SDK, AWS SDK v3 S3 client (R2 is S3-compatible).
- **Entry Condition**: `feature_backend_core_domain` plan is complete — brands, creators, campaigns, and proposals exist and are reachable through the API.
- **Exit Condition**: A brand can accept a proposal and be charged through Paymob. A funded collaboration can be shipped, delivered, revised, and approved. Approval puts the collaboration in the admin payout queue. An admin can mark a payout as paid. A brand and a creator can exchange messages on a funded collaboration. Every money movement has a corresponding `Transaction` row. Webhook signature verification and idempotency are covered by tests.

---

# Requirements

## Functional Requirements

- **REQ-001**: WHEN a brand accepts a proposal THE SYSTEM SHALL create a `Collaboration` in status `pending_payment`, register an order with Paymob, and return a checkout URL to the client.
- **REQ-002**: WHEN Paymob's webhook reports a successful transaction for a `Collaboration` THE SYSTEM SHALL set its status to `funded`, mark the linked `Proposal` `accepted`, and record a `Transaction` of type `hold`.
- **REQ-003**: IF Paymob's webhook reports a failed transaction THEN THE SYSTEM SHALL set the `Collaboration` status to `payment_failed` and leave the `Proposal` status untouched so the brand can retry or accept a different proposal.
- **REQ-004**: THE SYSTEM SHALL verify every Paymob webhook's HMAC signature before processing it, and SHALL reject unsigned or invalid requests with 400 without creating any `Transaction`.
- **REQ-005**: THE SYSTEM SHALL process each Paymob webhook idempotently — a repeated delivery of the same transaction id SHALL NOT create a second `Transaction` or change state twice.
- **REQ-006**: WHEN a brand confirms shipment on a `funded` collaboration THE SYSTEM SHALL record carrier and tracking number and set status to `shipped`.
- **REQ-007**: WHEN a creator registers a deliverable file THE SYSTEM SHALL require a valid, previously-issued upload URL for that collaboration and SHALL set the collaboration status to `delivered`.
- **REQ-008**: WHEN a brand approves a deliverable THE SYSTEM SHALL set the collaboration status to `approved` and record a `Transaction` of type `release`.
- **REQ-009**: WHEN a brand requests a revision THE SYSTEM SHALL set the collaboration status back to `revision_requested` and require feedback text.
- **REQ-010**: WHEN an admin marks an approved collaboration as paid THE SYSTEM SHALL record a `Transaction` of type `payout` with the admin's user id, and set the collaboration status to `paid`.
- **REQ-011**: WHEN a brand or creator requests a chat token for a collaboration THE SYSTEM SHALL issue an Ably token scoped only to that collaboration's channel, and only if the requester is the brand or the creator on that collaboration.
- **SEC-001**: THE SYSTEM SHALL reject any deliverable-upload-URL request for a collaboration the requesting creator does not own.
- **SEC-002**: THE SYSTEM SHALL never expose a creator's `creator_payout_details` to the brand, on any endpoint in this plan.
- **SEC-003**: THE SYSTEM SHALL store the Paymob HMAC secret and API keys only in environment variables, never in code or logs.
- **CON-001**: A `Proposal` can produce at most one `Collaboration` — enforced by a unique constraint on `proposal_id`.
- **CON-002**: Refunds in Phase 1 are admin-triggered and manual (recorded as a `Transaction` of type `refund`); no automatic refund flow exists yet.
- **GUD-001**: All monetary amounts are stored as `numeric(10,2)` in `EGP`; no floating-point arithmetic on money anywhere in this plan.

```gherkin
Feature: Accepting a proposal charges the brand
  Scenario: Acceptance creates a pending-payment collaboration
    Given a live campaign with an "applied" proposal from a creator
    When the brand POSTs to /api/v1/proposals/{id}/accept
    Then the response status is 201
    And a Collaboration exists with status "pending_payment"
    And the response includes a Paymob checkout URL

  Scenario: A successful webhook funds the collaboration
    Given a Collaboration in status "pending_payment" with a known Paymob order id
    When Paymob POSTs a validly-signed "success" webhook for that order
    Then the Collaboration status becomes "funded"
    And the linked Proposal status becomes "accepted"
    And exactly one Transaction of type "hold" exists for that Collaboration

  Scenario: A repeated webhook delivery does not double-process
    Given a Collaboration already "funded" from a prior webhook with transaction id "txn_123"
    When Paymob POSTs the same "txn_123" webhook again
    Then the response status is 200
    And no second Transaction is created

  Scenario: An invalid signature is rejected
    Given a webhook request with a signature that does not match the computed HMAC
    When the request reaches /api/v1/webhooks/paymob
    Then the response status is 400
    And no Collaboration or Transaction is modified

Feature: Delivery approval releases escrow
  Scenario: Approval records a release transaction
    Given a Collaboration in status "delivered" with one submitted Deliverable
    When the brand POSTs to /api/v1/deliverables/{id}/review with action "approve"
    Then the Collaboration status becomes "approved"
    And a Transaction of type "release" exists for that Collaboration
    And the Collaboration appears in the admin payout queue

Feature: Admin payout
  Scenario: Admin marks a collaboration paid
    Given a Collaboration in status "approved" with no existing "payout" Transaction
    When an admin POSTs to /api/v1/admin/payouts/{collaborationId}/mark-paid with payout evidence
    Then a Transaction of type "payout" is recorded with the admin's user id
    And the Collaboration status becomes "paid"

Feature: Collaboration-scoped chat
  Scenario: A third party cannot get a chat token for someone else's collaboration
    Given a Collaboration between brand A and creator B
    When user C, who is neither A nor B, requests a chat token for that Collaboration
    Then the response status is 403
```

---

# Dependencies

| ID | Name | Type | Version | Purpose |
|---|---|---|---|---|
| DEP-001 | Paymob Accept API | external service | REST v1 | Card/wallet/Fawry payment collection in Egypt |
| DEP-002 | ably | package | latest stable | Realtime chat, token-based auth |
| DEP-003 | @aws-sdk/client-s3, @aws-sdk/s3-request-presigner | package | latest stable | Presigned upload URLs against Cloudflare R2 (S3-compatible) |
| DEP-004 | Cloudflare R2 | external service | n/a | Object storage for deliverable files |

A registered Paymob merchant account (Egyptian commercial registration required, tracked as HLD RISK-002) and a Cloudflare R2 bucket must exist before this plan's integration tasks can be verified end-to-end; local development can stub Paymob and use a local S3-compatible container (e.g. MinIO) in the meantime.

---

# Plan Details

## Design — *How it should happen*

### Impact on system design

This plan adds the `Collaboration` entity as the anchor for everything financial: charge, hold, release, payout, refund, deliverables, and chat all reference `collaboration_id`. It is the highest-risk plan in Phase 1 because it moves real money; every state transition below is deliberately narrow and single-purpose rather than a generic "update status" endpoint, so each one maps to exactly one business event and one `Transaction` row.

### Escrow state machine

```
pending_payment ──(webhook success)──► funded ──(confirm shipment)──► shipped
                                                                          │
        ┌───────────(payment_failed, terminal)                           │
        │                                                                 ▼
   payment_failed                                            delivered ◄─(creator registers deliverable)
                                                                          │
                        ┌─────────────────────────────────────────────────┤
                        ▼                                                 ▼
              revision_requested                                     approved
                        │                                                 │
                        └──────────(creator re-delivers)───────────────────┤
                                                                          ▼
                                                                       paid
                                                            (admin marks payout complete)
```

### Escrow sequence (full detail, expands HLD §2.2)

```
Brand              API                  Paymob            Creator          Admin
 │ accept proposal   │                      │                  │              │
 ├───────────────────►                      │                  │              │
 │                    │ create Collaboration │                  │              │
 │                    │ (pending_payment)     │                  │              │
 │                    │ register order         │                  │              │
 │                    ├───────────────────────►                  │              │
 │                    │ payment key + iframe URL│                  │              │
 │                    ◄───────────────────────┤                  │              │
 │ 201 { checkoutUrl }│                      │                  │              │
 ◄───────────────────┤                      │                  │              │
 │  (completes payment in Paymob-hosted page)│                  │              │
 │                    │  webhook: success     │                  │              │
 │                    ◄───────────────────────┤                  │              │
 │                    │ verify HMAC, check     │                  │              │
 │                    │ idempotency, then:     │                  │              │
 │                    │ Collaboration=funded    │                  │              │
 │                    │ Proposal=accepted        │                  │              │
 │                    │ Transaction=hold          │                  │              │
 │ confirm shipment    │                      │                  │              │
 ├───────────────────►│ Collaboration=shipped  │                  │              │
 │                    │                      │                  │  ship product  │
 │                    │                      │                  │  film + upload │
 │                    │  register deliverable  │                  │◄─────────────┤
 │                    │◄──────────────────────────────────────────┤              │
 │                    │ Collaboration=delivered│                  │              │
 │ review + approve    │                      │                  │              │
 ├───────────────────►│ Collaboration=approved │                  │              │
 │                    │ Transaction=release      │                  │              │
 │                    │  (enters payout queue) │                  │              │
 │                    │                      │                  │  bank/InstaPay │
 │                    │                      │                  │◄─────────────┤
 │                    │  mark-paid              │                  │              │
 │                    │◄──────────────────────────────────────────────────────────┤
 │                    │ Transaction=payout        │                  │              │
 │                    │ Collaboration=paid       │                  │              │
```

### Decisions

| ID | Decision | Rationale | Alternatives Considered | Side effect (which modules?) |
|---|---|---|---|---|
| DES-P1-001 | The platform's own ledger (`transactions` table) implements escrow; Paymob only collects and (later) disburses money | Paymob has no marketplace-split product in Egypt (HLD §1.3); the ledger is the simplest structure that gives correct, auditable fund tracking | Wait for a marketplace-capable gateway; build a custom split-payment layer on top of raw card processing | `collaborations`, `transactions`, `payments` |
| DES-P1-002 | Payout to the creator is a manual, admin-recorded `Transaction`, not an automated disbursement | Automating Egyptian payouts needs either Paymob's payout API or a licensed disbursement partner — validated in Phase 2, not built speculatively now (YAGNI, `clean-code` GEN-01) | Integrate Paymob payout/disbursement API now | `admin` payout extension |
| DES-P1-003 | Deliverable files upload directly from the mobile app to Cloudflare R2 via a presigned URL; the API only stores the resulting `file_url` | Avoids routing large video files through the NestJS process (memory, bandwidth, timeout risk) | Proxy uploads through the API | `deliverables` module |
| DES-P1-004 | Chat uses Ably with per-request, per-collaboration scoped tokens, not a self-hosted WebSocket gateway | No infra to operate for a solo developer; Ably's token capability model directly expresses "this user may only publish/subscribe to this one collaboration's channel" | Self-hosted `ws`/Socket.IO server | `messages` module |
| DES-P1-005 | Webhook idempotency keyed on Paymob's transaction id, stored as a unique column on `transactions.paymob_reference` | A unique DB constraint is a simpler and stronger guarantee than an in-memory or Redis-based deduplication cache | Redis SETNX dedupe cache | `transactions` entity, `payments` module |

### Constraints & Assumptions

| Type | ID | Description | Impact if Wrong | Handling Strategy |
|---|---|---|---|---|
| Constraint | CON-P1-001 | Platform fee is fixed at 10% of the creator's agreed price for all of Phase 1 | A rate change needs a migration or a config value, not a code change | Store the fee rate in `ConfigModule`, not hard-coded in the service, per `clean-code` DES-01 |
| Constraint | CON-P1-002 | One currency, EGP, for all Phase 1 transactions | Multi-currency needs FX handling later | `currency` column exists on `transactions` and `collaborations` now so a future currency needs no schema change |
| Assumption | ASM-P1-001 | The Paymob merchant account and Cloudflare R2 bucket exist before this plan reaches staging/production verification | Integration tasks are blocked | Local dev proceeds with a stubbed Paymob client and MinIO; track the real account as HLD RISK-002, resolve before Phase 1 launch |

### Edge cases

| ID | Scenario | Expected Behavior | Handling Strategy |
|---|---|---|---|
| EDGE-P1-001 | Brand double-taps "accept" before the first request returns | Only one `Collaboration` is created | Unique constraint on `collaborations.proposal_id`; second request gets 409 |
| EDGE-P1-002 | Webhook arrives before the API has finished creating the `Collaboration` row (out-of-order delivery) | Webhook handler retries safely | Webhook looks up the `Collaboration` by the Paymob order id it created at REQ-001 time; if not found, returns 200 but logs a warning for manual review rather than erroring the webhook (Paymob would otherwise retry indefinitely) |
| EDGE-P1-003 | Creator uploads a deliverable file directly to R2 but never calls the register endpoint | File exists in storage but is invisible to the app | Acceptable in Phase 1 — R2 lifecycle rule can clean up unreferenced objects older than 7 days; not built as a feature, just a bucket lifecycle policy |
| EDGE-P1-004 | Brand tries to approve a deliverable on a collaboration not in status `delivered` | 422, error code `invalid_state_transition` | Explicit status-machine check in `deliverables.service.ts`, not implicit from DB constraints alone |
| EDGE-P1-005 | Admin tries to mark a collaboration paid twice | 409, error code `already_paid` | Unique partial index on `transactions (collaboration_id)` where `type = 'payout'` |
| EDGE-P1-006 | Chat token requested for a `pending_payment` (unfunded) collaboration | 403 — chat opens only once a collaboration is funded, so a creator cannot be contacted before payment is secured | Explicit status check in the token-issuing endpoint |

### Directory Map

```text
apps/api/src/modules/
├── collaborations/
│   ├── collaborations.controller.ts
│   ├── collaborations.service.ts
│   ├── collaborations.module.ts
│   ├── dto/{accept-proposal,confirm-shipment}.dto.ts
│   └── entities/collaboration.entity.ts
├── deliverables/
│   ├── deliverables.controller.ts
│   ├── deliverables.service.ts
│   ├── deliverables.module.ts
│   ├── dto/{request-upload-url,register-deliverable,review-deliverable}.dto.ts
│   └── entities/{deliverable.entity.ts,deliverable-feedback.entity.ts}
├── transactions/
│   ├── transactions.service.ts
│   ├── transactions.module.ts
│   └── entities/transaction.entity.ts
├── payments/
│   ├── paymob.client.ts
│   ├── paymob-webhook.controller.ts
│   ├── payments.module.ts
│   └── dto/paymob-webhook.dto.ts
├── messages/
│   ├── messages.controller.ts
│   ├── messages.service.ts
│   ├── messages.module.ts
│   ├── ably-token.service.ts
│   └── entities/message.entity.ts
└── admin/
    └── admin-payouts.controller.ts   (extends the admin module from the core-domain plan)
        admin-payouts.service.ts
        dto/mark-paid.dto.ts
```

### Directory Specifications

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations/Error handling | Key Configurations/settings |
|---|---|---|---|---|---|
| TASK-P1-001 | Collaboration entity + migration | `collaborations/entities/collaboration.entity.ts` | `Collaboration(id uuid pk, campaign_id fk, proposal_id fk unique, brand_id fk, creator_id fk, creator_price numeric(10,2), platform_fee numeric(10,2), total_amount numeric(10,2), currency char(3) default 'EGP', status enum, paymob_order_id, shipment_carrier nullable, shipment_tracking_number nullable, shipment_confirmed_at nullable, created_at, updated_at)` | `status` enum: `pending_payment`\|`funded`\|`payment_failed`\|`shipped`\|`delivered`\|`revision_requested`\|`approved`\|`paid`\|`cancelled` | Indexes on `brand_id`, `creator_id`, `status` |
| TASK-P1-002 | Transaction entity + migration | `transactions/entities/transaction.entity.ts` | `Transaction(id uuid pk, collaboration_id fk, type enum, amount numeric(10,2), currency char(3), status enum, paymob_reference nullable, recorded_by_user_id nullable, created_at)` | Unique on `paymob_reference` where not null (REQ-005); partial unique on `(collaboration_id)` where `type='payout'` (EDGE-P1-005) | `type` enum: `charge`\|`hold`\|`release`\|`payout`\|`refund` |
| TASK-P1-003 | Paymob client wrapper | `payments/paymob.client.ts` | Encapsulates auth-token, order-registration, and payment-key calls to Paymob's Accept API; returns a checkout iframe URL | Wraps all HTTP errors from Paymob into a domain `PaymentProviderError`, never leaks Paymob's raw response to the client | `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_IFRAME_ID` from env |
| TASK-P1-004 | Accept-proposal endpoint | `collaborations/collaborations.controller.ts`, `collaborations.service.ts` | `POST /api/v1/proposals/{id}/accept`: loads the proposal, checks ownership and status `applied`, creates the `Collaboration` in a transaction, calls the Paymob client, stores `paymob_order_id`, returns the checkout URL | REQ-001, EDGE-P1-001 | Wrapped in a DB transaction so a Paymob failure rolls back the `Collaboration` insert |
| TASK-P1-005 | Paymob webhook endpoint | `payments/paymob-webhook.controller.ts` | `POST /api/v1/webhooks/paymob` (public, unauthenticated by JWT, authenticated by HMAC): verifies signature, looks up the `Collaboration` by `paymob_order_id`, applies REQ-002/REQ-003/REQ-005 | REQ-004, REQ-005, EDGE-P1-002 | `PAYMOB_HMAC_SECRET` from env; constant-time signature comparison |
| TASK-P1-006 | Confirm shipment endpoint | `collaborations/collaborations.controller.ts` | `POST /api/v1/collaborations/{id}/confirm-shipment`: brand-only, requires status `funded` | REQ-006, EDGE-P1-004-style state check | |
| TASK-P1-007 | Deliverable upload-URL + register endpoints | `deliverables/*` | `POST /api/v1/collaborations/{id}/deliverables/upload-url` issues a presigned R2 PUT URL scoped to that collaboration; `POST /api/v1/collaborations/{id}/deliverables` registers the resulting file as a `Deliverable` and sets `Collaboration.status = delivered` | SEC-001, REQ-007, EDGE-P1-003 | Presigned URL TTL 15 minutes; object key namespaced `collaborations/{id}/{uuid}.{ext}` |
| TASK-P1-008 | Deliverable review endpoint | `deliverables/deliverables.controller.ts` | `POST /api/v1/deliverables/{id}/review` with `action: approve\|request_revision\|decline`; approve triggers REQ-008, request_revision triggers REQ-009 and requires `feedback` | EDGE-P1-004 | Feedback stored as a `DeliverableFeedback` row, not a free-text column, so a thread can grow |
| TASK-P1-009 | Ably token endpoint + chat CRUD | `messages/*` | `POST /api/v1/collaborations/{id}/chat-token` issues a capability-scoped Ably token after verifying the requester is the brand or creator on that collaboration and it is `funded` or later; `GET/POST /api/v1/collaborations/{id}/messages` persists messages for history/search even though realtime delivery goes through Ably | REQ-011, SEC-001-style ownership check, EDGE-P1-006 | Ably token TTL 1 hour, capability restricted to `collaboration:{id}` channel, publish+subscribe only |
| TASK-P1-010 | Admin payout queue + mark-paid | `admin/admin-payouts.controller.ts` | `GET /api/v1/admin/payouts?status=pending` lists `approved` collaborations with no `payout` transaction; `POST /api/v1/admin/payouts/{collaborationId}/mark-paid` records the `Transaction` and sets `Collaboration.status = paid` | REQ-010, EDGE-P1-005 | Requires `method`, `reference`, `paidAt` in the request body as the ops evidence trail |
| TASK-P1-011 | Unit + e2e tests, including webhook signature and idempotency tests | `**/*.spec.ts`, `test/*.e2e-spec.ts` | Covers every Gherkin scenario above, plus a fixture Paymob webhook payload with a valid and an invalid signature | CI fails the build on any red test | Paymob client is mocked in tests; no real network calls |
| TASK-P1-012 | Export shared DTO/response types | `packages/shared-types/src/{collaborations,deliverables,transactions,messages}.ts`, re-exported from `index.ts` | Mirrors this plan's Schemas section as plain TypeScript types alongside the core-domain plan's exports, so `apps/mobile` has one consistent contract source | Same review-time check as the core-domain plan's equivalent task | Extends the same `packages/shared-types/src/index.ts` barrel, not a second package |

### Schemas

**Accept proposal** — `POST /api/v1/proposals/{id}/accept`
```yaml
response:
  data:
    collaborationId: uuid
    status: "pending_payment"
    checkoutUrl: string
```

**Paymob webhook** — `POST /api/v1/webhooks/paymob`
```yaml
request:
  # Paymob's native transaction-processed payload; verified via HMAC query/body per Paymob's documented scheme
  obj:
    id: string            # Paymob transaction id -> transactions.paymob_reference
    success: boolean
    order:
      id: string           # -> collaborations.paymob_order_id
response:
  status: 200               # always 200 once signature-verified, so Paymob stops retrying; failures are handled internally
```

**Request deliverable upload URL** — `POST /api/v1/collaborations/{id}/deliverables/upload-url`
```yaml
request:
  contentType: string   # e.g. "video/mp4"
response:
  data:
    uploadUrl: string      # presigned R2 PUT URL, 15-minute TTL
    fileUrl: string        # final public/CDN URL to register after upload
```

**Register deliverable** — `POST /api/v1/collaborations/{id}/deliverables`
```yaml
request:
  type: ready_ad | raw | broll | hook | photo | voiceover
  fileUrl: string
  durationSeconds: integer (optional)
response:
  data: { id, collaborationId, type, status: "submitted", createdAt }
```

**Review deliverable** — `POST /api/v1/deliverables/{id}/review`
```yaml
request:
  action: approve | request_revision | decline
  feedback: string (required when action is request_revision or decline)
response:
  data: { id, status, collaborationStatus }
```

**Mark payout paid** — `POST /api/v1/admin/payouts/{collaborationId}/mark-paid`
```yaml
request:
  method: bank_transfer | instapay | vodafone_cash
  reference: string
  paidAt: string (ISO 8601)
response:
  data: { transactionId, collaborationStatus: "paid" }
```

All error responses use the standard envelope: `{ "error": { "code", "message", "details"? } }`.

### Data Models & flows

<settings>
New environment variables:

| Variable | Purpose | Secret? | Default |
|---|---|---|---|
| `PAYMOB_API_KEY` | Paymob Accept API authentication | Yes | none |
| `PAYMOB_INTEGRATION_ID` | Paymob payment integration id | Yes | none |
| `PAYMOB_IFRAME_ID` | Paymob hosted checkout iframe id | Yes | none |
| `PAYMOB_HMAC_SECRET` | Webhook signature verification | Yes | none |
| `PLATFORM_FEE_RATE` | Fee applied on top of creator price | No | `0.10` |
| `ABLY_API_KEY` | Ably server-side key for token issuance | Yes | none |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Cloudflare R2 access for presigned URLs | Yes | none |
</settings>

<Data-Models>
```
proposals ──1:1── collaborations ──1:N── deliverables ──1:N── deliverable_feedback
                        │
                        ├──1:N── transactions
                        └──1:N── messages
```

| Entity | Key Columns | Notes |
|---|---|---|
| `collaborations` | id, campaign_id fk, proposal_id fk unique, brand_id fk, creator_id fk, creator_price, platform_fee, total_amount, status, paymob_order_id | The billing unit |
| `transactions` | id, collaboration_id fk, type, amount, status, paymob_reference (unique, nullable), recorded_by_user_id (nullable) | The escrow ledger |
| `deliverables` | id, collaboration_id fk, type, file_url, status | |
| `deliverable_feedback` | id, deliverable_id fk, sender_user_id fk, body, created_at | |
| `messages` | id, collaboration_id fk, sender_user_id fk, body, sent_at | |
</Data-Models>

<Data-flow>
See the escrow sequence diagram above for the full accept → fund → deliver → approve → payout flow.
</Data-flow>

---

#### **Process** (runtime, QA, deployment)

- **Runtime Considerations**: The Paymob webhook endpoint must be reachable from the public internet even in a staging environment (Paymob cannot call `localhost`); use a tunnel (e.g. `ngrok`) for local webhook testing, documented in this plan's task list but not part of CI.
- **Deployment Impact**: Requires the Paymob merchant account and Cloudflare R2 bucket referenced in ASM-P1-001 to be provisioned before this plan can be verified against real payments. CI runs entirely against mocks and does not require live credentials.

---

# Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RISK-001 | Paymob merchant account not yet approved (needs Egyptian commercial registration, HLD RISK-002) | Med | High — blocks real payment collection | Build and test this entire plan against a mocked Paymob client first; swap in real credentials once the account is approved, no code change needed beyond env vars |
| RISK-002 | Manual payout step becomes a bottleneck as collaboration volume grows | High (by design in Phase 1) | Med | Tracked as HLD RISK-003; cap Phase 1 volume to what one admin can pay out weekly |
| RISK-003 | Webhook replay or forgery if the HMAC check is implemented incorrectly | Low | High — could fraudulently mark a collaboration funded | REQ-004 and TASK-P1-011 require a dedicated test for both a valid and a tampered signature before this plan is considered done |

---

# Code Guidelines

**From `clean-code`:**
- Async failure handling (GEN-08): every Paymob API call has a defined failure path — a thrown `PaymentProviderError` that the controller turns into a clean error response, never an unhandled rejection.
- No optimistic updates without rollback (GEN-09): `Collaboration` creation and the Paymob order-registration call are wrapped so a mid-flight failure leaves no orphaned `pending_payment` row without a corresponding Paymob order.
- Structured logging (LOG-02): every `Transaction` insert logs one structured line including `collaborationId`, `type`, `amount`, and `correlationId`.

**From `security`:**
- A08 Software and Data Integrity Failures: webhook signatures are verified with a constant-time comparison before any state changes (REQ-004).
- A01 Broken Access Control: chat tokens, deliverable upload URLs, and payout details all check that the requester is a real participant in the specific collaboration (SEC-001, EDGE-P1-006).
- Never log secrets: `PAYMOB_API_KEY`, `PAYMOB_HMAC_SECRET`, and `ABLY_API_KEY` are never included in structured logs, even at debug level.
- File upload hardening: presigned URLs restrict `Content-Type` to allow-listed video/image MIME types only; R2 bucket denies public write, only presigned PUTs succeed.

**From `database`:**
- Idempotency via a real unique constraint (`paymob_reference`), not an application-level check-then-insert race.
- `numeric(10,2)` for every money column; no `float` anywhere in this plan.
- Foreign keys (`collaboration_id`, `deliverable_id`) are indexed everywhere they appear.

**From `nestjs`:**
- The Paymob webhook controller is the one controller in this plan not guarded by `JwtAuthGuard` — documented explicitly in its file header so a future refactor does not accidentally add auth and break Paymob's callback.
