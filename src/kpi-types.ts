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

export type DashboardPayload = {
  ok: true;
  companyId: string;
  range: { from: string; to: string };
  displayCurrency: string;
  costRollups: Array<{ yearMonth: string; rollup: CostRollupMonthV1 }>;
  manualEntries: ManualLedgerEntryV1[];
  totals: {
    costFromRollupsCents: number;
    manualIncomeCents: number;
    manualExpenseCents: number;
  };
};
