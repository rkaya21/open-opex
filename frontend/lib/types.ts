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

export type SuggestionStatus = "submitted" | "approved" | "rejected" | "implemented";

export interface Suggestion {
  id: number;
  title: string;
  description: string;
  process: number | null;
  process_code: string | null;
  submitted_by: number | null;
  submitted_by_detail: { id: number; email: string } | null;
  status: SuggestionStatus;
  evaluation_note: string;
  evaluated_by_detail: { id: number; email: string } | null;
  evaluated_at: string | null;
  implemented_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectPhase = "plan" | "do" | "check" | "act" | "done";

export interface ImprovementProject {
  id: number;
  title: string;
  description: string;
  process: number | null;
  process_code: string | null;
  kpi: number | null;
  kpi_name: string | null;
  suggestion: number | null;
  suggestion_title: string | null;
  lead: number | null;
  lead_detail: { id: number; email: string } | null;
  team: number[];
  phase: ProjectPhase;
  expected_benefit: string | null;
  realized_benefit: string | null;
  a3_background: string;
  a3_current_state: string;
  a3_goal: string;
  a3_root_cause: string;
  a3_countermeasures: string;
  a3_follow_up: string;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
