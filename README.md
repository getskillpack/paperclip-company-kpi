# paperclip-company-kpi

Paperclip-плагин для сводки **KPI / бюджета компании**: агрегирование `cost_event.created` в `ctx.state` и **ручной журнал** доходов и расходов.

- План: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- Публикация и каналы: [docs/PUBLICATION_PLAN.md](docs/PUBLICATION_PLAN.md)
- Копирайт лендинга: [docs/LANDING.md](docs/LANDING.md)
- Пакет: `@getskillpack/paperclip-company-kpi`

## Статус

- **Фазы A–B:** каркас (`@paperclipai/create-paperclip-plugin` + esbuild), CI (`typecheck` / `test` / `build`), rollup по `cost_event.created`, ручной журнал, дашборд.
- **Фаза E:** цели C-level в state и UI — см. [docs/C_LEVEL_KPI.md](docs/C_LEVEL_KPI.md).
- **Дальше:** фаза C (сверка budget/spent по агентам), публичный npm и внешняя дистрибуция — см. [docs/PUBLICATION_PLAN.md](docs/PUBLICATION_PLAN.md).

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
