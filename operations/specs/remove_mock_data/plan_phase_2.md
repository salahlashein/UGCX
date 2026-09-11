# Phase 2: Removing Remaining UI Mock Data

## Context & Scope
The goal of this phase is to eliminate the remaining hardcoded data on the mobile app screens and replace them with dynamic, database-backed logic and properties.

The specific screens and replacements are:
1. **PendingVettingScreen**: Replace hardcoded name/niche with real profile data. Calculate the 3-of-4 setup checklist dynamically based on profile completion. Replace mocked "Glow Lab" campaigns with actual LIVE campaigns from the database.
2. **DeliverableUploadScreen**: Replace hardcoded "Pump close-up" checklist with the campaign's actual `talkingPoints`.
3. **CampaignDiscoveryScreen**: Replace hardcoded filter chips with the creator's actual `niches` and `city`.
4. **CampaignDetailScreen**: Replace hardcoded price presets with dynamic tiers derived from the creator's `basePrice`.

## Step-by-Step Implementation Plan

| ID | Task | File(s)| responsibility or Expected Behaviors | Validations/Error handling | Key Configurations |
|----|------|--------|--------------------------------------|----------------------------|--------------------|
| TASK-P2-001 | Pending Vetting Screen (Profile) | `apps/mobile/src/screens/creator/PendingVettingScreen.tsx` | Fetch `useCreatorProfile`. Replace "Mariam Adel" with `profile.displayName`. Compute checklist status (e.g. `niches`, `basePrice`, payout details) and update the progress bar. | Fallback to initials/placeholders | DONE |
| TASK-P2-002 | Pending Vetting Screen (Campaigns) | `apps/mobile/src/screens/creator/PendingVettingScreen.tsx` | Fetch `useLiveCampaigns({ perPage: 2 })` and render the first two real live campaigns instead of "Glow Lab" / "Bebe Care". | Handle empty state gracefully | DONE |
| TASK-P2-003 | Upload Checklist | `apps/mobile/src/screens/creator/DeliverableUploadScreen.tsx` | Map `collab.campaign.talkingPoints` into a stateful checklist. Add a generic 'Vertical 9:16' item to ensure format constraints. | Handle empty talkingPoints | DONE |
| TASK-P2-004 | Discovery Filters | `apps/mobile/src/screens/creator/CampaignDiscoveryScreen.tsx` | Use `useCreatorProfile` to grab the creator's `niches` and `city` and render them as the filter chips instead of the static string array. | | DONE |
| TASK-P2-005 | Pricing Presets | `apps/mobile/src/screens/creator/CampaignDetailScreen.tsx` | Fetch `useCreatorProfile` to get `basePrice`. Calculate 3 preset buttons (e.g., `basePrice`, `basePrice * 1.25`, `basePrice * 1.5`) instead of `2500, 3200, 4000`. | Fallback to static presets if `basePrice` is unset | DONE |

## Definition of Done
- No occurrences of the static string "Mariam Adel" or "Glow Lab" remain in `PendingVettingScreen.tsx`.
- The checklist in `DeliverableUploadScreen.tsx` iterates over `campaign.talkingPoints`.
- The filter chips in `CampaignDiscoveryScreen.tsx` are dynamically mapped from profile niches.
- The preset buttons in `CampaignDetailScreen.tsx` derive values from `profile.basePrice`.
- All TypeScript types map correctly and the mobile app compiles.
