# V1 Test Report: Feature 04 - Brand Proposal Review and Escrow Allocation

## Feature Overview
This feature allows brands to review incoming creator proposals, view creator profiles, and accept a proposal. Acceptance triggers automatic escrow allocation without raising a secondary charge.

## Test Scenarios & Cases

### Test Case 4.1: Brand Inbox Proposal Listing
- **Actor**: Brand user (`Glow Lab`)
- **Endpoint**: `GET /api/v1/campaigns/8fe97031-d64f-4ebc-805a-9721408791f4/proposals`
- **Response Status**: `200 OK`
- **Verification**: Proposal `8a99d471-127c-43ce-b61a-364859fd9d86` appeared in the inbox with creator details.

---

### Test Case 4.2: Brand Accepts Proposal
- **Actor**: Brand user
- **Endpoint**: `POST /api/v1/proposals/8a99d471-127c-43ce-b61a-364859fd9d86/accept`
- **Request Body**: `{}`
- **Response Status**: `201 Created`
- **Response Data**:
  - `status`: `"funded"`
  - `creatorPrice`: `"800.00"`
  - `platformFee`: `"80.00"`
  - `totalAmount`: `"880.00"`
  - `checkoutUrl`: `null` (funds allocated directly from campaign escrow)

#### PostgreSQL Database Verification: Proposal Status
Query:
```sql
SELECT id, status FROM proposals WHERE id = '8a99d471-127c-43ce-b61a-364859fd9d86';
```
Result Snapshot:
```json
{
  "id": "8a99d471-127c-43ce-b61a-364859fd9d86",
  "status": "accepted"
}
```

#### PostgreSQL Database Verification: Created Collaboration
Query:
```sql
SELECT id, campaign_id, brand_id, creator_id, status, creator_price, platform_fee, total_amount 
FROM collaborations WHERE campaign_id = '8fe97031-d64f-4ebc-805a-9721408791f4';
```
Result Snapshot:
```json
{
  "id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
  "campaign_id": "8fe97031-d64f-4ebc-805a-9721408791f4",
  "brand_id": "571d3301-30cd-44d5-b4a2-d1b0358c3967",
  "creator_id": "00ba27c2-8f3a-4531-a6d7-ad12237dc07c",
  "status": "funded",
  "creator_price": "800.00",
  "platform_fee": "80.00",
  "total_amount": "880.00"
}
```

#### PostgreSQL Database Verification: Transactions Hold Entry
Query:
```sql
SELECT id, collaboration_id, type, amount, status 
FROM transactions WHERE collaboration_id = '1a2a837f-cac1-4478-a62f-70f61ff4405c';
```
Result Snapshot:
```json
{
  "id": "656249b6-c782-4a1d-be29-1784a2694a37",
  "collaboration_id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
  "type": "hold",
  "amount": "880.00",
  "status": "completed"
}
```

#### PostgreSQL Database Verification: Campaign Escrow Balances
Query:
```sql
SELECT id, escrow_funded_amount, escrow_allocated_amount 
FROM campaigns WHERE id = '8fe97031-d64f-4ebc-805a-9721408791f4';
```
Result Snapshot:
```json
{
  "id": "8fe97031-d64f-4ebc-805a-9721408791f4",
  "escrow_funded_amount": "1000.00",
  "escrow_allocated_amount": "880.00"
}
```

---

## UI Verification via Puppeteer MCP
- **Screens Verified**:
  - `04_brand_proposals_inbox`: Proposals review tab displaying campaign proposals waiting for brand review.

## Verification Verdict
**STATUS: PASSED.**
Collaboration created with status `funded`. Hold transaction logged. Campaign allocated amount accurately incremented.
