# Document Control
- **Version**: 1.1
- **Date Created**: 2026-09-03
- **Last Updated**: 2026-09-04
- **Status**: Active Implementation

---

# Executive Summary

- **Goal**: Revamp the Creator Mobile App UI to match the high-fidelity design handoff.
- **Scope**: production feature (UI overhaul)
- **Domains**: frontend (mobile)
- **Architecture**: We will build reusable atomic UI components (bottom sheets, cards, pills) based on the `DESIGN.md` spec, then sequentially replace or create the 14 target screens. We will mock the UI for screens without existing backend support yet.
- **Tech Stack**: React Native (Expo), TypeScript, Reanimated, `@gorhom/bottom-sheet` (recommended for robust bottom sheets).
- **Entry Condition**: Design HTML/screenshots are available, and the React Native environment is set up.
- **Exit Condition**: All 14 screens from the design handoff are visually implemented, tested in both LTR (English) and RTL (Arabic) modes, and integrated into the mobile app's navigation.

---

# Requirements

## Functional Requirements
- **REQ-001**: THE SYSTEM SHALL render all text in Inter (Latin) and IBM Plex Sans Arabic (Arabic) at the specified mobile scale.
- **REQ-002**: THE SYSTEM SHALL use logical CSS properties (`paddingStart`, `marginStart`) instead of physical ones to ensure automatic RTL mirroring.
- **REQ-003**: THE SYSTEM SHALL present the Onboarding flow (Role Select, Phone/OTP, Basics, Portfolio) accurately matching the design specs, including 96px vertical centering for Role Select.
- **REQ-004**: THE SYSTEM SHALL display full-bleed signature cards (coral, forest, dark navy) with correct contrast and typography.
- **REQ-005**: THE SYSTEM SHALL use bottom sheets with a 45%-opacity scrim for apply, payout, and portfolio step flows.
- **REQ-006**: THE SYSTEM SHALL visually implement all 14 handoff screens, substituting hardcoded mock data for features lacking backend support.
- **CON-001**: Bottom tab navigation must be flat with a 1px hairline top border and no switch animation.
- **GUD-001**: All new components must adhere strictly to `DESIGN.md` and the Mobile & RTL Addendum.

---

# Plan Details (Implementation Phases)

*Note for builder agent: Ensure all code matches the design handoff (`operations/design_handoff_creator_app/screens`) and respects the RTL logic.*

## Phase 1: Onboarding Completion
- [x] **TASK-1.1**: Implement `OnboardingRoleScreen.tsx` (Completed)
- [x] **TASK-1.2**: Implement `02-onboarding-otp.md` -> `OnboardingOtpScreen.tsx`. Ensure OTP inputs align natively.
- [x] **TASK-1.3**: Implement `03-onboarding-basics-required.md` -> `OnboardingBasicsScreen.tsx`. Form inputs, spacing per handoff.
- [x] **TASK-1.4**: Implement `04-onboarding-portfolio-optional.md` -> `OnboardingPortfolioScreen.tsx`.

## Phase 2: Core Discovery & Home
- [x] **TASK-2.1**: Implement `05-home-work-queue.md` -> `CreatorHomeScreen.tsx`. Urgent task cards layout.
- [x] **TASK-2.2**: Implement `06-home-discovery-feed.md` -> `CampaignDiscoveryScreen.tsx`. Filter chips, pastel demo cards.
- [x] **TASK-2.3**: Implement `07-home-status-board.md` -> `CollaborationStatusScreen.tsx`. Escrow cards, timelines.

## Phase 3: Detail & Collaboration
- [x] **TASK-3.1**: Implement `08-brief-detail-and-apply.md` -> `CampaignDetailScreen.tsx`. Hero image, sticky bottom bar, Apply bottom sheet.
- [x] **TASK-3.2**: Implement `10-upload-deliverable.md` -> `DeliverableUploadScreen.tsx`. File upload area, progress state.
- [x] **TASK-3.3**: Implement `11-collaboration-chat.md` -> `CollaborationChatScreen.tsx`. Standard chat bubbles, system capsules.

## Phase 4: Financials & Profile
- [x] **TASK-4.1**: Implement `12-earnings-and-payout.md` -> `PayoutsScreen.tsx`. Cream card balance, ledger, payout bottom sheet.
- [x] **TASK-4.2**: Implement `13-profile-portfolio.md` -> `CreatorProfileScreen.tsx`. Vetted badge, stat blocks, portfolio grid.
- [x] **TASK-4.3**: Implement `16-my-proposals.md` -> `MyProposalsScreen.tsx`. Status pills for pending/accepted/declined.

## Phase 5: Aux Screens & Navigation
- [x] **TASK-5.1**: Implement `14-pending-vetting-home.md` -> `PendingVettingScreen.tsx`. 4-step checklist.
- [x] **TASK-5.2**: Implement `15-notifications.md` -> `NotificationsScreen.tsx`. Grouped notifications.
- [x] **TASK-5.3**: Implement `17-settings.md` -> `SettingsScreen.tsx`. Language toggle.
- [x] **TASK-5.4**: Implement `18-empty-and-error-states.md` -> `EmptyStateScreen.tsx` & `ErrorStateScreen.tsx`.
- [x] **TASK-5.5**: Update TabNavigator (Home/Discover/Work/Earnings/Profile) to be flat, no shadow, wiring up all the new screens.

---

# Risks
| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| RISK-001 | RTL layout breaks due to legacy `Left/Right` properties | High | High | Run automated linting or search for physical properties before finalizing. |
| RISK-002 | Bottom sheet gesture conflicts with ScrollViews | Med | Med | Use `@gorhom/bottom-sheet`'s provided `BottomSheetScrollView`. |
| RISK-003 | Mocking non-existent features creates tech debt | High | Med | Clearly mark mock data files and hardcoded states with `TODO: Connect to API in Phase 2`. |

# Code Guidelines
- **UI Architecture**: Always use `StyleSheet.create` for performance. Extract semantic colors from `apps/mobile/src/theme/`.
- **RTL Standards**: Strictly use `marginStart`, `marginEnd`, `paddingStart`, `paddingEnd`, `alignItems: 'flex-start'`. NEVER use `left` or `right`.
- **Typography**: Only use weights 400 and 500 for the mobile scale. Apply the 1.15x line-height multiplier for Arabic.
- **Bottom Tabs**: Flat, no shadow, no switch animations. Active text in `{colors.ink}`, inactive in `{colors.muted}`.
