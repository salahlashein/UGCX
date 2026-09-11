# Document Control
- **Version**: 1.0
- **Date Created**: 2026-08-31
- **Last Updated**: 2026-08-31
- **Status**: Planned

---

# Executive Summary

- **Goal**: Build the one cross-platform mobile app that carries both brand mode and creator mode, consuming the APIs from the core-domain and escrow/payments plans, in Arabic and English with full RTL support.
- **Scope**: production feature (Phase 1 slice)
- **Domains**: frontend (mobile), API integration
- **Architecture**: One Expo/React Native app (`apps/mobile`) with role-based navigation: after login, a brand user sees the Brand tab navigator, a creator user sees the Creator tab navigator. Server state goes through TanStack Query against the NestJS API; a small Zustand store holds only the auth session. All text is bilingual from the first screen (`react-i18next` + RTL layout via `I18nManager`).
- **Tech Stack**: Expo (managed workflow), React Native, TypeScript, TanStack Query, React Hook Form + Zod, Zustand, `react-i18next`, `expo-secure-store`, `react-native-webview`, `ably` (client SDK), `expo-notifications`, `expo-image-picker`/`expo-document-picker`.
- **Entry Condition**: `feature_backend_core_domain` and `feature_backend_escrow_payments` plans are complete and reachable over HTTPS (local dev: reachable over the LAN from a physical device, or via `localhost` in a simulator).
- **Exit Condition**: A brand can register, log in, create a product and a campaign, publish it, review proposals, accept one (completing a Paymob checkout in-app), confirm shipment, review a delivered video, approve it, and chat with the creator. A creator can register, log in, complete a profile with portfolio and payout details, browse and apply to campaigns, upload a deliverable, and chat with the brand. Every screen renders correctly in both English (LTR) and Arabic (RTL). Push notifications arrive for proposal, delivery, and approval events.

---

# Requirements

## Functional Requirements

- **REQ-001**: WHEN the app starts and no valid session exists THE SYSTEM SHALL show the role-selection and auth flow before any other screen.
- **REQ-002**: WHEN a user's stored access token expires THE SYSTEM SHALL silently refresh it using the stored refresh token before retrying the failed request, and SHALL log the user out only if the refresh itself fails.
- **REQ-003**: WHEN the authenticated user's role is `brand` THE SYSTEM SHALL show the Brand tab navigator (Campaigns, Products, Profile); WHEN the role is `creator` THE SYSTEM SHALL show the Creator tab navigator (Browse, My Applications, My Collaborations, Profile).
- **REQ-004**: WHEN a brand submits the campaign wizard's final step THE SYSTEM SHALL call the publish endpoint and SHALL show field-level errors returned by the API rather than a generic failure message.
- **REQ-005**: WHEN a brand accepts a proposal THE SYSTEM SHALL open the returned Paymob checkout URL in an in-app WebView and, on a redirect indicating completion, SHALL poll the collaboration status until it leaves `pending_payment` or a 60-second timeout is reached.
- **REQ-006**: WHEN a creator selects a video file to deliver THE SYSTEM SHALL request a presigned upload URL, upload the file directly to that URL with visible progress, and only then register the deliverable with the API.
- **REQ-007**: WHEN a user opens a funded-or-later collaboration's chat THE SYSTEM SHALL request a chat token from the API and connect to the Ably channel scoped to that collaboration.
- **REQ-008**: THE SYSTEM SHALL render every screen correctly in both `en` (LTR) and `ar` (RTL), switching layout direction with `I18nManager`, not just mirroring text.
- **REQ-009**: WHEN a proposal is received, a deliverable is submitted, or a collaboration is approved THE SYSTEM SHALL show a push notification to the relevant user.
- **SEC-001**: THE SYSTEM SHALL store access and refresh tokens in `expo-secure-store`, never in `AsyncStorage` or plain component state that survives app restarts.
- **SEC-002**: THE SYSTEM SHALL never render a creator's payout details on any brand-facing screen.
- **CON-001**: THE SYSTEM SHALL treat English and Arabic as first-class from the first commit — no screen ships with hard-coded English strings.
- **GUD-001**: Every list screen (campaign browse, proposals, collaborations) SHALL show explicit loading, empty, and error states — never a blank screen.

