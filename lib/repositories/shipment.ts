// Shipment Repository - Supabase with localStorage fallback
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Shipment,
  ShipmentWithCounts,
  ShipmentWithPallets,
  CreateShipmentData,
} from "@/lib/types/shipment";
import { palletRepository } from "./pallet";
import { boxRepository } from "./box";

const SHIPMENT_STORAGE_KEY = "qr_logistics_shipments";

class ShipmentRepository {
  // localStorage methods
  private getLocalShipments(): Shipment[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(SHIPMENT_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalShipments(shipments: Shipment[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(SHIPMENT_STORAGE_KEY, JSON.stringify(shipments));
  }

  // Generate unique code
  private generateCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `SHP-${timestamp}-${random}`;
  }

  // Get all shipments with counts
  async getAll(): Promise<ShipmentWithCounts[]> {
    if (!isSupabaseConfigured || !supabase) {
      const shipments = this.getLocalShipments();
      const allPallets = await palletRepository.getAll();

      return Promise.all(
        shipments.map(async (shipment) => {
          const pallets = allPallets.filter(
            (p) => p.shipment_code === shipment.code
          );
          const pallet_count = pallets.length;
          const box_count = pallets.reduce((sum, p) => sum + p.box_count, 0);

          return {
            ...shipment,
            pallet_count,
            box_count,
          };
        })
      );
    }

    try {
      const { data, error } = await supabase
        .from("shipments")
        .select(
          `
          *,
          pallets:pallets!shipment_code(
            count,
            boxes:boxes!pallet_code(count)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => {
        const pallet_count = item.pallets?.[0]?.count || 0;
        const box_count = item.pallets?.reduce(
          (sum: number, p: any) => sum + (p.boxes?.[0]?.count || 0),
          0
        ) || 0;

        return {
          ...item,
          pallet_count,
          box_count,
          pallets: undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching shipments from Supabase:", error);
      // Fallback to localStorage
      const shipments = this.getLocalShipments();
      const allPallets = await palletRepository.getAll();

      return Promise.all(
        shipments.map(async (shipment) => {
          const pallets = allPallets.filter(
            (p) => p.shipment_code === shipment.code
          );
          const pallet_count = pallets.length;
          const box_count = pallets.reduce((sum, p) => sum + p.box_count, 0);

          return {
            ...shipment,
            pallet_count,
            box_count,
          };
        })
      );
    }
  }

  // Get single shipment with pallets
  async getByCode(code: string): Promise<ShipmentWithPallets | null> {
    if (!isSupabaseConfigured || !supabase) {
      const shipments = this.getLocalShipments();
      const shipment = shipments.find((s) => s.code === code);
      if (!shipment) return null;

      const pallets = await palletRepository.getByShipment(code);

      // Get boxes for each pallet
      const palletsWithBoxes = await Promise.all(
        pallets.map(async (pallet) => {
          const palletDetail = await palletRepository.getByCode(pallet.code);
          return {
            id: pallet.id,
            code: pallet.code,
            name: pallet.name,
            box_count: pallet.box_count,
            boxes: palletDetail?.boxes || [],
          };
        })
      );

      return {
        ...shipment,
        pallets: palletsWithBoxes,
      };
    }

    try {
      const { data: shipmentData, error: shipmentError } = await supabase
        .from("shipments")
        .select("*")
        .eq("code", code)
        .single();

      if (shipmentError) throw shipmentError;

      // Get pallets for this shipment
      const { data: palletsData, error: palletsError } = await supabase
        .from("pallets")
        .select(
          `
          id,
          code,
          name,
          boxes:boxes!pallet_code(
            id,
            code,
            name,
            status,
            photo_url,
            department:departments(name)
          )
        `
        )
        .eq("shipment_code", code)
        .order("created_at", { ascending: false });

      if (palletsError) throw palletsError;

      return {
        ...shipmentData,
        pallets: (palletsData || []).map((p) => ({
          ...p,
          box_count: p.boxes?.length || 0,
          boxes: (p.boxes || []).map((b: any) => ({
            ...b,
            department_name: Array.isArray(b.department)
              ? b.department[0]?.name || "Unknown"
              : b.department?.name || "Unknown",
            department: undefined,
          })),
        })),
      };
    } catch (error) {
      console.error("Error fetching shipment from Supabase:", error);
      // Fallback to localStorage
      const shipments = this.getLocalShipments();
      const shipment = shipments.find((s) => s.code === code);
      if (!shipment) return null;

      const pallets = await palletRepository.getByShipment(code);

      const palletsWithBoxes = await Promise.all(
        pallets.map(async (pallet) => {
          const palletDetail = await palletRepository.getByCode(pallet.code);
          return {
            id: pallet.id,
            code: pallet.code,
            name: pallet.name,
            box_count: pallet.box_count,
            boxes: palletDetail?.boxes || [],
          };
        })
      );

      return {
        ...shipment,
        pallets: palletsWithBoxes,
      };
    }
  }

  // Create shipment
  async create(
    data: CreateShipmentData,
    userName: string
  ): Promise<Shipment> {
    const code = this.generateCode();
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const shipments = this.getLocalShipments();

      const newShipment: Shipment = {
        id: `shipment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code,
        name_or_plate: data.name_or_plate,
        created_by: userName,
        created_at: now,
        updated_at: now,
      };

      shipments.push(newShipment);
      this.saveLocalShipments(shipments);
      return newShipment;
    }

    try {
      const { data: newShipment, error } = await supabase
        .from("shipments")
        .insert({
          code,
          name_or_plate: data.name_or_plate,
          created_by: userName,
        })
        .select()
        .single();

      if (error) throw error;
      return newShipment;
    } catch (error: any) {
      console.error("Error creating shipment in Supabase:", error);
      throw new Error("Sevkiyat oluşturulamadı: " + error.message);
    }
  }

  // Delete shipment
  async delete(code: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const shipments = this.getLocalShipments();
      const filtered = shipments.filter((s) => s.code !== code);

      if (filtered.length === shipments.length) {
        throw new Error("Sevkiyat bulunamadı");
      }

      // Remove shipment_code from pallets
      const pallets = await palletRepository.getByShipment(code);
      for (const pallet of pallets) {
        await palletRepository.update(pallet.code, null);
      }

      this.saveLocalShipments(filtered);
      return;
    }

    try {
      // First, remove shipment_code from all pallets
      const { error: updateError } = await supabase
        .from("pallets")
        .update({ shipment_code: null })
        .eq("shipment_code", code);

      if (updateError) throw updateError;

      // Then delete the shipment
      const { error: deleteError } = await supabase
        .from("shipments")
        .delete()
        .eq("code", code);

      if (deleteError) throw deleteError;
    } catch (error: any) {
      console.error("Error deleting shipment from Supabase:", error);
      throw new Error("Sevkiyat silinemedi: " + error.message);
    }
  }

  // Add pallet to shipment
  async addPallet(shipmentCode: string, palletCode: string): Promise<void> {
    // Update pallet to set shipment_code
    await palletRepository.update(palletCode, shipmentCode);
  }

  // Remove pallet from shipment
  async removePallet(palletCode: string): Promise<void> {
    // Update pallet to remove shipment_code
    await palletRepository.update(palletCode, null);
  }
}

export const shipmentRepository = new ShipmentRepository();
