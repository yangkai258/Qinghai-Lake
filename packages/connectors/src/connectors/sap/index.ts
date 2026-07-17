import type { BaseConnector, SnapshotRecord } from "../../base/types.js";

/**
 * SAP connector — stub. Real impl deferred ~6 months while we focus on
 * the douyin data. If SAP_BASE_URL is set we hard-fail in validateConfig
 * (so a misconfigured source never silently produces empty data).
 */
export const sapConnector: BaseConnector = {
  kind: "sap",
  async validateConfig(config) {
    if (config.SAP_BASE_URL || process.env.SAP_BASE_URL) {
      throw new Error("sap connector is not implemented yet (~6mo ETA). unset SAP_BASE_URL or disable source.");
    }
  },
  async fetch() {
    return [];
  },
};