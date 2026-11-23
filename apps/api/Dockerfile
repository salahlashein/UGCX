# Production image for the API. Build it from the repository root:
#   docker build -f apps/api/Dockerfile .
# The root is the build context because the API depends on the
# workspace package @ugcx/shared-types.

# ---- build: install all dependencies and compile ----
FROM node:20-slim AS build
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile --filter "api..."

COPY packages/shared-types packages/shared-types
COPY apps/api apps/api
RUN pnpm --filter @ugcx/shared-types build && pnpm --filter api build

# ---- runtime: production dependencies and compiled output only ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile --prod --filter "api..."

COPY --from=build /repo/packages/shared-types/dist packages/shared-types/dist
COPY --from=build /repo/apps/api/dist apps/api/dist

WORKDIR /repo/apps/api
USER node
EXPOSE 3000
# Apply pending migrations, then start the API. The Render free plan has
# no pre-deploy step. If a migration fails, the container stops, the
# health check fails, and Render keeps the old version. Each migration
# runs in its own transaction, because an enum value that one migration
# adds must commit before a later migration uses it.
CMD ["sh", "-c", "node node_modules/typeorm/cli.js migration:run -d dist/config/data-source.js --transaction each && exec node dist/main.js"]
