export type ProcessStatus = "draft" | "published" | "archived";

export interface ProcessNode {
  id: number;
  name: string;
  code: string;
  status: ProcessStatus;
  version: number;
  owner: number | null;
  children: ProcessNode[];
}

export interface Process {
  id: number;
  name: string;
  code: string;
  parent: number | null;
  owner: number | null;
  owner_detail: { id: number; email: string; first_name: string; last_name: string } | null;
  status: ProcessStatus;
  version: number;
  purpose: string;
  suppliers: string;
  inputs: string;
  steps: string;
  outputs: string;
  customers: string;
  children_count: number;
  created_at: string;
  updated_at: string;
}

export type KpiStatus = "green" | "yellow" | "red" | "gray";
export type KpiDirection = "higher" | "lower";

export interface TrendPoint {
  period: string;
  value: string;
}

export interface Kpi {
  id: number;
  name: string;
  description: string;
  unit: string;
  direction: KpiDirection;
  frequency: "daily" | "weekly" | "monthly";
  process: number | null;
  process_code: string | null;
  owner: number | null;
  target: string | null;
  tolerance_percent: number;
  is_active: boolean;
  latest_value: string | null;
  latest_period: string | null;
  status: KpiStatus;
  trend: TrendPoint[];
  created_at: string;
  updated_at: string;
}

export interface KpiMeasurement {
  id: number;
  period: string;
  value: string;
  note: string;
  created_by: number | null;
  updated_at: string;
}

export interface KpiTemplate {
  key: string;
  name: string;
  unit: string;
  direction: KpiDirection;
  frequency: "daily" | "weekly" | "monthly";
  description: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
