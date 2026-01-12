// Domain Types
export interface Pallet {
  id: string;
  code: string;
  name: string;
  created_by: string;
  shipment_code: string | null;
  created_at: string;
  updated_at: string;
}

// View Models
export interface PalletWithBoxCount extends Pallet {
  box_count: number;
}

export interface PalletWithBoxes extends Pallet {
  boxes: Array<{
    id: string;
    code: string;
    name: string;
    department_name: string;
    status: "draft" | "sealed";
    created_by: string;
    created_at: string;
    photo_url: string | null;
  }>;
}

// Form Types
export interface CreatePalletData {
  name: string;
}

