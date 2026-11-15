# Phase 1: Localization Single Folder Consolidation (en.json, ar.json)

# Document Control

- **Version**: 1.0.0
- **Date Created**: 2026-11-01
- **Last Updated**: 2026-11-01
- **Status**: COMPLETED
- **Phase**: 1 of 5
- **Parent Document**: `operations/specs/web_app_architecture_refactor/00_overview.md`

---

# Executive Summary

- **Goal**: Consolidate the entire web application localization structure into a single dedicated folder `apps/web/src/i18n/` containing `en.json`, `ar.json`, `index.tsx`, and `types.ts`, eliminating the nested `locales/` directory, introducing strict dictionary key typing, and providing an automated parity test suite.
- **Scope**: Frontend localization structure in `apps/web`.
- **Domains**: Localization (`apps/web/src/i18n`), Unit Tests (`apps/web/src/__tests__`).
- **Architecture**: Single-directory localization bundle where `en.json` and `ar.json` reside directly alongside the React context provider [`index.tsx`](file:///C:/Users/Salah%20Lashein/source/repos/UGCX/apps/web/src/i18n/index.tsx). Types and key validators ensure complete parity between English and Arabic.
- **Tech Stack**: Next.js 15, TypeScript 5, React 19, Node.js Test Runner.
- **Entry Condition**: `apps/web` typecheck and tests pass cleanly.
- **Exit Condition**: `locales/` subdirectory is completely removed, `src/i18n/en.json` and `src/i18n/ar.json` are loaded cleanly, all 66 existing unit tests pass, and a new parity test `i18n.test.ts` passes with 100% key match.

---

# Requirements

## Functional, Security, Constraint & Pattern Requirements

- **REQ-WAR1-001**: THE SYSTEM SHALL store all language translation dictionaries directly within `apps/web/src/i18n/` as `en.json` and `ar.json` without any nested subfolders.
- **REQ-WAR1-002**: THE SYSTEM SHALL export strong typing for translation keys from `apps/web/src/i18n/types.ts` based on the shape of `en.json`.
- **REQ-WAR1-003**: THE SYSTEM SHALL verify in an automated test that every dot-separated translation key in `en.json` exists in `ar.json` and vice versa.
- **REQ-WAR1-004**: WHEN `useTranslation` resolves a missing translation key in Arabic THE SYSTEM SHALL fall back to the corresponding English string before returning the key path.
- **CON-WAR1-001**: THE SYSTEM SHALL NOT break any existing translation key paths used in web screens and components.
- **PAT-WAR1-001**: THE SYSTEM SHALL export `useTranslation`, `I18nProvider`, and translation helper functions directly from `apps/web/src/i18n/index.tsx`.

```gherkin
Feature: Single-folder Localization Architecture

  Scenario: Application loads translations from single i18n folder
    Given the translation files exist at "apps/web/src/i18n/en.json" and "apps/web/src/i18n/ar.json"
    When the application initializes "I18nProvider"
    Then it successfully resolves keys for English and Arabic without HTTP or runtime import errors
    And the nested "apps/web/src/i18n/locales/" directory does not exist

  Scenario: Parity test verifies 100% key matching between en.json and ar.json
    Given both "en.json" and "ar.json" in "src/i18n/"
    When the test runner executes "src/__tests__/i18n.test.ts"
    Then zero missing or mismatched keys are reported
```

---

# Plan Details

## Design Decisions

| ID | Decision | Rationale | Alternatives Considered | Side Effect |
|---|---|---|---|---|
| DES-WAR1-001 | Move `en.json` and `ar.json` from `src/i18n/locales/` to `src/i18n/`. | Fulfills user requirement: "i want the localization to be in one folder has en.json". Eliminates unnecessary folder nesting. | Keep nested `locales/`. Rejected per direct user request. | Clean and simple folder structure in `src/i18n/`. |
| DES-WAR1-002 | Add fallback to English when Arabic key is undefined in `src/i18n/index.tsx`. | Prevents raw translation keys from rendering on screen if a string is missing in Arabic. | Return empty string. Rejected because English fallback preserves usability. | Enhanced resilience for all bilingual views. |

---

# Tasks

| Task ID | Title | Verdict | Status | Implements | Target Files |
|---|---|---|---|---|---|
| `TASK-WAR1-001` | Move `en.json` and `ar.json` to `src/i18n/` and remove `locales/` | REPLACE | DONE | REQ-WAR1-001 | `apps/web/src/i18n/en.json`, `apps/web/src/i18n/ar.json` |
| `TASK-WAR1-002` | Update `src/i18n/index.tsx` dictionary imports and English fallback | EXTEND | DONE | REQ-WAR1-002, REQ-WAR1-004 | `apps/web/src/i18n/index.tsx`, `apps/web/src/i18n/types.ts` |
| `TASK-WAR1-003` | Add bilingual dictionary key parity test | NEW | DONE | REQ-WAR1-003 | `apps/web/src/__tests__/i18n.test.ts` |
| `TASK-WAR1-004` | Execute verification commands and assert 0 errors | VERIFY | DONE | PAT-WAR1-001 | `apps/web/src/**` |

### Detailed Steps

#### `TASK-WAR1-001`: Move dictionaries to `src/i18n/`
1. Move `apps/web/src/i18n/locales/en.json` to `apps/web/src/i18n/en.json`.
2. Move `apps/web/src/i18n/locales/ar.json` to `apps/web/src/i18n/ar.json`.
3. Delete the empty directory `apps/web/src/i18n/locales`.

#### `TASK-WAR1-002`: Update imports and fallback in `src/i18n/index.tsx`
1. Update dictionary imports to:
   ```typescript
   import en from './en.json';
   import ar from './ar.json';
   ```
2. Update translation resolution logic to check English dictionary if Arabic lookup yields `undefined`.
3. Create `apps/web/src/i18n/types.ts` exporting `Locale`, `TranslationDictionary`, and `TranslateFn`.

#### `TASK-WAR1-003`: Add dictionary parity test in `src/__tests__/i18n.test.ts`
1. Recursively extract all leaf key paths from `en.json` and `ar.json`.
2. Assert that difference sets `enKeys - arKeys` and `arKeys - enKeys` are both empty.
3. Test interpolation helper `interpolate("Hello {{name}}", { name: "Antigravity" })`.

#### `TASK-WAR1-004`: Verification
Run:
```powershell
npm --prefix apps/web run typecheck
npm --prefix apps/web test
```
Assert all tests pass and `locales/` directory is gone.
