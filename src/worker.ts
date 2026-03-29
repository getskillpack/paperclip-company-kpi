import { definePlugin, runWorker, type PluginEvent } from "@paperclipai/plugin-sdk";
import type {
  AgentBudgetSnapshotV1,
  CostFineBucketV1,
  CostFineGranularity,
  CostRollupMonthV1,
  DashboardPayload,
  ExecutiveKpiTargetV1,
  ManualLedgerEntryV1,
  RollupAgentsReconciliationV1,
} from "./kpi-types.js";
import {
  DISPLAY_CURRENCY_KEY,
  DASHBOARD_HOUR_BREAKDOWN_MAX_DAYS,
  addRollupDayToIndex,
  addRollupHourToIndex,
  addRollupMonthToIndex,
  comparableUtcMonthForRange,
  companyStateKey,
  dayRollupInRange,
  emptyRollup,
  hourRollupInRange,
  parseRange,
  readDayRollup,
  readExecutiveKpiTargets,
  readHourRollup,
  readManualLedger,
  readMonthRollup,
  readRollupDayIndex,
  readRollupHourIndex,
  readRollupIndex,
  rangeSpanUtcDays,
  rollupInRange,
  utcDayFromIso,
  utcHourKeyFromIso,
  writeDayRollup,
  writeExecutiveKpiTargets,
  writeHourRollup,
  writeManualLedger,
  writeMonthRollup,
  yearMonthFromIso,
} from "./kpi-state.js";

function reconcileRollupVsAgentsSpend(
  comparableMonth: string | null,
  costRollups: Array<{ yearMonth: string; rollup: CostRollupMonthV1 }>,
  agentsSpentSumCents: number,
): RollupAgentsReconciliationV1 {
  if (!comparableMonth) {
    return {
      comparableMonth: null,
      rollupTotalCents: null,
      agentsSpentSumCents,
      deltaCents: null,
      mismatchWarning: null,
    };
  }
  const row = costRollups.find((r) => r.yearMonth === comparableMonth);
  const rollupTotal = row?.rollup.totalCostCents ?? 0;
  const deltaCents = rollupTotal - agentsSpentSumCents;
  const basis = Math.max(rollupTotal, agentsSpentSumCents, 1);
  const tolerance = Math.max(1, Math.round(0.01 * basis));
  const mismatchWarning =
    Math.abs(deltaCents) > tolerance
      ? `Mismatch for ${comparableMonth}: cost_event rollup = ${rollupTotal} ¢, sum of agents’ spentMonthlyCents = ${agentsSpentSumCents} ¢ (Δ ${deltaCents} ¢, tolerance ${tolerance} ¢). Billing periods may differ, not all spend flows through cost_event, or sync may lag.`
      : null;
  return {
    comparableMonth,
    rollupTotalCents: rollupTotal,
    agentsSpentSumCents,
    deltaCents,
    mismatchWarning,
  };
}

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

const EXEC_OWNER_TAGS = new Set<string>(["cto", "cmo", "cfo", "coo", "ceo", "other"]);
const EXEC_UNITS = new Set<ExecutiveKpiTargetV1["unit"]>(["count", "cents", "percent", "days", "score"]);

