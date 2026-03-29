import type { PluginStateClient } from "@paperclipai/plugin-sdk";
import type { CostRollupMonthV1, ManualLedgerEntryV1 } from "./kpi-types.js";

export const MANUAL_LEDGER_KEY = "manual_ledger_v1";
export const COST_ROLLUP_INDEX_KEY = "cost_rollup_index_v1";
export const DISPLAY_CURRENCY_KEY = "display_currency_v1";
export const COST_ROLLUP_KEY_PREFIX = "cost_rollup_v1:";

export function companyStateKey(companyId: string, stateKey: string) {
  return { scopeKind: "company" as const, scopeId: companyId, stateKey };
}

export function yearMonthFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "1970-01";
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthStartUtc(yearMonth: string): Date {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, 1, 0, 0, 0, 0));
}

/** Inclusive end instant of calendar month `yyyy-mm` (UTC). */
export function monthEndUtcMs(yearMonth: string): number {
  const [y, mo] = yearMonth.split("-").map(Number);
  return Date.UTC(y, mo, 0, 23, 59, 59, 999);
}

export function defaultDashboardRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { from: start.toISOString(), to: end.toISOString() };
}

export function parseRange(params: { rangeFrom?: string; rangeTo?: string }): { from: string; to: string } {
  if (params.rangeFrom && params.rangeTo) {
    return { from: params.rangeFrom, to: params.rangeTo };
  }
  return defaultDashboardRange();
}

export async function readManualLedger(state: PluginStateClient, companyId: string): Promise<ManualLedgerEntryV1[]> {
  const raw = await state.get(companyStateKey(companyId, MANUAL_LEDGER_KEY));
  if (!Array.isArray(raw)) return [];
  return raw as ManualLedgerEntryV1[];
}

export async function writeManualLedger(
  state: PluginStateClient,
  companyId: string,
  entries: ManualLedgerEntryV1[],
): Promise<void> {
  await state.set(companyStateKey(companyId, MANUAL_LEDGER_KEY), entries);
}

export async function readRollupIndex(state: PluginStateClient, companyId: string): Promise<string[]> {
  const raw = await state.get(companyStateKey(companyId, COST_ROLLUP_INDEX_KEY));
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter((x): x is string => typeof x === "string");
}

export async function addRollupMonthToIndex(
  state: PluginStateClient,
  companyId: string,
  yearMonth: string,
): Promise<void> {
  const idx = await readRollupIndex(state, companyId);
  if (!idx.includes(yearMonth)) {
    idx.push(yearMonth);
    idx.sort();
    await state.set(companyStateKey(companyId, COST_ROLLUP_INDEX_KEY), idx);
  }
}

export async function readMonthRollup(
  state: PluginStateClient,
  companyId: string,
  yearMonth: string,
): Promise<CostRollupMonthV1> {
  const raw = await state.get(companyStateKey(companyId, `${COST_ROLLUP_KEY_PREFIX}${yearMonth}`));
  if (!raw || typeof raw !== "object") {
    return emptyRollup();
  }
  const o = raw as Record<string, unknown>;
  return {
    totalCostCents: typeof o.totalCostCents === "number" ? o.totalCostCents : 0,
    eventCount: typeof o.eventCount === "number" ? o.eventCount : 0,
    lastOccurredAt: typeof o.lastOccurredAt === "string" ? o.lastOccurredAt : null,
    appliedPluginEventIds: Array.isArray(o.appliedPluginEventIds)
      ? (o.appliedPluginEventIds as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
  };
}

export function emptyRollup(): CostRollupMonthV1 {
  return {
    totalCostCents: 0,
    eventCount: 0,
    lastOccurredAt: null,
    appliedPluginEventIds: [],
  };
}

export async function writeMonthRollup(
  state: PluginStateClient,
  companyId: string,
  yearMonth: string,
  rollup: CostRollupMonthV1,
): Promise<void> {
  await state.set(companyStateKey(companyId, `${COST_ROLLUP_KEY_PREFIX}${yearMonth}`), rollup);
}

export function rollupInRange(yearMonth: string, fromIso: string, toIso: string): boolean {
  const startRange = new Date(fromIso).getTime();
  const endRange = new Date(toIso).getTime();
  const monthStart = monthStartUtc(yearMonth).getTime();
  const monthEnd = monthEndUtcMs(yearMonth);
  return monthStart <= endRange && monthEnd >= startRange;
}
