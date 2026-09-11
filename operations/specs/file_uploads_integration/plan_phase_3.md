# Document Control
- **Version**: 1.0
- **Date Created**: 2026-09-04
- **Status**: Completed

---

# Executive Summary

- **Goal**: Phase 3 - File Uploads & Profile Completion Integration
- **Scope**: full-stack (mobile + API)
- **Domains**: API, frontend, infrastructure
- **Architecture**: We will centralize S3 presigned URL generation into a single `/storage/upload-url` endpoint. The React Native frontend will use this to upload files directly to S3 (or a local mock bucket) for creator verification clips, portfolio items, and deliverables, replacing all hardcoded `mock.mp4` placeholders.
- **Tech Stack**: NestJS, React Native, AWS S3 (or Minio)
- **Entry Condition**: Auth OTP Phase 2 is complete.
- **Exit Condition**: A user can upload a real video during onboarding and as a deliverable, and the file actually persists and plays back.

---

# Requirements

## Functional Requirements
- **REQ-001**: THE SYSTEM SHALL provide a generic endpoint to generate S3 presigned URLs for different entity types (e.g., `verification`, `portfolio`, `deliverable`, `product`).
- **REQ-002**: WHEN a creator uploads a verification clip in `OnboardingBasicsScreen`, THE SYSTEM SHALL use the presigned URL to upload the real file before calling `PATCH /creators/me`.
- **REQ-003**: WHEN a creator adds portfolio samples in `OnboardingPortfolioScreen`, THE SYSTEM SHALL upload the files and call `POST /creators/me/portfolio-items`, then save the `basePrice` and complete onboarding.
- **REQ-004**: WHEN a creator uploads a deliverable in `DeliverableUploadScreen`, THE SYSTEM SHALL remove the `mock.mp4` hardcode and actually upload the user's selected file to the cloud.

---

# Plan Details

## Design - *How it should happen*

### Decisions

| ID | Decision | Rationale | Alternatives Considered | Side effect |
|----|----------|-----------|------------------------|-------------------|
| DES-P3-001 | Create a generic `StorageController` | Deliverables currently have their own upload-url endpoint. Portfolio and Verification have none. Centralizing prevents code duplication. | Replicating `upload-url` inside every controller. | Refactoring Deliverables API slightly. |
| DES-P3-002 | Use Expo FileSystem for uploads | React Native `fetch` can struggle with large video uploads via presigned URLs. `expo-file-system` provides reliable background/foreground raw file uploading. | Using standard `fetch`. | Needs `expo-file-system` package. |

### Directory Specifications

| ID | Task | File(s) | Responsibility |
|----|------|--------|----------------|
| TASK-P3-001 | Create Storage Service & Controller | `apps/api/src/modules/storage/*` | [DONE] Expose `POST /storage/upload-url` accepting `{ module: 'portfolio'\|'deliverable'\|'verification', contentType, fileSize }`. |
| TASK-P3-002 | Update Shared Types | `packages/shared-types/src/storage.ts` | [DONE] Define `RequestUploadUrlRequest` and `RequestUploadUrlResponse`. |
| TASK-P3-003 | Add File Upload Hook | `apps/mobile/src/hooks/api/useStorage.ts` | [DONE] React Query mutation to request upload URLs, plus a helper to perform the actual HTTP PUT of the file. |
| TASK-P3-004 | Wire OnboardingBasics | `apps/mobile/src/screens/auth/OnboardingBasicsScreen.tsx` | [DONE] Wire up the image/video picker, upload it, and send the URL. |
| TASK-P3-005 | Wire OnboardingPortfolio | `apps/mobile/src/screens/auth/OnboardingPortfolioScreen.tsx` | [DONE] Wire up the file picker, upload the files, send to the portfolio endpoint, update price, and save session. |
| TASK-P3-006 | Wire Deliverables Upload | `apps/mobile/src/screens/creator/DeliverableUploadScreen.tsx` | [DONE] Replace `mock.mp4` with the real file picking and uploading process. |

### Data Models & flows

<Data-flow>
```text
Mobile App                  NestJS API                  S3 / Storage
    │                           │                           │
    │ 1. POST /upload-url       │                           │
    ├──────────────────────────▶│                           │
    │                           │ 2. Generate Presigned URL │
    │                           ├──────────────────────────▶│
    │                           │                           │
    │ 3. Return URL & Key       │                           │
    │◀──────────────────────────┤                           │
    │                           │                           │
    │ 4. PUT File to URL        │                           │
    ├───────────────────────────┼──────────────────────────▶│
    │                           │                           │
    │ 5. POST /creators/me      │                           │
    ├──────────────────────────▶│                           │
```
</Data-flow>

## Assessment summary:
*   **Ready to merge?** With fixes
*   **Reasoning:** The implementation functionally achieves all tasks without compile errors or crashing, but lacks proper security (rate-limiting) for the generic storage endpoint and leaves behind dead code.

### High Issues
- [ ] **Security / Authorization:** The new generic StorageController generates S3 presigned URLs for any authenticated user without contextual authorization (e.g. verifying they own a specific collaboration before allowing a 'deliverable' upload). This exposes the storage bucket to spam uploads and bill padding. Apply @UseGuards(ThrottlerGuard) strictly to rate-limit this endpoint, and ensure the S3 bucket is configured with lifecycle policies to delete unreferenced files. (pps/api/src/modules/storage/storage.controller.ts)

### Medium Issues
- [ ] **Dead Code / Tech Debt:** The previous equestUploadUrl method in DeliverablesController (POST collaborations/:id/deliverables/upload-url) is now obsolete as the mobile app utilizes the generic StorageController. It should be removed to prevent confusion and duplicate maintenance. (pps/api/src/modules/deliverables/deliverables.controller.ts)
- [ ] **UI Error Handling:** If the S3 file upload fails, the error is caught and logged, but no feedback is provided to the user. The app fails silently (button just stops spinning). Add a user-facing Toast/Alert message in the catch blocks. (pps/mobile/src/screens/auth/OnboardingBasicsScreen.tsx, OnboardingPortfolioScreen.tsx, DeliverableUploadScreen.tsx)

### Recommendations
- [ ] **Configurable Constraints:** The 500MB file size limit is hardcoded in the StorageController. It should be extracted to ConfigService or an environment variable for better maintainability. (pps/api/src/modules/storage/storage.controller.ts:31)

## Code Review Findings (to be added by the Analyser Agent):

#### Requirement Validation
- [x] Functional requirements (REQ-001 to REQ-004) are fully implemented.

#### Security
- [ ] OWASP A04 (Insecure Design): Missing rate limiting on POST /storage/upload-url.
- [ ] OWASP A01 (Broken Access Control): Generic endpoint bypasses previous contextual ownership checks (e.g. checking if creator owns the deliverable).

#### Code Quality & smells
- [ ] Code smell: Dead endpoint left behind in deliverables.controller.ts.

#### Frontend & UX
- [ ] Missing error boundary / feedback during file upload process.

**Guidelines for review**
- [x] Code builds/compiles for each subsystem and runs without crashing.
- [x] Linting passes without errors.
- [x] Static type checking passes (if applicable).
- [ ] Security rules are in accordance with security skill (Rate limiting is missing).
