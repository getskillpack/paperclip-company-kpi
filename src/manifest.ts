import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "getskillpack.paperclip-company-kpi",
  apiVersion: 1,
  version: "0.3.3",
  displayName: "Company KPI",
  description: "Cost event rollups and a manual company income/expense ledger.",
  author: "getskillpack",
  categories: ["ui"],
  capabilities: ["events.subscribe", "plugin.state.read", "plugin.state.write", "agents.read"],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "company-kpi-dashboard",
        displayName: "Company KPI",
        exportName: "DashboardWidget",
      },
    ],
  },
};

export default manifest;
