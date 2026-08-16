# FlowFable Architecture

This document records the key architectural decisions made in Phase 1 and the
reasoning behind them. It is the reference for all later phases.

## System Overview

```
                     ┌──────────────────────────────────────────────┐
  Instagram ─┐       │                  apps/api (NestJS)           │
  Messenger ─┤       │  ┌─────────────┐   ┌──────────────────────┐  │
  WhatsApp  ─┼─────▶ │  │  Webhook    │──▶│  BullMQ queues       │  │
  Telegram  ─┘  HTTP │  │  Ingest     │   │  (Redis)             │  │
                     │  └─────────────┘   └──────────┬───────────┘  │
  Widget ──── WS ──▶ │  ┌─────────────┐              ▼              │
                     │  │  REST API   │   ┌──────────────────────┐  │
  apps/web ── HTTP ─▶│  │  + Socket.io│◀──│  Workers:            │  │
  (Next.js)      WS  │  └─────────────┘   │  flow engine, AI/RAG,│  │
                     │                    │  sequences, broadcasts│ │
                     │                    │  webhooks, rollups   │  │
                     │                    └──────────┬───────────┘  │
                     └───────────────────────────────┼──────────────┘
                                                     ▼
                                  PostgreSQL 16 (+ pgvector)  ·  Redis 7
```

## Decisions

### 1. Monorepo: pnpm workspaces + Turborepo

One repo, three apps (`api`, `web`, `widget`), three packages (`database`,
`shared`, `tsconfig`). The decisive factor is **shared contracts**: the flow
graph schema, normalized message shapes, and channel capability matrix are
consumed by both the React Flow editor (web) and the flow engine (api). In a
polyrepo those drift; here they are one import (`@flowfable/shared`).

### 2. Backend: NestJS over FastAPI

- The flow engine, channel adapters, and queue workers benefit heavily from
  Nest's DI + module system (each channel is a self-contained module
  implementing a common adapter interface).
- One language (TypeScript) end-to-end means shared types are free.
- First-class BullMQ and Socket.io integrations.

### 3. Channel adapters: everything is normalized

Each platform module implements a single interface:

- **inbound:** platform webhook → `NormalizedEvent` (message / comment /
  story reply / postback / referral) → persisted → matched against
  `FlowTrigger` index → enqueued.
- **outbound:** `MessageContent` (shared shape) → platform payload, degrading
  gracefully using the `CHANNEL_CAPABILITIES` matrix (e.g. carousels become
  image + links on WhatsApp).

This is the load-bearing abstraction: flows, inbox, AI, sequences, and
broadcasts never see a platform API.

### 4. Webhooks never block

Meta requires fast webhook ACKs and will retry (causing duplicates) on slow
responses. The ingest pipeline therefore does only: verify signature →
deduplicate (`messages.conversationId+externalId` unique index) → enqueue →
`200 OK`. All real work (contact resolution, flow matching, AI calls, sends)
happens in BullMQ workers with retries and backoff.

### 5. Flows: immutable versions + trigger index + resumable sessions

- `Flow` is the container; the graph lives in immutable `FlowVersion` rows.
  Publishing points `publishedVersionId` at a frozen version, so editing a
  draft never mutates running automations, and every `FlowSession` records
  which version it runs.
- `FlowTrigger` denormalizes trigger config out of the graph JSON so the
  ingest worker finds matching flows with one indexed query
  (`channelId + type + isEnabled`) instead of scanning graphs.
- `FlowSession` stores the interpreter state (`currentNodeId`, `variables`,
  `resumeAt`), which makes Delay and wait-for-reply nodes survive restarts:
  a scheduler polls `(status=WAITING, resumeAt<=now)`.

### 6. Multi-tenancy: workspace-scoped rows, guarded at the API layer

Every tenant-owned table carries `workspaceId` with composite indexes/uniques.
Tenancy is enforced in the API layer (guard + Prisma extension injecting the
workspace filter). Postgres RLS was considered and deferred: it complicates
worker code paths for marginal benefit while the API is the only DB client.

### 7. AI: BYOK + pgvector RAG

- Provider credentials are per-workspace (`AiProviderCredential`), AES-256-GCM
  encrypted with `CREDENTIALS_ENCRYPTION_KEY`. Local LLMs work via any
  OpenAI-compatible base URL.
- Knowledge bases chunk + embed sources into `KnowledgeChunk.embedding`
  (`vector(1536)`, pgvector). Retrieval is a raw `ORDER BY embedding <=> $q`
  query. No external vector DB — keeps self-hosting to Postgres + Redis.
- The embedding model is frozen per knowledge base so all chunks share one
  vector space; changing models means re-ingesting.

### 8. Conversations: explicit handover state machine

`Conversation.handoverState ∈ {BOT, AI_AGENT, HUMAN}` decides who may respond.
Flows and AI agents check it before sending; the Human Handover node and the
inbox "take over" action move it to `HUMAN` and cancel active flow sessions.
This single field prevents the classic bot-talks-over-agent bug.

### 9. Analytics: raw truth + daily rollups

Messages, sessions, and conversations are the source of truth;
`DailyStat(workspaceId, channelId, date, metrics)` is a pre-aggregated JSON
rollup written by workers so dashboard queries stay O(days), not O(messages).
The `metrics` column is JSON on purpose — adding a metric doesn't require a
migration.

### 10. Credentials & security posture

- Channel tokens and AI keys: encrypted at rest, never returned by the API.
- API keys and refresh tokens: stored as SHA-256 hashes only.
- Outgoing webhooks: HMAC-SHA256 signed (`X-FlowFable-Signature`).
- Rate limiting at the edge (`RATE_LIMIT_PER_MINUTE`), audit log for
  sensitive actions.

## Message Lifecycle (end-to-end example: Comment-to-DM)

1. User comments "price" on an IG post → Meta calls `POST /webhooks/meta`.
2. Ingest verifies `X-Hub-Signature-256`, ACKs 200, enqueues the event.
3. Worker resolves the `Channel` by `(type, externalId)`, upserts
   `Contact` + `ContactIdentity` by IGSID.
4. Trigger matcher queries `FlowTrigger(type=COMMENT)` for the channel,
   matches keyword config, creates a `FlowSession` on the published version.
5. Flow engine walks the graph: sends the DM (adapter renders buttons),
   evaluates the VIP condition against tags, applies the `lead` tag.
6. Message rows are written with delivery status; Socket.io pushes the
   conversation update to any open inboxes; `DailyStat` counters increment.
