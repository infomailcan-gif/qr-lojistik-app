// Department Repository - Supabase with localStorage fallback
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Department } from "@/lib/types/box";

const DEPARTMENT_STORAGE_KEY = "qr_lojistik_departments";

class DepartmentRepository {
  // localStorage methods
  private getLocalDepartments(): Department[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(DEPARTMENT_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalDepartments(departments: Department[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(DEPARTMENT_STORAGE_KEY, JSON.stringify(departments));
  }

  // Get all departments
  async getAll(): Promise<Department[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getLocalDepartments();
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching departments from Supabase:", error);
      // Fallback to localStorage
      return this.getLocalDepartments();
    }
  }

  // Get single department by ID
  async getById(id: string): Promise<Department | null> {
    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      return departments.find((d) => d.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching department from Supabase:", error);
      // Fallback to localStorage
      const departments = this.getLocalDepartments();
      return departments.find((d) => d.id === id) || null;
    }
  }

  // Create department
  async create(name: string): Promise<Department> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      const newDepartment: Department = {
        id: `dept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        created_at: now,
        updated_at: now,
      };

      departments.push(newDepartment);
      this.saveLocalDepartments(departments);
      return newDepartment;
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error creating department in Supabase:", error);
      throw new Error("Departman oluşturulamadı: " + error.message);
    }
  }

  // Update department
  async update(id: string, name: string): Promise<Department> {
    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      const index = departments.findIndex((d) => d.id === id);

      if (index === -1) {
        throw new Error("Departman bulunamadı");
      }

      departments[index] = {
        ...departments[index],
        name,
        updated_at: new Date().toISOString(),
      };

      this.saveLocalDepartments(departments);
      return departments[index];
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .update({
          name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating department in Supabase:", error);
      throw new Error("Departman güncellenemedi: " + error.message);
    }
  }

  // Delete department
  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      const filtered = departments.filter((d) => d.id !== id);

      if (filtered.length === departments.length) {
        throw new Error("Departman bulunamadı");
      }

      this.saveLocalDepartments(filtered);
      return;
    }

    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting department from Supabase:", error);
      throw new Error("Departman silinemedi: " + error.message);
    }
  }
}

export const departmentRepository = new DepartmentRepository();
