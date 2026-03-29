import type { Agent } from "@paperclipai/shared";
import { describe, expect, it } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";
import {
  COST_ROLLUP_DAY_INDEX_KEY,
  COST_ROLLUP_HOUR_INDEX_KEY,
  COST_ROLLUP_KEY_PREFIX,
  COST_ROLLUP_INDEX_KEY,
  DASHBOARD_HOUR_BREAKDOWN_MAX_DAYS,
  DISPLAY_CURRENCY_KEY,
  EXECUTIVE_KPI_TARGETS_KEY,
  MANUAL_LEDGER_KEY,
  companyStateKey,
} from "../src/kpi-state.js";

const companyId = "11111111-1111-1111-1111-111111111111";

const testCaps = [...manifest.capabilities, "events.emit"] as const;

function seedAgent(partial: Partial<Agent> & Pick<Agent, "id" | "companyId" | "name" | "spentMonthlyCents" | "budgetMonthlyCents">): Agent {
  const now = new Date();
  return {
    urlKey: partial.urlKey ?? "agent",
    role: partial.role ?? "engineer",
    title: partial.title ?? null,
    icon: partial.icon ?? null,
    status: partial.status ?? "running",
    reportsTo: partial.reportsTo ?? null,
    capabilities: partial.capabilities ?? null,
    adapterType: partial.adapterType ?? "cursor",
    adapterConfig: partial.adapterConfig ?? {},
    runtimeConfig: partial.runtimeConfig ?? {},
    pauseReason: partial.pauseReason ?? null,
    pausedAt: partial.pausedAt ?? null,
    permissions: partial.permissions ?? { canCreateAgents: false },
    lastHeartbeatAt: partial.lastHeartbeatAt ?? null,
    metadata: partial.metadata ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    ...partial,
  };
}

