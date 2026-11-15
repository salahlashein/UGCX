# V1 Test Report: Feature 08 - In-App Notifications

## Feature Overview
This feature delivers in-app notifications for lifecycle events to Brands and Creators. Events are defined in `@ugcx/shared-types` and stored in PostgreSQL `notifications`.

## Test Scenarios & Cases

### Test Case 8.1: Brand Receives Notification Feed
- **Actor**: Brand user (`Glow Lab`, User ID: `e7baf692-c3ea-4174-85d6-540112c92984`)
- **Endpoint**: `GET /api/v1/notifications?perPage=20`
- **Response Status**: `200 OK`
- **Verification**: Brand received notifications for `brief_published`, `proposal_received`, `escrow_funded`, and `message_received`.

---

### Test Case 8.2: Creator Receives Notification Feed
- **Actor**: Creator user (`Nour Hassan`, User ID: `a9ef2e9c-fa99-47aa-a623-3b7251500616`)
- **Endpoint**: `GET /api/v1/notifications?perPage=20`
- **Response Status**: `200 OK`
- **Verification**: Creator received notifications for `message_received` and collaboration status updates.

#### PostgreSQL Database Verification
Query:
```sql
SELECT id, user_id, event, params, read_at, created_at 
FROM notifications 
WHERE user_id IN ('e7baf692-c3ea-4174-85d6-540112c92984', 'a9ef2e9c-fa99-47aa-a623-3b7251500616') 
ORDER BY created_at DESC 
LIMIT 5;
```
Result Snapshot:
```json
[
  {
    "id": "27d0f977-c999-4bba-957d-418ca8a6b293",
    "user_id": "e7baf692-c3ea-4174-85d6-540112c92984",
    "event": "message_received",
    "params": {
      "preview": "Understood! I will record the close-up texture in ",
      "senderName": "Nour Hassan"
    },
    "read_at": null,
    "created_at": "2026-10-29T17:35:27.593Z"
  },
  {
    "id": "c3cf5ba8-a9e5-4793-af2e-68c72c6b4478",
    "user_id": "a9ef2e9c-fa99-47aa-a623-3b7251500616",
    "event": "message_received",
    "params": {
      "preview": "Hi Nour! Excited to collaborate. Please focus on t",
      "senderName": "Glow Lab"
    },
    "read_at": null,
    "created_at": "2026-10-29T17:35:27.555Z"
  },
  {
    "id": "71e5a27f-b33e-462a-9966-2b6b668c869a",
    "user_id": "e7baf692-c3ea-4174-85d6-540112c92984",
    "event": "escrow_funded",
    "params": {
      "title": "Summer Skincare UGC Campaign 577397",
      "total": "880.00",
      "currency": "EGP",
      "creatorPrice": "800.00"
    },
    "read_at": null,
    "created_at": "2026-10-29T17:35:27.509Z"
  },
  {
    "id": "0aa5c268-3508-4192-9883-5ed4240da4be",
    "user_id": "e7baf692-c3ea-4174-85d6-540112c92984",
    "event": "proposal_received",
    "params": {
      "count": 1,
      "title": "Summer Skincare UGC Campaign 577397"
    },
    "read_at": null,
    "created_at": "2026-10-29T17:35:27.391Z"
  },
  {
    "id": "4cff353d-5ab7-4808-9f83-3df00901de2c",
    "user_id": "e7baf692-c3ea-4174-85d6-540112c92984",
    "event": "brief_published",
    "params": {
      "title": "Summer Skincare UGC Campaign 577397"
    },
    "read_at": null,
    "created_at": "2026-10-29T17:35:27.339Z"
  }
]
```

---

## Verification Verdict
**STATUS: PASSED.**
Notification records generated automatically by domain lifecycle events and persisted in PostgreSQL.
