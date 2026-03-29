import { usePluginAction, usePluginData, type PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";
import { useCallback, useState } from "react";
import type { DashboardPayload, ExecutiveKpiTargetV1, ManualLedgerEntryV1 } from "../kpi-types.js";

function formatCents(cents: number, currency: string): string {
  const n = cents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export function DashboardWidget({ context }: PluginWidgetProps) {
  const companyId = context.companyId;
  const { data, loading, error, refresh } = usePluginData<DashboardPayload | { ok: false; error: string }>(
    "companyKpiDashboard",
    companyId ? { companyId } : {},
  );
  const addEntry = usePluginAction("addManualLedgerEntry");
  const deleteEntry = usePluginAction("deleteManualLedgerEntry");
  const upsertExecTarget = usePluginAction("upsertExecutiveKpiTarget");
  const deleteExecTarget = usePluginAction("deleteExecutiveKpiTarget");

  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);

  const [exOwner, setExOwner] = useState("");
  const [exRoleTag, setExRoleTag] = useState<ExecutiveKpiTargetV1["ownerRoleTag"] | "">("");
  const [exKpi, setExKpi] = useState("");
  const [exTarget, setExTarget] = useState("");
  const [exUnit, setExUnit] = useState<ExecutiveKpiTargetV1["unit"]>("count");
  const [exPeriod, setExPeriod] = useState(() => {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const [exActual, setExActual] = useState("");
  const [exNotes, setExNotes] = useState("");

  const onAdd = useCallback(async () => {
    if (!companyId) return;
    const major = Number.parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(major) || major <= 0) return;
    const amountCents = Math.round(major * 100);
    const now = new Date().toISOString();
    const entry: ManualLedgerEntryV1 = {
      id: crypto.randomUUID(),
      kind,
      amountCents,
      currency: currency.trim() || "USD",
      label: label.trim() || "(без описания)",
      occurredAt: now,
      createdAt: now,
    };
    setBusy(true);
    try {
      await addEntry({ companyId, entry });
      setAmount("");
      setLabel("");
      refresh();
    } finally {
      setBusy(false);
    }
  }, [addEntry, amount, companyId, currency, kind, label, refresh]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setBusy(true);
      try {
        await deleteEntry({ companyId, id });
        refresh();
      } finally {
        setBusy(false);
      }
    },
    [companyId, deleteEntry, refresh],
  );

  const onAddExecTarget = useCallback(async () => {
    if (!companyId) return;
    const tv = Number.parseFloat(exTarget.replace(",", "."));
    if (!exOwner.trim() || !exKpi.trim() || !exPeriod.trim() || !Number.isFinite(tv)) return;
    let actualValue: number | null | undefined;
    if (exActual.trim() !== "") {
      const a = Number.parseFloat(exActual.replace(",", "."));
      if (!Number.isFinite(a)) return;
      actualValue = a;
    }
    const now = new Date().toISOString();
    const target: ExecutiveKpiTargetV1 = {
      id: crypto.randomUUID(),
      ownerLabel: exOwner.trim(),
      ownerRoleTag: exRoleTag || undefined,
      kpiLabel: exKpi.trim(),
      targetValue: tv,
      unit: exUnit,
      periodLabel: exPeriod.trim(),
      actualValue,
      notes: exNotes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    setBusy(true);
    try {
      await upsertExecTarget({ companyId, target });
      setExKpi("");
      setExTarget("");
      setExActual("");
      setExNotes("");
      refresh();
    } finally {
      setBusy(false);
    }
  }, [
    companyId,
    exActual,
    exKpi,
    exNotes,
    exOwner,
    exPeriod,
    exRoleTag,
    exTarget,
    exUnit,
    refresh,
    upsertExecTarget,
  ]);

  const onDeleteExec = useCallback(
    async (id: string) => {
      if (!companyId) return;
      setBusy(true);
      try {
        await deleteExecTarget({ companyId, id });
        refresh();
      } finally {
        setBusy(false);
      }
    },
    [companyId, deleteExecTarget, refresh],
  );

  if (!companyId) {
    return (
      <div style={{ padding: "0.5rem", color: "#666" }}>
        Выберите компанию в интерфейсе Paperclip, чтобы видеть KPI.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: "0.5rem" }}>Загрузка Company KPI…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "0.5rem", color: "#b00020" }}>
        Ошибка плагина: {error.message}
      </div>
    );
  }

  if (!data || !("ok" in data) || data.ok !== true) {
    const msg = data && "error" in data ? data.error : "Нет данных";
    return <div style={{ padding: "0.5rem" }}>{msg}</div>;
  }

  const dash = data;

  return (
    <div style={{ display: "grid", gap: "1rem", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem" }}>
      <div>
        <strong>Company KPI</strong>
        <div style={{ color: "#555", marginTop: 4 }}>
          Период: {dash.range.from.slice(0, 10)} — {dash.range.to.slice(0, 10)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
        <Stat label="Cost (rollup)" value={formatCents(dash.totals.costFromRollupsCents, dash.displayCurrency)} />
        <Stat label="Ручные доходы" value={formatCents(dash.totals.manualIncomeCents, dash.displayCurrency)} />
        <Stat label="Ручные расходы" value={formatCents(dash.totals.manualExpenseCents, dash.displayCurrency)} />
      </div>

      <section>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Агенты: budget vs spent (host API)</div>
        <div style={{ color: "#555", fontSize: "0.8rem", marginBottom: 8 }}>
          Поля <code>budgetMonthlyCents</code> / <code>spentMonthlyCents</code> — снимок текущего биллингового месяца инстанса. Сверка с rollup ниже — только если выбранный период целиком в одном UTC-месяце.
        </div>
        {dash.reconciliation.mismatchWarning ? (
          <div
            style={{
              marginBottom: 8,
              padding: "8px 10px",
              borderRadius: 8,
              background: "#fff3e0",
              border: "1px solid #ff9800",
              color: "#5d4037",
              fontSize: "0.85rem",
            }}
          >
            {dash.reconciliation.mismatchWarning}
          </div>
        ) : null}
        {dash.reconciliation.comparableMonth ? (
          <div style={{ color: "#555", fontSize: "0.8rem", marginBottom: 8 }}>
            Сверка за {dash.reconciliation.comparableMonth}: rollup cost_event ={" "}
            {dash.reconciliation.rollupTotalCents != null ? formatCents(dash.reconciliation.rollupTotalCents, dash.displayCurrency) : "—"}
            , сумма spent по агентам = {formatCents(dash.reconciliation.agentsSpentSumCents, dash.displayCurrency)}
            {dash.reconciliation.deltaCents != null ? (
              <span>
                {" "}
                (Δ {formatCents(dash.reconciliation.deltaCents, dash.displayCurrency)})
              </span>
            ) : null}
            .
          </div>
        ) : (
          <div style={{ color: "#666", fontSize: "0.8rem", marginBottom: 8 }}>
            Период охватывает несколько UTC-месяцев — автоматическая сверка rollup ↔ spent отключена.
          </div>
        )}
        {dash.agentBudgetRows.length === 0 ? (
          <div style={{ color: "#666" }}>Нет агентов или нет доступа к списку.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "4px 8px" }}>Агент</th>
                <th style={{ padding: "4px 8px" }}>Статус</th>
                <th style={{ padding: "4px 8px" }}>Budget / мес</th>
                <th style={{ padding: "4px 8px" }}>Spent / мес</th>
                <th style={{ padding: "4px 8px" }}>Остаток</th>
              </tr>
            </thead>
            <tbody>
              {dash.agentBudgetRows.map((row) => {
                const left = row.budgetMonthlyCents - row.spentMonthlyCents;
                return (
                  <tr key={row.agentId} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "4px 8px" }}>
                      {row.name}
                      <span style={{ color: "#888", fontSize: "0.75rem" }}> ({row.urlKey})</span>
                    </td>
                    <td style={{ padding: "4px 8px" }}>{row.status}</td>
                    <td style={{ padding: "4px 8px" }}>{formatCents(row.budgetMonthlyCents, dash.displayCurrency)}</td>
                    <td style={{ padding: "4px 8px" }}>{formatCents(row.spentMonthlyCents, dash.displayCurrency)}</td>
                    <td style={{ padding: "4px 8px" }}>{formatCents(left, dash.displayCurrency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Агрегаты cost по месяцам</div>
        {dash.costRollups.length === 0 ? (
          <div style={{ color: "#666" }}>Пока нет cost_event в выбранном периоде.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "4px 8px" }}>Месяц</th>
                <th style={{ padding: "4px 8px" }}>События</th>
                <th style={{ padding: "4px 8px" }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {dash.costRollups.map(({ yearMonth, rollup }) => (
                <tr key={yearMonth} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "4px 8px" }}>{yearMonth}</td>
                  <td style={{ padding: "4px 8px" }}>{rollup.eventCount}</td>
                  <td style={{ padding: "4px 8px" }}>{formatCents(rollup.totalCostCents, dash.displayCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Cost (UTC {dash.costFineGranularity === "hour" ? "hourly" : "daily"})
        </div>
        <div style={{ color: "#555", fontSize: "0.8rem", marginBottom: 8 }}>
          Для диапазона ≤ 7 суток — почасовые ведра; иначе — по дням. Ключи в UTC.
        </div>
        {dash.costFineBuckets.length === 0 ? (
          <div style={{ color: "#666" }}>Нет cost_event в этом разрезе за период.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "4px 8px" }}>Bucket (UTC)</th>
                <th style={{ padding: "4px 8px" }}>События</th>
                <th style={{ padding: "4px 8px" }}>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {dash.costFineBuckets.map((b) => (
                <tr key={b.bucketKey} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "4px 8px" }}>{b.bucketKey}</td>
                  <td style={{ padding: "4px 8px" }}>{b.eventCount}</td>
                  <td style={{ padding: "4px 8px" }}>{formatCents(b.totalCostCents, dash.displayCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Цели C-level (задаёт CEO / board)</div>
        <div style={{ color: "#555", fontSize: "0.8rem", marginBottom: 8 }}>
          Реестр KPI по ролям: target и ручной факт (MVP). См.{" "}
          <a href="https://github.com/getskillpack/paperclip-company-kpi/blob/main/docs/C_LEVEL_KPI.md" target="_blank" rel="noreferrer">
            docs/C_LEVEL_KPI.md
          </a>
          .
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Роль / владелец</span>
            <input value={exOwner} onChange={(e) => setExOwner(e.target.value)} placeholder="CTO" style={{ width: 120 }} />
          </label>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Тег</span>
            <select
              value={exRoleTag}
              onChange={(e) => setExRoleTag(e.target.value as ExecutiveKpiTargetV1["ownerRoleTag"] | "")}
            >
              <option value="">—</option>
              <option value="cto">cto</option>
              <option value="cmo">cmo</option>
              <option value="cfo">cfo</option>
              <option value="coo">coo</option>
              <option value="ceo">ceo</option>
              <option value="other">other</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 2, flex: "1 1 140px" }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>KPI</span>
            <input value={exKpi} onChange={(e) => setExKpi(e.target.value)} placeholder="Закрытых тикетов / нед" />
          </label>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Target</span>
            <input value={exTarget} onChange={(e) => setExTarget(e.target.value)} placeholder="12" style={{ width: 72 }} />
          </label>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Единица</span>
            <select value={exUnit} onChange={(e) => setExUnit(e.target.value as ExecutiveKpiTargetV1["unit"])}>
              <option value="count">count</option>
              <option value="cents">cents</option>
              <option value="percent">percent</option>
              <option value="days">days</option>
              <option value="score">score</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Период</span>
            <input value={exPeriod} onChange={(e) => setExPeriod(e.target.value)} placeholder="2026-03" style={{ width: 88 }} />
          </label>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Факт (опц.)</span>
            <input value={exActual} onChange={(e) => setExActual(e.target.value)} style={{ width: 72 }} />
          </label>
          <label style={{ display: "grid", gap: 2, flex: "1 1 160px" }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Заметка</span>
            <input value={exNotes} onChange={(e) => setExNotes(e.target.value)} />
          </label>
          <button type="button" disabled={busy} onClick={() => void onAddExecTarget()}>
            Добавить цель
          </button>
        </div>
        {dash.executiveTargets.length === 0 ? (
          <div style={{ color: "#666" }}>Целей пока нет.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "4px 8px" }}>Владелец</th>
                <th style={{ padding: "4px 8px" }}>KPI</th>
                <th style={{ padding: "4px 8px" }}>Период</th>
                <th style={{ padding: "4px 8px" }}>Target</th>
                <th style={{ padding: "4px 8px" }}>Факт</th>
                <th style={{ padding: "4px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {dash.executiveTargets.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "4px 8px" }}>
                    {row.ownerLabel}
                    {row.ownerRoleTag ? <span style={{ color: "#888", fontSize: "0.75rem" }}> ({row.ownerRoleTag})</span> : null}
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    {row.kpiLabel}
                    {row.notes ? <div style={{ fontSize: "0.75rem", color: "#666" }}>{row.notes}</div> : null}
                  </td>
                  <td style={{ padding: "4px 8px" }}>{row.periodLabel}</td>
                  <td style={{ padding: "4px 8px" }}>{formatKpiValue(row.targetValue, row.unit, dash.displayCurrency)}</td>
                  <td style={{ padding: "4px 8px" }}>
                    {row.actualValue == null ? "—" : formatKpiValue(row.actualValue, row.unit, dash.displayCurrency)}
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <button type="button" disabled={busy} onClick={() => void onDeleteExec(row.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Ручной журнал</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Тип</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as "expense" | "income")}>
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Сумма</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ width: 96 }} />
          </label>
          <label style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Валюта</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 64 }} />
          </label>
          <label style={{ display: "grid", gap: 2, flex: "1 1 160px" }}>
            <span style={{ fontSize: "0.75rem", color: "#555" }}>Описание</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <button type="button" disabled={busy} onClick={() => void onAdd()}>
            Добавить
          </button>
        </div>

        {dash.manualEntries.length === 0 ? (
          <div style={{ color: "#666" }}>Записей нет.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "4px 8px" }}>Дата</th>
                <th style={{ padding: "4px 8px" }}>Тип</th>
                <th style={{ padding: "4px 8px" }}>Сумма</th>
                <th style={{ padding: "4px 8px" }}>Описание</th>
                <th style={{ padding: "4px 8px" }} />
              </tr>
            </thead>
            <tbody>
              {dash.manualEntries.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "4px 8px" }}>{row.occurredAt.slice(0, 10)}</td>
                  <td style={{ padding: "4px 8px" }}>{row.kind === "income" ? "Доход" : "Расход"}</td>
                  <td style={{ padding: "4px 8px" }}>{formatCents(row.amountCents, row.currency)}</td>
                  <td style={{ padding: "4px 8px" }}>{row.label}</td>
                  <td style={{ padding: "4px 8px" }}>
                    <button type="button" disabled={busy} onClick={() => void onDelete(row.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function formatKpiValue(value: number, unit: ExecutiveKpiTargetV1["unit"], displayCurrency: string): string {
  if (unit === "cents") {
    return formatCents(value, displayCurrency);
  }
  if (unit === "percent") {
    return `${value}%`;
  }
  return String(value);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: "0.75rem", color: "#555" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
