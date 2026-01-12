import {
  Pallet,
  PalletWithBoxCount,
  PalletWithBoxes,
  CreatePalletData,
} from "../types/pallet";
import { supabase, isSupabaseConfigured } from "../supabase/client";
import { boxRepository } from "./box";
import { departmentRepository } from "./department";

// Generate unique pallet code (shorter format)
function generatePalletCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "P-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate UUID for local storage
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class PalletRepository {
  private palletsKey = "qr_lojistik_pallets";

  // Local storage helpers
  private getLocalPallets(): Pallet[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.palletsKey);
    return stored ? JSON.parse(stored) : [];
  }

  private setLocalPallets(pallets: Pallet[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.palletsKey, JSON.stringify(pallets));
  }

  // Create pallet
  async create(data: CreatePalletData, createdBy: string): Promise<Pallet> {
    const now = new Date().toISOString();
    const pallet: Pallet = {
      id: generateUUID(),
      code: generatePalletCode(),
      name: data.name,
      created_by: createdBy,
      shipment_code: null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from("pallets")
        .insert(pallet)
        .select()
        .single();

      if (error) throw error;
      return inserted;
    }

    // Local storage
    const pallets = this.getLocalPallets();
    pallets.push(pallet);
    this.setLocalPallets(pallets);
    return pallet;
  }

  // Get pallet by code
  async getByCode(code: string): Promise<Pallet | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("pallets")
        .select("*")
        .eq("code", code)
        .single();

      if (error) return null;
      return data;
    }

    // Local storage
    const pallets = this.getLocalPallets();
    return pallets.find((p) => p.code === code) || null;
  }

  // Get pallet with boxes
  async getByCodeWithBoxes(code: string): Promise<PalletWithBoxes | null> {
    const pallet = await this.getByCode(code);
    if (!pallet) return null;

    // Get all boxes for this pallet
    const allBoxes = await boxRepository.getAll();
    const palletBoxes = allBoxes.filter((box) => box.pallet_code === code);

    return {
      ...pallet,
      boxes: palletBoxes.map((box) => ({
        id: box.id,
        code: box.code,
        name: box.name,
        department_name: box.department.name,
        status: box.status,
        created_by: box.created_by,
        created_at: box.created_at,
        photo_url: box.photo_url,
      })),
    };
  }

  // Get all pallets with box counts
  async getAll(filters?: { createdBy?: string }): Promise<PalletWithBoxCount[]> {
    let pallets: Pallet[] = [];

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from("pallets").select("*");

      if (filters?.createdBy) {
        query = query.eq("created_by", filters.createdBy);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      pallets = data || [];
    } else {
      // Local storage
      pallets = this.getLocalPallets();

      if (filters?.createdBy) {
        pallets = pallets.filter((p) => p.created_by === filters.createdBy);
      }

      // Sort by created_at desc
      pallets.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    // Get box counts
    const allBoxes = await boxRepository.getAll();
    const result: PalletWithBoxCount[] = pallets.map((pallet) => {
      const boxCount = allBoxes.filter(
        (box) => box.pallet_code === pallet.code
      ).length;
      return {
        ...pallet,
        box_count: boxCount,
      };
    });

    return result;
  }

  // Get statistics for admin
  async getStats(): Promise<{
    totalPallets: number;
    recent: PalletWithBoxCount[];
    byUser: { user: string; count: number }[];
  }> {
    const pallets = await this.getAll();

    // By user
    const userMap = new Map<string, number>();
    pallets.forEach((pallet) => {
      const count = userMap.get(pallet.created_by) || 0;
      userMap.set(pallet.created_by, count + 1);
    });
    const byUser = Array.from(userMap.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalPallets: pallets.length,
      recent: pallets.slice(0, 10),
      byUser,
    };
  }

  // Link pallet to shipment
  async setShipment(palletCode: string, shipmentCode: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("pallets")
        .update({
          shipment_code: shipmentCode,
          updated_at: new Date().toISOString(),
        })
        .eq("code", palletCode);

      if (error) throw error;
      return;
    }

    // Local storage
    const pallets = this.getLocalPallets();
    const pallet = pallets.find((p) => p.code === palletCode);
    if (!pallet) throw new Error("Pallet not found");

    pallet.shipment_code = shipmentCode;
    pallet.updated_at = new Date().toISOString();
    this.setLocalPallets(pallets);
  }

  // Clear shipment from pallet
  async clearShipment(palletCode: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("pallets")
        .update({
          shipment_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq("code", palletCode);

      if (error) throw error;
      return;
    }

    // Local storage
    const pallets = this.getLocalPallets();
    const pallet = pallets.find((p) => p.code === palletCode);
    if (!pallet) throw new Error("Pallet not found");

    pallet.shipment_code = null;
    pallet.updated_at = new Date().toISOString();
    this.setLocalPallets(pallets);
  }

  // Get pallets available for shipment (not on shipment, optionally filtered by creator)
  async getAvailableForShipment(createdBy?: string): Promise<PalletWithBoxCount[]> {
    const filters: { createdBy?: string } = {};
    if (createdBy) {
      filters.createdBy = createdBy;
    }
    const pallets = await this.getAll(filters);
    return pallets.filter((pallet) => !pallet.shipment_code);
  }

  // Update pallet
  async update(code: string, data: Partial<Pallet>): Promise<void> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("pallets")
        .update({ ...data, updated_at: now })
        .eq("code", code);

      if (error) throw error;
      return;
    }

    // Local storage
    const pallets = this.getLocalPallets();
    const index = pallets.findIndex((p) => p.code === code);
    if (index === -1) throw new Error("Pallet not found");

    pallets[index] = { ...pallets[index], ...data, updated_at: now };
    this.setLocalPallets(pallets);
  }

  // Delete pallet
  async delete(code: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("pallets").delete().eq("code", code);

      if (error) throw error;
      return;
    }

    // Local storage
    const pallets = this.getLocalPallets();
    const filtered = pallets.filter((p) => p.code !== code);
    this.setLocalPallets(filtered);
  }
}

export const palletRepository = new PalletRepository();

