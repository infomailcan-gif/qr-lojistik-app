// Department Repository - Supabase with localStorage fallback
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Department } from "@/lib/types/box";

const DEPARTMENT_STORAGE_KEY = "qr_lojistik_departments";

// Default departments (same as in supabase-setup.sql)
const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: "d1111111-1111-1111-1111-111111111111",
    name: "Restoran",
    description: "Restoran departmanı",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "d2222222-2222-2222-2222-222222222222",
    name: "Mutfak",
    description: "Mutfak departmanı",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "d3333333-3333-3333-3333-333333333333",
    name: "IT",
    description: "Bilgi teknolojileri",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "d4444444-4444-4444-4444-444444444444",
    name: "Depo",
    description: "Ana depo",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "d5555555-5555-5555-5555-555555555555",
    name: "Oyun Alanı",
    description: "Çocuk oyun alanı",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "d6666666-6666-6666-6666-666666666666",
    name: "Yemekhane",
    description: "Personel yemekhanesi",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "d7777777-7777-7777-7777-777777777777",
    name: "Bilgi İşlem",
    description: "IT departmanı",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "d8888888-8888-8888-8888-888888888888",
    name: "Server Odası",
    description: "Sunucu odası",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

class DepartmentRepository {
  // localStorage methods
  private getLocalDepartments(): Department[] {
    if (typeof window === "undefined") return DEFAULT_DEPARTMENTS;
    const stored = localStorage.getItem(DEPARTMENT_STORAGE_KEY);
    if (!stored) {
      this.saveLocalDepartments(DEFAULT_DEPARTMENTS);
      return DEFAULT_DEPARTMENTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_DEPARTMENTS;
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

  // Get single department
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
  async create(name: string, description?: string): Promise<Department> {
    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      
      // Check if name already exists
      if (departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Bu departman adı zaten kullanılıyor");
      }

      const newDepartment: Department = {
        id: `d${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      departments.push(newDepartment);
      this.saveLocalDepartments(departments);
      return newDepartment;
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          name,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error creating department in Supabase:", error);
      
      // Check for unique constraint error
      if (error.code === "23505") {
        throw new Error("Bu departman adı zaten kullanılıyor");
      }
      
      throw new Error("Departman oluşturulamadı: " + error.message);
    }
  }

  // Update department
  async update(id: string, name: string, description?: string): Promise<Department> {
    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      const index = departments.findIndex((d) => d.id === id);

      if (index === -1) {
        throw new Error("Departman bulunamadı");
      }

      // Check if new name conflicts with existing departments
      if (
        departments.some(
          (d) => d.id !== id && d.name.toLowerCase() === name.toLowerCase()
        )
      ) {
        throw new Error("Bu departman adı zaten kullanılıyor");
      }

      departments[index] = {
        ...departments[index],
        name,
        description,
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
          description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error updating department in Supabase:", error);
      
      if (error.code === "23505") {
        throw new Error("Bu departman adı zaten kullanılıyor");
      }
      
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
