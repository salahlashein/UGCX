# Document Control
- **Version**: 1.0
- **Date Created**: 2026-08-31
- **Last Updated**: 2026-08-31
- **Status**: Implemented

---

# Executive Summary

- **Goal**: Build the non-financial core of the marketplace — accounts, profiles, campaigns, and proposals — so a brand can post a brief and a creator can apply to it.
- **Scope**: production feature (Phase 1 slice)
- **Domains**: backend, database
- **Architecture**: New NestJS feature modules (`auth`, `users`, `brands`, `creators`, `products`, `campaigns`, `proposals`, `admin`) inside `apps/api`, each following the controller → service → TypeORM repository layering from the `nestjs` skill. No payment or escrow logic lives here — proposal **acceptance** (which charges money) is out of scope and belongs to the escrow/payments plan.
- **Tech Stack**: NestJS, TypeORM, PostgreSQL, class-validator/class-transformer, Passport-JWT, bcrypt.
- **Entry Condition**: `infrastructure_monorepo_foundation` plan is complete — `apps/api` boots, `/api/v1/health` passes, PostgreSQL runs locally.
- **Exit Condition**: A brand can register, log in, create a product, create and publish a campaign. A creator can register, log in, complete a profile, and submit a proposal to a live campaign matching their niche. An admin can approve or reject a creator's vetting status. All endpoints enforce ownership and role checks. Unit and e2e tests pass in CI.

---

# Requirements

## Functional Requirements

- **REQ-001**: WHEN a new user registers THE SYSTEM SHALL create a `User` with role `brand` or `creator`, hash the password, and create the matching `Brand` or `Creator` profile row in the same transaction.
- **REQ-002**: WHEN a user logs in with a correct email and password THE SYSTEM SHALL return a short-lived access token and a longer-lived refresh token.
- **REQ-003**: IF a user logs in with an incorrect email or password THEN THE SYSTEM SHALL return a generic "invalid credentials" error, without revealing whether the email exists.
- **REQ-004**: WHEN a brand creates a product THE SYSTEM SHALL associate it with that brand's own `Brand` row, taken from the authenticated user, never from client input.
- **REQ-005**: WHEN a brand creates a campaign THE SYSTEM SHALL set its status to `draft` and require a linked product owned by the same brand.
- **REQ-006**: WHEN a brand publishes a campaign THE SYSTEM SHALL reject the transition to `live` unless niche, video type, duration, and language are all set.
- **REQ-007**: WHEN a creator lists campaigns THE SYSTEM SHALL return only campaigns with status `live`, optionally filtered by niche, country, and language.
- **REQ-008**: WHEN a creator submits a proposal to a campaign THE SYSTEM SHALL reject a second proposal from the same creator to the same campaign.
- **REQ-009**: WHEN a brand shortlists or declines a proposal THE SYSTEM SHALL update its status, and SHALL NOT expose a way to set status `accepted` from this module — that transition belongs to the escrow/payments plan.
- **REQ-010**: WHEN an admin approves or rejects a creator's vetting status THE SYSTEM SHALL record the admin's user id and a timestamp on the decision.
- **SEC-001**: THE SYSTEM SHALL enforce that a brand can only read or modify products, campaigns, and proposals it owns; a creator can only read or modify its own profile and proposals.
- **SEC-002**: THE SYSTEM SHALL hash passwords with bcrypt (cost factor 12) and never store or log plaintext passwords.
- **SEC-003**: THE SYSTEM SHALL rate-limit `/auth/login` and `/auth/register` to 10 requests per minute per IP.
- **SEC-004**: THE SYSTEM SHALL restrict read access to a creator's payout details to that creator and to the `admin` role only.
- **CON-001**: A `User` row has exactly one role for the lifetime of Phase 1 — no multi-role or agency accounts.
- **GUD-001**: All list endpoints return the pagination envelope from `api-patterns` (`data`, `meta`, `links`).
- **PAT-001**: Every write endpoint validates its body with a class-validator DTO; controllers never touch the database directly.

