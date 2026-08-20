# @flowfable/web

The FlowFable dashboard — **scaffolded in Phase 2** (app shell + auth + inbox),
**Phase 4** (flow builder).

Planned structure (Next.js 15 App Router + Tailwind + shadcn/ui + React Flow):

```
src/
├── app/
│   ├── (auth)/             # login, register, accept-invite
│   ├── (dashboard)/[workspace]/
│   │   ├── inbox/          # live inbox (3-pane: list / thread / contact)
│   │   ├── contacts/       # CRM: contacts, tags, segments, custom fields
│   │   ├── flows/          # flow list + React Flow editor
│   │   ├── ai/             # AI agents & knowledge bases
│   │   ├── campaigns/      # sequences & broadcasts
│   │   ├── analytics/      # dashboard
│   │   └── settings/       # channels, team, webhooks, API keys, white-label
│   └── api/                # route handlers (auth callbacks, widget config)
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── inbox/
│   └── flow-editor/        # custom React Flow nodes (one per FlowNodeType)
├── lib/                    # api client, socket client, utils
└── stores/                 # zustand stores (editor state, inbox state)
```
