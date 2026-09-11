# Document Control
- **Version**: 1.0
- **Date Created**: 2026-09-06
- **Last Updated**: 2026-09-06
- **Status**: Planned

---

# Executive Summary

- **Goal**: Remove Mock Data and Implement Actual Features for Profile, Earnings, and Discover
- **Scope**: feature / bug fix
- **Domains**: frontend, backend, database
- **Architecture**: We will replace hardcoded mock values in the React Native mobile app with real data from the NestJS backend. We will update the database seeder to remove mock campaigns and create a new `PayoutRequest` entity to handle real payout requests.
- **Tech Stack**: React Native, NestJS, TypeORM, PostgreSQL
- **Entry Condition**: User is authenticated and can access Profile, Earnings, and Discover screens.
- **Exit Condition**: No hardcoded mock data remains on the three screens. Payout requests are properly saved to the database. The seeder no longer populates mock campaigns.

---

# Requirements

## Functional Requirements
- **REQ-001**: THE SYSTEM SHALL calculate and display real creator statistics (Collaborations, Approved, Revisions avg) on the Creator Profile screen.
- **REQ-002**: WHEN a creator requests a payout, THE SYSTEM SHALL save this request to a new `PayoutRequest` database table.
- **REQ-003**: THE SYSTEM SHALL NOT populate mock campaigns in the database seeder.

Feature: Real Creator Statistics
  Scenario: Creator views their profile
    Given: The creator has completed collaborations
    When/if: The creator navigates to the Profile screen
    Then: The stats (Collaborations, Approved, Revisions avg) show actual calculated numbers instead of hardcoded 0 or N/A.

Feature: Real Payout Requests
  Scenario: Creator requests a payout
    Given: The creator has a pending balance >= 500 EGP
    When/if: The creator submits a payout request
    Then: The system creates a `PayoutRequest` record in the database with status 'PENDING'
    And: Returns a success message.

Feature: Remove Mock Campaigns
  Scenario: Database is seeded
    Given: The database seeder runs
    Then: The system does not create the mock "Glow Lab" campaign.

---

# Dependencies

| ID | Name | Type | Version | Purpose |
|----|------|------|---------|---------|
| DEP-001 | TypeORM | package | latest | Database ORM for PayoutRequest entity |

---

# Plan Details

## Design — *How it should happen*

### Impact on system design
- A new `PayoutRequest` entity will be added to the `creators` module.
- The `CreatorsService` will be updated to calculate real stats and handle the new `PayoutRequest` entity.
- The `CreatorProfileScreen` will be updated to use the new stats from the API.

### Decisions

| ID | Decision | Rationale | Alternatives Considered | Side effect |
|----|----------|-----------|------------------------|-------------------|
| DES-P1-001 | Add stats to `GET /creators/me` | Avoids adding a new endpoint just for 3 numbers | Separate endpoint | Mobile app needs to read from the updated profile response |
| DES-P1-002 | Create `PayoutRequest` entity | Needed to persist requests for admin review | Relying on emails | Database schema change |

### Constraints & Assumptions

| Type | ID | Description | Impact if Wrong | Handling Strategy |
|------|----|-------------|-----------------|-------------------|
| Constraint | CON-P1-001 | Revisions avg might be complex to calculate | Stats could be inaccurate | Keep it simple for now, maybe count revisions per collab |
| Assumption | ASM-P1-001 | Admins will need a way to view payout requests | Payouts won't be processed | Add a basic admin endpoint later if needed (out of scope for this specific phase) |

### Edge cases
  | ID | Scenario | Expected Behavior | Handling Strategy |
  |----|----------|-------------------|-------------------|
  | EDGE-P1-001 | Creator has no collaborations | Stats should show 0 | Handle null/0 gracefully |

### Directory Map
  ```text
  apps/
  ├── api/src/
  │   ├── modules/creators/
  │   │   ├── entities/payout-request.entity.ts
  │   │   ├── creators.service.ts
  │   │   └── creators.controller.ts
  │   └── database/seeder.ts
  └── mobile/src/
      └── screens/creator/CreatorProfileScreen.tsx
  ```

### Directory Specifications

| ID | Task | File(s)| responsibility or Expected Behaviors | Validations/Error handling | Key Configurations |
|----|------|--------|--------------------------------------|----------------------------|--------------------|
| TASK-P1-001 | DONE | `apps/api/src/modules/creators/entities/payout-request.entity.ts` | Define PayoutRequest schema (amount, method, status, creatorId) | DB constraints | |
| TASK-P1-002 | DONE | `apps/api/src/modules/creators/creators.service.ts` | Update `requestPayout` to save to DB. Add `stats` to `findByUserId`. | Throw error if balance insufficient | |
| TASK-P1-003 | DONE | `apps/api/src/database/seeder.ts` | Remove mock campaign, proposal, collab, messages, tx. | None | |
| TASK-P1-004 | DONE | `apps/mobile/src/screens/creator/CreatorProfileScreen.tsx` | Use `profile.stats` instead of hardcoded 0 and N/A. | Fallback to 0 | |

### Data Models & flows

<Data-Models> 
  `PayoutRequest` Table:
  - `id`: uuid (PK)
  - `creatorId`: uuid (FK to Creator)
  - `amount`: decimal
  - `method`: string (instapay, bank, vodafone)
  - `status`: enum (PENDING, APPROVED, REJECTED, PAID)
  - `createdAt`, `updatedAt`
</Data-Models>

<Data-flow>
  1. Creator opens Profile -> Mobile calls `GET /creators/me` -> API calculates stats and returns them.
  2. Creator requests payout -> Mobile calls `POST /creators/me/payout-requests` -> API validates balance, creates `PayoutRequest`, returns success.
</Data-flow>

---

# Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| RISK-001 | Stats calculation could be slow if user has many collaborations | Low | Med | Use efficient SQL aggregations if needed |

# Code Guidelines
- Follow existing codebase patterns.
- Keep components small and focused.
- Ensure strict typing for new DTOs and API responses.
