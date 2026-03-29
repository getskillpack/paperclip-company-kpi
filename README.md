# `@getskillpack/paperclip-company-kpi`

Paperclip plugin that rolls up **`cost_event.created`** streams into monthly totals, keeps an **auditable manual ledger** for income and expense lines the API does not know yet, and surfaces **C-level KPI targets** next to the numbers you already trust in the host.

| Resource | Link |
| --- | --- |
| Implementation phases | [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) |
| C-level KPI model | [docs/C_LEVEL_KPI.md](docs/C_LEVEL_KPI.md) |
| Publication / channels | [docs/PUBLICATION_PLAN.md](docs/PUBLICATION_PLAN.md) |
| Landing copy (multi-language) | [docs/LANDING.md](docs/LANDING.md) |
| Static landing preview | [docs/site/index.html](docs/site/index.html) |

If this project helps you, **[star the repository on GitHub](https://github.com/getskillpack/paperclip-company-kpi)** — it makes the plugin easier for other teams to discover.

## Features

- **Monthly cost rollups** from `cost_event.created`, with an optional rebuild path (see implementation plan).
- **Manual ledger** for labeled income/expense entries with currency metadata.
- **Executive KPI registry** — target, period, optional role tag, manual actual — described in [docs/C_LEVEL_KPI.md](docs/C_LEVEL_KPI.md).
- **Worker + UI bundle** built with `@paperclipai/plugin-sdk`.

## Status

- **Phases A–B:** scaffold, CI (`typecheck` / `test` / `build`), rollup + ledger + dashboard — shipped.
- **Phase E:** C-level targets in `ctx.state` and UI — shipped (see [docs/C_LEVEL_KPI.md](docs/C_LEVEL_KPI.md)).
- **Phase C:** per-agent `budgetMonthlyCents` / `spentMonthlyCents` в dashboard и сверка с месячным rollup (см. [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)) — shipped.
- **Next:** public npm — tracked in Paperclip under the [getskillpack paperclip-company-kpi](https://github.com/getskillpack/paperclip-company-kpi) program; see [docs/PUBLICATION_PLAN.md](docs/PUBLICATION_PLAN.md).

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Install in Paperclip

The host loads the built artifacts from `dist/` (manifest, worker, UI). Follow your Paperclip version’s plugin installation guide and point it at this package’s `paperclipPlugin` paths after `npm run build`.

Until the package is public on npm, install from a git checkout or release tarball. When `private` is flipped off, `npm install @getskillpack/paperclip-company-kpi` will become the default path — see [docs/PUBLICATION_PLAN.md](docs/PUBLICATION_PLAN.md).

## Security notes

- No secrets belong in this repository; live company state stays in Paperclip `ctx.state`.
- The plugin is **trusted code** in the Paperclip runtime (same-origin UI) — not a third-party sandbox.

## License

MIT
