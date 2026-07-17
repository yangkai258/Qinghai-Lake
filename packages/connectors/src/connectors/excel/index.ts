import type { BaseConnector, SnapshotRecord } from "../../base/types.js";

/**
 * Excel connector — stub. A real impl would read .xlsx from EXCEL_INBOX
 * using a lib like `xlsx`/`exceljs` and emit the same SnapshotRecord
 * shape as feigua. Deferred until we have a real source.
 */
export const excelConnector: BaseConnector = {
  kind: "excel",
  async validateConfig() {
    // no-op
  },
  async fetch() {
    return [];
  },
};