import { definePlugin, runWorker, type PluginEvent } from "@paperclipai/plugin-sdk";
import type { DashboardPayload, ManualLedgerEntryV1 } from "./kpi-types.js";
import {
  DISPLAY_CURRENCY_KEY,
  addRollupMonthToIndex,
  companyStateKey,
  emptyRollup,
  parseRange,
  readManualLedger,
  readMonthRollup,
  readRollupIndex,
  writeManualLedger,
  writeMonthRollup,
  yearMonthFromIso,
  rollupInRange,
} from "./kpi-state.js";

function readCostFromPayload(payload: unknown): {
  costCents: number;
  occurredAt: string;
} | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const costRaw = p.costCents;
  const costCents = typeof costRaw === "number" && Number.isFinite(costRaw) ? costRaw : null;
  if (costCents === null) return null;
  const occurred = p.occurredAt;
  if (occurred instanceof Date) {
    return { costCents, occurredAt: occurred.toISOString() };
  }
  if (typeof occurred === "string") {
    return { costCents, occurredAt: occurred };
  }
  return null;
}

function isManualEntry(x: unknown): x is ManualLedgerEntryV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    (o.kind === "income" || o.kind === "expense") &&
    typeof o.amountCents === "number" &&
    typeof o.currency === "string" &&
    typeof o.label === "string" &&
    typeof o.occurredAt === "string" &&
    typeof o.createdAt === "string"
  );
}

const plugin = definePlugin({
  async setup(ctx) {
    ctx.events.on("cost_event.created", async (event: PluginEvent) => {
      const companyId = event.companyId;
      const parsed = readCostFromPayload(event.payload);
      if (!parsed) {
        ctx.logger.warn("cost_event.created: skip, bad payload", { eventId: event.eventId });
        return;
      }
      const yearMonth = yearMonthFromIso(parsed.occurredAt);
      await addRollupMonthToIndex(ctx.state, companyId, yearMonth);
      const rollup = await readMonthRollup(ctx.state, companyId, yearMonth);
      if (rollup.appliedPluginEventIds.includes(event.eventId)) {
        return;
      }
      rollup.totalCostCents += parsed.costCents;
      rollup.eventCount += 1;
      rollup.lastOccurredAt = parsed.occurredAt;
      rollup.appliedPluginEventIds.push(event.eventId);
      await writeMonthRollup(ctx.state, companyId, yearMonth, rollup);
      await ctx.state.set(companyStateKey(companyId, "last_cost_sync_v1"), new Date().toISOString());
    });

    ctx.data.register("companyKpiDashboard", async (params) => {
      const companyId = typeof params.companyId === "string" ? params.companyId : "";
      if (!companyId) {
        return { ok: false as const, error: "companyId is required" };
      }
      const range = parseRange({
        rangeFrom: typeof params.rangeFrom === "string" ? params.rangeFrom : undefined,
        rangeTo: typeof params.rangeTo === "string" ? params.rangeTo : undefined,
      });
      const displayRaw = await ctx.state.get(companyStateKey(companyId, DISPLAY_CURRENCY_KEY));
      const displayCurrency = typeof displayRaw === "string" && displayRaw ? displayRaw : "USD";

      const months = await readRollupIndex(ctx.state, companyId);
      const costRollups = [];
      let costFromRollupsCents = 0;
      for (const ym of months) {
        if (!rollupInRange(ym, range.from, range.to)) continue;
        const rollup = await readMonthRollup(ctx.state, companyId, ym);
        costRollups.push({ yearMonth: ym, rollup });
        costFromRollupsCents += rollup.totalCostCents;
      }

      const manualAll = await readManualLedger(ctx.state, companyId);
      const fromMs = new Date(range.from).getTime();
      const toMs = new Date(range.to).getTime();
      const manualEntries = manualAll.filter((e) => {
        const t = new Date(e.occurredAt).getTime();
        return t >= fromMs && t <= toMs;
      });

      let manualIncomeCents = 0;
      let manualExpenseCents = 0;
      for (const e of manualEntries) {
        if (e.kind === "income") manualIncomeCents += e.amountCents;
        else manualExpenseCents += e.amountCents;
      }

      const body: DashboardPayload = {
        ok: true,
        companyId,
        range,
        displayCurrency,
        costRollups,
        manualEntries,
        totals: {
          costFromRollupsCents,
          manualIncomeCents,
          manualExpenseCents,
        },
      };
      return body;
    });

    ctx.actions.register("addManualLedgerEntry", async (params) => {
      const companyId = typeof params.companyId === "string" ? params.companyId : "";
      if (!companyId) throw new Error("companyId is required");
      const entryRaw = params.entry;
      if (!isManualEntry(entryRaw)) {
        throw new Error("entry must be a valid ManualLedgerEntryV1");
      }
      if (entryRaw.amountCents <= 0) {
        throw new Error("amountCents must be positive");
      }
      const list = await readManualLedger(ctx.state, companyId);
      if (list.some((e) => e.id === entryRaw.id)) {
        return { ok: true as const, deduped: true };
      }
      list.push(entryRaw);
      list.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
      await writeManualLedger(ctx.state, companyId, list);
      return { ok: true as const, deduped: false };
    });

    ctx.actions.register("deleteManualLedgerEntry", async (params) => {
      const companyId = typeof params.companyId === "string" ? params.companyId : "";
      const id = typeof params.id === "string" ? params.id : "";
      if (!companyId || !id) throw new Error("companyId and id are required");
      const list = await readManualLedger(ctx.state, companyId);
      const next = list.filter((e) => e.id !== id);
      if (next.length === list.length) {
        return { ok: false as const, reason: "not_found" };
      }
      await writeManualLedger(ctx.state, companyId, next);
      return { ok: true as const };
    });

    ctx.actions.register("rebuildCostRollupMonth", async (params) => {
      const companyId = typeof params.companyId === "string" ? params.companyId : "";
      const yearMonth = typeof params.yearMonth === "string" ? params.yearMonth : "";
      if (!companyId || !/^\d{4}-\d{2}$/.test(yearMonth)) {
        throw new Error("companyId and yearMonth (YYYY-MM) are required");
      }
      await writeMonthRollup(ctx.state, companyId, yearMonth, emptyRollup());
      return { ok: true as const, yearMonth };
    });

    ctx.data.register("health", async () => {
      return { status: "ok" as const, checkedAt: new Date().toISOString() };
    });
  },

  async onHealth() {
    return { status: "ok" as const, message: "Company KPI worker" };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
