// Domain Types
export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

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
  photo_url_2: string | null;
  needs_reprint: boolean;
  is_direct_shipment: boolean;
  is_fragile: boolean;
  shipment_code: string | null;
  created_at: string;
  updated_at: string;
}

// Extended box detail with pallet and shipment info
export interface BoxWithPalletAndShipment extends Box {
  department: Department;
  lines: BoxLine[];
  pallet_info?: {
    code: string;
    name: string;
  } | null;
  shipment_info?: {
    code: string;
    name_or_plate: string;
  } | null;
}

export interface BoxLine {
  id: string;
  box_id: string;
  product_name: string;
  qty: number;
  kind: string | null;
  created_at: string;
}

// View Models
export interface BoxWithDepartment extends Box {
  department: {
    id: string;
    name: string;
  };
}

export interface BoxWithLines extends BoxWithDepartment {
  lines: BoxLine[];
}

export interface BoxDetail extends BoxWithLines {
  department: Department;
}

// Type alias for compatibility
export type BoxWithDetails = BoxDetail;

// Form Types
export interface CreateBoxData {
  name: string;
  department_id: string;
  is_direct_shipment?: boolean;
  is_fragile?: boolean;
}

export interface UpdateBoxData {
  name?: string;
  department_id?: string;
  status?: "draft" | "sealed";
  pallet_code?: string | null;
  photo_url?: string | null;
  photo_url_2?: string | null;
  needs_reprint?: boolean;
  is_direct_shipment?: boolean;
  is_fragile?: boolean;
  shipment_code?: string | null;
}

export interface CreateBoxLineData {
  product_name: string;
  qty: number;
  kind?: string;
}
