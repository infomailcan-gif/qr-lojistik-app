// Pallet Repository - Supabase with localStorage fallback
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Pallet,
  PalletWithBoxCount,
  PalletWithBoxes,
  CreatePalletData,
} from "@/lib/types/pallet";
import { boxRepository } from "./box";

const PALLET_STORAGE_KEY = "qr_lojistik_pallets";

class PalletRepository {
  // localStorage methods
  private getLocalPallets(): Pallet[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(PALLET_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalPallets(pallets: Pallet[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(PALLET_STORAGE_KEY, JSON.stringify(pallets));
  }

  // Generate unique code
  private generateCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PLT-${timestamp}-${random}`;
  }

  // Get all pallets with box count
  async getAll(): Promise<PalletWithBoxCount[]> {
    if (!isSupabaseConfigured || !supabase) {
      const pallets = this.getLocalPallets();
      const boxes = await boxRepository.getAll();

      return pallets.map((pallet) => ({
        ...pallet,
        box_count: boxes.filter((b) => b.pallet_code === pallet.code).length,
      }));
    }

    try {
      const { data, error } = await supabase
        .from("pallets")
        .select(
          `
          *,
          boxes:boxes!boxes_pallet_code_fkey(count)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        box_count: item.boxes?.[0]?.count || 0,
        boxes: undefined,
      }));
    } catch (error) {
      console.error("Error fetching pallets from Supabase:", error);
      // Fallback to localStorage
      const pallets = this.getLocalPallets();
      const boxes = await boxRepository.getAll();

      return pallets.map((pallet) => ({
        ...pallet,
        box_count: boxes.filter((b) => b.pallet_code === pallet.code).length,
      }));
    }
  }

  // Get single pallet with boxes
  async getByCode(code: string): Promise<PalletWithBoxes | null> {
    if (!isSupabaseConfigured || !supabase) {
      const pallets = this.getLocalPallets();
      const pallet = pallets.find((p) => p.code === code);
      if (!pallet) return null;

      const allBoxes = await boxRepository.getAll();
      const palletBoxes = allBoxes.filter((b) => b.pallet_code === code);

      return {
        ...pallet,
        boxes: palletBoxes.map((b) => ({
          id: b.id,
          code: b.code,
          name: b.name,
          department_name: b.department.name,
          status: b.status,
          created_by: b.created_by,
          created_at: b.created_at,
          photo_url: b.photo_url,
        })),
      };
    }

    try {
      const { data: palletData, error: palletError } = await supabase
        .from("pallets")
        .select("*")
        .eq("code", code)
        .single();

      if (palletError) throw palletError;

      // Get boxes for this pallet
      const { data: boxesData, error: boxesError } = await supabase
        .from("boxes")
        .select(
          `
          id,
          code,
          name,
          status,
          created_by,
          created_at,
          photo_url,
          department:departments(name)
        `
        )
        .eq("pallet_code", code)
        .order("created_at", { ascending: false });

      if (boxesError) throw boxesError;

      return {
        ...palletData,
        boxes: (boxesData || []).map((b: any) => ({
          ...b,
          department_name: Array.isArray(b.department)
            ? b.department[0]?.name || "Unknown"
            : b.department?.name || "Unknown",
          department: undefined,
        })),
      };
    } catch (error) {
      console.error("Error fetching pallet from Supabase:", error);
      // Fallback to localStorage
      const pallets = this.getLocalPallets();
      const pallet = pallets.find((p) => p.code === code);
      if (!pallet) return null;

      const allBoxes = await boxRepository.getAll();
      const palletBoxes = allBoxes.filter((b) => b.pallet_code === code);

      return {
        ...pallet,
        boxes: palletBoxes.map((b) => ({
          id: b.id,
          code: b.code,
          name: b.name,
          department_name: b.department.name,
          status: b.status,
          created_by: b.created_by,
          created_at: b.created_at,
          photo_url: b.photo_url,
        })),
      };
    }
  }

  // Create pallet
  async create(data: CreatePalletData, userName: string): Promise<Pallet> {
    const code = this.generateCode();
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const pallets = this.getLocalPallets();

      const newPallet: Pallet = {
        id: `pallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code,
        name: data.name,
        created_by: userName,
        shipment_code: null,
        created_at: now,
        updated_at: now,
      };

      pallets.push(newPallet);
      this.saveLocalPallets(pallets);
      return newPallet;
    }

    try {
      const { data: newPallet, error } = await supabase
        .from("pallets")
        .insert({
          code,
          name: data.name,
          created_by: userName,
        })
        .select()
        .single();

      if (error) throw error;
      return newPallet;
    } catch (error: any) {
      console.error("Error creating pallet in Supabase:", error);
      throw new Error("Palet oluşturulamadı: " + error.message);
    }
  }

  // Delete pallet
  async delete(code: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const pallets = this.getLocalPallets();
      const filtered = pallets.filter((p) => p.code !== code);

      if (filtered.length === pallets.length) {
        throw new Error("Palet bulunamadı");
      }

      // Remove pallet_code from boxes
      const boxes = await boxRepository.getAll();
      for (const box of boxes) {
        if (box.pallet_code === code) {
          await boxRepository.update(box.code, { pallet_code: null });
        }
      }

      this.saveLocalPallets(filtered);
      return;
    }

    try {
      // First, remove pallet_code from all boxes
      const { error: updateError } = await supabase
        .from("boxes")
        .update({ pallet_code: null })
        .eq("pallet_code", code);

      if (updateError) throw updateError;

      // Then delete the pallet
      const { error: deleteError } = await supabase
        .from("pallets")
        .delete()
        .eq("code", code);

      if (deleteError) throw deleteError;
    } catch (error: any) {
      console.error("Error deleting pallet from Supabase:", error);
      throw new Error("Palet silinemedi: " + error.message);
    }
  }

  // Add box to pallet
  async addBox(palletCode: string, boxCode: string): Promise<void> {
    // Update box to set pallet_code
    await boxRepository.update(boxCode, { pallet_code: palletCode });
  }

  // Remove box from pallet
  async removeBox(boxCode: string): Promise<void> {
    // Update box to remove pallet_code
    await boxRepository.update(boxCode, { pallet_code: null });
  }

  // Get pallets by shipment
  async getByShipment(shipmentCode: string): Promise<PalletWithBoxCount[]> {
    if (!isSupabaseConfigured || !supabase) {
      const pallets = this.getLocalPallets().filter(
        (p) => p.shipment_code === shipmentCode
      );
      const boxes = await boxRepository.getAll();

      return pallets.map((pallet) => ({
        ...pallet,
        box_count: boxes.filter((b) => b.pallet_code === pallet.code).length,
      }));
    }

    try {
      const { data, error } = await supabase
        .from("pallets")
        .select(
          `
          *,
          boxes:boxes!boxes_pallet_code_fkey(count)
        `
        )
        .eq("shipment_code", shipmentCode)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item) => ({
        ...item,
        box_count: item.boxes?.[0]?.count || 0,
        boxes: undefined,
      }));
    } catch (error) {
      console.error("Error fetching pallets by shipment from Supabase:", error);
      const pallets = this.getLocalPallets().filter(
        (p) => p.shipment_code === shipmentCode
      );
      const boxes = await boxRepository.getAll();

      return pallets.map((pallet) => ({
        ...pallet,
        box_count: boxes.filter((b) => b.pallet_code === pallet.code).length,
      }));
    }
  }

  // Update pallet
  async update(code: string, updates: { name?: string; shipment_code?: string | null }): Promise<Pallet> {
    if (!isSupabaseConfigured || !supabase) {
      const pallets = this.getLocalPallets();
      const index = pallets.findIndex((p) => p.code === code);

      if (index === -1) {
        throw new Error("Palet bulunamadı");
      }

      pallets[index] = {
        ...pallets[index],
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.shipment_code !== undefined && { shipment_code: updates.shipment_code }),
        updated_at: new Date().toISOString(),
      };

      this.saveLocalPallets(pallets);
      return pallets[index];
    }

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.shipment_code !== undefined) {
        updateData.shipment_code = updates.shipment_code;
      }

      const { data, error } = await supabase
        .from("pallets")
        .update(updateData)
        .eq("code", code)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating pallet in Supabase:", error);
      throw new Error("Palet güncellenemedi: " + error.message);
    }
  }

  // Set shipment code for pallet (shorthand)
  async setShipment(code: string, shipmentCode: string | null): Promise<Pallet> {
    return this.update(code, { shipment_code: shipmentCode });
  }

  // Clear shipment code from pallet
  async clearShipment(code: string): Promise<Pallet> {
    return this.update(code, { shipment_code: null });
  }

  // Get pallets available for shipment (not assigned to any shipment, created by user)
  async getAvailableForShipment(userName: string): Promise<PalletWithBoxCount[]> {
    if (!isSupabaseConfigured || !supabase) {
      const pallets = this.getLocalPallets().filter(
        (p) => !p.shipment_code && p.created_by === userName
      );
      const boxes = await boxRepository.getAll();

      return pallets.map((pallet) => ({
        ...pallet,
        box_count: boxes.filter((b) => b.pallet_code === pallet.code).length,
      }));
    }

    try {
      const { data, error } = await supabase
        .from("pallets")
        .select("*")
        .is("shipment_code", null)
        .eq("created_by", userName)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get box counts separately
      const palletCodes = (data || []).map((p) => p.code);
      let boxCounts: { [key: string]: number } = {};

      if (palletCodes.length > 0) {
        const { data: boxData } = await supabase
          .from("boxes")
          .select("pallet_code")
          .in("pallet_code", palletCodes);

        (boxData || []).forEach((b) => {
          boxCounts[b.pallet_code] = (boxCounts[b.pallet_code] || 0) + 1;
        });
      }

      return (data || []).map((pallet) => ({
        ...pallet,
        box_count: boxCounts[pallet.code] || 0,
      }));
    } catch (error) {
      console.error("Error fetching available pallets from Supabase:", error);
      // Fallback to localStorage
      const pallets = this.getLocalPallets().filter(
        (p) => !p.shipment_code && p.created_by === userName
      );
      const boxes = await boxRepository.getAll();

      return pallets.map((pallet) => ({
        ...pallet,
        box_count: boxes.filter((b) => b.pallet_code === pallet.code).length,
      }));
    }
  }
}

export const palletRepository = new PalletRepository();
