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

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