```gherkin
Feature: Registration and login
  Scenario: A brand registers successfully
    Given no user exists with the email "brand@example.com"
    When a client POSTs to /api/v1/auth/register with role "brand" and valid fields
    Then the response status is 201
    And a User row and a Brand row exist, linked by user_id

  Scenario: Login with a wrong password does not reveal account existence
    Given a user exists with the email "brand@example.com"
    When a client POSTs to /api/v1/auth/login with the correct email and a wrong password
    Then the response status is 401
    And the error message is "Invalid credentials" with no further detail

Feature: Campaign publishing
  Scenario: Publish fails when required fields are missing
    Given a draft campaign owned by the authenticated brand with no niche set
    When the brand POSTs to /api/v1/campaigns/{id}/publish
    Then the response status is 422
    And the error details list "niche" as a missing field

  Scenario: Publish succeeds when all required fields are set
    Given a draft campaign owned by the authenticated brand with niche, video type, duration, and language set
    When the brand POSTs to /api/v1/campaigns/{id}/publish
    Then the response status is 200
    And the campaign status is "live"

Feature: Proposal submission
  Scenario: A creator cannot apply twice to the same campaign
    Given a live campaign and a creator who already submitted a proposal to it
    When the same creator POSTs another proposal to the same campaign
    Then the response status is 409
    And the error code is "duplicate_proposal"

Feature: Creator vetting
  Scenario: Admin approves a pending creator
    Given a creator with vetting_status "pending"
    When an admin PATCHes /api/v1/admin/creators/{id}/vetting with status "approved"
    Then the creator's vetting_status becomes "approved"
    And the response includes the reviewing admin's user id and the decision timestamp
```

---

# Dependencies

| ID | Name | Type | Version | Purpose |
|---|---|---|---|---|
| DEP-001 | @nestjs/jwt, @nestjs/passport, passport-jwt | package | latest stable | JWT issuance and route guards |
| DEP-002 | bcrypt | package | latest stable | Password hashing |
| DEP-003 | class-validator, class-transformer | package | latest stable | DTO validation (already added in the foundation plan) |
| DEP-004 | @nestjs/throttler | package | latest stable | Rate limiting on auth endpoints |
| DEP-005 | typeorm, @nestjs/typeorm | package | latest stable | Entities and repositories (already added in the foundation plan) |

Check each package's latest version and license before installing.

---

# Plan Details

## Design — *How it should happen*

### Impact on system design

This plan adds eight feature modules to `apps/api/src/modules/`. It introduces the first real database migrations. It does not touch payments, escrow, chat, or file uploads — those are the escrow/payments plan. The `proposals` module deliberately stops at `shortlisted`/`declined`; the `accepted` transition is owned by the next plan so that "accepting a proposal" and "charging the brand" can never be implemented as two disconnected code paths.

```
┌──────────────┐     register/login      ┌──────────────┐
│  Mobile App  │ ───────────────────────► │  auth module │
└──────────────┘                          └──────┬───────┘
                                                  │ issues JWT
        ┌─────────────────────────────────────────┼───────────────────────────┐
        ▼                                          ▼                           ▼
┌───────────────┐                       ┌───────────────────┐        ┌───────────────────┐
│ brands module  │                       │ creators module     │        │  admin module        │
│ products module│                       │ (profile, portfolio,│        │ (vetting decisions)  │
│ campaigns module│                      │  payout details)    │        └───────────────────┘
└───────┬────────┘                       └─────────┬──────────┘
        │                                            │
        └──────────────────┬─────────────────────────┘
                            ▼
                  ┌───────────────────┐
                  │ proposals module     │
                  │ (apply, shortlist,    │
                  │  decline — NOT accept)│
                  └───────────────────┘
```

### Decisions

| ID | Decision | Rationale | Alternatives Considered | Side effect (which modules?) |
|---|---|---|---|---|
| DES-P1-001 | Proposal acceptance is excluded from this plan | Accepting a proposal always charges the brand (HLD REQ-003); splitting "accept" from "charge" would let a Collaboration exist without funds, or a charge happen without a Collaboration record | Implement a no-op "accepted" status here and wire payment later | `proposals` module, `collaborations` module (next plan) |
| DES-P1-002 | Niches modeled as a `text[]` column with a GIN index, not a join table | Small, stable vocabulary (beauty, fashion, mom & baby, food/FMCG, etc.); array containment queries (`@>`) are simple and fast at this scale, per the `database` skill | Many-to-many `creator_niches` join table | `creators` entity, `campaigns` entity |
| DES-P1-003 | JWT access tokens are short-lived (15 min); refresh tokens are stored hashed and rotated on use | Limits the blast radius of a leaked access token; matches the `security` skill's JWT guidance | Long-lived single JWT with no refresh | `auth` module |
| DES-P1-004 | Payout details are a separate `creator_payout_details` table, not columns on `creators` | Keeps sensitive financial data behind its own access check (SEC-004) instead of relying on field-level filtering of a shared row | Columns on `creators` with response-serializer field stripping | `creators` module |

### Constraints & Assumptions

