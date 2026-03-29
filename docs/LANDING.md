# Landing copy: Company KPI for Paperclip

Source for GitHub Pages, npm `homepage`, or social snippets. **English** is canonical for OSS; **ES / PT-BR / 中文 / DE** follow the same narrative depth (hero, problem/solution, bullets) as English on [`docs/site/index.html`](./site/index.html).

**Star the repo:** [github.com/getskillpack/paperclip-company-kpi](https://github.com/getskillpack/paperclip-company-kpi) — use the ⭐ button on GitHub (or the embed on [docs/site/index.html](./site/index.html)).

---

## English

### Hero

**Headline:** Company-wide KPI and spend, inside Paperclip.  
**Subhead:** Roll up `cost_event` streams, add a manual ledger, and track executive targets — one dashboard for operators and leadership.

**Primary CTA:** [Open repository](https://github.com/getskillpack/paperclip-company-kpi)  
**Secondary CTA:** [Implementation plan](https://github.com/getskillpack/paperclip-company-kpi/blob/main/docs/IMPLEMENTATION_PLAN.md)  
**Star on GitHub:** [Star `paperclip-company-kpi`](https://github.com/getskillpack/paperclip-company-kpi)

### Problem / solution

- **Problem:** Agent spend and company KPIs live in logs, spreadsheets, and ad-hoc notes — not where decisions are made.
- **Solution:** A Paperclip plugin that aggregates cost events into monthly rollups, keeps an auditable manual ledger, and surfaces C-level targets next to the numbers you already trust in the host.

### Bullets

- Monthly **cost rollups** from `cost_event.created` with optional rebuild.
- **Manual ledger** for income/expense lines the API does not know yet.
- **Executive KPI targets** (target, period, role tag, manual actual) — see [C_LEVEL_KPI.md](./C_LEVEL_KPI.md).
- Built with `@paperclipai/plugin-sdk`; ships worker + UI bundle.

---

## Español

**Titular:** KPI y gasto de la empresa, dentro de Paperclip.  
**Subtítulo:** Agrega flujos `cost_event`, añade un libro manual y sigue objetivos ejecutivos — un panel para operadores y liderazgo.

**CTA:** [Repositorio](https://github.com/getskillpack/paperclip-company-kpi) · [Documentación](https://github.com/getskillpack/paperclip-company-kpi/blob/main/docs/IMPLEMENTATION_PLAN.md) · [Dar estrella en GitHub](https://github.com/getskillpack/paperclip-company-kpi)

### Problema / solución

- **Problema:** el gasto y los KPI de la empresa están en registros, hojas de cálculo y notas — no donde se decide.
- **Solución:** plugin de Paperclip con rollups mensuales de `cost_event`, libro manual auditable y objetivos ejecutivos junto a los datos del host.

### Viñetas

- Rollups mensuales desde `cost_event.created`.
- **Libro manual** de ingresos/gastos.
- **Objetivos ejecutivos** (target, periodo, rol) — ver [C_LEVEL_KPI.md](./C_LEVEL_KPI.md).

---

## Português (Brasil)

**Manchete:** KPI e gastos da empresa dentro do Paperclip.  
**Subtítulo:** Consolide fluxos `cost_event`, use um livro-razão manual e acompanhe metas executivas — um painel para operações e liderança.

**CTA:** [Repositório](https://github.com/getskillpack/paperclip-company-kpi) · [Documentação](https://github.com/getskillpack/paperclip-company-kpi/blob/main/docs/IMPLEMENTATION_PLAN.md) · [Estrela no GitHub](https://github.com/getskillpack/paperclip-company-kpi)

### Problema / solução

- **Problema:** gasto de agentes e KPIs em logs, planilhas e anotações — fora do fluxo de decisão.
- **Solução:** plugin Paperclip que agrega `cost_event` em rollups mensais, mantém razão manual auditável e metas de liderança ao lado dos números do host.

### Marcadores

- Rollups mensais a partir de `cost_event.created`.
- **Razão manual** de receitas/despesas.
- **Metas executivas** — ver [C_LEVEL_KPI.md](./C_LEVEL_KPI.md).

---

## 中文（简体）

**标题：** 在 Paperclip 内的公司级 KPI 与支出。  
**副标题：** 汇总 `cost_event` 流、补充手工台账，并跟踪高管目标 —— 为运营与管理层提供统一看板。

**行动：** [代码仓库](https://github.com/getskillpack/paperclip-company-kpi) · [实现说明](https://github.com/getskillpack/paperclip-company-kpi/blob/main/docs/IMPLEMENTATION_PLAN.md) · [在 GitHub 点星](https://github.com/getskillpack/paperclip-company-kpi)

### 问题 / 方案

- **问题：** 智能体支出与公司 KPI 分散在日志、表格和临时笔记中，不在决策现场。
- **方案：** Paperclip 插件将 `cost_event` 汇总为月度 rollup，维护可审计手工台账，并在宿主可信数据旁展示高管目标。

### 要点

- 基于 `cost_event.created` 的月度成本汇总。
- **手工台账** 收入/支出行。
- **高管 KPI 目标** — 见 [C_LEVEL_KPI.md](./C_LEVEL_KPI.md)。

---

## Deutsch

**Headline:** Unternehmens-KPIs und Ausgaben — direkt in Paperclip.  
**Subhead:** `cost_event`-Ströme zusammenführen, ein manuelles Journal pflegen und Führungsziele tracken — ein Dashboard für Betrieb und Leadership.

**CTA:** [Repository](https://github.com/getskillpack/paperclip-company-kpi) · [Implementierungsplan](https://github.com/getskillpack/paperclip-company-kpi/blob/main/docs/IMPLEMENTATION_PLAN.md) · [Star auf GitHub](https://github.com/getskillpack/paperclip-company-kpi)

### Problem / Lösung

- **Problem:** Agenten-Ausgaben und Unternehmens-KPIs liegen in Logs, Tabellen und Notizen — nicht dort, wo entschieden wird.
- **Lösung:** Paperclip-Plugin mit monatlichen `cost_event`-Rollups, auditierbarem Journal und Führungszielen neben den Host-Zahlen.

### Stichpunkte

- Monatliche Kosten-Rollups aus `cost_event.created`.
- **Manuelles Journal** für Einnahmen/Ausgaben.
- **Executive-KPI-Ziele** — siehe [C_LEVEL_KPI.md](./C_LEVEL_KPI.md).

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

## Trust and safety

- No secrets in the repo; company state stays in Paperclip `ctx.state`.
- Honest about runtime: trusted plugin code, same-origin UI — not a third-party sandbox.

---

## Footer

Open source (MIT) · [getskillpack](https://github.com/getskillpack) · [Issues](https://github.com/getskillpack/paperclip-company-kpi/issues) · **Star:** [paperclip-company-kpi](https://github.com/getskillpack/paperclip-company-kpi)
