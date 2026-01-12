import type {
  Shipment,
  ShipmentWithCounts,
  ShipmentWithPallets,
  CreateShipmentData,
} from "@/lib/types/shipment";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { palletRepository } from "./pallet";
import { boxRepository } from "./box";

const STORAGE_KEY = "qr_lojistik_shipments";

// UUID helper
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Shipment code generator (shorter format)
function generateShipmentCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "S-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

class ShipmentRepository {
  // Local storage helpers
  private getLocalShipments(): Shipment[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocalShipments(shipments: Shipment[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
  }

  // Create shipment
  async create(data: CreateShipmentData, createdBy: string): Promise<Shipment> {
    const now = new Date().toISOString();
    const shipment: Shipment = {
      id: generateUUID(),
      code: generateShipmentCode(),
      name_or_plate: data.name_or_plate,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from("shipments")
        .insert(shipment)
        .select()
        .single();

      if (error) throw error;
      return inserted;
    }

    // Local storage
    const shipments = this.getLocalShipments();
    shipments.unshift(shipment);
    this.setLocalShipments(shipments);
    return shipment;
  }

  // Get shipment by code
  async getByCode(code: string): Promise<Shipment | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("code", code)
        .single();

      if (error) return null;
      return data;
    }

    // Local storage
    const shipments = this.getLocalShipments();
    return shipments.find((s) => s.code === code) || null;
  }

  // Get all shipments with counts
  async getAll(): Promise<ShipmentWithCounts[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with counts
      const enriched = await Promise.all(
        (data || []).map(async (shipment) => {
          const pallets = await palletRepository.getAll();
          const shipmentPallets = pallets.filter(
            (p) => p.shipment_code === shipment.code
          );
          const boxCount = shipmentPallets.reduce(
            (sum, p) => sum + p.box_count,
            0
          );

          return {
            ...shipment,
            pallet_count: shipmentPallets.length,
            box_count: boxCount,
          };
        })
      );

      return enriched;
    }

    // Local storage
    const shipments = this.getLocalShipments();
    const pallets = await palletRepository.getAll();

    return shipments.map((shipment) => {
      const shipmentPallets = pallets.filter(
        (p) => p.shipment_code === shipment.code
      );
      const boxCount = shipmentPallets.reduce((sum, p) => sum + p.box_count, 0);

      return {
        ...shipment,
        pallet_count: shipmentPallets.length,
        box_count: boxCount,
      };
    });
  }

  // Get shipment with pallets and boxes (for detail/public view)
  async getWithPallets(code: string): Promise<ShipmentWithPallets | null> {
    const shipment = await this.getByCode(code);
    if (!shipment) return null;

    const allPallets = await palletRepository.getAll();
    const shipmentPallets = allPallets.filter(
      (p) => p.shipment_code === code
    );

    const allBoxes = await boxRepository.getAll();

    const palletsWithBoxes = shipmentPallets.map((pallet) => {
      const palletBoxes = allBoxes.filter((b) => b.pallet_code === pallet.code);

      return {
        id: pallet.id,
        code: pallet.code,
        name: pallet.name,
        box_count: palletBoxes.length,
        boxes: palletBoxes.map((box) => ({
          id: box.id,
          code: box.code,
          name: box.name,
          department_name: box.department.name,
          status: box.status,
          photo_url: box.photo_url,
        })),
      };
    });

    return {
      ...shipment,
      pallets: palletsWithBoxes,
    };
  }

  // Update shipment
  async update(code: string, data: Partial<Shipment>): Promise<void> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("shipments")
        .update({ ...data, updated_at: now })
        .eq("code", code);

      if (error) throw error;
      return;
    }

    // Local storage
    const shipments = this.getLocalShipments();
    const index = shipments.findIndex((s) => s.code === code);
    if (index === -1) throw new Error("Shipment not found");

    shipments[index] = { ...shipments[index], ...data, updated_at: now };
    this.setLocalShipments(shipments);
  }

  // Delete shipment
  async delete(code: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("shipments").delete().eq("code", code);

      if (error) throw error;
      return;
    }

    // Local storage
    const shipments = this.getLocalShipments();
    const filtered = shipments.filter((s) => s.code !== code);
    this.setLocalShipments(filtered);
  }

  // Get statistics for admin
  async getStats(): Promise<{
    totalShipments: number;
    recent: ShipmentWithCounts[];
    byUser: { user: string; count: number }[];
  }> {
    const shipments = await this.getAll();

    // By user
    const userMap = new Map<string, number>();
    shipments.forEach((shipment) => {
      const count = userMap.get(shipment.created_by) || 0;
      userMap.set(shipment.created_by, count + 1);
    });
    const byUser = Array.from(userMap.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalShipments: shipments.length,
      recent: shipments.slice(0, 10),
      byUser,
    };
  }
}

export const shipmentRepository = new ShipmentRepository();

