# Changelog

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Версии соответствуют [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Совместимость

Плагин собирается с **`@paperclipai/plugin-sdk`** версии, указанной в `package.json` (см. devDependencies). Требуемые capabilities перечислены в `src/manifest.ts` (`events.subscribe`, `plugin.state.read`, `plugin.state.write`, `agents.read`).

## [0.3.4] — 2026-03-29

### Added

- Action `setCompanyKpiDisplayCurrency` — persists ISO 4217 code to `display_currency_v1` (company state).
- Dashboard widget: display currency control (presets + custom) with Apply.

### Changed

- `readDisplayCurrency` / validation for stored currency codes in `kpi-state` (invalid values fall back to `USD`).
- `DashboardParams` documented as an external-only integrator contract (not used inside the package).
- Currency amounts in the widget use `Intl.NumberFormat("en-US", …)` for consistent English formatting.
- `docs/site/index.html`: ES / PT / ZH / DE panels now include the same depth as English (problem/solution, feature bullets, install sketch); git install pin updated to `v0.3.4`.

## [0.3.3] — 2026-03-29

### Added

- UTC **day** и **hour** rollup по `cost_event.created` (отдельные индексы состояния), месячный rollup без изменений.
- Поля `companyKpiDashboard`: `costFineGranularity` (`hour` при длине диапазона ≤ 7 UTC-суток, иначе `day`) и `costFineBuckets`.
- Виджет: таблица почасовых/дневных ведёр рядом с месячными агрегатами.

### Changed

- Текст предупреждения сверки rollup ↔ `spentMonthlyCents` переведён на английский.

## [0.3.2] — 2026-03-29

### Added

- GitHub Actions [`pages.yml`](.github/workflows/pages.yml): деплой статического лендинга из `docs/site/` на GitHub Pages при push в `main` (в настройках репозитория: Pages → **GitHub Actions**).

### Changed

- `package.json` `homepage` → публичный URL лендинга Pages.
- README и [PUBLICATION_PLAN.md](docs/PUBLICATION_PLAN.md): инструкции по включению Pages, полю Website и чеклист board (§10).

## [0.3.1] — 2026-03-29

### Added

- GitHub Actions [`publish.yml`](.github/workflows/publish.yml): публикация в npm при push тега `v*.*.*` (секрет репозитория `NPM_TOKEN` с правом publish для scope `@getskillpack`).
- `publishConfig.access: public` для scoped-пакета.

## [0.3.0] — 2026-03-29

### Added

- Фаза C: список агентов с `budgetMonthlyCents` / `spentMonthlyCents`, сверка с месячным rollup `cost_event` при одном UTC-месяце в диапазоне.
- Capability `agents.read` в манифесте.

### Changed

- Пакет публичный (`private: false`), в tarball включается `dist/` (`files` + `prepublishOnly`: typecheck, test, build).

## [0.2.0] — ранее

### Added

- Rollup по `cost_event.created`, ручной журнал, виджет dashboard, цели C-level (фазы A–B, E).

[0.3.3]: https://github.com/getskillpack/paperclip-company-kpi/releases/tag/v0.3.3
[0.3.2]: https://github.com/getskillpack/paperclip-company-kpi/releases/tag/v0.3.2
[0.3.1]: https://github.com/getskillpack/paperclip-company-kpi/releases/tag/v0.3.1
[0.3.0]: https://github.com/getskillpack/paperclip-company-kpi/releases/tag/v0.3.0