function isExecutiveKpiTarget(x: unknown): x is ExecutiveKpiTargetV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return false;
  if (typeof o.ownerLabel !== "string" || !o.ownerLabel.trim()) return false;
  if (typeof o.kpiLabel !== "string" || !o.kpiLabel.trim()) return false;
  if (typeof o.targetValue !== "number" || !Number.isFinite(o.targetValue)) return false;
  if (typeof o.unit !== "string" || !EXEC_UNITS.has(o.unit as ExecutiveKpiTargetV1["unit"])) return false;
  if (typeof o.periodLabel !== "string" || !o.periodLabel.trim()) return false;
  if (typeof o.createdAt !== "string" || typeof o.updatedAt !== "string") return false;
  if (o.ownerRoleTag !== undefined && o.ownerRoleTag !== null) {
    if (typeof o.ownerRoleTag !== "string" || !EXEC_OWNER_TAGS.has(o.ownerRoleTag)) {
      return false;
    }
  }
  if (o.actualValue !== undefined && o.actualValue !== null && typeof o.actualValue !== "number") return false;
  if (o.notes !== undefined && o.notes !== null && typeof o.notes !== "string") return false;
  return true;
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
      const utcDay = utcDayFromIso(parsed.occurredAt);
      const hourKey = utcHourKeyFromIso(parsed.occurredAt);
      await addRollupMonthToIndex(ctx.state, companyId, yearMonth);
      await addRollupDayToIndex(ctx.state, companyId, utcDay);
      await addRollupHourToIndex(ctx.state, companyId, hourKey);
      const rollup = await readMonthRollup(ctx.state, companyId, yearMonth);
      if (rollup.appliedPluginEventIds.includes(event.eventId)) {
        return;
      }
      rollup.totalCostCents += parsed.costCents;
      rollup.eventCount += 1;
      rollup.lastOccurredAt = parsed.occurredAt;
      rollup.appliedPluginEventIds.push(event.eventId);
      await writeMonthRollup(ctx.state, companyId, yearMonth, rollup);

      const dayRollup = await readDayRollup(ctx.state, companyId, utcDay);
      dayRollup.totalCostCents += parsed.costCents;
      dayRollup.eventCount += 1;
      dayRollup.lastOccurredAt = parsed.occurredAt;
      dayRollup.appliedPluginEventIds.push(event.eventId);
      await writeDayRollup(ctx.state, companyId, utcDay, dayRollup);

      const hourRollup = await readHourRollup(ctx.state, companyId, hourKey);
      hourRollup.totalCostCents += parsed.costCents;
      hourRollup.eventCount += 1;
      hourRollup.lastOccurredAt = parsed.occurredAt;
      hourRollup.appliedPluginEventIds.push(event.eventId);
      await writeHourRollup(ctx.state, companyId, hourKey, hourRollup);

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

      const executiveTargets = await readExecutiveKpiTargets(ctx.state, companyId);
      executiveTargets.sort((a, b) => {
        const byOwner = a.ownerLabel.localeCompare(b.ownerLabel);
        if (byOwner !== 0) return byOwner;
        return a.periodLabel.localeCompare(b.periodLabel) || a.kpiLabel.localeCompare(b.kpiLabel);
      });

      const agents = await ctx.agents.list({ companyId });
      const agentBudgetRows: AgentBudgetSnapshotV1[] = agents
        .map((a) => ({
          agentId: a.id,
          name: a.name,
          urlKey: a.urlKey,
          status: a.status,
          budgetMonthlyCents: a.budgetMonthlyCents,
          spentMonthlyCents: a.spentMonthlyCents,
        }))
        .sort((x, y) => x.name.localeCompare(y.name));
      const agentsSpentSumCents = agentBudgetRows.reduce((s, r) => s + r.spentMonthlyCents, 0);
      const comparableMonth = comparableUtcMonthForRange(range.from, range.to);
      const reconciliation = reconcileRollupVsAgentsSpend(comparableMonth, costRollups, agentsSpentSumCents);

      const spanDays = rangeSpanUtcDays(range.from, range.to);
      const costFineGranularity: CostFineGranularity =
        spanDays <= DASHBOARD_HOUR_BREAKDOWN_MAX_DAYS ? "hour" : "day";
      const costFineBuckets: CostFineBucketV1[] = [];
      if (costFineGranularity === "hour") {
        const hours = await readRollupHourIndex(ctx.state, companyId);
        for (const hk of hours) {
          if (!hourRollupInRange(hk, range.from, range.to)) continue;
          const r = await readHourRollup(ctx.state, companyId, hk);
          if (r.eventCount === 0 && r.totalCostCents === 0) continue;
          costFineBuckets.push({
            bucketKey: hk,
            totalCostCents: r.totalCostCents,
            eventCount: r.eventCount,
          });
        }
      } else {
        const days = await readRollupDayIndex(ctx.state, companyId);
        for (const d of days) {
          if (!dayRollupInRange(d, range.from, range.to)) continue;
          const r = await readDayRollup(ctx.state, companyId, d);
          if (r.eventCount === 0 && r.totalCostCents === 0) continue;
          costFineBuckets.push({
            bucketKey: d,
            totalCostCents: r.totalCostCents,
            eventCount: r.eventCount,
          });
        }
      }

      const body: DashboardPayload = {
        ok: true,
        companyId,
        range,
        displayCurrency,
        costRollups,
        costFineGranularity,
        costFineBuckets,
        manualEntries,
        executiveTargets,
        agentBudgetRows,
        reconciliation,
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

    ctx.actions.register("upsertExecutiveKpiTarget", async (params) => {
      const companyId = typeof params.companyId === "string" ? params.companyId : "";
      const targetRaw = params.target;
      if (!companyId) throw new Error("companyId is required");
      if (!isExecutiveKpiTarget(targetRaw)) {
        throw new Error("target must be a valid ExecutiveKpiTargetV1");
      }
      const now = new Date().toISOString();
      const list = await readExecutiveKpiTargets(ctx.state, companyId);
      const idx = list.findIndex((t) => t.id === targetRaw.id);
      const merged: ExecutiveKpiTargetV1 =
        idx >= 0
          ? {
              ...targetRaw,
              createdAt: list[idx].createdAt,
              updatedAt: now,
            }
          : { ...targetRaw, createdAt: targetRaw.createdAt || now, updatedAt: now };
      if (idx >= 0) {
        list[idx] = merged;
      } else {
        list.push(merged);
      }
      await writeExecutiveKpiTargets(ctx.state, companyId, list);
      return { ok: true as const, id: merged.id };
    });

    ctx.actions.register("deleteExecutiveKpiTarget", async (params) => {
      const companyId = typeof params.companyId === "string" ? params.companyId : "";
      const id = typeof params.id === "string" ? params.id : "";
      if (!companyId || !id) throw new Error("companyId and id are required");
      const list = await readExecutiveKpiTargets(ctx.state, companyId);
      const next = list.filter((t) => t.id !== id);
      if (next.length === list.length) {
        return { ok: false as const, reason: "not_found" as const };
      }
      await writeExecutiveKpiTargets(ctx.state, companyId, next);
      return { ok: true as const };
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
