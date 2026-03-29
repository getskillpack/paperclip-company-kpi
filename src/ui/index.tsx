import { usePluginAction, usePluginData, type PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";
import { useCallback, useState } from "react";
import type { DashboardPayload, ManualLedgerEntryV1 } from "../kpi-types.js";

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

  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: "0.75rem", color: "#555" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}
