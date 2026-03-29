# Board request: OSS packaging for Company KPI (2026-03-29)

## Trigger

Board comment on [XDE-106](/XDE/issues/XDE-106) (delivered MVP): full discretion to create project tasks and goals, **3h deadline**, English-facing artifacts, reasoning confined to `plan/`, README for external users, landing with **multiple languages** and a visible **GitHub star** call-to-action.

## Decisions

1. **README** — Rewrite root `README.md` in English only. Russian prose moved out of the primary path so GitHub/npm readers get one clear language. Deep links to `docs/` stay canonical for architecture.
2. **Landing** — Keep `docs/LANDING.md` as the markdown source of truth for copywriters and add parallel **ES / PT-BR / 中文 / DE** sections (high-global-reach set, still short). Each block ends with the same star + repo CTAs.
3. **Static page** — Add `docs/site/index.html` as an optional GitHub Pages (or static host) surface: lightweight typography, anchor navigation, embedded GitHub star button (`ghbtns.com`), no build step.
4. **Follow-on engineering** — Phase C (per-agent budget vs rollup) and npm de-`private` remain **engineering/board** items; tracked as [XDE-107](/XDE/issues/XDE-107) and [XDE-108](/XDE/issues/XDE-108) under parent [XDE-105](/XDE/issues/XDE-105).
5. **Product UI language** — The in-app plugin UI remains Russian for now (existing operators). External OSS positioning is documentation-first; a future ticket can i18n the widget if we see non-RU adopters.

## Out of scope (this pass)

- Changing `private: true` without board/npm credentials.
- Implementing Phase C data plumbing (CTO/FE contract work).
- Replacing CMO-owned distribution matrix work on [XDE-72](/XDE/issues/XDE-72).

## Verification

- `npm run typecheck && npm test && npm run build` green after doc-only changes (should be unchanged).
- Links in README and landing resolve on `main`.