| Type | ID | Description | Impact if Wrong | Handling Strategy |
|---|---|---|---|---|
| Constraint | CON-P1-001 | Niche vocabulary is a fixed enum for Phase 1 (`beauty_personal_care`, `fashion`, `mom_baby`, `food_fmcg`, `home_lifestyle`, `other`) | New niches require a migration | Keep the enum small; adding a value is a low-risk additive migration |
| Assumption | ASM-P1-001 | Egypt is the only country in Phase 1, so `Brand.country` and `Creator.country` default to `EG` but are still stored as columns, not hard-coded | Expansion to a second country needs no schema change, only new allowed values | Store country as a column from day one (HLD RISK area, cheap to do now) |

### Edge cases

| ID | Scenario | Expected Behavior | Handling Strategy |
|---|---|---|---|
| EDGE-P1-001 | Registration with an email that already exists | 409 Conflict, generic message, no indication of which field collided beyond `"email"` | Unique constraint on `users.email`; caught and mapped to a 409 in the service layer |
| EDGE-P1-002 | A brand tries to read another brand's campaign by id | 404, not 403 | Ownership check treats "not mine" as "not found" to avoid confirming the resource exists (A01 Broken Access Control) |
| EDGE-P1-003 | A creator applies to a campaign that is not `live` (e.g. still `draft`) | 422 with error code `campaign_not_open` | Service-layer check before insert, not just a DB constraint |
| EDGE-P1-004 | Refresh token reused after rotation (possible token theft) | 401, and all refresh tokens for that user are revoked | Refresh tokens are single-use rows; reuse of an already-rotated token revokes the whole family |
| EDGE-P1-005 | Admin rejects a creator who has live proposals | Proposals remain visible to the brand but are auto-marked `declined` with reason `creator_rejected` | Handled inside the same transaction as the vetting decision |

### Directory Map

```text
apps/api/src/modules/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── refresh.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   └── entities/
│       └── refresh-token.entity.ts
├── users/
│   ├── users.service.ts
│   ├── users.module.ts
│   └── entities/user.entity.ts
├── brands/
│   ├── brands.controller.ts
│   ├── brands.service.ts
│   ├── brands.module.ts
│   ├── dto/update-brand.dto.ts
│   └── entities/brand.entity.ts
├── creators/
│   ├── creators.controller.ts
│   ├── creators.service.ts
│   ├── creators.module.ts
│   ├── dto/
│   │   ├── update-creator.dto.ts
│   │   ├── create-portfolio-item.dto.ts
│   │   └── upsert-payout-details.dto.ts
│   └── entities/
│       ├── creator.entity.ts
│       ├── creator-portfolio-item.entity.ts
│       └── creator-payout-detail.entity.ts
├── products/
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── products.module.ts
│   ├── dto/{create,update}-product.dto.ts
│   └── entities/product.entity.ts
├── campaigns/
│   ├── campaigns.controller.ts
│   ├── campaigns.service.ts
│   ├── campaigns.module.ts
│   ├── dto/{create,update,query}-campaign.dto.ts
│   └── entities/campaign.entity.ts
├── proposals/
│   ├── proposals.controller.ts
│   ├── proposals.service.ts
│   ├── proposals.module.ts
│   ├── dto/{create-proposal,update-proposal-status}.dto.ts
│   └── entities/proposal.entity.ts
└── admin/
    ├── admin-creators.controller.ts
    ├── admin-creators.service.ts
    ├── admin.module.ts
    └── dto/vet-creator.dto.ts
```