```gherkin
Feature: Role-based navigation
  Scenario: A creator sees the creator tab set after login
    Given a user with role "creator" logs in successfully
    When the app finishes loading the session
    Then the visible tab bar shows Browse, My Applications, My Collaborations, Profile
    And no brand-only screen is reachable

Feature: Silent token refresh
  Scenario: An expired access token is refreshed transparently
    Given a stored access token that the API rejects with 401
    And a valid stored refresh token
    When any authenticated request is made
    Then the app silently exchanges the refresh token for a new access token
    And retries the original request once
    And the user sees no interruption

  Scenario: Refresh failure logs the user out
    Given a stored refresh token that the API also rejects
    When the silent refresh attempt fails
    Then the app clears the stored session
    And navigates to the auth flow

Feature: Accepting a proposal in-app
  Scenario: Payment completes and the app reflects the new status
    Given a brand has tapped "Accept" on a proposal
    And the Paymob checkout WebView shows a completed payment
    When the WebView redirects to the app's success deep link
    Then the app polls the collaboration status
    And shows "Funded" once the status leaves "pending_payment"

Feature: RTL rendering
  Scenario: Arabic locale mirrors layout direction
    Given the user's selected locale is "ar"
    When any screen renders
    Then I18nManager.isRTL is true
    And list items, icons, and navigation chevrons are mirrored, not just the text
```

---

# Dependencies

| ID | Name | Type | Version | Purpose |
|---|---|---|---|---|
| DEP-001 | @tanstack/react-query | package | latest stable | Server state, caching, retries |
| DEP-002 | react-hook-form, zod, @hookform/resolvers | package | latest stable | Form state and validation, matching DTOs on the API |
| DEP-003 | zustand | package | latest stable | Minimal client-only state (auth session) |
| DEP-004 | react-i18next, i18next, expo-localization | package | latest stable | Arabic/English strings and locale detection |
| DEP-005 | expo-secure-store | package | latest stable (Expo SDK-matched) | Encrypted token storage |
| DEP-006 | react-native-webview | package | latest stable (Expo SDK-matched) | Paymob checkout |
| DEP-007 | ably | package | latest stable | Realtime chat client |
| DEP-008 | expo-notifications | package | latest stable (Expo SDK-matched) | Push notifications |
| DEP-009 | expo-document-picker or expo-image-picker | package | latest stable (Expo SDK-matched) | Selecting deliverable video/photo files |
| DEP-010 | packages/shared-types | internal | n/a | DTO types shared with `apps/api` |

Check each package's latest version and Expo SDK compatibility before installing (Expo packages must match the installed SDK line — use `npx expo install` rather than `pnpm add` for any `expo-*` package).

**Backend addendum required by this plan**: neither prior plan exposes a device push-token registration endpoint. Add `POST /api/v1/users/me/push-token` (body: `{ expoPushToken: string }`, stores it on the `users` row) as a small extension to the `users` module from `feature_backend_core_domain`, and a corresponding trigger in the escrow/payments plan's proposal, deliverable, and approval flows that sends an Expo push via the Expo Push API when those events fire. This is a small addition to existing modules, not a new plan.

---

# Plan Details

## Design — *How it should happen*

### Impact on system design

This plan is purely a consumer of the two backend plans — it adds no new backend endpoints beyond the push-token addendum above. Internally, it introduces one navigation split (brand vs. creator) driven entirely by `user.role` from the auth response, so there is exactly one code path per role rather than role checks scattered through shared screens.

```
                    ┌───────────────┐
                    │  App bootstrap  │
                    │  read session   │
                    │  from SecureStore│
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             │             ▼
     no valid session       │      valid session
              │             │             │
              ▼             │             ▼
     ┌────────────────┐     │    role === 'brand'?
     │ Auth stack       │    │       │         │
     │ (role select,    │    │      yes        no
     │  register, login)│    │       │         │
     └────────────────┘     │       ▼         ▼
                             │  Brand tabs   Creator tabs
```

### Decisions

