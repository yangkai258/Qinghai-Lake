export type AccStatus = "live" | "warn" | "dead";

export interface DouyinAccountRow {
  accountName: string;
  douyinName?: string | null;
  dept?: string | null;
  person?: string | null;
  status: AccStatus;
  playsInc: number;
  likeCount: number;
  fansTotal: number;
  fansInc: number;
  worksTotal: number;
  rate: number;
  capturedAt: string; // ISO
}

export interface ScreenMeta {
  totalAccounts: number;
  liveCount: number;
  warnCount: number;
  deadCount: number;
  capturedAt: string;
}

export interface Screen1Data { meta: ScreenMeta; rows: DouyinAccountRow[]; }
export interface Screen2Data { meta: ScreenMeta; rows: DouyinAccountRow[]; }
export interface Screen3Data { meta: ScreenMeta; rows: DouyinAccountRow[]; }
export interface Screen4Data { meta: ScreenMeta; rows: DouyinAccountRow[]; }
export interface Screen5Data { meta: ScreenMeta; rows: DouyinAccountRow[]; }
export interface Screen6Data { meta: ScreenMeta; rows: DouyinAccountRow[]; }

// KPI 6-tiles contract — every screen always renders 6 tiles.
export interface Kpi6 {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "flat";
  tone?: "default" | "good" | "warn" | "bad";
}