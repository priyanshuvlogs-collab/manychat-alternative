# FlowFable API — multi-stage build.
# NOTE: the API app is scaffolded in Phase 2; this Dockerfile establishes the
# final build pattern (pnpm workspace pruning + slim runtime) so `--profile app`
# works as soon as the app lands.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile=false --filter @flowfable/api...
RUN pnpm --filter @flowfable/database db:generate || true
RUN pnpm --filter @flowfable/api build || echo "api build target arrives in Phase 2"

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
EXPOSE 3001
CMD ["sh", "-c", "pnpm --filter @flowfable/database db:deploy && node apps/api/dist/main.js"]
