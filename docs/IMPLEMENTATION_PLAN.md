# План: плагин Paperclip «Company KPI / Budget»

Связь: [XDE-105](/XDE/issues/XDE-105), цель компании Launch Skill Manager (skpkg).  
## 1. Цель

Дать board и руководителям **один экран и один источник правды** по деньгам компании внутри Paperclip:

- **Расходы:** агрегировать фактические траты на агентов (из событий стоимости и/или снимков бюджета агентов) + **ручные** статьи (сверх API).
- **Доходы:** **ручной** журнал (MVP); позже — опциональные интеграции (вне скоупа MVP).
- **Период:** календарный месяц по умолчанию + выбор диапазона.

Плагин — **отдельный npm-пакет / репозиторий**, устанавливаемый в инстанс Paperclip (доверенный worker + UI), без хранения секретов в репозитории.

## 2. Ограничения рантайма (актуальные)

- Worker и UI плагина — **доверенный код**; UI same-origin, не песочница.
- Декларировать только поддерживаемые **capabilities** в `manifest`; не использовать `ctx.assets`.
- Установка: локальный путь (dev) или **npm package** (prod), см. `@paperclipai/plugin-sdk` README.

## 3. Источники данных

| Источник | Назначение |
|----------|------------|
| Событие `cost_event.created` | Поток фактических cost-событий по компании (подписка `events.subscribe`). |
| API агентов (через контекст плагина / снимки) | `budgetMonthlyCents`, `spentMonthlyCents` — контроль лимитов и «остатка» по агентам (сверка с ledger). |
| `ctx.state` scope `company` | Хранение **ручных** проводок (расход/доход), настроек валюты отображения, последней синхронизации. |

**Модель ручной проводки (MVP):** JSON-массив в state key например `manual_ledger_v1`: `{ id, kind: "income"\|"expense", amountCents, currency, label, occurredAt, createdAt, createdByHint? }`. Идемпотентность — UUID на клиенте.

## 4. Архитектура

- **Worker (`setup`):**
  - Подписка на `cost_event.created` (фильтр по `companyId`); нормализация и запись в `ctx.state` агрегатов по месяцам (`cost_rollup_v1:{yyyy-mm}`) или инкремент + периодический пересчёт job-ом (проще для MVP — append + job reconcile).
  - Регистрация `ctx.data` для UI: `getDashboard(companyId, range)` — объединяет rollup + manual + сводку по агентам.
  - Регистрация `ctx.actions`: `addManualEntry`, `deleteManualEntry` (только ручные id), `rebuildRollup` (оператор).
  - Опционально **job** `jobs.schedule`: ежедневный reconcile / дайджест (capability `jobs.schedule`).
- **UI:** страница (launcher «Company KPI» или слот уровня company, если доступен в манифесте) — таблица расходов/доходов, график по месяцам, блок «агенты: budget vs spent».

## 5. Capabilities (черновик манифеста)

Минимум: `events.subscribe`, `plugin.state.read`, `plugin.state.write`, `entities.read` (если нужен доступ к списку агентов), `agents.read` или эквивалент из SDK для бюджетных полей — **уточнить по факту** в коде SDK/host для вашей версии.

Для cron-дайджеста: `jobs.schedule`.

## 6. Фазы

1. **Фаза A — каркас:** scaffold через `@paperclipai/create-paperclip-plugin`, CI typecheck/test/build, пустой dashboard «OK».
2. **Фаза B — MVP данные:** подписка на `cost_event.created`, запись агрегатов в `ctx.state`, ручные проводки через actions, простая таблица в UI.
3. **Фаза C — сверка с агентами:** панель по агентам (budget/spent из API), предупреждения при расхождении с rollup (документировать допущения).
4. **Фаза D — отчётность:** экспорт CSV, email/webhook вне скоупа до запроса board.
5. **Фаза E — цели C-level:** реестр целей, которые CEO выставляет руководителям (роль/метка, название KPI, target, период, ручной actual); см. [docs/C_LEVEL_KPI.md](./C_LEVEL_KPI.md). Actions `upsertExecutiveKpiTarget` / `deleteExecutiveKpiTarget`, отображение в dashboard widget.

## 7. Тестирование

- `createTestHarness` из `@paperclipai/plugin-sdk/testing`: события cost, вызовы data/actions, state.
- Снапшоты UI по минимуму (smoke).

## 8. Безопасность и соответствие

- Не логировать PAT, ключи, PII; суммы и метки — в scope company state.
- RBAC: опираться на то, что UI вызывается в сессии board; не обещать изоляцию, которой нет в текущем рантайме.

## 9. Следующий шаг после утверждения плана

Назначить реализацию **Founding Engineer** (скaffold + MVP Фазы A–B), консультации по host API — **CTO** при расхождении контракта событий `cost_event`.

Фаза E (C-level targets) может вестись CEO/product совместно с FE; автоматический actual — после фазы C и уточнения модели ролей в host.

## 10. Публикация OSS

См. [PUBLICATION_PLAN.md](./PUBLICATION_PLAN.md) (npm, awesome-листы, Discord, лендинг) и [LANDING.md](./LANDING.md) (текст лендинга).
