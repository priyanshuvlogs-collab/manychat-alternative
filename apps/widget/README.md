# @flowfable/widget

Embeddable website live-chat widget — **scaffolded in Phase 3**.

A tiny (<30 kB) framework-free bundle that sites embed with one script tag:

```html
<script
  src="https://your-flowfable.example.com/widget.js"
  data-widget-key="YOUR_KEY"
  async
></script>
```

Talks to the API's webchat channel adapter over Socket.io, themed per-workspace
via `Channel.config.theme`.