| ID | Decision | Rationale | Alternatives Considered | Side effect (which modules?) |
|---|---|---|---|---|
| DES-P1-001 | Server state via TanStack Query, client state via Zustand, kept strictly separate | `frontend-patterns`/`react-patterns` guidance: server state and UI state are different problems; mixing them into one global store causes stale-cache bugs | Redux Toolkit + RTK Query, Context + useReducer for everything | All screens |
| DES-P1-002 | Deliverable upload goes straight from the device to the presigned R2 URL, never through the NestJS API | Matches DES-P1-003 in the escrow/payments plan; the mobile app is the client that URL was designed for | Upload to the API, let the API forward to R2 | `creator/DeliverableUpload` screen |
| DES-P1-003 | Paymob checkout runs inside an in-app WebView with a custom deep-link redirect (`ugcx://payment-complete`), not an external browser handoff | Keeps the brand inside the app during a multi-minute checkout instead of losing them to Safari/Chrome and hoping they return | `expo-web-browser` (opens system browser), server-side redirect polling only | `brand/AcceptProposal` flow |
| DES-P1-004 | One shared `apiClient` (Axios or `ky`) with a response interceptor implementing REQ-002's silent refresh, used by every TanStack Query hook | Centralizes token-refresh logic in one place instead of duplicating it per screen | Per-screen manual refresh handling | `services/apiClient.ts`, every hook in `hooks/api/` |
| DES-P1-005 | This plan ships with a minimal, neutral token set for spacing/radius/color roles (not the Airtable-derived tokens in the existing `DESIGN.md`) | `DESIGN.md` as currently written describes Airtable's marketing *website* (Haas Grotesk — a licensed font we do not hold rights to, hero bands, pricing pill buttons) and has no mobile component specs and no Arabic/RTL typography guidance; applying it as-is to a MENA mobile marketplace app would be copying another company's brand system rather than building ours | Apply `DESIGN.md` literally; block this plan until a UGCX-specific design system exists | `apps/mobile` theme file; flagged as RISK-001 below, not silently worked around |
| DES-P1-006 | Chat message history is fetched once via the API (`GET /collaborations/{id}/messages`) on screen mount, then live updates come only from the Ably subscription — no polling | Avoids double-rendering messages from two sources; matches the escrow/payments plan's design (API persists for history, Ably delivers realtime) | Poll the API on an interval | `screens/shared/ChatScreen.tsx` |

### Constraints & Assumptions

| Type | ID | Description | Impact if Wrong | Handling Strategy |
|---|---|---|---|---|
| Constraint | CON-P1-001 | No offline-first support in Phase 1 — the app requires a live connection for all core actions | Poor experience on flaky mobile networks (a real concern in parts of Egypt) | TanStack Query's default retry/backoff absorbs brief drops; a full offline queue is deferred, tracked as a Phase 2+ candidate if user feedback demands it |
| Assumption | ASM-P1-001 | Both Android and iOS ship from the same Expo codebase with no platform-specific screens in Phase 1 | A platform-specific UI quirk needs `Platform.select()` patches, not a fork | Test on both a physical Android device and iOS Simulator before calling this plan done, since most of the target market is Android-majority |

### Edge cases

| ID | Scenario | Expected Behavior | Handling Strategy |
|---|---|---|---|
| EDGE-P1-001 | User backgrounds the app mid-upload of a large deliverable video | Upload resumes or restarts cleanly, never leaves a corrupt partial file registered | Do not call the register-deliverable endpoint until the presigned PUT itself returns success; if the app is killed mid-upload, the orphaned R2 object is cleaned by the bucket lifecycle policy from the escrow/payments plan (EDGE-P1-003 there) |
| EDGE-P1-002 | Paymob WebView never redirects (user abandons checkout) | Brand is not stuck in a spinner forever | REQ-005's 60-second poll timeout shows a "Payment still processing — check back shortly" state and lets the brand leave the screen; the collaboration remains `pending_payment` until a webhook arrives or it is abandoned |
| EDGE-P1-003 | Device push permission is denied | App still functions; notifications are simply not shown | Feature-detect permission status; never block core flows on notification permission |
| EDGE-P1-004 | Arabic text mixed with Latin brand/product names in the same string | Mixed-direction text renders correctly | Use Unicode bidi-safe formatting; rely on the OS text engine rather than manual string reversal |
| EDGE-P1-005 | Locale switch while an unsaved form (e.g. campaign wizard) is open | Form values are preserved across the locale switch, only labels change | Locale state lives above the form tree in the navigator, not inside the form's own component state |

### Directory Map

