import {
  Box,
  BoxLine,
  BoxWithDepartment,
  BoxWithDetails,
  CreateBoxData,
  CreateBoxLineData,
  UpdateBoxData,
} from "../types/box";
import { supabase, isSupabaseConfigured } from "../supabase/client";
import { departmentRepository } from "./department";

// Generate unique box code (shorter format)
function generateBoxCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "B-";
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

class BoxRepository {
  private boxesKey = "qr_lojistik_boxes";
  private linesKey = "qr_lojistik_box_lines";

  // Local storage helpers
  private getLocalBoxes(): Box[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.boxesKey);
    return stored ? JSON.parse(stored) : [];
  }

  private setLocalBoxes(boxes: Box[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.boxesKey, JSON.stringify(boxes));
  }

  private getLocalLines(): BoxLine[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.linesKey);
    return stored ? JSON.parse(stored) : [];
  }

  private setLocalLines(lines: BoxLine[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.linesKey, JSON.stringify(lines));
  }

  // Create box
  async create(data: CreateBoxData, createdBy: string): Promise<Box> {
    const now = new Date().toISOString();
    const box: Box = {
      id: generateUUID(),
      code: generateBoxCode(),
      name: data.name,
      department_id: data.department_id,
      created_by: createdBy,
      status: "draft",
      revision: 1,
      pallet_code: null,
      photo_url: null,
      needs_reprint: false,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from("boxes")
        .insert(box)
        .select()
        .single();

      if (error) throw error;
      return inserted;
    }

    // Local storage
    const boxes = this.getLocalBoxes();
    boxes.push(box);
    this.setLocalBoxes(boxes);
    return box;
  }

  // Update box
  async update(id: string, data: UpdateBoxData): Promise<Box> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { data: updated, error } = await supabase
        .from("boxes")
        .update({ ...data, updated_at: now })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    }

    // Local storage
    const boxes = this.getLocalBoxes();
    const index = boxes.findIndex((b) => b.id === id);
    if (index === -1) throw new Error("Box not found");

    boxes[index] = { ...boxes[index], ...data, updated_at: now };
    this.setLocalBoxes(boxes);
    return boxes[index];
  }

  // Get box by code
  async getByCode(code: string): Promise<BoxWithDetails | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: box, error: boxError } = await supabase
        .from("boxes")
        .select("*, department:departments(*)")
        .eq("code", code)
        .single();

      if (boxError) return null;

      const { data: lines, error: linesError } = await supabase
        .from("box_lines")
        .select("*")
        .eq("box_id", box.id)
        .order("created_at");

      if (linesError) throw linesError;

      return {
        ...box,
        department: box.department,
        lines: lines || [],
      };
    }

    // Local storage
    const boxes = this.getLocalBoxes();
    const box = boxes.find((b) => b.code === code);
    if (!box) return null;

    const department = await departmentRepository.getById(box.department_id);
    if (!department) return null;

    const allLines = this.getLocalLines();
    const lines = allLines.filter((l) => l.box_id === box.id);

    return {
      ...box,
      department,
      lines,
    };
  }

  // Get box by ID
  async getById(id: string): Promise<Box | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("boxes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;
      return data;
    }

    // Local storage
    const boxes = this.getLocalBoxes();
    return boxes.find((b) => b.id === id) || null;
  }

  // Get all boxes with filters
  async getAll(filters?: {
    createdBy?: string;
    status?: "draft" | "sealed";
    departmentId?: string;
  }): Promise<BoxWithDepartment[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from("boxes")
        .select("*, department:departments(*)");

      if (filters?.createdBy) {
        query = query.eq("created_by", filters.createdBy);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.departmentId) {
        query = query.eq("department_id", filters.departmentId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      return (data || []).map((box) => ({
        ...box,
        department: box.department,
      }));
    }

    // Local storage
    let boxes = this.getLocalBoxes();

    if (filters?.createdBy) {
      boxes = boxes.filter((b) => b.created_by === filters.createdBy);
    }
    if (filters?.status) {
      boxes = boxes.filter((b) => b.status === filters.status);
    }
    if (filters?.departmentId) {
      boxes = boxes.filter((b) => b.department_id === filters.departmentId);
    }

    // Sort by created_at desc
    boxes.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Join with departments
    const result: BoxWithDepartment[] = [];
    for (const box of boxes) {
      const department = await departmentRepository.getById(box.department_id);
      if (department) {
        result.push({ ...box, department });
      }
    }

    return result;
  }

  // Add line to box
  async addLine(boxId: string, data: CreateBoxLineData): Promise<BoxLine> {
    const line: BoxLine = {
      id: generateUUID(),
      box_id: boxId,
      product_name: data.product_name,
      qty: data.qty,
      kind: data.kind,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data: inserted, error } = await supabase
        .from("box_lines")
        .insert(line)
        .select()
        .single();

      if (error) throw error;
      return inserted;
    }

    // Local storage
    const lines = this.getLocalLines();
    lines.push(line);
    this.setLocalLines(lines);
    return line;
  }

  // Delete line
  async deleteLine(lineId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("box_lines")
        .delete()
        .eq("id", lineId);

      if (error) throw error;
      return;
    }

    // Local storage
    const lines = this.getLocalLines();
    const filtered = lines.filter((l) => l.id !== lineId);
    this.setLocalLines(filtered);
  }

  // Link box to pallet
  async setPallet(boxCode: string, palletCode: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("boxes")
        .update({ pallet_code: palletCode, updated_at: new Date().toISOString() })
        .eq("code", boxCode);

      if (error) throw error;
      return;
    }

    // Local storage
    const boxes = this.getLocalBoxes();
    const box = boxes.find((b) => b.code === boxCode);
    if (!box) throw new Error("Box not found");

    box.pallet_code = palletCode;
    box.updated_at = new Date().toISOString();
    this.setLocalBoxes(boxes);
  }

  // Clear pallet from box
  async clearPallet(boxCode: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("boxes")
        .update({ pallet_code: null, updated_at: new Date().toISOString() })
        .eq("code", boxCode);

      if (error) throw error;
      return;
    }

    // Local storage
    const boxes = this.getLocalBoxes();
    const box = boxes.find((b) => b.code === boxCode);
    if (!box) throw new Error("Box not found");

    box.pallet_code = null;
    box.updated_at = new Date().toISOString();
    this.setLocalBoxes(boxes);
  }

  // Get boxes available for pallet (sealed, not on pallet, and optionally filtered by department and creator)
  async getAvailableForPallet(departmentId?: string, createdBy?: string): Promise<BoxWithDepartment[]> {
    const filters: { status?: "draft" | "sealed"; departmentId?: string; createdBy?: string } = {
      status: "sealed",
    };
    
    if (departmentId) {
      filters.departmentId = departmentId;
    }
    
    if (createdBy) {
      filters.createdBy = createdBy;
    }
    
    const boxes = await this.getAll(filters);

    return boxes.filter((box) => !box.pallet_code);
  }

  // Delete box (only draft boxes can be deleted)
  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      // First delete all lines
      await supabase.from("box_lines").delete().eq("box_id", id);
      
      // Then delete the box
      const { error } = await supabase.from("boxes").delete().eq("id", id);
      if (error) throw error;
      return;
    }

    // Local storage
    const boxes = this.getLocalBoxes();
    const filtered = boxes.filter((b) => b.id !== id);
    this.setLocalBoxes(filtered);
    
    // Also delete lines
    const lines = this.getLocalLines();
    const filteredLines = lines.filter((l) => l.box_id !== id);
    this.setLocalLines(filteredLines);
  }

  // Get statistics for admin
  async getStats(): Promise<{
    byDepartment: { department: string; count: number }[];
    byUser: { user: string; count: number }[];
    recent: BoxWithDepartment[];
  }> {
    const boxes = await this.getAll();

    // By department
    const deptMap = new Map<string, number>();
    boxes.forEach((box) => {
      const count = deptMap.get(box.department.name) || 0;
      deptMap.set(box.department.name, count + 1);
    });
    const byDepartment = Array.from(deptMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // By user
    const userMap = new Map<string, number>();
    boxes.forEach((box) => {
      const count = userMap.get(box.created_by) || 0;
      userMap.set(box.created_by, count + 1);
    });
    const byUser = Array.from(userMap.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent 10
    const recent = boxes.slice(0, 10);

    return { byDepartment, byUser, recent };
  }
}

export const boxRepository = new BoxRepository();
