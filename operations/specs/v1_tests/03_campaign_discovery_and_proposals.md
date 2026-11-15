# V1 Test Report: Feature 03 - Campaign Discovery and Creator Proposals

## Feature Overview
This feature allows creators to discover live briefs in the marketplace, filter by niche or shipping requirements, submit proposals with custom pricing and delivery commitments, and enforces duplicate proposal constraints.

## Test Scenarios & Cases

### Test Case 3.1: Discover Published Campaigns
- **Actor**: Creator user (`Nour Hassan`, ID: `00ba27c2-8f3a-4531-a6d7-ad12237dc07c`)
- **Endpoint**: `GET /api/v1/campaigns?perPage=20`
- **Response Status**: `200 OK`
- **Verification**: The published campaign (`Summer Skincare UGC Campaign 577397`, ID: `8fe97031-d64f-4ebc-805a-9721408791f4`) appeared in the discovery feed.

---

### Test Case 3.2: Creator Submits Proposal
- **Actor**: Creator user (`Nour Hassan`)
- **Endpoint**: `POST /api/v1/campaigns/8fe97031-d64f-4ebc-805a-9721408791f4/proposals`
- **Request Body**:
```json
{
  "price": 800,
  "deliveryDays": 5,
  "pitch": "I have 50K followers in Beauty and love filming aesthetic unboxings in Cairo!"
}
```
- **Response Status**: `201 Created`
- **Response ID**: `8a99d471-127c-43ce-b61a-364859fd9d86`

#### PostgreSQL Database Verification
Query:
```sql
SELECT id, campaign_id, creator_id, price, delivery_days, pitch, status 
FROM proposals WHERE id = '8a99d471-127c-43ce-b61a-364859fd9d86';
```
Result Snapshot:
```json
{
  "id": "8a99d471-127c-43ce-b61a-364859fd9d86",
  "campaign_id": "8fe97031-d64f-4ebc-805a-9721408791f4",
  "creator_id": "00ba27c2-8f3a-4531-a6d7-ad12237dc07c",
  "price": "800.00",
  "delivery_days": 5,
  "pitch": "I have 50K followers in Beauty and love filming aesthetic unboxings in Cairo!",
  "status": "applied"
}
```

---

### Test Case 3.3: Duplicate Proposal Constraint Enforcement
- **Actor**: Creator user (`Nour Hassan`)
- **Action**: Resubmitting a second proposal to the same campaign.
- **Endpoint**: `POST /api/v1/campaigns/8fe97031-d64f-4ebc-805a-9721408791f4/proposals`
- **Response Status**: `409 Conflict`
- **Error Response**:
```json
{
  "error": {
    "code": "conflict",
    "message": "You have already submitted a proposal for this campaign"
  }
}
```
- **Verification**: The unique constraint in PostgreSQL blocked duplicate rows.

---

## UI Verification via Puppeteer MCP
- **Screens Verified**:
  - `03_creator_discover_feed`: Creator marketplace feed showing live briefs, niche chips (`Beauty`, `Fashion`), and escrow badges (`EGP 7400.00 held in escrow`).

## Verification Verdict
**STATUS: PASSED.**
Proposal submitted and stored with status `applied`. Duplicate proposals correctly blocked with HTTP 409.
