# V1 Test Report: Feature 02 - Brief Creation and Escrow Funding

## Feature Overview
This feature allows a brand to create a brief using a 1-page form, fund the escrow balance directly, and publish the campaign to the creator marketplace.

## Test Scenarios & Cases

### Test Case 2.1: Post Brief (1-Page Form Draft)
- **Actor**: Brand user (`Glow Lab`, ID: `e7baf692-c3ea-4174-85d6-540112c92984`)
- **Endpoint**: `POST /api/v1/campaigns`
- **Request Body**:
```json
{
  "title": "Summer Skincare UGC Campaign 577397",
  "niche": "beauty_personal_care",
  "videoType": "unboxing",
  "durationSeconds": 30,
  "language": "ar",
  "budgetMin": 500,
  "budgetMax": 1000,
  "needsShipping": false
}
```
- **Response Status**: `201 Created`
- **Response ID**: `8fe97031-d64f-4ebc-805a-9721408791f4`

#### PostgreSQL Database Verification (Draft State)
Query:
```sql
SELECT id, brand_id, title, status, escrow_funded_amount, escrow_allocated_amount, budget_min, budget_max 
FROM campaigns WHERE id = '8fe97031-d64f-4ebc-805a-9721408791f4';
```
Result Snapshot:
```json
{
  "id": "8fe97031-d64f-4ebc-805a-9721408791f4",
  "brand_id": "571d3301-30cd-44d5-b4a2-d1b0358c3967",
  "title": "Summer Skincare UGC Campaign 577397",
  "status": "draft",
  "escrow_funded_amount": "0.00",
  "escrow_allocated_amount": "0.00",
  "budget_min": "500.00",
  "budget_max": "1000.00"
}
```

---

### Test Case 2.2: Escrow Funding via Checkout
- **Actor**: Brand user
- **Endpoint**: `POST /api/v1/campaigns/8fe97031-d64f-4ebc-805a-9721408791f4/escrow/checkout`
- **Request Body**:
```json
{
  "method": "card",
  "amount": 1000
}
```
- **Response Status**: `200 OK`
- **Response Data**:
  - `fundedAmount`: `"1000.00"`
  - `status`: `"funded"`

---

### Test Case 2.3: Publish Brief to Marketplace
- **Actor**: Brand user
- **Endpoint**: `POST /api/v1/campaigns/8fe97031-d64f-4ebc-805a-9721408791f4/publish`
- **Response Status**: `200 OK`
- **Response Data**:
  - `status`: `"live"`

#### PostgreSQL Database Verification (Funded & Live State)
Query:
```sql
SELECT id, title, status, escrow_funded_amount, escrow_allocated_amount, escrow_refunded_amount 
FROM campaigns WHERE id = '8fe97031-d64f-4ebc-805a-9721408791f4';
```
Result Snapshot:
```json
{
  "id": "8fe97031-d64f-4ebc-805a-9721408791f4",
  "title": "Summer Skincare UGC Campaign 577397",
  "status": "live",
  "escrow_funded_amount": "1000.00",
  "escrow_allocated_amount": "0.00",
  "escrow_refunded_amount": "0.00"
}
```

#### PostgreSQL Transactions Ledger Verification
Query:
```sql
SELECT id, campaign_id, type, amount, status, created_at 
FROM transactions WHERE campaign_id = '8fe97031-d64f-4ebc-805a-9721408791f4' 
ORDER BY created_at DESC;
```
Result Snapshot:
```json
[
  {
    "id": "84316a79-5a16-467a-95f7-a8cc232d4b89",
    "campaign_id": "8fe97031-d64f-4ebc-805a-9721408791f4",
    "type": "charge",
    "amount": "1000.00",
    "status": "completed",
    "created_at": "2026-10-29T17:35:27.310Z"
  }
]
```

---

## UI Verification via Puppeteer MCP
- **Screens Verified**:
  - `02_brand_dashboard`: Brand dashboard showing "Spent this month", "Active briefs (9)", and quick action cards.
  - `02_brand_my_briefs`: Full briefs management tab showing real campaigns, statuses (`Draft`, `Open`, `Completed`), and escrow badges.

## Verification Verdict
**STATUS: PASSED.**
Campaign transitioned from draft to live with verified escrow balance in PostgreSQL.
