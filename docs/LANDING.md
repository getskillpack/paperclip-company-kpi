# Лендинг (копирайт): Company KPI for Paperclip

Черновик для сайта, GitHub Pages или `homepage` npm. Язык английский — для глобальной OSS-аудитории; при необходимости CMO готовит локализации.

---

## Hero

**Headline:** Company-wide KPI and spend, inside Paperclip.  
**Subhead:** Roll up `cost_event` streams, add a manual ledger, and track executive targets — one dashboard for operators and leadership.

**Primary CTA:** [Install from GitHub](https://github.com/getskillpack/paperclip-company-kpi)  
**Secondary CTA:** [Documentation](https://github.com/getskillpack/paperclip-company-kpi/blob/main/docs/IMPLEMENTATION_PLAN.md)

---

## Problem / solution

- **Problem:** Agent spend and company KPIs live in logs, spreadsheets, and ad-hoc notes — not where decisions are made.
- **Solution:** A trusted Paperclip plugin that aggregates cost events into monthly rollups, keeps an auditable manual ledger, and surfaces C-level targets next to the numbers you already trust in the host.

---

## Bullets

- Monthly **cost rollups** from `cost_event.created` with optional rebuild.
- **Manual ledger** for income/expense lines the API does not know yet.
- **Executive KPI targets** (target, period, role tag, manual actual) — see [C_LEVEL_KPI.md](./C_LEVEL_KPI.md).
- Built with `@paperclipai/plugin-sdk`; ships worker + UI bundle.

---

## Install (sketch)

```bash
git clone https://github.com/getskillpack/paperclip-company-kpi.git
cd paperclip-company-kpi
npm install && npm run build
# Register the built plugin with your Paperclip instance (see host docs).
```

*(Replace with `npm install @getskillpack/paperclip-company-kpi` when the package is public.)*

---

## Trust & safety

- No secrets in the repo; company state stays in Paperclip `ctx.state`.
- Honest about runtime: trusted plugin code, same-origin UI — not a third-party sandbox.

---

## Footer

Open source (MIT) · [getskillpack](https://github.com/getskillpack) · Issues: [paperclip-company-kpi](https://github.com/getskillpack/paperclip-company-kpi/issues)
