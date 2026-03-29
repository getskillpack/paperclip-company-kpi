# paperclip-company-kpi

Paperclip-плагин для сводки **KPI / бюджета компании**: агрегирование `cost_event.created` в `ctx.state` и **ручной журнал** доходов и расходов.

- План: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- Пакет: `@getskillpack/paperclip-company-kpi`

## Статус (MVP, фазы A–B)

- Каркас на `@paperclipai/create-paperclip-plugin` + esbuild, CI (`typecheck` / `test` / `build`).
- Worker: подписка на `cost_event.created`, rollup по календарным месяцам (`cost_rollup_v1:YYYY-MM` + индекс месяцев), ручной журнал `manual_ledger_v1`.
- Actions: `addManualLedgerEntry`, `deleteManualLedgerEntry`, `rebuildCostRollupMonth`.
- Data: `companyKpiDashboard` (params: `companyId`, опционально `rangeFrom` / `rangeTo` ISO).
- UI: виджет дашборда — сводка, таблица rollup, форма и таблица ручных проводок.

## Разработка

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Установка в Paperclip

Локальный путь (dev), см. README `@paperclipai/plugin-sdk`: установка плагина из каталога с собранными `dist/` артефактами.

## Лицензия

MIT
