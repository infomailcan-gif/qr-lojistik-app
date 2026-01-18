// Domain Types
import type { Department } from './department';

export type { Department };

export interface Box {
  id: string;
  code: string;
  name: string;
  department_id: string;
  created_by: string;
  status: "draft" | "sealed";
  revision: number;
  pallet_code: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoxLine {
  id: string;
  box_id: string;
  product_name: string;
  qty: number;
  kind: string;
  created_at: string;
}

// View Models (with joined data)
export interface BoxWithDepartment extends Box {
  department: Department;
}

export interface BoxWithDetails extends BoxWithDepartment {
  lines: BoxLine[];
}

// Form Types
export interface CreateBoxData {
  name: string;
  department_id: string;
}

export interface CreateBoxLineData {
  product_name: string;
  qty: number;
  kind: string;
}

export interface UpdateBoxData {
  name?: string;
  department_id?: string;
  status?: "draft" | "sealed";
  photo_url?: string | null;
}