### Directory Specifications

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations/Error handling | Key Configurations/settings |
|---|---|---|---|---|---|
| TASK-P1-001 | User + refresh token entities and migration | `users/entities/user.entity.ts`, `auth/entities/refresh-token.entity.ts` | `User(id uuid pk, email citext unique, phone, password_hash, role enum, locale enum, created_at, updated_at)`; `RefreshToken(id uuid pk, user_id fk, token_hash, expires_at, revoked_at nullable)` | Unique index on `email`; FK `user_id` indexed | `role` enum: `brand`\|`creator`\|`admin`; `locale` enum: `ar`\|`en` |
| TASK-P1-002 | Auth module: register/login/refresh/logout | `auth/*` | Register creates User + role profile in one DB transaction; login verifies bcrypt hash and issues token pair; refresh rotates the refresh token; logout revokes it | REQ-001–003, SEC-002, SEC-003, EDGE-P1-001, EDGE-P1-004 | Access token TTL 15 min, refresh token TTL 30 days, `@nestjs/throttler` at 10/min on `/auth/*` |
| TASK-P1-003 | JWT guard, roles guard, `@CurrentUser()`, `@Roles()` | `auth/guards/*`, `auth/decorators/*` | Every non-auth controller is guarded by `JwtAuthGuard`; role-restricted routes add `@Roles('brand')` etc. | Returns 401 for missing/invalid token, 403 for wrong role | Guards registered per-controller, not globally, so `/health` stays public |
| TASK-P1-004 | Brand entity + module | `brands/*` | `Brand(id uuid pk, user_id fk unique, company_name, country default 'EG', created_at, updated_at)`; `GET/PATCH /api/v1/brands/me` | Ownership derived from `@CurrentUser()`, never from a request param | REQ-004, SEC-001 |
| TASK-P1-005 | Creator entity, portfolio items, payout details | `creators/*` | `Creator(id uuid pk, user_id fk unique, display_name, city, niches text[], base_price numeric(10,2), vetting_status enum default 'pending', created_at, updated_at)`; `CreatorPortfolioItem(id, creator_id fk, media_url, media_type enum, created_at)`; `CreatorPayoutDetail(id, creator_id fk unique, method enum, account_identifier, holder_name, updated_at)` | GIN index on `niches`; payout details endpoint restricted to owner + admin (SEC-004) | REQ-004 analog for creators, SEC-004 |
| TASK-P1-006 | Product entity + module | `products/*` | `Product(id uuid pk, brand_id fk, name, description, value_props text[], images text[], created_at, updated_at)`; brand-scoped CRUD | Ownership check (EDGE-P1-002 pattern) | REQ-004 |
| TASK-P1-007 | Campaign entity + module | `campaigns/*` | `Campaign(id uuid pk, brand_id fk, product_id fk, status enum default 'draft', niche enum nullable, language enum nullable, video_type enum nullable, duration_seconds int nullable, script_mode enum nullable, script text nullable, talking_points text[], do_not_say text[], needs_shipping boolean default true, slots int default 1, created_at, updated_at)`; publish endpoint enforces REQ-006 | Indexes on `status`, `niche` for the creator browse query; `script_mode` enum restricted to `brand`\|`creator` in Phase 1 (`ai` reserved for Phase 3) | REQ-005, REQ-006, REQ-007, EDGE-P1-003 |
| TASK-P1-008 | Proposal entity + module | `proposals/*` | `Proposal(id uuid pk, campaign_id fk, creator_id fk, price numeric(10,2), currency char(3) default 'EGP', delivery_days int, pitch text, status enum default 'applied', created_at, updated_at)`; unique `(campaign_id, creator_id)`; brand can only set `shortlisted`/`declined` | REQ-008, REQ-009, EDGE-P1-003 | Composite unique index enforces REQ-008 at the DB level, service layer returns the friendly 409 |
| TASK-P1-009 | Admin creator vetting | `admin/admin-creators.controller.ts`, `admin-creators.service.ts` | `GET /api/v1/admin/creators?vetting_status=pending`, `PATCH /api/v1/admin/creators/{id}/vetting`; records `reviewed_by_user_id`, `reviewed_at` | Role-guarded to `admin` only; cascades to auto-decline live proposals on rejection (EDGE-P1-005) | REQ-010 |
| TASK-P1-010 | Global validation pipe | `main.ts` | `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` | Strips unknown fields instead of silently accepting them | PAT-001 |
| TASK-P1-011 | Unit + e2e tests | `**/*.spec.ts`, `test/*.e2e-spec.ts` | Service-level unit tests for each module's business rules (ownership, status transitions, duplicate checks); e2e tests covering every Gherkin scenario above | CI fails the build on any red test | Jest, `@nestjs/testing` `TestingModule` |
| TASK-P1-012 | Export shared DTO/response types | `packages/shared-types/src/{auth,brands,creators,products,campaigns,proposals}.ts`, re-exported from `index.ts` | Every request/response shape defined in the Schemas section above is mirrored here as a plain TypeScript type (not a class-validator DTO — those stay API-only), so `apps/mobile` imports the same contract instead of redeclaring it | A type here changing without the matching API DTO changing is a review-time check, not an automated one, until an OpenAPI-generation step exists | Barrel-exported from `packages/shared-types/src/index.ts`, consumed as `@ugcx/shared-types` from both apps |

### Schemas

**Register** — `POST /api/v1/auth/register`
```yaml
request:
  role: brand | creator
  email: string (email)
  phone: string
  password: string (min 8, at least one upper, one lower, one digit)
  locale: ar | en
response:
  data:
    userId: uuid
    role: brand | creator
    accessToken: string
    refreshToken: string
```

**Login** — `POST /api/v1/auth/login`
```yaml
request:
  email: string
  password: string
response:
  data:
    accessToken: string
    refreshToken: string
```

**Create campaign** — `POST /api/v1/campaigns`
```yaml
request:
  productId: uuid
response:
  data: { id, status: "draft", productId, createdAt }
```

