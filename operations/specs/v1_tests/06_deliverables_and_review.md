# V1 Test Report: Feature 06 - Deliverable Upload and Review Loop

## Feature Overview
This feature allows creators to request scoped presigned storage URLs, register uploaded video deliverables, and allows brands to review and approve deliverables. Approval triggers the escrow release to creator earnings and records the platform fee.

## Test Scenarios & Cases

### Test Case 6.1: Creator Requests Presigned Upload URL
- **Actor**: Creator user (`Nour Hassan`)
- **Endpoint**: `POST /api/v1/collaborations/1a2a837f-cac1-4478-a62f-70f61ff4405c/deliverables/upload-url`
- **Request Body**:
```json
{
  "contentType": "video/mp4",
  "fileSize": 10485760
}
```
- **Response Status**: `200 OK`
- **Response Data**:
  - `uploadUrl`: Presigned S3/R2 PUT URL
  - `fileUrl`: Scoped object URL (`https://pub-70e1fef88f8a4917b0e0806684f8064a.r2.dev/collaborations/1a2a837f-cac1-4478-a62f-70f61ff4405c/74a7fe43-5463-46c7-a51a-a0b1331e10eb.mp4`)

---

### Test Case 6.2: Creator Registers Uploaded Deliverable
- **Actor**: Creator user (`Nour Hassan`)
- **Endpoint**: `POST /api/v1/collaborations/1a2a837f-cac1-4478-a62f-70f61ff4405c/deliverables`
- **Request Body**:
```json
{
  "type": "ready_ad",
  "fileUrl": "https://pub-70e1fef88f8a4917b0e0806684f8064a.r2.dev/collaborations/1a2a837f-cac1-4478-a62f-70f61ff4405c/74a7fe43-5463-46c7-a51a-a0b1331e10eb.mp4",
  "durationSeconds": 30,
  "note": "Here is the first draft! Natural lighting and sound included."
}
```
- **Response Status**: `201 Created`
- **Response ID**: `a549c568-5490-44e3-884f-e0175b13c8b6`

#### PostgreSQL Database Verification: Submitted Deliverable
Query:
```sql
SELECT id, collaboration_id, file_url, status, created_at 
FROM deliverables WHERE collaboration_id = '1a2a837f-cac1-4478-a62f-70f61ff4405c';
```
Result Snapshot:
```json
{
  "id": "a549c568-5490-44e3-884f-e0175b13c8b6",
  "collaboration_id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
  "file_url": "https://pub-70e1fef88f8a4917b0e0806684f8064a.r2.dev/collaborations/1a2a837f-cac1-4478-a62f-70f61ff4405c/74a7fe43-5463-46c7-a51a-a0b1331e10eb.mp4",
  "status": "submitted",
  "created_at": "2026-10-29T17:35:27.673Z"
}
```

#### Collaboration Status after Upload
Query:
```sql
SELECT id, status FROM collaborations WHERE id = '1a2a837f-cac1-4478-a62f-70f61ff4405c';
```
Result Snapshot:
```json
{
  "id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
  "status": "delivered"
}
```

---

### Test Case 6.3: Brand Approves Deliverable
- **Actor**: Brand user (`Glow Lab`)
- **Endpoint**: `POST /api/v1/deliverables/a549c568-5490-44e3-884f-e0175b13c8b6/review`
- **Request Body**:
```json
{
  "action": "approve"
}
```
- **Response Status**: `200 OK`
- **Response Data**:
  - `status`: `"approved"`
  - `collaborationStatus`: `"approved"`
  - `releasedAmount`: `"880.00"`
  - `creatorAmount`: `"800.00"`
  - `platformFee`: `"80.00"`
  - `currency`: `"EGP"`

#### PostgreSQL Database Verification: Approved Deliverable & Collaboration
Query:
```sql
SELECT d.id, d.status AS deliverable_status, c.status AS collaboration_status
FROM deliverables d
JOIN collaborations c ON c.id = d.collaboration_id
WHERE d.id = 'a549c568-5490-44e3-884f-e0175b13c8b6';
```
Result Snapshot:
```json
{
  "id": "a549c568-5490-44e3-884f-e0175b13c8b6",
  "deliverable_status": "approved",
  "collaboration_status": "approved"
}
```

#### PostgreSQL Transactions Ledger: Release & Platform Fee Verification
Query:
```sql
SELECT id, collaboration_id, type, amount, status, created_at 
FROM transactions WHERE collaboration_id = '1a2a837f-cac1-4478-a62f-70f61ff4405c' 
ORDER BY created_at DESC;
```
Result Snapshot:
```json
[
  {
    "id": "7b679d86-b866-41c8-8283-d92ce34848e6",
    "collaboration_id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
    "type": "release",
    "amount": "880.00",
    "status": "completed",
    "created_at": "2026-10-29T17:35:27.757Z"
  },
  {
    "id": "f1495b37-b8c8-4a0c-ad50-e4e1182f4f09",
    "collaboration_id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
    "type": "fee",
    "amount": "80.00",
    "status": "completed",
    "created_at": "2026-10-29T17:35:27.757Z"
  }
]
```

---

## UI Verification via Puppeteer MCP
- **Screens Verified**:
  - `06_creator_my_board`: Creator board showing collaboration in "In review / Completed" with status `approved` and amount `EGP 800.00`.

## Verification Verdict
**STATUS: PASSED.**
Deliverable reviewed and approved. Release and fee ledger transactions executed cleanly.
