# UGCX

UGCX is a MENA-region UGC-creator marketplace. This repository is a pnpm
monorepo. It contains the API, the mobile app, and the types both apps
share.

## Prerequisites

Install these tools before you start.

1. Node.js 20 LTS.
2. pnpm. Corepack manages the exact version from `package.json`.
3. Docker Desktop, with the WSL2 backend on Windows. The API needs a local
   PostgreSQL database, and Docker Compose runs it for you.

## Setup

1. Copy `.env.example` to `.env` at the repository root, and copy
   `apps/api/.env.example` to `apps/api/.env`. Fill in real local values.
   Make sure to set `PLATFORM_FEE_RATE=0.10` for escrow calculations.
   Also set `CAMPAIGN_DEFAULT_OPEN_DAYS=14` and `REPORTING_TIME_ZONE=Africa/Cairo`.
2. Run `pnpm install` at the repository root. This installs every workspace
   package.
3. Run `docker compose up -d db`. This starts PostgreSQL in the background.
4. Run `pnpm --filter api dev`. This starts the API in watch mode.
5. Send a `GET` request to `http://localhost:3000/api/v1/health`. A healthy
   response looks like `{"status":"ok","database":"connected"}`.
6. Run `pnpm --filter mobile start`. This starts the Expo dev server. Scan
   the QR code with Expo Go to open the app on your device.

## Repository layout

- `apps/api` is the NestJS backend, one deployable process organized as a
  modular monolith.
- `apps/mobile` is the Expo mobile app.
- `packages/shared-types` holds the TypeScript types both apps share.

## Troubleshooting

If `docker compose up -d db` fails, check that Docker Desktop is running.
On Windows, also check that the WSL2 backend is active.