**Publish campaign** — `POST /api/v1/campaigns/{id}/publish`
```yaml
response (422 on missing fields):
  error:
    code: validation_error
    message: "Campaign is missing required fields"
    details: [{ field: "niche", message: "required before publish" }]
```

**Create proposal** — `POST /api/v1/campaigns/{id}/proposals`
```yaml
request:
  price: number
  deliveryDays: integer
  pitch: string
response:
  data: { id, campaignId, creatorId, status: "applied", createdAt }
error (409 duplicate):
  error: { code: "duplicate_proposal", message: "You already applied to this campaign" }
```

All error responses use the standard envelope from `api-patterns`: `{ "error": { "code", "message", "details"? } }`.

### Data Models & flows

<settings>
New environment variables:

| Variable | Purpose | Secret? | Default |
|---|---|---|---|
| `JWT_ACCESS_TTL` | Access token lifetime | No | `15m` |
| `JWT_REFRESH_TTL` | Refresh token lifetime | No | `30d` |
| `BCRYPT_COST` | Password hashing cost factor | No | `12` |
</settings>

<Data-Models>
```
users ──1:1── brands
   │
   └──1:1── creators ──1:N── creator_portfolio_items
                       └──1:1── creator_payout_details

brands ──1:N── products ──1:N── campaigns ──1:N── proposals ──N:1── creators
```

| Entity | Key Columns | Notes |
|---|---|---|
| `users` | id, email (unique), phone, password_hash, role, locale | Root identity |
| `refresh_tokens` | id, user_id fk, token_hash, expires_at, revoked_at | One row per active refresh token |
| `brands` | id, user_id fk unique, company_name, country | |
| `creators` | id, user_id fk unique, display_name, city, niches text[], base_price, vetting_status | GIN index on `niches` |
| `creator_portfolio_items` | id, creator_id fk, media_url, media_type | |
| `creator_payout_details` | id, creator_id fk unique, method, account_identifier, holder_name | Read-restricted (SEC-004) |
| `products` | id, brand_id fk, name, description, value_props text[], images text[] | |
| `campaigns` | id, brand_id fk, product_id fk, status, niche, language, video_type, duration_seconds | Indexed on `status`, `niche` |
| `proposals` | id, campaign_id fk, creator_id fk, price, delivery_days, pitch, status | Unique `(campaign_id, creator_id)` |
</Data-Models>

<Data-flow>
```
Creator                         API                              DB
  │  POST /campaigns/{id}/proposals │                                │
  ├─────────────────────────────────►                                │
  │                                  │ check campaign.status='live'   │
  │                                  ├────────────────────────────────►
  │                                  │ check no existing proposal      │
  │                                  ├────────────────────────────────►
  │                                  │ insert proposal (status=applied)│
  │                                  ├────────────────────────────────►
  │  201 { data: proposal }          │                                │
  ◄─────────────────────────────────┤                                │
```
</Data-flow>

---

#### **Process** (runtime, QA, deployment)

- **Runtime Considerations**: All endpoints are synchronous request/response; no background jobs in this plan.
- **Deployment Impact**: Adds the first real migrations. Migrations must run (`typeorm migration:run`) as an explicit deploy step before the app starts, per the `database` skill's "every change is a migration" rule.

---

# Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RISK-001 | Fixed niche enum feels limiting once real creators onboard | Med | Low | Enum values chosen from HLD RISK-004 candidates; adding a value is a one-line additive migration |
| RISK-002 | Manual creator vetting does not scale past Phase 1 volume | High (by design) | Low in Phase 1 | Tracked in HLD as an intentional Phase 1 bottleneck; automation is a Phase 3 item |

---

# Code Guidelines

**From `clean-code`:**
- No anemic models (SMELL-02): entities carry the validation that belongs to them (e.g. `Campaign.canPublish()` domain check), not just bare columns with all logic in the service.
- No side effects from functions (FUN-01): `ProposalsService.create()` either creates and returns, or throws — it never silently no-ops on a duplicate.
- Structured logging (LOG-02): every state transition (`campaign.published`, `proposal.declined`, `creator.vetted`) logs one structured line with `context.module`, `context.action`, and the acting user id.

**From `security`:**
- A01 Broken Access Control: every read/write in `brands`, `creators`, `products`, `campaigns`, `proposals` checks ownership server-side (SEC-001); 404-not-403 on cross-tenant access (EDGE-P1-002).
- A07 Identification and Authentication Failures: generic login error message (REQ-003), bcrypt cost 12, rate-limited auth endpoints (SEC-003), refresh token rotation with reuse detection (EDGE-P1-004).
- A03 Injection: all queries go through TypeORM's parameterized query builder or repository methods — no raw string-concatenated SQL.

