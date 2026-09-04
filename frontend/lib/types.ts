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
export type SuggestionCategory =
  | "five_s"
  | "sec"
  | "respect"
  | "sigma_green"
  | "sigma_black"
  | "kaizen"
  | "investment"
  | "reasonable"
  | "asakai_card"
  | "tnd"
  | "autonomous"
  | "rnd"
  | "innovation"
  | "poka_yoke"
  | "";

export interface Suggestion {
  id: number;
  title: string;
  description: string;
  category: SuggestionCategory;
  problem: string;
  solution: string;
  estimated_cost: string | null;
  cost_note: string;
  estimated_benefit: string | null;
  benefit_note: string;
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

export interface TenantUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "manager" | "member";
}

export interface Area {
  id: number;
  name: string;
  code: string;
  description: string;
  responsible: number | null;
  responsible_email: string | null;
  checklist_template: number | null;
  checklist_template_name: string | null;
  is_active: boolean;
  last_score: string | null;
  last_audit_date: string | null;
  created_at: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  category: string;
  order: number;
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  items: ChecklistItem[];
  created_at: string;
}

export type AuditStatus = "planned" | "completed";

export interface AuditAnswer {
  id: number;
  item: number;
  score: number;
  note: string;
}

export interface Audit {
  id: number;
  name: string;
  audit_type: "announced" | "unannounced";
  participants: number[];
  participant_emails: string[];
  notes: string;
  template: number;
  template_name: string;
  area: number;
  area_code: string;
  area_name: string;
  auditor: number | null;
  auditor_email: string | null;
  scheduled_date: string;
  status: AuditStatus;
  completed_at: string | null;
  score_percent: string | null;
  answers: AuditAnswer[];
  findings_count: number;
  created_at: string;
}

export type FindingStatus = "open" | "closed";

export interface Finding {
  id: number;
  title: string;
  description: string;
  audit: number | null;
  area: number | null;
  area_code: string | null;
  photo: string | null;
  status: FindingStatus;
  created_by_email: string | null;
  created_at: string;
}

export type ActionStatus = "open" | "in_progress" | "done";

export interface Action {
  id: number;
  title: string;
  description: string;
  assignee: number | null;
  assignee_email: string | null;
  due_date: string | null;
  status: ActionStatus;
  finding: number | null;
  finding_title: string | null;
  suggestion: number | null;
  suggestion_title: string | null;
  project: number | null;
  project_title: string | null;
  asakai_item: number | null;
  asakai_item_description: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyWork {
  actions: Action[];
  audits: Audit[];
  suggestions: Suggestion[];
  projects: ImprovementProject[];
  suggestions_to_evaluate?: Suggestion[];
}

export interface AsakaiMeeting {
  id: number;
  title: string;
  area: number | null;
  area_code: string | null;
  area_name: string | null;
  held_at: string;
  participant_count: number;
  notes: string;
  created_by: number | null;
  created_by_email: string | null;
  items_count: number;
  open_items_count: number;
  created_at: string;
}

export interface AsakaiItem {
  id: number;
  meeting: number;
  meeting_title: string;
  description: string;
  status: "open" | "done";
  created_by_email: string | null;
  action_ids: number[];
  created_at: string;
}

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  link: string;
  kind: "info" | "warning";
  read: boolean;
  created_at: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
