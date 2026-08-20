# Contributing to FlowFable

Thanks for your interest in making FlowFable better! This guide covers
everything you need to go from `git clone` to a merged pull request.

## Development Setup

```bash
# 1. Fork & clone
git clone https://github.com/<you>/manychat-alternative flowfable
cd flowfable

# 2. Toolchain (Node >= 20)
corepack enable          # activates pnpm

# 3. Environment & infrastructure
cp .env.example .env
docker compose up -d     # postgres + redis + mailpit

# 4. Install & prepare the database
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Develop
pnpm dev
```

## Project Structure

- `apps/api` — NestJS backend (REST, webhooks, flow engine, queues)
- `apps/web` — Next.js dashboard
- `apps/widget` — embeddable chat widget
- `packages/database` — Prisma schema & migrations (**schema changes need a migration**)
- `packages/shared` — types shared between web and api (flow graph, message contracts)

## Workflow

1. **Open or claim an issue first** for anything non-trivial, so we can align
   on the approach before you invest time.
2. Create a branch: `feat/<short-description>`, `fix/<short-description>`, or
   `docs/<short-description>`.
3. Make your changes, keeping commits focused and messages in
   [Conventional Commits](https://www.conventionalcommits.org/) style
   (`feat(inbox): add snooze action`).
4. Verify locally before pushing:

   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```

5. Open a PR against `main` describing **what** and **why**. Screenshots or
   clips for UI changes are hugely appreciated.

## Coding Standards

- **TypeScript strict mode everywhere.** No `any` unless there is truly no
  alternative (and then with a comment explaining why).
- **Comments explain intent, not mechanics.** Write comments for the next
  maintainer, not narration of the code.
- **Database changes** must go through `pnpm db:migrate` — never edit applied
  migrations; add a new one.
- **Cross-app contracts** (flow node payloads, message shapes, capability
  flags) belong in `packages/shared` — never duplicate them.
- **Secrets never touch the repo.** Configuration goes in `.env.example` with
  a comment; credentials at rest are encrypted (see `CREDENTIALS_ENCRYPTION_KEY`).
- **Tests**: business logic (flow engine, segment evaluation, adapters) needs
  unit tests; API endpoints get e2e coverage where practical.

## Channel Adapters

Adding a new messaging channel? Implement the adapter interface in
`apps/api/src/modules/channels/adapters/` (Phase 2+): webhook verification,
inbound normalization to the shared `MessageContent` shape, outbound rendering,
and a capabilities entry in `packages/shared/src/channels.ts`.

## Reporting Bugs & Security Issues

- **Bugs:** open a GitHub issue with reproduction steps, expected vs. actual
  behavior, and logs where possible.
- **Security vulnerabilities:** please do **not** open a public issue — email
  the maintainers instead. We'll acknowledge within 72 hours.

## Code of Conduct

Be kind, be constructive, assume good intent. Harassment or disrespectful
behavior is not tolerated anywhere in the project's spaces.