**From `database`:**
- Every foreign key gets an index (`brand_id`, `product_id`, `campaign_id`, `creator_id`, `user_id`).
- `numeric(10,2)` for `price`, never `float`.
- `text[]` with a GIN index for `niches`, per DES-P1-002.
- Migrations are forward-only; each migration ships its own `up`/`down`.

**From `nestjs`:**
- Controllers stay thin — delegate to services; DTOs validate every request body with class-validator.
- One module per bounded concept, matching the directory map above.

---

# Code Review Findings

*Reviewed 2026-09-01 by the analyser agent. First independent review of this plan.*

## Assessment summary

- **Ready to merge?** No — with fixes. Fix the three HIGH items first.
- **Reasoning:** The plan is implemented faithfully. All six Gherkin scenarios pass against real Postgres, all 58 unit tests pass, and every subsystem builds, lints, and typechecks. Three defects break invariants the plan states: bearer tokens go into the request log, a published campaign can be edited back to an incomplete state while it stays `live`, and a funded (`accepted`) proposal can be forced back to `declined`.

## Quality gate results

| Gate | Command | Result |
|---|---|---|
| Build (3 subsystems) | `pnpm -r build` | PASS (shared-types, api, mobile) |
| Lint (3 subsystems) | `pnpm -r lint` | PASS, 0 errors |
| Static types | `tsc --noEmit -p apps/api/tsconfig.json` | PASS |
| Unit tests | `npx jest` (apps/api) | PASS, 58/58 |
| E2E Gherkin | `npx jest --config test/jest-e2e.json -t gherkin` | PASS, 6/6 vs live Postgres |
| Secret scan | grep for `sk-`, `api_key`, `secret` | PASS, no hardcoded secrets |
| SAST | none configured | NOT RUN — no SonarQube, CodeQL, or semgrep config exists in this repo |

## Requirement verification

| ID | Verdict | Evidence |
|---|---|---|
| REQ-001 | PASS | `auth.service.ts:53-93` one transaction creates User + Brand/Creator |
| REQ-002 | PASS | `auth.service.ts:164-195` access + refresh pair |
| REQ-003 | PASS (see L1) | `auth.service.ts:102-111` single generic message |
| REQ-004 | PASS | `products.service.ts:18-28` brandId from `@CurrentUser()`, never from body |
| REQ-005 | PASS | `campaigns.service.ts:31-43` draft + `findByIdAndBrandId` |
| REQ-006 | PARTIAL — see H2 | publish blocks correctly, post-publish edit does not |
| REQ-007 | PASS | `campaigns.service.ts:60-83` filters `status = live` |
| REQ-008 | PASS | unique index `1735000000005-CreateProposals.ts:34-36` + 409 mapping |
| REQ-009 | PARTIAL — see H3 | target status is restricted, source status is not |
| REQ-010 | PASS | `admin-creators.service.ts:54-57` records admin id + timestamp |
| SEC-001 | PASS | ownership derived from the token in every scoped service |
| SEC-002 | PASS (see M6) | `BCRYPT_COST=12` in `.env` and `.env.example`, code default 12 |
| SEC-003 | PASS | `app.module.ts:56` 10/60s; live response header `x-ratelimit-limit: 10` |
| SEC-004 | PASS | `creators.service.ts:98-117` owner-or-admin, other creators get 404 |
| EDGE-P1-002 | PASS (see M5) | 404-not-403 applied in every scoped module |
| EDGE-P1-004 | PARTIAL — see M1, M2 | family revocation works, but the check is not atomic |
| EDGE-P1-005 | PARTIAL — see M3 | cascade works, but a rejected creator can immediately re-apply |
| A03 Injection | PASS | 0 string-concatenated SQL; all queries parameterized |
| Mass assignment | PASS (see L3) | global `whitelist` + `forbidNonWhitelisted` in `main.ts:16-22` |

## High Issues