```text
apps/mobile/src/
├── App.tsx
├── navigation/
│   ├── RootNavigator.tsx
│   ├── AuthStack.tsx
│   ├── BrandTabNavigator.tsx
│   └── CreatorTabNavigator.tsx
├── screens/
│   ├── auth/
│   │   ├── RoleSelectScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── LoginScreen.tsx
│   ├── brand/
│   │   ├── CampaignsListScreen.tsx
│   │   ├── CampaignWizardScreen.tsx
│   │   ├── ProposalsInboxScreen.tsx
│   │   ├── AcceptProposalScreen.tsx      (Paymob WebView)
│   │   ├── ProductsListScreen.tsx
│   │   ├── ProductFormScreen.tsx
│   │   ├── CollaborationDetailScreen.tsx  (shipment, review, approve)
│   │   └── BrandProfileScreen.tsx
│   ├── creator/
│   │   ├── CampaignBrowseScreen.tsx
│   │   ├── CampaignDetailApplyScreen.tsx
│   │   ├── MyProposalsScreen.tsx
│   │   ├── MyCollaborationsScreen.tsx
│   │   ├── DeliverableUploadScreen.tsx
│   │   ├── CreatorProfileScreen.tsx        (portfolio, niches, base price)
│   │   └── PayoutDetailsScreen.tsx
│   └── shared/
│       └── ChatScreen.tsx
├── components/
│   ├── ui/                                  (Button, TextInput, Card, EmptyState, ErrorState, LoadingState)
│   └── forms/
├── hooks/
│   ├── api/                                  (useCampaigns, useProposals, useCollaborations, useMessages, ...)
│   └── useAuthSession.ts
├── services/
│   ├── apiClient.ts
│   ├── ablyClient.ts
│   └── uploadService.ts
├── store/
│   └── authStore.ts
├── i18n/
│   ├── index.ts
│   ├── en.json
│   └── ar.json
├── theme/
│   └── tokens.ts
└── types/
    └── (re-exports from packages/shared-types)
```

### Directory Specifications

