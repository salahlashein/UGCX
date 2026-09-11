# Phase 2: Phone & OTP Authentication Integration

## Objective
Implement a Phone and OTP-based authentication flow for the NestJS backend and wire up the React Native mobile app's onboarding screens to use it. This will replace the mock Zustand-based session login. For local development, all OTP codes will be hardcoded to `0000`.

## Scope

### 1. Database Schema Updates (`apps/api`)
- Create a new migration to make `email` and `password_hash` nullable on the `User` entity, since phone/OTP users will not have them.
- Add `verification_clip_url` (text, nullable) to the `Creator` entity to store the onboarding verification video.

### 2. Authentication Endpoints (`apps/api`)
Update the `AuthController` and `AuthService` in `apps/api/src/modules/auth`:
- **POST `/auth/otp/send`**
  - **Payload:** `{ phone: string, role?: UserRole }`
  - **Behavior:** Checks if user exists. If not, temporarily stores the role requirement. Hardcodes OTP generation to `0000`.
- **POST `/auth/otp/verify`**
  - **Payload:** `{ phone: string, otp: string, role?: UserRole }`
  - **Behavior:** Validates the OTP. If valid and user doesn't exist, creates the root `User` and `Creator`/`Brand` profile in a single transaction. Returns the standard `TokenPair`.

### 3. Shared Types (`packages/shared-types`)
- Add DTO interfaces for `SendOtpRequest` and `VerifyOtpRequest`.
- Update `Creator` interface to include `verificationClipUrl`.

### 4. Frontend Integration (`apps/mobile`)
- **API Hooks:** Add `useSendOtp` and `useVerifyOtp` to `apps/mobile/src/hooks/api/useAuth.ts`.
- **OnboardingPhoneNumberScreen:** Connect to `useSendOtp`. Navigate to OTP screen on success.
- **OnboardingOtpScreen:** Connect to `useVerifyOtp`. On success, set the session in `authStore`.
- **OnboardingBasicsScreen:** Refactor to call `PATCH /creators/me` with `{ displayName, city, niches }` and include the verification clip.
- **OnboardingPortfolioScreen:** Refactor `handleFinish` to call `PATCH /creators/me` (for `basePrice`) and `POST /creators/me/portfolio-items` (for samples) before navigating to the main app, removing the mock Zustand session setter.

## Step-by-Step Implementation

1. **Step 1: Database Migrations**
   - Update `user.entity.ts` and `creator.entity.ts`.
   - Run `pnpm typeorm migration:generate` and apply it to the database.

2. **Step 2: Shared Types**
   - Update `packages/shared-types/src/auth.ts` and `creators.ts`.
   - Build the shared-types package.

3. **Step 3: Backend Auth Service & Controller**
   - Implement the `otp/send` and `otp/verify` methods. Ensure a robust transaction is used to create new users.

4. **Step 4: Frontend Hook Updates**
   - Implement `@tanstack/react-query` mutations for the new endpoints.

5. **Step 5: Wiring the Mobile UI**
   - Go through the 4 onboarding screens and wire the state to the mutations.

6. **Step 6: End-to-End Verification**
   - Clean the database.
   - Run the app and walk through the onboarding flow, typing a phone number, entering `0000`, setting up a profile, and confirming data persists via DBeaver or psql.