- [ ] **H1 — Bearer tokens are written to the request log on every request.** `apps/api/src/app.module.ts:32-40` configures `LoggerModule.forRoot` with no `redact` list, so `pino-http` serializes the full `req.headers` object, including `authorization`. Confirmed in the e2e run: `"headers":{...,"authorization":"Bearer eyJhbGciOiJIUzI1NiIs..."}` at `info` level, which is the production level set on line 34. Anyone with log access can replay a valid access token for its full 15-minute life. This breaks the `CLAUDE.md` "Must Never" rule against putting tokens in output. Fix: add `redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], censor: '[REDACTED]' }` to `pinoHttp`.
- [ ] **H2 — A published campaign can be edited back to an incomplete state and stays `live`.** `apps/api/src/modules/campaigns/campaigns.service.ts:130-138` runs `Object.assign(campaign, dto)` with no check on `campaign.status`, and every field in `apps/api/src/modules/campaigns/dto/update-campaign.dto.ts` uses bare `@IsOptional()`, which class-validator skips for an explicit `null`. Verified: `PATCH /api/v1/campaigns/{id}` with `{"niche":null,"videoType":null,"durationSeconds":null,"language":null}` returned 200, the campaign kept `status: "live"`, and it stayed in the creator browse feed with `niche: null`. REQ-006 guards the transition but not the invariant. Fix: reject edits to the four publish-required fields once `status === 'live'`, or re-run `missingPublishFields()` after the assign and reject when it is non-empty.
- [ ] **H3 — A brand can force an `accepted` proposal back to `declined` or `shortlisted`.** `apps/api/src/modules/proposals/proposals.service.ts:104-123` validates the target status via the DTO but never reads `proposal.status` first. Verified: a proposal set to `accepted` accepted `PATCH /api/v1/proposals/{id}/status {"status":"declined"}` and returned 200 with `status: "declined"`. The `accepted` value arrived with the later escrow plan (`1735000000006-AddAcceptedToProposalsStatus.ts`), so this desyncs a funded Collaboration from its proposal. Fix: allow the transition only from `applied` or `shortlisted`, and return 422 `invalid_state_transition` otherwise.

## Medium Issues

- [ ] **M1 — Refresh-token rotation is not atomic (TOCTOU).** `apps/api/src/modules/auth/auth.service.ts:116-146` reads the row, then revokes it in a separate transaction, with no conditional predicate. Two concurrent requests carrying the same token both observe `revokedAt === null` and both mint a new pair, so reuse detection never fires for a simultaneous replay. Fix: `UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL` and treat an affected-row count of 0 as reuse.
- [ ] **M2 — Logout and natural expiry are both treated as token reuse.** `apps/api/src/modules/auth/auth.service.ts:124-133` folds `revokedAt !== null` and `expiresAt < now` into one branch that calls `revokeAllForUser`. A user who logs out on one device and then refreshes from a second device loses every session, and the log records a false "reuse detected" warning. Fix: separate the three cases, and revoke the family only for a token that was rotated, not one that expired or was logged out.
- [ ] **M3 — Vetting status does not gate marketplace participation.** `apps/api/src/modules/proposals/proposals.service.ts:30-71` never reads `creator.vettingStatus`. Verified: a creator set to `rejected` submitted a new proposal and got 201 `applied`. This makes the EDGE-P1-005 auto-decline cascade pointless, since the creator re-applies immediately. Fix: reject proposal creation unless `vettingStatus === 'approved'`, with a 422 domain code.
- [ ] **M4 — The niche-match rule is dead code.** `apps/api/src/modules/creators/entities/creator.entity.ts:90-92` defines `hasNiche()` with a comment saying ProposalsService uses it, but no caller exists anywhere in the repo. The plan's Exit Condition ("submit a proposal to a live campaign matching their niche") is therefore unimplemented. Fix: either call `hasNiche(campaign.niche)` in `ProposalsService.create()` or delete the method and correct the Exit Condition.
- [ ] **M5 — A malformed id path param returns 500 instead of 404.** No controller uses `ParseUUIDPipe` (0 occurrences across 12 UUID path params: `products.controller.ts:59,67,78`, `campaigns.controller.ts:73,82,92`, `proposals.controller.ts:35,50,92`, `creators.controller.ts:76`, `admin-creators.controller.ts:46`). Verified: `GET /api/v1/products/not-a-uuid` returned 500 `internal_error` because Postgres rejects the cast. This also breaks the uniform 404 contract for cross-tenant probing. Fix: add `ParseUUIDPipe` to every id param.
- [ ] **M6 — The bcrypt cost guardrail allows a value far below SEC-002.** `apps/api/src/config/env.validation.ts:47` sets `@Min(4)`. The deployed value is 12, so SEC-002 holds today, but an operator can silently drop it to 4. Fix: raise the floor to `@Min(12)`.
- [ ] **M7 — Unbounded string inputs.** `apps/api/src/modules/auth/dto/register.dto.ts:17-22` has no `@MaxLength` on `password`: bcrypt silently truncates past 72 bytes, and a multi-megabyte password burns CPU at cost 12 on an unauthenticated endpoint. Same gap on `pitch` (`create-proposal.dto.ts:20-22`) and `description` (`create-product.dto.ts:14-16`), both of which write to unbounded `text` columns. Fix: add `@MaxLength(72)` on password and explicit caps on the free-text fields.
- [ ] **M8 — `JWT_SECRET` has no strength check.** `apps/api/src/config/env.validation.ts:34-35` only requires a non-empty string, so a one-character HMAC key boots the app. Fix: add `@MinLength(32)`.

