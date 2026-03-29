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

export type CostRollupMonthV1 = {
  totalCostCents: number;
  eventCount: number;
  lastOccurredAt: string | null;
  appliedPluginEventIds: string[];
};

export type DashboardParams = {
  companyId?: string;
  rangeFrom?: string;
  rangeTo?: string;
};

export type ExecutiveKpiOwnerRoleTag = "cto" | "cmo" | "cfo" | "coo" | "ceo" | "other";

/** Цель для C-level (или другой роли), задаваемая CEO/board; actual в MVP вручную. */
export type ExecutiveKpiTargetV1 = {
  id: string;
  /** Отображаемое имя владельца, напр. «CTO», «CMO — контент». */
  ownerLabel: string;
  ownerRoleTag?: ExecutiveKpiOwnerRoleTag;
  kpiLabel: string;
  targetValue: number;
  unit: "count" | "cents" | "percent" | "days" | "score";
  /** Период: YYYY-MM или произвольная метка (Q2-2026). */
  periodLabel: string;
  actualValue?: number | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardPayload = {
  ok: true;
  companyId: string;
  range: { from: string; to: string };
  displayCurrency: string;
  costRollups: Array<{ yearMonth: string; rollup: CostRollupMonthV1 }>;
  manualEntries: ManualLedgerEntryV1[];
  executiveTargets: ExecutiveKpiTargetV1[];
  totals: {
    costFromRollupsCents: number;
    manualIncomeCents: number;
    manualExpenseCents: number;
  };
};
