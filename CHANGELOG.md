# Changelog

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Версии соответствуют [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Совместимость

Плагин собирается с **`@paperclipai/plugin-sdk`** версии, указанной в `package.json` (см. devDependencies). Требуемые capabilities перечислены в `src/manifest.ts` (`events.subscribe`, `plugin.state.read`, `plugin.state.write`, `agents.read`).

## [0.3.0] — 2026-03-29

### Added

- Фаза C: список агентов с `budgetMonthlyCents` / `spentMonthlyCents`, сверка с месячным rollup `cost_event` при одном UTC-месяце в диапазоне.
- Capability `agents.read` в манифесте.

### Changed

- Пакет публичный (`private: false`), в tarball включается `dist/` (`files` + `prepublishOnly`: typecheck, test, build).

## [0.2.0] — ранее

### Added

- Rollup по `cost_event.created`, ручной журнал, виджет dashboard, цели C-level (фазы A–B, E).

[0.3.0]: https://github.com/getskillpack/paperclip-company-kpi/releases/tag/v0.3.0
