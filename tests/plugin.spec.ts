import { describe, expect, it } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";
import { COST_ROLLUP_KEY_PREFIX, COST_ROLLUP_INDEX_KEY, MANUAL_LEDGER_KEY, companyStateKey } from "../src/kpi-state.js";

const companyId = "11111111-1111-1111-1111-111111111111";

describe("company-kpi plugin", () => {
  it("aggregates cost_event.created into monthly rollup (idempotent by plugin event id)", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities, "events.emit"] });
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
    const rollup = harness.getState(companyStateKey(companyId, `${COST_ROLLUP_KEY_PREFIX}2026-03`)) as {
      totalCostCents: number;
      eventCount: number;
    };
    expect(rollup.totalCostCents).toBe(42);
    expect(rollup.eventCount).toBe(1);
  });

  it("adds and deletes manual ledger entries", async () => {
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities, "events.emit"] });
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
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities, "events.emit"] });
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
    const harness = createTestHarness({ manifest, capabilities: [...manifest.capabilities, "events.emit"] });
    await plugin.definition.setup(harness.ctx);
    const h = await harness.getData<{ status: string }>("health", {});
    expect(h.status).toBe("ok");
  });
});
