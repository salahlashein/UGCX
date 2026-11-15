# UGCX V1 End-to-End System Test Reports

This directory contains functional test reports for the core V1 application features defined in [v1_decommissioning_and_simplification_plan.md](../v1_decommissioning_and_simplification_plan.md).

All tests ran against the real backend API, real PostgreSQL database, and real React Native Web frontend via Chrome/Puppeteer MCP. No data was mocked.

## Feature Test Reports

| Report | Feature | Scope & Highlights | DB Verification | Status |
|---|---|---|---|---|
| [01_auth_and_onboarding.md](./01_auth_and_onboarding.md) | Authentication & Onboarding | Brand/Creator phone OTP login and new registration | `users`, `creators`, `brands` | **PASSED** |
| [02_brief_creation_and_escrow.md](./02_brief_creation_and_escrow.md) | Brief Creation & Escrow | 1-page PostBrief, card checkout funding, live status | `campaigns`, `transactions` (charge) | **PASSED** |
| [03_campaign_discovery_and_proposals.md](./03_campaign_discovery_and_proposals.md) | Campaign Discovery & Proposals | Creator discovery feed, pitch submission, 409 duplicate block | `proposals` (applied status, unique index) | **PASSED** |
| [04_proposal_review_and_escrow_allocation.md](./04_proposal_review_and_escrow_allocation.md) | Proposal Review & Allocation | Brand inbox, proposal accept, zero second-charge allocation | `collaborations` (funded), `transactions` (hold) | **PASSED** |
| [05_collaboration_chat.md](./05_collaboration_chat.md) | Collaboration Chat | Chronological in-app chat between brand and creator | `messages` (ordered by `sent_at`) | **PASSED** |
| [06_deliverables_and_review.md](./06_deliverables_and_review.md) | Deliverable & Review Loop | Presigned upload URL, deliverable submission, brand approval | `deliverables`, `transactions` (release + fee) | **PASSED** |
| [07_creator_earnings_and_ledger.md](./07_creator_earnings_and_ledger.md) | Creator Earnings & Ledger | Real-time balances, double-entry immutable ledger | `transactions`, `creators` | **PASSED** |
| [08_in_app_notifications.md](./08_in_app_notifications.md) | In-App Notifications | Event catalog notifications (`brief_published`, `message_received`, etc.) | `notifications` | **PASSED** |

## Executed Integration Test Runner
The test runner script that verified these flows is saved at [`apps/api/test-v1-features.js`](file:///C:/Users/Salah%20Lashein/source/repos/UGCX/apps/api/test-v1-features.js). The full machine-readable test output is available in [`apps/api/test-v1-report.json`](file:///C:/Users/Salah%20Lashein/source/repos/UGCX/apps/api/test-v1-report.json).
