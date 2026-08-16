<div align="center">

# FlowFable

**The open-source chat automation platform.**
Flows, AI agents, and an omnichannel inbox — self-hosted, white-label ready.
An open alternative to ManyChat / Chatfuel.

[Features](#features) · [Quick Start](#quick-start) · [Architecture](#architecture) · [Roadmap](#roadmap) · [Contributing](CONTRIBUTING.md)

</div>

---

## What is FlowFable?

FlowFable lets businesses automate conversations across **Instagram, Facebook
Messenger, WhatsApp, Telegram, and their own website** — with a visual
drag-and-drop flow builder, AI agents that answer from your knowledge base,
a shared live inbox for human agents, and full CRM features (tags, segments,
sequences, broadcasts). You own your data: one `docker compose up` and it runs
on your own server.

## Features

| Area              | What you get                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Channels**      | Instagram (Comment-to-DM, story replies, DMs), Messenger, WhatsApp Cloud API, Telegram, website live-chat widget. Email/SMS planned.                      |
| **Flow Builder**  | Node-based visual editor (React Flow): triggers, messages, conditions, delays, AI responses, HTTP requests, tagging, sequences, human handover, payments. |
| **AI-first**      | BYOK AI agents (OpenAI, Anthropic, Gemini, Grok, local LLMs), RAG knowledge bases (pgvector), sentiment analysis, auto-tagging, AI-to-human handover.     |
| **Inbox**         | Real-time team inbox with assignment, notes, snooze, and bot/AI/human handover states.                                                                    |
| **CRM**           | Contacts unified across channels, custom fields, tags, dynamic segments.                                                                                  |
| **Campaigns**     | Drip sequences and one-off broadcasts with delivery stats.                                                                                                |
| **Teams**         | Multi-workspace, role-based access (Owner / Admin / Agent / Viewer), invitations.                                                                         |
| **Extensibility** | REST API with API keys, signed outgoing webhooks, white-label settings.                                                                                   |

## Tech Stack

- **Web:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Flow
- **API:** NestJS (Node 22), Socket.io for realtime, BullMQ for queues/schedulers
- **Data:** PostgreSQL 16 + pgvector (RAG), Redis 7, Prisma ORM
- **Infra:** pnpm + Turborepo monorepo, Docker Compose for one-command self-hosting

## Quick Start

### Prerequisites

- Node.js ≥ 20, [pnpm](https://pnpm.io) ≥ 9 (`corepack enable`)
- Docker + Docker Compose

### 1. Clone & configure

```bash
git clone https://github.com/priyanshuvlogs-collab/manychat-alternative flowfable
cd flowfable
cp .env.example .env       # then edit secrets (see comments in the file)
```

### 2. Start infrastructure

```bash
docker compose up -d       # PostgreSQL (pgvector) + Redis + Mailpit
```

### 3. Install, migrate, seed

```bash
pnpm install
pnpm db:generate           # generate the Prisma client
pnpm db:migrate            # create the schema
pnpm db:seed               # demo workspace, contacts, and a Comment-to-DM flow
```

### 4. Run the apps

```bash
pnpm dev                   # web on :3000, api on :3001 (from Phase 2)
```

> **Project status:** Phase 1 (foundation & schema) is complete. The API and
> web apps are scaffolded in Phase 2 — see the [Roadmap](#roadmap).

### Full self-hosted stack (Docker only)

```bash
docker compose --profile app up -d --build
```

## Repository Layout

```
flowfable/
├── apps/
│   ├── api/                # NestJS backend: REST API, webhooks, flow engine, workers
│   ├── web/                # Next.js dashboard: inbox, flow builder, CRM, analytics
│   └── widget/             # Embeddable live-chat widget (single script tag)
├── packages/
│   ├── database/           # Prisma schema, migrations, seed data
│   ├── shared/             # Shared types: flow graph, message contracts, capabilities
│   └── tsconfig/           # Shared TypeScript configs
├── docker/                 # Production Dockerfiles
├── docs/                   # Architecture decisions & guides
├── docker-compose.yml      # One-command local infra / full stack
└── .env.example            # Documented configuration reference
```

## Architecture

The high-level design and the reasoning behind each decision live in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The short version:

1. **Everything is a channel adapter.** Each platform implements one interface
   (`receive` → normalized event, `send` ← normalized message), so flows, the
   inbox, and AI agents are completely channel-agnostic.
2. **Webhooks never block.** Meta/Telegram webhooks are verified, deduplicated,
   persisted, and enqueued — all processing happens in BullMQ workers.
3. **Flows are versioned, interpreted graphs.** Publishing freezes an immutable
   `FlowVersion`; running sessions keep their version while you edit the draft.
4. **Multi-tenant by workspace.** Every row is scoped by `workspaceId` and every
   API query is tenant-guarded.
5. **BYOK AI.** Provider keys are AES-256-GCM encrypted per workspace; RAG runs
   on pgvector inside your own Postgres — no external vector DB required.

## Connecting Channels

| Channel               | What you need                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Instagram / Messenger | A Meta app (`META_APP_ID` / `META_APP_SECRET`), IG Business account linked to a FB Page. OAuth connect flow in Settings → Channels. |
| WhatsApp              | WhatsApp Cloud API number on the same Meta app.                                                                                     |
| Telegram              | A bot token from [@BotFather](https://t.me/botfather) — paste it in the UI.                                                         |
| Website widget        | Nothing — generate the embed snippet in Settings → Channels.                                                                        |

Detailed per-channel guides will land in `docs/channels/` with Phase 3.

## Roadmap

- [x] **Phase 1** — Monorepo foundation, architecture, complete database schema
- [ ] **Phase 2** — Auth, workspaces & roles, contact management, basic inbox
- [ ] **Phase 3** — Instagram & Messenger integration (Comment-to-DM), webchat widget
- [ ] **Phase 4** — Visual flow builder + flow engine
- [ ] **Phase 5** — AI agents, knowledge bases (RAG), sentiment & auto-tagging
- [ ] **Phase 6** — Sequences, broadcasting, analytics dashboard
- [ ] **Phase 7** — WhatsApp & Telegram, polish, docs, deployment guides

## Contributing

We'd love your help — see [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow,
coding standards, and how to set up a dev environment.

## License

[MIT](LICENSE) © FlowFable Contributors
