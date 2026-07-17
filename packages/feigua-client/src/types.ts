export interface FeiguaAccount {
  /** Feigua internal id (used as entity_id in DB) */
  id: string;
  douyin_name: string;
  dept: string;
  person: string;
  status: "live" | "warn" | "dead";
  plays_inc: number;
  like_count: number;
  fans_total: number;
  fans_inc: number;
  works_total: number;
  rate: number;
}

export interface FeiguaPayload {
  capturedAt: string;
  source: "feigua";
  accounts: FeiguaAccount[];
}