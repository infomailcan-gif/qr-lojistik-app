// Domain Types
export interface Shipment {
  id: string;
  code: string;
  name_or_plate: string;
  created_by: string;
  photo_url: string | null;
  photo_url_2: string | null;
  created_at: string;
  updated_at: string;
}

// View Models
export interface ShipmentWithCounts extends Shipment {
  pallet_count: number;
  box_count: number;
}

export interface ShipmentWithPallets extends Shipment {
  pallets: Array<{
    id: string;
    code: string;
    name: string;
    box_count: number;
    boxes: Array<{
      id: string;
      code: string;
      name: string;
      department_name: string;
      status: "draft" | "sealed";
      photo_url: string | null;
    }>;
  }>;
}

// Form Types
export interface CreateShipmentData {
  name_or_plate: string;
}