describe("company-kpi plugin", () => {
  it("aggregates cost_event.created into monthly rollup (idempotent by plugin event id)", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...testCaps] });
    harness.seed({
      agents: [
        seedAgent({
          id: "agent-rollup-match",
          companyId,
          name: "Matcher",
          urlKey: "matcher",
          spentMonthlyCents: 42,
          budgetMonthlyCents: 1000,
        }),
      ],
    });
    await plugin.definition.setup(harness.ctx);

    const from = "2026-03-01T00:00:00.000Z";
    const to = "2026-03-31T23:59:59.999Z";

    await harness.emit(
      "cost_event.created",
      { costCents: 42, occurredAt: "2026-03-10T12:00:00.000Z" },
      { companyId, eventId: "cost-evt-1" },
    );

    const dash = await harness.getData<Record<string, unknown>>("companyKpiDashboard", {
      companyId,
      rangeFrom: from,
      rangeTo: to,
    });
    expect(dash.ok).toBe(true);
    expect((dash as { totals: { costFromRollupsCents: number } }).totals.costFromRollupsCents).toBe(42);
    const d1 = dash as { reconciliation: { mismatchWarning: string | null } };
    expect(d1.reconciliation.mismatchWarning).toBeNull();

    await harness.emit(
      "cost_event.created",
      { costCents: 999, occurredAt: "2026-03-11T12:00:00.000Z" },
      { companyId, eventId: "cost-evt-1" },
    );

    const dash2 = await harness.getData<{ totals: { costFromRollupsCents: number } }>("companyKpiDashboard", {
      companyId,
      rangeFrom: from,
      rangeTo: to,
    });
    expect(dash2.totals.costFromRollupsCents).toBe(42);

    const idx = harness.getState(companyStateKey(companyId, COST_ROLLUP_INDEX_KEY)) as string[];
    expect(idx).toContain("2026-03");
    const dayIdx = harness.getState(companyStateKey(companyId, COST_ROLLUP_DAY_INDEX_KEY)) as string[];
    expect(dayIdx).toContain("2026-03-10");
    const hourIdx = harness.getState(companyStateKey(companyId, COST_ROLLUP_HOUR_INDEX_KEY)) as string[];
    expect(hourIdx).toContain("2026-03-10T12");
    const rollup = harness.getState(companyStateKey(companyId, `${COST_ROLLUP_KEY_PREFIX}2026-03`)) as {
      totalCostCents: number;
      eventCount: number;
    };
    expect(rollup.totalCostCents).toBe(42);
    expect(rollup.eventCount).toBe(1);
  });

  it("uses hour buckets when range span ≤ 7 UTC days, else day buckets", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...testCaps] });
    harness.seed({ agents: [] });
    await plugin.definition.setup(harness.ctx);

    await harness.emit(
      "cost_event.created",
      { costCents: 1, occurredAt: "2026-03-10T12:00:00.000Z" },
      { companyId, eventId: "h1" },
    );
    await harness.emit(
      "cost_event.created",
      { costCents: 2, occurredAt: "2026-03-10T13:00:00.000Z" },
      { companyId, eventId: "h2" },
    );

    const shortFrom = "2026-03-09T00:00:00.000Z";
    const shortTo = "2026-03-11T23:59:59.999Z";
    const spanDays = (new Date(shortTo).getTime() - new Date(shortFrom).getTime()) / (24 * 60 * 60 * 1000);
    expect(spanDays).toBeLessThanOrEqual(DASHBOARD_HOUR_BREAKDOWN_MAX_DAYS);

    const dashShort = await harness.getData<{
      costFineGranularity: string;
      costFineBuckets: { bucketKey: string; totalCostCents: number }[];
    }>("companyKpiDashboard", { companyId, rangeFrom: shortFrom, rangeTo: shortTo });
    expect(dashShort.costFineGranularity).toBe("hour");
    expect(dashShort.costFineBuckets.map((b) => b.bucketKey).sort()).toEqual(["2026-03-10T12", "2026-03-10T13"]);
    expect(dashShort.costFineBuckets.reduce((s, b) => s + b.totalCostCents, 0)).toBe(3);

    const longFrom = "2026-03-01T00:00:00.000Z";
    const longTo = "2026-03-31T23:59:59.999Z";
    const dashLong = await harness.getData<{
      costFineGranularity: string;
      costFineBuckets: { bucketKey: string; totalCostCents: number }[];
    }>("companyKpiDashboard", { companyId, rangeFrom: longFrom, rangeTo: longTo });
    expect(dashLong.costFineGranularity).toBe("day");
    expect(dashLong.costFineBuckets).toEqual([{ bucketKey: "2026-03-10", totalCostCents: 3, eventCount: 2 }]);
  });

  it("flags reconciliation when rollup and sum(agent spent) diverge (single UTC month)", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...testCaps] });
    harness.seed({
      agents: [
        seedAgent({
          id: "agent-high-spend",
          companyId,
          name: "Spender",
          urlKey: "spender",
          spentMonthlyCents: 10_000,
          budgetMonthlyCents: 50_000,
        }),
      ],
    });
    await plugin.definition.setup(harness.ctx);

    const from = "2026-04-01T00:00:00.000Z";
    const to = "2026-04-30T23:59:59.999Z";

    await harness.emit(
      "cost_event.created",
      { costCents: 100, occurredAt: "2026-04-10T12:00:00.000Z" },
      { companyId, eventId: "cost-mismatch-1" },
    );

    const dash = await harness.getData<{ reconciliation: { mismatchWarning: string | null } }>("companyKpiDashboard", {
      companyId,
      rangeFrom: from,
      rangeTo: to,
    });
    expect(dash.reconciliation.mismatchWarning).not.toBeNull();
    expect(dash.reconciliation.mismatchWarning).toMatch(/Mismatch for/);
  });

  it("persists display currency via setCompanyKpiDisplayCurrency", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...testCaps] });
    harness.seed({ agents: [] });
    await plugin.definition.setup(harness.ctx);

    const dash0 = await harness.getData<{ displayCurrency: string }>("companyKpiDashboard", { companyId });
    expect(dash0.displayCurrency).toBe("USD");

    await harness.performAction("setCompanyKpiDisplayCurrency", { companyId, currencyCode: "eur" });
    const stored = harness.getState(companyStateKey(companyId, DISPLAY_CURRENCY_KEY));
    expect(stored).toBe("EUR");

    const dash1 = await harness.getData<{ displayCurrency: string }>("companyKpiDashboard", { companyId });
    expect(dash1.displayCurrency).toBe("EUR");
  });

  it("adds and deletes manual ledger entries", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...testCaps] });
    await plugin.definition.setup(harness.ctx);

    const entry = {
      id: "manual-1",
      kind: "expense" as const,
      amountCents: 1500,
      currency: "USD",
      label: "Coffee",
      occurredAt: "2026-03-05T00:00:00.000Z",
      createdAt: "2026-03-05T00:00:00.000Z",
    };

    await harness.performAction("addManualLedgerEntry", { companyId, entry });
    const stored = harness.getState(companyStateKey(companyId, MANUAL_LEDGER_KEY)) as unknown[];
    expect(stored).toHaveLength(1);

    await harness.performAction("deleteManualLedgerEntry", { companyId, id: "manual-1" });
    const after = harness.getState(companyStateKey(companyId, MANUAL_LEDGER_KEY)) as unknown[];
    expect(after).toHaveLength(0);
  });

  it("rebuildCostRollupMonth clears a month bucket", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...testCaps] });
    await plugin.definition.setup(harness.ctx);

    await harness.emit(
      "cost_event.created",
      { costCents: 10, occurredAt: "2026-02-01T00:00:00.000Z" },
      { companyId, eventId: "e1" },
    );

    await harness.performAction("rebuildCostRollupMonth", { companyId, yearMonth: "2026-02" });
    const rollup = harness.getState(companyStateKey(companyId, `${COST_ROLLUP_KEY_PREFIX}2026-02`)) as {
      totalCostCents: number;
    };
    expect(rollup.totalCostCents).toBe(0);
  });

  it("exposes health data", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...testCaps] });
    await plugin.definition.setup(harness.ctx);
    const h = await harness.getData<{ status: string }>("health", {});
    expect(h.status).toBe("ok");
  });

  it("upserts and deletes executive KPI targets and returns them on dashboard", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...testCaps] });
    await plugin.definition.setup(harness.ctx);

    const now = "2026-03-29T12:00:00.000Z";
    const target = {
      id: "exec-1",
      ownerLabel: "CTO",
      ownerRoleTag: "cto" as const,
      kpiLabel: "Issues closed / week",
      targetValue: 10,
      unit: "count" as const,
      periodLabel: "2026-03",
      actualValue: 7,
      createdAt: now,
      updatedAt: now,
    };

    await harness.performAction("upsertExecutiveKpiTarget", { companyId, target });

    const dash = await harness.getData<{ executiveTargets: { id: string; kpiLabel: string }[] }>("companyKpiDashboard", {
      companyId,
    });
    expect(dash.executiveTargets).toHaveLength(1);
    expect(dash.executiveTargets[0].kpiLabel).toBe("Issues closed / week");

    await harness.performAction("deleteExecutiveKpiTarget", { companyId, id: "exec-1" });
    const stored = harness.getState(companyStateKey(companyId, EXECUTIVE_KPI_TARGETS_KEY)) as unknown[];
    expect(stored).toHaveLength(0);
  });
});
