# V1 Test Report: Feature 05 - Collaboration Chat

## Feature Overview
This feature provides in-app messaging between the brand and creator scoped to an active collaboration. It logs system milestone events and user chat messages in chronological sequence.

## Test Scenarios & Cases

### Test Case 5.1: Automatic System Message on Collaboration Creation
- **Trigger**: Brand accepts proposal.
- **Verification**: Collaboration record creation automatically generates an initial system message containing the funded escrow amounts.

---

### Test Case 5.2: Brand Sends Chat Message
- **Actor**: Brand user (`Glow Lab`, User ID: `e7baf692-c3ea-4174-85d6-540112c92984`)
- **Endpoint**: `POST /api/v1/collaborations/1a2a837f-cac1-4478-a62f-70f61ff4405c/messages`
- **Request Body**:
```json
{
  "body": "Hi Nour! Excited to collaborate. Please focus on the texture."
}
```
- **Response Status**: `201 Created`
- **Response ID**: `9be22ae6-ed57-489c-b3f5-97220e7c24a3`

---

### Test Case 5.3: Creator Sends Chat Message
- **Actor**: Creator user (`Nour Hassan`, User ID: `a9ef2e9c-fa99-47aa-a623-3b7251500616`)
- **Endpoint**: `POST /api/v1/collaborations/1a2a837f-cac1-4478-a62f-70f61ff4405c/messages`
- **Request Body**:
```json
{
  "body": "Understood! I will record the close-up texture in daylight tomorrow."
}
```
- **Response Status**: `201 Created`
- **Response ID**: `96464997-892c-487a-a0b2-bf027408aa38`

#### PostgreSQL Database Verification
Query:
```sql
SELECT id, collaboration_id, sender_user_id, body, sent_at 
FROM messages WHERE collaboration_id = '1a2a837f-cac1-4478-a62f-70f61ff4405c' 
ORDER BY sent_at ASC;
```
Result Snapshot:
```json
[
  {
    "id": "74917196-667a-4884-9c90-e69df5c8ce79",
    "collaboration_id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
    "sender_user_id": null,
    "body": "{\"total\":\"880.00\",\"creatorPrice\":\"800.00\"}",
    "sent_at": "2026-10-29T17:35:27.509Z"
  },
  {
    "id": "9be22ae6-ed57-489c-b3f5-97220e7c24a3",
    "collaboration_id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
    "sender_user_id": "e7baf692-c3ea-4174-85d6-540112c92984",
    "body": "Hi Nour! Excited to collaborate. Please focus on the texture.",
    "sent_at": "2026-10-29T17:35:27.555Z"
  },
  {
    "id": "96464997-892c-487a-a0b2-bf027408aa38",
    "collaboration_id": "1a2a837f-cac1-4478-a62f-70f61ff4405c",
    "sender_user_id": "a9ef2e9c-fa99-47aa-a623-3b7251500616",
    "body": "Understood! I will record the close-up texture in daylight tomorrow.",
    "sent_at": "2026-10-29T17:35:27.593Z"
  }
]
```

---

## Verification Verdict
**STATUS: PASSED.**
Messages correctly linked to collaboration ID, sender user ID, and ordered chronologically by `sent_at`.
