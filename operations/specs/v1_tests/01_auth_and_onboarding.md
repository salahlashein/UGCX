# V1 Test Report: Feature 01 - Authentication and Onboarding

## Feature Overview
This feature manages user role selection, phone number authentication with SMS OTP, and account creation for Brands and Creators.

## Test Scenarios & Cases

### Test Case 1.1: Brand Login with Phone OTP
- **Actor**: Brand user (+201000000002)
- **Endpoint**: `POST /api/v1/auth/otp/verify`
- **Request Body**:
```json
{
  "phone": "+201000000002",
  "otp": "0000",
  "role": "brand"
}
```
- **Response Status**: `200 OK`
- **Response Data**:
  - `userId`: `e7baf692-c3ea-4174-85d6-540112c92984`
  - `role`: `brand`
  - `accessToken`: JWT issued
  - `refreshToken`: JWT issued

#### PostgreSQL Database Verification
Query:
```sql
SELECT u.id, u.phone, u.role, b.id AS brand_id, b.company_name
FROM users u
LEFT JOIN brands b ON b.user_id = u.id
WHERE u.id = 'e7baf692-c3ea-4174-85d6-540112c92984';
```
Result Snapshot:
```json
{
  "id": "e7baf692-c3ea-4174-85d6-540112c92984",
  "phone": "+201000000002",
  "role": "brand",
  "brand_id": "571d3301-30cd-44d5-b4a2-d1b0358c3967",
  "company_name": "Glow Lab"
}
```

---

### Test Case 1.2: Creator Login with Phone OTP
- **Actor**: Creator user (+201000000001)
- **Endpoint**: `POST /api/v1/auth/otp/verify`
- **Request Body**:
```json
{
  "phone": "+201000000001",
  "otp": "0000",
  "role": "creator"
}
```
- **Response Status**: `200 OK`
- **Response Data**:
  - `userId`: `a9ef2e9c-fa99-47aa-a623-3b7251500616`
  - `role`: `creator`
  - `accessToken`: JWT issued
  - `refreshToken`: JWT issued

#### PostgreSQL Database Verification
Query:
```sql
SELECT u.id, u.phone, u.role, c.id AS creator_id, c.display_name, c.vetting_status
FROM users u
LEFT JOIN creators c ON c.user_id = u.id
WHERE u.id = 'a9ef2e9c-fa99-47aa-a623-3b7251500616';
```
Result Snapshot:
```json
{
  "id": "a9ef2e9c-fa99-47aa-a623-3b7251500616",
  "phone": "+201000000001",
  "role": "creator",
  "creator_id": "00ba27c2-8f3a-4531-a6d7-ad12237dc07c",
  "display_name": "Nour Hassan",
  "vetting_status": "approved"
}
```

---

### Test Case 1.3: New Creator Registration
- **Actor**: New Creator (+201099577397)
- **Flow**:
  1. `POST /api/v1/auth/otp/send` with `{ phone: "+201099577397", role: "creator" }` -> Returns `200 OK`.
  2. `POST /api/v1/auth/otp/verify` with `{ phone: "+201099577397", otp: "0000", role: "creator" }` -> Creates user and creator records.
- **Response Status**: `200 OK`
- **Response Data**:
  - `userId`: `bd40a9f9-a4f0-4a3f-8fd1-3349c78e79c1`
  - `role`: `creator`

#### PostgreSQL Database Verification
Query:
```sql
SELECT u.id, u.phone, u.role, c.id AS creator_id
FROM users u
LEFT JOIN creators c ON c.user_id = u.id
WHERE u.id = 'bd40a9f9-a4f0-4a3f-8fd1-3349c78e79c1';
```
Result Snapshot:
```json
{
  "id": "bd40a9f9-a4f0-4a3f-8fd1-3349c78e79c1",
  "phone": "+201099577397",
  "role": "creator",
  "creator_id": "08f07d57-4540-47a0-b0e1-fac7f1fe682c"
}
```

---

## UI Verification via Puppeteer MCP
- **Screens Verified**:
  - `01_auth_role_selection`: Role choice between Creator and Brand.
  - `01_auth_phone_screen`: Egyptian phone number entry (+20 prefix).
  - `01_auth_otp_screen`: 4-digit verification code entry with resend timer.

## Verification Verdict
**STATUS: PASSED.**
All records persist in PostgreSQL. Mock data was not used.