| ID | Task | File(s) | Responsibility / Expected Behavior | Validations/Error handling | Key Configurations/settings |
|---|---|---|---|---|---|
| TASK-P1-001 | API client with auth interceptor | `services/apiClient.ts` | Attaches the stored access token to every request; on 401, runs the refresh flow once, retries the original request, and on refresh failure clears the session and triggers navigation to `AuthStack` | REQ-002 | Base URL from `app.config.ts` env, per build profile (dev/staging/prod) |
| TASK-P1-002 | Auth store + secure token storage | `store/authStore.ts`, `hooks/useAuthSession.ts` | Zustand store holds `{ user, accessToken, refreshToken, isLoading }`; tokens persist to `expo-secure-store`, rehydrated on app boot | SEC-001 | No token ever logged, even in dev builds |
| TASK-P1-003 | Root/auth/role navigators | `navigation/*` | Implements REQ-001, REQ-003; `RootNavigator` picks `AuthStack`, `BrandTabNavigator`, or `CreatorTabNavigator` based on session state and role | REQ-001, REQ-003 | React Navigation native-stack + bottom-tabs |
| TASK-P1-004 | i18n setup + RTL bootstrap | `i18n/*`, `App.tsx` | Loads `en.json`/`ar.json`, detects device locale via `expo-localization` with a manual override in Profile settings, calls `I18nManager.forceRTL()` and prompts an app reload when the direction actually changes | REQ-008, EDGE-P1-004 | Locale persisted to `expo-secure-store` alongside the session so it survives logout |
| TASK-P1-005 | Register/login screens | `screens/auth/*` | Forms built with React Hook Form + Zod schemas matching the API's `register`/`login` DTOs; on success, populates the auth store and navigates into the correct role tabs | Field-level errors surfaced from 422 responses; generic message on 401 (matches the backend's anti-enumeration behavior) | |
| TASK-P1-006 | Campaign wizard | `screens/brand/CampaignWizardScreen.tsx` | Multi-step form: product select/create → niche/video type/duration/language → script → talking points/do-not-say → shipping → review; final step calls create + publish | REQ-004 | Zod schema mirrors the publish validation from the core-domain plan so errors can surface inline before the API call, not only after |
| TASK-P1-007 | Proposals inbox + accept flow | `screens/brand/ProposalsInboxScreen.tsx`, `AcceptProposalScreen.tsx` | Lists proposals per campaign with creator portfolio preview; shortlist/decline call the core-domain endpoints; accept opens the Paymob WebView and implements REQ-005 | REQ-005, EDGE-P1-002 | Deep link scheme `ugcx://payment-complete` registered in `app.json` |
| TASK-P1-008 | Collaboration detail (brand side) | `screens/brand/CollaborationDetailScreen.tsx` | Shows status timeline, confirm-shipment form, deliverable review actions (approve/request revision/decline), embeds the chat entry point | GUD-001 loading/empty/error states | |
| TASK-P1-009 | Campaign browse + apply (creator side) | `screens/creator/CampaignBrowseScreen.tsx`, `CampaignDetailApplyScreen.tsx` | Lists live campaigns filtered by the creator's own niches by default, with a manual filter override; apply form (price, delivery days, pitch) | Duplicate-proposal 409 surfaces as an inline message, not a crash | |
| TASK-P1-010 | Deliverable upload | `screens/creator/DeliverableUploadScreen.tsx`, `services/uploadService.ts` | Implements REQ-006: request presigned URL, upload with progress via `expo-document-picker`/`expo-image-picker` + `fetch`/`XMLHttpRequest` progress events, then register | EDGE-P1-001 | Max file size and allowed MIME types mirrored from the escrow/payments plan's presigned-URL constraints, checked client-side before upload starts to fail fast |
| TASK-P1-011 | Creator profile, portfolio, payout details | `screens/creator/CreatorProfileScreen.tsx`, `PayoutDetailsScreen.tsx` | Niche multi-select, base price, portfolio item add/remove, payout method form | SEC-002-adjacent: payout details screen only ever renders for the owning creator, never reachable from a brand-facing navigator | |
| TASK-P1-012 | Chat screen | `screens/shared/ChatScreen.tsx`, `services/ablyClient.ts` | Implements REQ-007: fetch history from the API, subscribe to the Ably channel using the issued token, render bubbles with sender attribution, RTL-aware alignment | | Reconnects the Ably client on token expiry (1-hour TTL from the escrow/payments plan) by re-requesting a token, not by holding a stale connection |
| TASK-P1-013 | Push notification registration + handling | `hooks/usePushRegistration.ts` | Requests permission, obtains the Expo push token, calls the addendum endpoint, and handles foreground/background notification taps by deep-linking to the relevant screen | REQ-009, EDGE-P1-003 | |
| TASK-P1-014 | Base theme tokens | `theme/tokens.ts` | Neutral spacing (4px scale), radius, and color-role tokens per DES-P1-005, consumed by `components/ui/*` | | Documented in-file as provisional pending a UGCX-specific design pass |
| TASK-P1-015 | Component + integration tests | `**/*.test.tsx` | React Native Testing Library tests for the auth flow, campaign wizard validation, and the token-refresh interceptor; a manual QA pass covering every Gherkin scenario in both `en` and `ar` on a physical Android device | CI runs the automated subset; RTL and payment-flow scenarios are manually verified per the QA checklist below since they depend on device rendering and a real Paymob sandbox | |

### Schemas

This plan consumes the schemas defined in `feature_backend_core_domain` and `feature_backend_escrow_payments` verbatim, imported as TypeScript types from `packages/shared-types`. No new API schemas are introduced except the addendum below.

**Register push token** — `POST /api/v1/users/me/push-token`
```yaml
request:
  expoPushToken: string
response:
  data: { registered: true }
```

### Data Models & flows

<settings>
New environment variables (mobile app, via `app.config.ts` / EAS build profiles):

| Variable | Purpose | Secret? | Default |
|---|---|---|---|
| `API_BASE_URL` | Backend base URL per environment | No | `http://localhost:3000/api/v1` (dev) |

No Ably key ships in the app bundle. The client authenticates to Ably purely with the short-lived, collaboration-scoped token issued by `POST /collaborations/{id}/chat-token` (escrow/payments plan) — never with a static client key.
</settings>

<Data-Models>
No new database entities. This plan is a pure API consumer.
</Data-Models>

