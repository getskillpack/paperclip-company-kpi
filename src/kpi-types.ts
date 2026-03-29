export type ManualLedgerKind = "income" | "expense";

export type ManualLedgerEntryV1 = {
  id: string;
  kind: ManualLedgerKind;
  amountCents: number;
  currency: string;
  label: string;
  occurredAt: string;
  createdAt: string;
  createdByHint?: string;
};

/** Monthly / daily / hourly bucket: idempotent append via `appliedPluginEventIds`. */
export type CostRollupMonthV1 = {
  totalCostCents: number;
  eventCount: number;
  lastOccurredAt: string | null;
  appliedPluginEventIds: string[];
};

export type CostRollupDayV1 = CostRollupMonthV1;
export type CostRollupHourV1 = CostRollupMonthV1;

/**
 * External-only: query shape for the `companyKpiDashboard` data provider (hosts, deep links).
 * Not referenced inside this package; kept as a stable integrator contract.
 */
export type DashboardParams = {
  companyId?: string;
  rangeFrom?: string;
  rangeTo?: string;
};

export type ExecutiveKpiOwnerRoleTag = "cto" | "cmo" | "cfo" | "coo" | "ceo" | "other";

/** C-level (or other role) target set by CEO/board; MVP uses a manual actual. */
export type ExecutiveKpiTargetV1 = {
  id: string;
  /** Display name for the owner, e.g. "CTO", "CMO — content". */
  ownerLabel: string;
  ownerRoleTag?: ExecutiveKpiOwnerRoleTag;
  kpiLabel: string;
  targetValue: number;
  unit: "count" | "cents" | "percent" | "days" | "score";
  /** Period: YYYY-MM or an arbitrary label (e.g. Q2-2026). */
  periodLabel: string;
  actualValue?: number | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

/** Per-agent budget/spend snapshot from the host API (current billing month of the instance). */
export type AgentBudgetSnapshotV1 = {
  agentId: string;
  name: string;
  urlKey: string;
  status: string;
  budgetMonthlyCents: number;
  spentMonthlyCents: number;
};

/**
 * Compares the sum of agents' `spentMonthlyCents` with cost_event rollup for one UTC calendar month.
 * See docs/IMPLEMENTATION_PLAN.md — phase C (assumptions).
 */
export type RollupAgentsReconciliationV1 = {
  comparableMonth: string | null;
  rollupTotalCents: number | null;
  agentsSpentSumCents: number;
  deltaCents: number | null;
  mismatchWarning: string | null;
};

export type CostFineGranularity = "hour" | "day";

export type CostFineBucketV1 = {
  /** UTC day `YYYY-MM-DD` or hour `YYYY-MM-DDTHH`. */
  bucketKey: string;
  totalCostCents: number;
  eventCount: number;
};

export type DashboardPayload = {
  ok: true;
  companyId: string;
  range: { from: string; to: string };
  displayCurrency: string;
  costRollups: Array<{ yearMonth: string; rollup: CostRollupMonthV1 }>;
  /** Range span ≤ 7 UTC days → hour buckets; otherwise day buckets. */
  costFineGranularity: CostFineGranularity;
  costFineBuckets: CostFineBucketV1[];
  manualEntries: ManualLedgerEntryV1[];
  executiveTargets: ExecutiveKpiTargetV1[];
  agentBudgetRows: AgentBudgetSnapshotV1[];
  reconciliation: RollupAgentsReconciliationV1;
  totals: {
    costFromRollupsCents: number;
    manualIncomeCents: number;
    manualExpenseCents: number;
  };
};
