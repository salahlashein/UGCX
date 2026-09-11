# Full Backend Integration & Mock Data Removal

## Objective
Remove all hardcoded mock data from the `apps/mobile` frontend, connect the UI directly to the `apps/api` NestJS backend, and implement a robust TypeORM database seeder so the app remains testable with realistic data. 

This phase covers everything simultaneously as requested by the user.

## Scope & Endpoints

### 1. Database Seeder (apps/api)
- **Goal:** Provide a `pnpm seed` command.
- **Data to generate:** 
  - Users (Brand and Creator roles)
  - Brands and Creators profiles
  - Products (for the Brand)
  - Campaigns (Draft and Live statuses)
  - Proposals (Pending, Accepted, Rejected)
  - Collaborations & Escrow Transactions
  - Deliverables & Messages

### 2. Required Backend Endpoints
Most endpoints exist in the controllers but need verification. The following specific endpoints must be wired or created:

| Method | Endpoint | Consumer Screen / Hook | Notes |
|--------|----------|------------------------|-------|
| `GET` | `/api/v1/creators/me/queue` | `CreatorHomeScreen` (`useHomeQueue`) | **NEW**: Aggregates urgent/upcoming tasks (messages, shipments, deliverables). |
| `GET` | `/api/v1/creators/me/earnings` | `CreatorHomeScreen` | **NEW**: Summarizes escrow, pending, and cleared earnings. |
| `GET` | `/api/v1/campaigns` | `CampaignDiscoveryScreen` | Returns paginated live campaigns. |
| `GET` | `/api/v1/campaigns/:id` | `CampaignDetailScreen` | Returns single campaign. |
| `GET` | `/api/v1/proposals/mine` | `MyProposalsScreen` | Returns creator's proposals. |
| `GET` | `/api/v1/collaborations/mine` | `CreatorHomeScreen` / Work Tab | Returns active collaborations. |
| `GET` | `/api/v1/collaborations/:id/messages` | `CollaborationChatScreen` | Returns message history. |
| `POST` | `/api/v1/collaborations/:id/messages` | `CollaborationChatScreen` | Sends a message via API (and Ably WS). |

### 3. Frontend Data Hook Updates (apps/mobile)
Update the following hooks in `apps/mobile/src/hooks/api` to use the real `apiClient` (Axios) instead of static imports:
- `useHomeQueue.ts` -> Calls `/creators/me/queue`
- `useCampaigns.ts` -> Calls `/campaigns` and `/campaigns/:id`
- `useProposals.ts` -> Calls `/proposals/mine`
- `useCollaborations.ts` -> Calls `/collaborations/mine`
- `useMessages.ts` -> Calls `/collaborations/:id/messages`
- `useDeliverables.ts` -> Calls `/deliverables`

### 4. Frontend Screen Un-mocking (apps/mobile)
Remove hardcoded `const MOCK_DATA = [...]` arrays inside the UI components and replace them with React Query hook calls.

**Target Screens:**
1. `CreatorHomeScreen.tsx`
2. `CampaignDiscoveryScreen.tsx`
3. `CampaignDetailScreen.tsx`
4. `MyProposalsScreen.tsx`
5. `CollaborationChatScreen.tsx`
6. `CollaborationDetailScreen.tsx`
7. `DeliverableUploadScreen.tsx`
8. `ProposalsInboxScreen.tsx` (Brand)
9. `CampaignsListScreen.tsx` (Brand)
10. `CampaignWizardScreen.tsx` (Brand)

## Step-by-Step Implementation

1. **Step 1: Build the API Seeder**
   - Create `apps/api/src/database/seeder.ts`.
   - Implement realistic factory functions for TypeORM entities.
   - Add `"seed": "ts-node src/database/seeder.ts"` to `apps/api/package.json`.

2. **Step 2: Add Missing Aggregation Endpoints**
   - In `creators.controller.ts`, add `GET /me/queue`.
   - In `creators.service.ts`, implement the logic to gather Deliverables due, Shipments pending, and Unread Messages, returning the `HomeQueueData` shape.
   - Add `GET /me/earnings` to calculate the escrow and cleared amounts.

3. **Step 3: Update Frontend Hooks**
   - Modify `apps/mobile/src/hooks/api/*.ts` to point to the live server URL via `axios`.
   - Remove `mocks/*.json` from the frontend.

4. **Step 4: Connect Screens**
   - Go through the target screens sequentially.
   - Inject `const { data, isLoading } = useXYZ()` logic.
   - Ensure loading spinners and Empty States (e.g., `NoOpenBriefsStateScreen`) are appropriately triggered.

5. **Step 5: E2E Verification**
   - Run the DB seeder.
   - Launch the API and Expo app.
   - Verify Creator login -> Discovery -> Submit Proposal -> Chat -> Deliverable upload flow works end-to-end with real database state.
