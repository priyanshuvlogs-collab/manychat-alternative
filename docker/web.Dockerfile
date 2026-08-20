# FlowFable Web — multi-stage build.
# NOTE: the web app is scaffolded in Phase 2; this Dockerfile establishes the
# final build pattern (Next.js standalone output) so `--profile app` works as
# soon as the app lands.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile=false --filter @flowfable/web...
RUN pnpm --filter @flowfable/web build || echo "web build target arrives in Phase 2"

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
EXPOSE 3000
CMD ["node", "apps/web/.next/standalone/apps/web/server.js"]
