# @flowfable/api

The FlowFable backend — **scaffolded in Phase 2**.

Planned structure (NestJS):

```
src/
├── main.ts                 # bootstrap: helmet, CORS, rate limiting, pino logger
├── app.module.ts
├── common/                 # guards, interceptors, pipes, decorators, filters
├── config/                 # typed env config (zod-validated)
├── modules/
│   ├── auth/               # JWT auth, sessions, invitations
│   ├── workspaces/         # tenancy, members, roles, API keys
│   ├── channels/           # channel CRUD + adapter registry
│   │   └── adapters/       # instagram/, messenger/, whatsapp/, telegram/, webchat/
│   ├── webhooks-ingest/    # Meta/Telegram webhook receivers (verify, dedupe, enqueue)
│   ├── contacts/           # contacts, tags, segments, custom fields
│   ├── inbox/              # conversations, messages, realtime gateway (Socket.io)
│   ├── flows/              # flow CRUD, versioning, triggers
│   ├── flow-engine/        # graph interpreter (BullMQ workers)
│   ├── ai/                 # BYOK providers, agents, RAG pipeline
│   ├── campaigns/          # sequences, broadcasts
│   ├── integrations/       # outgoing webhooks
│   └── analytics/          # daily stats, dashboard queries
└── queues/                 # BullMQ queue definitions & schedulers
```
