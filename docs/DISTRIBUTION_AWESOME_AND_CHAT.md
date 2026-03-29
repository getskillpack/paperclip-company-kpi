# Дистрибуция: awesome-листы и чаты (§4–§5)

Исполнение [docs/PUBLICATION_PLAN.md](./PUBLICATION_PLAN.md) §4–§5 для [`@getskillpack/paperclip-company-kpi`](https://github.com/getskillpack/paperclip-company-kpi).  
Учёт отправленных PR и постов — в матрице [XDE-72](/XDE/issues/XDE-72), эпик [XDE-71](/XDE/issues/XDE-71).

---

## 4a. One-liner (English, для PR в curated-листы)

**Single line:**

> **paperclip-company-kpi** — Paperclip plugin: roll up `cost_event.created` into monthly totals, keep a manual income/expense ledger, and show C-level KPI targets next to host metrics. MIT.

**С ссылкой (второй абзац PR или описание пункта в README-листе):**

- Repo: `https://github.com/getskillpack/paperclip-company-kpi`
- Landing (после включения Pages): `https://getskillpack.github.io/paperclip-company-kpi/`
- npm (после первого publish): `https://www.npmjs.com/package/@getskillpack/paperclip-company-kpi`

**Готовая строка для вставки в список в стиле [awesome-paperclip](https://github.com/gsxdsm/awesome-paperclip) (раздел Plugins):**

```markdown
- [paperclip-company-kpi](https://github.com/getskillpack/paperclip-company-kpi) — Company finance KPIs: monthly cost rollups, manual ledger, C-level targets in the Paperclip UI. [npm](https://www.npmjs.com/package/@getskillpack/paperclip-company-kpi) (after publish).
```

До появления пакета в registry можно временно убрать сегмент `[npm](...)` или заменить на «install via git tag / see README».

---

## 4b. Кандидаты awesome / каталогов

Перед каждым PR: прочитать `CONTRIBUTING.md` целевого репозитория, проверить актуальность категории, **один** качественный PR на список (без массового копипаста).

| Приоритет | Куда | URL | Зачем |
|-----------|------|-----|--------|
| P0 | **Awesome Paperclip** (официальная отсылка из upstream README) | [gsxdsm/awesome-paperclip](https://github.com/gsxdsm/awesome-paperclip) | Прямой охват операторов Paperclip; секция **Plugins**. |
| P1 | **Paperclip** — Discussions / showcase | [paperclipai/paperclip/discussions](https://github.com/paperclipai/paperclip/discussions) | Короткий пост с ссылкой на репо и one-liner; не дублировать, если уже есть тред по плагину. |
| P2 | **Paperclip Discord** | приглашение в [README upstream](https://github.com/paperclipai/paperclip/blob/master/README.md) (`discord.gg/m4HZY7xNG3`) | Только каналы, где разрешены анонсы; использовать тексты из §5. |
| P3 | Агрегаторы плагинов | [oh-my-paperclip](https://github.com/gsxdsm/oh-my-paperclip) (если поддерживают внешние entries) | Уточнить у maintainers, нужен ли отдельный PR или достаточно awesome-paperclip. |

Не целить в общие mega-lists без явного fit (например, только «self-hosted» без связи с Paperclip/agents) — низкая конверсия и риск спама.

---

## 5. Discord и чаты

**Правила:** не постить в чужие серверы без правил канала; не @everyone; одна волна после стабильного тега / npm — см. [PUBLICATION_PLAN.md](./PUBLICATION_PLAN.md) §3 и §5.

### Вариант A — короткий (одна ссылка + one-liner)

```text
Open-source Paperclip plugin for company KPIs (cost rollups + manual ledger + C-level targets in the host UI): https://github.com/getskillpack/paperclip-company-kpi — MIT, feedback welcome.
```

### Вариант B — развёрнутый (showcase / «что внутри»)

```text
We shipped a Paperclip plugin for operators who want finance-style signal inside the host:

• Monthly rollups from cost_event.created
• Manual ledger for income/expense lines the API doesn’t model yet
• C-level KPI registry (targets + optional actual) next to the numbers you already trust

Repo: https://github.com/getskillpack/paperclip-company-kpi
Landing: https://getskillpack.github.io/paperclip-company-kpi/ (enable GitHub Actions Pages in repo settings if the site 404s)
npm: @getskillpack/paperclip-company-kpi (after the first publish — see README)

MIT — issues/PRs welcome.
```

---

## Шаблон строки для матрицы [XDE-72](/XDE/issues/XDE-72)

Скопировать в документ матрицы после фактического действия:

| Канал | Формат | Статус | Ссылка (PR/post) | Дата (UTC) |
|-------|--------|--------|------------------|------------|
| awesome-paperclip | PR | pending / merged | … | … |
| Discord Paperclip | post | pending / posted | … | … |
