// Box Repository - Supabase with localStorage fallback
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Box,
  BoxLine,
  BoxWithDepartment,
  BoxWithLines,
  BoxDetail,
  BoxWithPalletAndShipment,
  CreateBoxData,
  UpdateBoxData,
  CreateBoxLineData,
} from "@/lib/types/box";
import { departmentRepository } from "./department";

const BOX_STORAGE_KEY = "qr_lojistik_boxes";
const BOX_LINES_STORAGE_KEY = "qr_lojistik_box_lines";

class BoxRepository {
  // localStorage methods
  private getLocalBoxes(): Box[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(BOX_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalBoxes(boxes: Box[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(BOX_STORAGE_KEY, JSON.stringify(boxes));
  }

  private getLocalBoxLines(): BoxLine[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(BOX_LINES_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalBoxLines(lines: BoxLine[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(BOX_LINES_STORAGE_KEY, JSON.stringify(lines));
  }

  // Generate unique code
  private generateCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BOX-${timestamp}-${random}`;
  }

  // Get all boxes with department info
  async getAll(): Promise<BoxWithDepartment[]> {
    if (!isSupabaseConfigured || !supabase) {
      const boxes = this.getLocalBoxes();
      const departments = await departmentRepository.getAll();

      return boxes.map((box) => {
        const dept = departments.find((d) => d.id === box.department_id);
        return {
          ...box,
          department: {
            id: box.department_id,
            name: dept?.name || "Unknown",
          },
        };
      });
    }

    try {
      const { data, error } = await supabase
        .from("boxes")
        .select(
          `
          *,
          department:departments(id, name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((item) => ({
        ...item,
        department: Array.isArray(item.department)
          ? item.department[0]
          : item.department,
      }));
    } catch (error) {
      console.error("Error fetching boxes from Supabase:", error);
      // Fallback to localStorage
      const boxes = this.getLocalBoxes();
      const departments = await departmentRepository.getAll();

      return boxes.map((box) => {
        const dept = departments.find((d) => d.id === box.department_id);
        return {
          ...box,
          department: {
            id: box.department_id,
            name: dept?.name || "Unknown",
          },
        };
      });
    }
  }

  // Get single box with details
  async getByCode(code: string): Promise<BoxDetail | null> {
    if (!isSupabaseConfigured || !supabase) {
      const boxes = this.getLocalBoxes();
      const box = boxes.find((b) => b.code === code);
      if (!box) return null;

      const lines = this.getLocalBoxLines().filter((l) => l.box_id === box.id);
      const department = await departmentRepository.getById(box.department_id);

      return {
        ...box,
        lines,
        department: department || {
          id: box.department_id,
          name: "Unknown",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }

    try {
      const { data: boxData, error: boxError } = await supabase
        .from("boxes")
        .select(
          `
          *,
          department:departments(*),
          lines:box_lines(*)
        `
        )
        .eq("code", code)
        .single();

      if (boxError) throw boxError;

      return {
        ...boxData,
        department: Array.isArray(boxData.department)
          ? boxData.department[0]
          : boxData.department,
        lines: boxData.lines || [],
      };
    } catch (error) {
      console.error("Error fetching box from Supabase:", error);
      // Fallback to localStorage
      const boxes = this.getLocalBoxes();
      const box = boxes.find((b) => b.code === code);
      if (!box) return null;

      const lines = this.getLocalBoxLines().filter((l) => l.box_id === box.id);
      const department = await departmentRepository.getById(box.department_id);

      return {
        ...box,
        lines,
        department: department || {
          id: box.department_id,
          name: "Unknown",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    }
  }

  // Get box with full pallet and shipment info
  async getByCodeWithPalletAndShipment(code: string): Promise<BoxWithPalletAndShipment | null> {
    if (!isSupabaseConfigured || !supabase) {
      const boxDetail = await this.getByCode(code);
      if (!boxDetail) return null;

      // Get pallet info if box is in a pallet
      let palletInfo = null;
      let shipmentInfo = null;

      if (boxDetail.pallet_code) {
        const PALLET_STORAGE_KEY = "qr_lojistik_pallets";
        const stored = localStorage.getItem(PALLET_STORAGE_KEY);
        if (stored) {
          const pallets = JSON.parse(stored);
          const pallet = pallets.find((p: any) => p.code === boxDetail.pallet_code);
          if (pallet) {
            palletInfo = { code: pallet.code, name: pallet.name };
            
            // Check if pallet is in a shipment
            if (pallet.shipment_code) {
              const SHIPMENT_STORAGE_KEY = "qr_logistics_shipments";
              const shipmentStored = localStorage.getItem(SHIPMENT_STORAGE_KEY);
              if (shipmentStored) {
                const shipments = JSON.parse(shipmentStored);
                const shipment = shipments.find((s: any) => s.code === pallet.shipment_code);
                if (shipment) {
                  shipmentInfo = { code: shipment.code, name_or_plate: shipment.name_or_plate };
                }
              }
            }
          }
        }
      }

      // Check if box is directly in a shipment (for direct shipment items)
      if ((boxDetail as any).shipment_code) {
        const SHIPMENT_STORAGE_KEY = "qr_logistics_shipments";
        const shipmentStored = localStorage.getItem(SHIPMENT_STORAGE_KEY);
        if (shipmentStored) {
          const shipments = JSON.parse(shipmentStored);
          const shipment = shipments.find((s: any) => s.code === (boxDetail as any).shipment_code);
          if (shipment) {
            shipmentInfo = { code: shipment.code, name_or_plate: shipment.name_or_plate };
          }
        }
      }

      return {
        ...boxDetail,
        is_direct_shipment: (boxDetail as any).is_direct_shipment || false,
        shipment_code: (boxDetail as any).shipment_code || null,
        pallet_info: palletInfo,
        shipment_info: shipmentInfo,
      };
    }

    try {
      // Get box with department and lines
      const { data: boxData, error: boxError } = await supabase
        .from("boxes")
        .select(
          `
          *,
          department:departments(*),
          lines:box_lines(*)
        `
        )
        .eq("code", code)
        .single();

      if (boxError) throw boxError;

      let palletInfo = null;
      let shipmentInfo = null;

      // Get pallet info if box is in a pallet
      if (boxData.pallet_code) {
        const { data: palletData } = await supabase
          .from("pallets")
          .select("code, name, shipment_code")
          .eq("code", boxData.pallet_code)
          .single();

        if (palletData) {
          palletInfo = { code: palletData.code, name: palletData.name };

          // Get shipment info if pallet is in a shipment
          if (palletData.shipment_code) {
            const { data: shipmentData } = await supabase
              .from("shipments")
              .select("code, name_or_plate")
              .eq("code", palletData.shipment_code)
              .single();

            if (shipmentData) {
              shipmentInfo = { code: shipmentData.code, name_or_plate: shipmentData.name_or_plate };
            }
          }
        }
      }

      // Check if box is directly in a shipment
      if (boxData.shipment_code) {
        const { data: shipmentData } = await supabase
          .from("shipments")
          .select("code, name_or_plate")
          .eq("code", boxData.shipment_code)
          .single();

        if (shipmentData) {
          shipmentInfo = { code: shipmentData.code, name_or_plate: shipmentData.name_or_plate };
        }
      }

      return {
        ...boxData,
        department: Array.isArray(boxData.department)
          ? boxData.department[0]
          : boxData.department,
        lines: boxData.lines || [],
        pallet_info: palletInfo,
        shipment_info: shipmentInfo,
      };
    } catch (error) {
      console.error("Error fetching box with pallet/shipment info:", error);
      return null;
    }
  }

  // Create box
  async create(
    data: CreateBoxData,
    userId: string,
    userName: string
  ): Promise<Box> {
    const code = this.generateCode();
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const boxes = this.getLocalBoxes();

      const newBox: Box = {
        id: `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        code,
        name: data.name,
        department_id: data.department_id,
        created_by: userName,
        status: "draft",
        revision: 1,
        pallet_code: null,
        photo_url: null,
        photo_url_2: null,
        needs_reprint: false,
        is_direct_shipment: (data as any).is_direct_shipment || false,
        shipment_code: null,
        created_at: now,
        updated_at: now,
      };

      boxes.push(newBox);
      this.saveLocalBoxes(boxes);
      return newBox;
    }

    try {
      const { data: newBox, error } = await supabase
        .from("boxes")
        .insert({
          code,
          name: data.name,
          department_id: data.department_id,
          created_by: userName,
          status: "draft",
          revision: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return newBox;
    } catch (error: any) {
      console.error("Error creating box in Supabase:", error);
      throw new Error("Koli oluşturulamadı: " + error.message);
    }
  }

  // Update box
  async update(code: string, updates: UpdateBoxData): Promise<Box> {
    if (!isSupabaseConfigured || !supabase) {
      const boxes = this.getLocalBoxes();
      const index = boxes.findIndex((b) => b.code === code);

      if (index === -1) {
        throw new Error("Koli bulunamadı");
      }

      boxes[index] = {
        ...boxes[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      this.saveLocalBoxes(boxes);
      return boxes[index];
    }

    try {
      const { data, error } = await supabase
        .from("boxes")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("code", code)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating box in Supabase:", error);
      throw new Error("Koli güncellenemedi: " + error.message);
    }
  }

  // Delete box
  async delete(code: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const boxes = this.getLocalBoxes();
      const box = boxes.find((b) => b.code === code);

      if (!box) {
        throw new Error("Koli bulunamadı");
      }

      // Delete box lines
      const lines = this.getLocalBoxLines();
      const filteredLines = lines.filter((l) => l.box_id !== box.id);
      this.saveLocalBoxLines(filteredLines);

      // Delete box
      const filteredBoxes = boxes.filter((b) => b.code !== code);
      this.saveLocalBoxes(filteredBoxes);
      return;
    }

    try {
      const { error } = await supabase.from("boxes").delete().eq("code", code);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting box from Supabase:", error);
      throw new Error("Koli silinemedi: " + error.message);
    }
  }

  // Add line to box
  async addLine(boxCode: string, lineData: CreateBoxLineData): Promise<BoxLine> {
    if (!isSupabaseConfigured || !supabase) {
      const boxes = this.getLocalBoxes();
      const box = boxes.find((b) => b.code === boxCode);

      if (!box) {
        throw new Error("Koli bulunamadı");
      }

      const lines = this.getLocalBoxLines();
      const newLine: BoxLine = {
        id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        box_id: box.id,
        product_name: lineData.product_name,
        qty: lineData.qty,
        kind: lineData.kind || null,
        created_at: new Date().toISOString(),
      };

      lines.push(newLine);
      this.saveLocalBoxLines(lines);
      return newLine;
    }

    try {
      // First get the box to get its ID
      const { data: box, error: boxError } = await supabase
        .from("boxes")
        .select("id")
        .eq("code", boxCode)
        .single();

      if (boxError) throw boxError;

      const { data: newLine, error } = await supabase
        .from("box_lines")
        .insert({
          box_id: box.id,
          product_name: lineData.product_name,
          qty: lineData.qty,
          kind: lineData.kind,
        })
        .select()
        .single();

      if (error) throw error;
      return newLine;
    } catch (error: any) {
      console.error("Error adding line to box in Supabase:", error);
      throw new Error("Ürün eklenemedi: " + error.message);
    }
  }

  // Delete line from box
  async deleteLine(lineId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const lines = this.getLocalBoxLines();
      const filtered = lines.filter((l) => l.id !== lineId);

      if (filtered.length === lines.length) {
        throw new Error("Ürün bulunamadı");
      }

      this.saveLocalBoxLines(filtered);
      return;
    }

    try {
      const { error } = await supabase
        .from("box_lines")
        .delete()
        .eq("id", lineId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting line from Supabase:", error);
      throw new Error("Ürün silinemedi: " + error.message);
    }
  }

  // Seal box (change status to sealed)
  async seal(code: string): Promise<Box> {
    return this.update(code, { status: "sealed" });
  }

  // Set pallet for a box
  async setPallet(boxCode: string, palletCode: string): Promise<Box> {
    return this.update(boxCode, { pallet_code: palletCode });
  }

  // Clear pallet from a box
  async clearPallet(boxCode: string): Promise<Box> {
    return this.update(boxCode, { pallet_code: null });
  }

  // Get boxes by pallet
  async getByPallet(palletCode: string): Promise<BoxWithDepartment[]> {
    if (!isSupabaseConfigured || !supabase) {
      const boxes = this.getLocalBoxes().filter(
        (b) => b.pallet_code === palletCode
      );
      const departments = await departmentRepository.getAll();

      return boxes.map((box) => {
        const dept = departments.find((d) => d.id === box.department_id);
        return {
          ...box,
          department: {
            id: box.department_id,
            name: dept?.name || "Unknown",
          },
        };
      });
    }

    try {
      const { data, error } = await supabase
        .from("boxes")
        .select(
          `
          *,
          department:departments(id, name)
        `
        )
        .eq("pallet_code", palletCode)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((item) => ({
        ...item,
        department: Array.isArray(item.department)
          ? item.department[0]
          : item.department,
      }));
    } catch (error) {
      console.error("Error fetching boxes by pallet from Supabase:", error);
      const boxes = this.getLocalBoxes().filter(
        (b) => b.pallet_code === palletCode
      );
      const departments = await departmentRepository.getAll();

      return boxes.map((box) => {
        const dept = departments.find((d) => d.id === box.department_id);
        return {
          ...box,
          department: {
            id: box.department_id,
            name: dept?.name || "Unknown",
          },
        };
      });
    }
  }
}

export const boxRepository = new BoxRepository();
