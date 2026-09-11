# Earnings & Payouts Implementation Plan

## Phase 1: Backend Endpoints for Ledger and Payout Requests
1. **Ledger Endpoint**: 
   - Create `getLedger` in `creators.service.ts` to return formatted ledger entries by querying the creator's collaborations and joining the brand.
   - Map `CollaborationStatus` to UI statuses (e.g. `APPROVED` -> `Withdrawable`, `FUNDED`/`SHIPPED`/`DELIVERED`/`REVISION_REQUESTED` -> `In escrow`, `PAID` -> `Paid`).
   - Expose as `GET /creators/me/ledger` in `creators.controller.ts`.
2. **Payout Request Endpoint**:
   - Create `requestPayout` in `creators.service.ts` that accepts a `method` and `amount`.
   - Expose as `POST /creators/me/payout-requests`.
   - Since payouts are manual by ops (per HLD), this endpoint will log the request and return success (simulating a notification to the admin queue).

## Phase 2: Frontend Hooks & UI Integration
1. **Hooks**:
   - Add `useCreatorLedger()` to `useCreator.ts` calling `GET /creators/me/ledger`.
   - Add `useRequestPayout()` to `useCreator.ts` calling `POST /creators/me/payout-requests`.
2. **PayoutsScreen Integration**:
   - Fetch `useCreatorEarnings()` for the top stats (Escrow, Pending/Withdrawable, Cleared).
   - Fetch `useCreatorLedger()` to replace the mocked `LEDGER` constant.
   - Wire the `AppBottomSheet` "Request Payout" button to `useRequestPayout.mutate()`.
   - Remove hardcoded mock data.
