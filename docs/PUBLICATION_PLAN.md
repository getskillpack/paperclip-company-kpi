# План публикации: `@getskillpack/paperclip-company-kpi`

Связь: [XDE-106](/XDE/issues/XDE-106), цель [Launch Skill Manager (skpkg)](/XDE/projects/getskillpack-paperclip-company-kpi).  
Проект Paperclip: [getskillpack paperclip-company-kpi](/XDE/projects/getskillpack-paperclip-company-kpi).

## 1. Цель публикации

Сделать плагин **находимым и доверяемым** для операторов Paperclip: понятный README, воспроизводимая установка, видимость в каталогах/сообществах — без утечки секретов и без обещаний по RBAC, которых нет в рантайме (см. [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)).

## 2. Готовность продукта (до «шумной» дистрибуции)

| Блок | Статус | Доработки |
|------|--------|-----------|
| Фазы A–B (rollup + ledger) | готово | — |
| Фаза E (C-level targets) | готово в коде | после фазы C — привязка actual к API агентов при согласовании с CTO |
| Фаза C (budget/spent по агентам) | готово | — |
| `package.json` публичный пакет | `private: false`, метаданные заполнены | первый `npm publish` — после токена board / CI |
| Лицензия MIT | ок | `LICENSE` в корне |
| CI | ок | бейдж в README, workflow `ci.yml` на `main` |
| `CHANGELOG.md` | ок | Keep a Changelog + совместимость SDK |

## 3. npm (публичный пакет)

1. Решение board: публиковать ли scope `@getskillpack` из org npm или только GitHub Releases + установка по git/tag.
2. Перед `npm publish`: убрать `private`, заполнить метаданные, `npm pack --dry-run`, теги git `v0.x.y`.
3. В README — одна команда установки и ссылка на раздел «Установка в Paperclip» (локальный путь vs npm).

## 4. Awesome-листы и каталоги

- Подготовить **короткий англоязычный** one-liner + ссылку на репо (для PR в чужие списки).
- Кандидаты (уточнять актуальность перед PR): curated-листы вокруг Paperclip / agent runtimes / self-hosted devtools (не спамить: один качественный PR лучше десяти копий).
- Вести учёт отправленных PR в матрице дистрибуции проекта [skpkg Distribution & Social](/XDE/projects/skpkg-distribution-social) ([XDE-71](/XDE/issues/XDE-71), [XDE-72](/XDE/issues/XDE-72)).

## 5. Discord и чаты

- Не постить в чужие серверы без правил канала; подготовить **2 варианта** сообщения: короткий (одна ссылка + one-liner) и развёрнутый (для «showcase»).
- Целевые каналы — из исследования CMO в [XDE-72](/XDE/issues/XDE-72) (Paperclip-adjacent, OSS, self-hosted).
- После релиза npm / стабильного тега — одна волна анонсов, дальше обновления по changelog.

## 6. Документация

- Пользовательский путь: README → [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) (архитектура) → [C_LEVEL_KPI.md](./C_LEVEL_KPI.md) (цели C-level).
- Добавить при публичном релизе: `CHANGELOG.md` (Keep a Changelog), раздел «Совместимость» (версия `@paperclipai/plugin-sdk` / host).

## 7. Лендинг

- Источник копирайта: [LANDING.md](./LANDING.md) (мультиязычные блоки + CTA на звезду GitHub).
- Статическая страница без сборки: [docs/site/index.html](./site/index.html) — можно опубликовать через GitHub Pages (корень сайта → `docs/site/` или настроить workflow).
- Варианты размещения: GitHub Pages, отдельная страница на сайте skpkg (если появится), или `homepage` в npm — выбор board/CMO.
- Минимальный MVP лендинга: один экран — проблема, решение, установка, ссылка на репозиторий и видимый star-widget / ссылка «Star on GitHub».

## 8. Роли

| Кто | Что |
|-----|-----|
| CEO / продукт | приоритеты фаз, публикация плана, связка с эпиками |
| Board | npm scope, домен лендинга, юридические формулировки |
| CTO | контракты API/событий при доработках после фазы C |
| CMO | матрица каналов, тексты постов, awesome/Discord из п. 4–5 |
| Founding Engineer | реализация фаз C/D, релизные скрипты, CI |

## 9. Следующий шаг (рекомендация)

1. Закрыть **фазу C** или явно пометить в README «beta: без сверки по агентам» — затем открыть npm и внешние PR в awesome.
2. Параллельно CMO обновляет матрицу под этот репозиторий в рамках [XDE-72](/XDE/issues/XDE-72).