## Low Issues

- [ ] **L1 — Login timing oracle.** `apps/api/src/modules/auth/auth.service.ts:103-107` short-circuits before `bcrypt.compare` when the email is unknown, so an unknown email answers measurably faster than a known one. The message is generic (REQ-003 satisfied) but the behavior still enumerates accounts. Fix: compare against a fixed dummy hash when no user is found.
- [ ] **L2 — Numeric overflow returns 500.** `create-proposal.dto.ts:11-13` (`price`) and `update-creator.dto.ts:28-31` (`basePrice`) set `@Min(0)` with no `@Max`, while both columns are `numeric(10,2)`. A value above 99,999,999.99 raises a Postgres 22003 and surfaces as 500. Fix: add `@Max(99999999.99)`.
- [ ] **L3 — `Object.assign(entity, dto)` leans entirely on the global pipe.** `products.service.ts:67`, `brands.service.ts:29`, `campaigns.service.ts:136`. Safe today because `main.ts:16-22` sets `whitelist` and `forbidNonWhitelisted`, and because `target: ES2021` keeps undeclared DTO fields off the instance. It becomes a mass-assignment hole the moment either setting changes. Fix: assign fields explicitly, as `creators.service.ts:43-54` already does.
- [ ] **L4 — Logging does not follow the plan's LOG-02 rule.** `auth.service.ts:95,109,161`, `campaigns.service.ts:155`, `proposals.service.ts:57,121`, `admin-creators.service.ts:66` all use plain string interpolation. The Code Guidelines section requires one structured line with `context.module`, `context.action`, and the acting user id.
- [ ] **L5 — `Campaign.canPublish()` is dead code.** `campaign.entity.ts:150-152` has no caller; `publish()` uses `missingPublishFields()` directly.
- [ ] **L6 — Refresh tokens are never pruned.** `refresh_tokens` grows without bound; expired and revoked rows are never deleted.
- [ ] **L7 — An admin cannot read a draft campaign.** `campaigns.service.ts:104-107` puts the admin role in the creator branch, so admins only see `live` campaigns. Likely unintended for a support role.
- [ ] **L8 — `listLive` always joins `brands`.** `campaigns.service.ts:62` runs the `leftJoin` even when no `country` filter is present. Move it inside the `if (query.country)` branch.

## What was verified as correct

- 404-not-403 for cross-tenant access is applied consistently in every module in scope: `products.service.ts:50-59`, `campaigns.service.ts:90-119`, `proposals.service.ts:104-117`, `creators.service.ts:98-108`, `admin-creators.service.ts:49-52`.
- Payout details are a separate table behind an owner-or-admin check (DES-P1-004, SEC-004), with no eager relation from `Creator` that could leak them through another endpoint.
- No SQL injection surface: zero string-concatenated queries, all filters bound as named parameters.
- Migrations are correct: index on every FK, GIN index on `creators.niches`, composite unique on `(campaign_id, creator_id)`, `numeric(10,2)` for both money columns, `timestamptz` throughout, and an `up`/`down` pair per file.
- Money is handled as a string end to end (`price: string`, `basePrice: string | null`) with `.toFixed(2)` at the boundary. No float arithmetic anywhere in scope.
- `password_hash` uses `select: false`, and `RegisterDto` blocks `admin` self-registration.
- Scope discipline holds: the `proposals` module exposes only `shortlisted` and `declined`, per DES-P1-001.

## Review Summary

| Severity | Count | Status |
|---|---|---|
| CRITICAL | 0 | pass |
| HIGH | 3 | should fix before merge |
| MEDIUM | 8 | info |
| LOW | 8 | note |

**Verdict: WARNING.** No CRITICAL issue blocks the merge, and the plan is implemented with real, requirement-tagged test coverage. Fix H1, H2, and H3 before this ships: H1 puts replayable tokens in production logs, and H2 and H3 both let a client break an invariant the plan states.

**Guidelines used for this review:** the Code Guidelines section of this plan (`clean-code` SMELL-02, FUN-01, LOG-02; `security` A01, A03, A07; `database` FK indexes, `numeric(10,2)`, forward-only migrations; `nestjs` thin controllers and DTO validation), plus the `CLAUDE.md` "Must Always" and "Must Never" rules.
