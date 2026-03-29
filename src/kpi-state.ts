import type { PluginStateClient } from "@paperclipai/plugin-sdk";
import type { CostRollupMonthV1, ExecutiveKpiTargetV1, ManualLedgerEntryV1 } from "./kpi-types.js";

export const MANUAL_LEDGER_KEY = "manual_ledger_v1";
export const EXECUTIVE_KPI_TARGETS_KEY = "executive_kpi_targets_v1";
export const COST_ROLLUP_INDEX_KEY = "cost_rollup_index_v1";
export const COST_ROLLUP_DAY_INDEX_KEY = "cost_rollup_day_index_v1";
export const COST_ROLLUP_HOUR_INDEX_KEY = "cost_rollup_hour_index_v1";
export const DISPLAY_CURRENCY_KEY = "display_currency_v1";
export const COST_ROLLUP_KEY_PREFIX = "cost_rollup_v1:";
export const COST_ROLLUP_DAY_KEY_PREFIX = "cost_rollup_day_v1:";
export const COST_ROLLUP_HOUR_KEY_PREFIX = "cost_rollup_hour_v1:";

/** Inclusive range span ≤ this many UTC days → dashboard hour buckets; else day buckets. */
export const DASHBOARD_HOUR_BREAKDOWN_MAX_DAYS = 7;

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

export function utcDayFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "1970-01-01";
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** UTC hour bucket id, e.g. `2026-03-10T14`. */
export function utcHourKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "1970-01-01T00";
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}`;
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

export async function readExecutiveKpiTargets(
  state: PluginStateClient,
  companyId: string,
): Promise<ExecutiveKpiTargetV1[]> {
  const raw = await state.get(companyStateKey(companyId, EXECUTIVE_KPI_TARGETS_KEY));
  if (!Array.isArray(raw)) return [];
  return raw as ExecutiveKpiTargetV1[];
}

export async function writeExecutiveKpiTargets(
  state: PluginStateClient,
  companyId: string,
  targets: ExecutiveKpiTargetV1[],
): Promise<void> {
  await state.set(companyStateKey(companyId, EXECUTIVE_KPI_TARGETS_KEY), targets);
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

export async function readRollupDayIndex(state: PluginStateClient, companyId: string): Promise<string[]> {
  const raw = await state.get(companyStateKey(companyId, COST_ROLLUP_DAY_INDEX_KEY));
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter((x): x is string => typeof x === "string");
}

export async function addRollupDayToIndex(
  state: PluginStateClient,
  companyId: string,
  utcDay: string,
): Promise<void> {
  const idx = await readRollupDayIndex(state, companyId);
  if (!idx.includes(utcDay)) {
    idx.push(utcDay);
    idx.sort();
    await state.set(companyStateKey(companyId, COST_ROLLUP_DAY_INDEX_KEY), idx);
  }
}

export async function readRollupHourIndex(state: PluginStateClient, companyId: string): Promise<string[]> {
  const raw = await state.get(companyStateKey(companyId, COST_ROLLUP_HOUR_INDEX_KEY));
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[]).filter((x): x is string => typeof x === "string");
}

export async function addRollupHourToIndex(
  state: PluginStateClient,
  companyId: string,
  hourKey: string,
): Promise<void> {
  const idx = await readRollupHourIndex(state, companyId);
  if (!idx.includes(hourKey)) {
    idx.push(hourKey);
    idx.sort();
    await state.set(companyStateKey(companyId, COST_ROLLUP_HOUR_INDEX_KEY), idx);
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

export async function readDayRollup(
  state: PluginStateClient,
  companyId: string,
  utcDay: string,
): Promise<CostRollupMonthV1> {
  const raw = await state.get(companyStateKey(companyId, `${COST_ROLLUP_DAY_KEY_PREFIX}${utcDay}`));
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

export async function writeDayRollup(
  state: PluginStateClient,
  companyId: string,
  utcDay: string,
  rollup: CostRollupMonthV1,
): Promise<void> {
  await state.set(companyStateKey(companyId, `${COST_ROLLUP_DAY_KEY_PREFIX}${utcDay}`), rollup);
}

export async function readHourRollup(
  state: PluginStateClient,
  companyId: string,
  hourKey: string,
): Promise<CostRollupMonthV1> {
  const raw = await state.get(companyStateKey(companyId, `${COST_ROLLUP_HOUR_KEY_PREFIX}${hourKey}`));
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

export async function writeHourRollup(
  state: PluginStateClient,
  companyId: string,
  hourKey: string,
  rollup: CostRollupMonthV1,
): Promise<void> {
  await state.set(companyStateKey(companyId, `${COST_ROLLUP_HOUR_KEY_PREFIX}${hourKey}`), rollup);
}

export function dayStartUtcMs(utcDay: string): number {
  const [y, m, d] = utcDay.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

export function dayEndUtcMs(utcDay: string): number {
  const [y, m, d] = utcDay.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
}

export function dayRollupInRange(utcDay: string, fromIso: string, toIso: string): boolean {
  const startRange = new Date(fromIso).getTime();
  const endRange = new Date(toIso).getTime();
  const ds = dayStartUtcMs(utcDay);
  const de = dayEndUtcMs(utcDay);
  return ds <= endRange && de >= startRange;
}

export function hourRollupInRange(hourKey: string, fromIso: string, toIso: string): boolean {
  const startRange = new Date(fromIso).getTime();
  const endRange = new Date(toIso).getTime();
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})$/.exec(hourKey);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const hourStart = Date.UTC(y, mo - 1, d, h, 0, 0, 0);
  const hourEnd = Date.UTC(y, mo - 1, d, h, 59, 59, 999);
  return hourStart <= endRange && hourEnd >= startRange;
}

export function rangeSpanUtcDays(fromIso: string, toIso: string): number {
  const fromMs = new Date(fromIso).getTime();
  const toMs = new Date(toIso).getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) return Infinity;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return (toMs - fromMs) / MS_PER_DAY;
}

export function rollupInRange(yearMonth: string, fromIso: string, toIso: string): boolean {
  const startRange = new Date(fromIso).getTime();
  const endRange = new Date(toIso).getTime();
  const monthStart = monthStartUtc(yearMonth).getTime();
  const monthEnd = monthEndUtcMs(yearMonth);
  return monthStart <= endRange && monthEnd >= startRange;
}

/** If range endpoints fall in the same UTC calendar month, return `YYYY-MM` for rollup ↔ agents.spent comparison. */
export function comparableUtcMonthForRange(fromIso: string, toIso: string): string | null {
  const a = yearMonthFromIso(fromIso);
  const b = yearMonthFromIso(toIso);
  return a === b ? a : null;
}