<Data-flow>
```
Mobile App                          API                         Paymob / Ably / R2
  │ login                             │                                │
  ├───────────────────────────────────►                                │
  │ tokens, user, role                │                                │
  ◄───────────────────────────────────┤                                │
  │ navigate to role tabs             │                                │
  │                                    │                                │
  │ accept proposal                    │                                │
  ├───────────────────────────────────►                                │
  │ checkoutUrl                        │                                │
  ◄───────────────────────────────────┤                                │
  │ open WebView(checkoutUrl)          │                                │
  ├─────────────────────────────────────────────────────────────────────►
  │ ... user pays inside WebView ...   │                                │
  │ redirect to ugcx://payment-complete│                                │
  ◄─────────────────────────────────────────────────────────────────────┤
  │ poll GET /collaborations/{id}      │                                │
  ├───────────────────────────────────►                                │
  │ status: funded                     │                                │
  ◄───────────────────────────────────┤                                │
```
</Data-flow>

---

#### **Process** (runtime, QA, deployment)

- **Runtime Considerations**: The Expo app runs in Expo Go during early development; a physical-device signature (development build) is needed once native modules (`expo-notifications`, `react-native-webview`) are exercised on iOS, since some native functionality is limited in Expo Go.
- **Deployment Impact**: No app-store submission in this plan — that belongs to a later release-management plan. This plan's exit condition is a working development build installable via EAS Build's internal distribution, not a store listing.

**Manual QA checklist (RTL and payment flow, not covered by automated tests):**
1. Switch device/app locale to Arabic; confirm every screen in both tab navigators mirrors layout, not just text.
2. Run the full accept-proposal flow against the Paymob sandbox; confirm REQ-005's poll-and-timeout behavior on both a successful and an abandoned checkout.
3. Kill the app mid-deliverable-upload; confirm no corrupt deliverable is registered on relaunch.

---

# Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RISK-001 | `DESIGN.md` as currently written is an Airtable marketing-website clone (Haas Grotesk, hero bands, pricing pills) with no mobile component specs and no Arabic/RTL typography guidance — it is not yet a real UGCX design system | High (confirmed by reading the file) | Med — screens ship with provisional, neutral tokens instead of a considered brand identity | Flagged here rather than worked around silently, per DES-P1-005; recommend a dedicated design pass (a fresh `DESIGN.md` for UGCX, ideally covering Arabic typography and mobile components) before this plan's screens get a visual polish pass |
| RISK-002 | Paymob's hosted checkout page may not be optimized for an in-app WebView on all Android WebView versions | Med | Med | Manual QA checklist item 2; fall back to `expo-web-browser` (system browser) if the WebView proves unreliable in testing — a same-effort swap since `AcceptProposalScreen` isolates the checkout UI |
| RISK-003 | Both brand and creator flows in one app increases the risk of accidentally leaking role-specific UI (e.g. a brand screen rendering in a creator session) | Low | Med (privacy/trust) | Navigators are role-gated at the root (TASK-P1-003), not per-screen; no shared screen reads `user.role` to conditionally render brand-only content |

---

# Code Guidelines

**From `clean-code`:**
- Keep it simple (GEN-01): no offline-first architecture, no premature multi-tenant/agency support — matches CON-001 in the HLD.
- No side effects from functions (FUN-01): `uploadService.uploadDeliverable()` either resolves with the registered deliverable or rejects — it never partially registers state on failure.
- Structured logging is a backend concern; on mobile, use a single `logger.ts` wrapper around `console` so log calls can be swapped for a crash-reporting SDK later without touching every call site.

**From `security`:**
- SEC-001: tokens live only in `expo-secure-store`.
- A01 Broken Access Control (client-side mirror): navigators enforce role separation at the root, not per-screen (RISK-003 mitigation).
- Never hard-code the Paymob or Ably server-side keys in the mobile bundle — only the API issues checkout URLs and chat tokens; the app never talks to Paymob or Ably with a secret key.

**From `react-patterns`:**
- Functional components with hooks only; no class components.
- `useMemo`/`useCallback` for expensive list rendering (campaign feed, proposals inbox).
- Error boundaries around each tab navigator so one screen's crash does not blank the whole app.
- Custom hooks (`hooks/api/*`) separate data-fetching from presentation, per the "Quality reminders" in `react-patterns`.

**From `frontend-patterns`:**
- TypeScript strict mode, no `any`.
- Zod validation on every form and on every API response boundary consumed by the mobile app, not just at the API layer.
- Mobile-first is inherent here (there is no other form factor), but the underlying principle — design for the smallest, most constrained surface first — still applies to information density on list screens (GUD-001).
