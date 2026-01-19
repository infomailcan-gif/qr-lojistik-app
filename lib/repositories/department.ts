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
      const departments = JSON.parse(stored);
      // Eğer dizi boşsa, default departmanları geri yükle
      if (!Array.isArray(departments) || departments.length === 0) {
        this.saveLocalDepartments(DEFAULT_DEPARTMENTS);
        return DEFAULT_DEPARTMENTS;
      }
      return departments;
    } catch {
      this.saveLocalDepartments(DEFAULT_DEPARTMENTS);
      return DEFAULT_DEPARTMENTS;
    }
  }

  private saveLocalDepartments(departments: Department[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DEPARTMENT_STORAGE_KEY, JSON.stringify(departments));
    } catch (error) {
      console.error("Error saving departments to localStorage:", error);
    }
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
    // Validasyon
    if (!name || !name.trim()) {
      throw new Error("Departman adı gerekli");
    }

    const trimmedName = name.trim();

    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      
      // Check if name already exists (case insensitive)
      if (departments.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())) {
        throw new Error("Bu departman adı zaten kullanılıyor");
      }

      const newDepartment: Department = {
        id: `dept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: trimmedName,
        description: description || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      departments.push(newDepartment);
      this.saveLocalDepartments(departments);
      
      console.log("Department created locally:", newDepartment.name);
      return newDepartment;
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({
          name: trimmedName,
          description: description || "",
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
    // Validasyon
    if (!id) {
      throw new Error("Departman ID gerekli");
    }
    if (!name || !name.trim()) {
      throw new Error("Departman adı gerekli");
    }

    const trimmedName = name.trim();

    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      const index = departments.findIndex((d) => d.id === id);

      if (index === -1) {
        throw new Error("Departman bulunamadı");
      }

      // Check if new name conflicts with existing departments (case insensitive)
      if (
        departments.some(
          (d) => d.id !== id && d.name.toLowerCase() === trimmedName.toLowerCase()
        )
      ) {
        throw new Error("Bu departman adı zaten kullanılıyor");
      }

      departments[index] = {
        ...departments[index],
        name: trimmedName,
        description: description || departments[index].description,
        updated_at: new Date().toISOString(),
      };

      this.saveLocalDepartments(departments);
      
      console.log("Department updated locally:", departments[index].name);
      return departments[index];
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .update({
          name: trimmedName,
          description: description || "",
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
    // Validasyon
    if (!id) {
      throw new Error("Departman ID gerekli");
    }

    if (!isSupabaseConfigured || !supabase) {
      const departments = this.getLocalDepartments();
      const departmentToDelete = departments.find((d) => d.id === id);
      
      if (!departmentToDelete) {
        throw new Error("Departman bulunamadı");
      }

      // En az 1 departman kalmalı
      if (departments.length <= 1) {
        throw new Error("En az bir departman bulunmalıdır");
      }

      const filtered = departments.filter((d) => d.id !== id);
      this.saveLocalDepartments(filtered);
      
      console.log("Department deleted locally:", departmentToDelete.name);
      return;
    }

    try {
      // Önce bu departmanda koli var mı kontrol et
      const { data: boxes, error: boxError } = await supabase
        .from("boxes")
        .select("id")
        .eq("department_id", id)
        .limit(1);

      if (boxError) throw boxError;

      if (boxes && boxes.length > 0) {
        throw new Error("Bu departmana ait koliler var. Önce kolileri silin veya başka departmana taşıyın.");
      }

      // Bu departmanda kullanıcı var mı kontrol et
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("department_id", id)
        .limit(1);

      if (userError) throw userError;

      if (users && users.length > 0) {
        throw new Error("Bu departmana atanmış kullanıcılar var. Önce kullanıcıları başka departmana taşıyın.");
      }

      // Şimdi güvenle silebiliriz
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting department from Supabase:", error);
      
      // Foreign key hatası için özel mesaj
      if (error.code === "23503") {
        throw new Error("Bu departmana bağlı kayıtlar var. Önce kolileri ve kullanıcıları başka departmana taşıyın.");
      }
      
      throw new Error(error.message || "Departman silinemedi");
    }
  }

  // Reset departments to default (for debugging)
  resetToDefault(): void {
    this.saveLocalDepartments(DEFAULT_DEPARTMENTS);
    console.log("Departments reset to default");
  }
}

export const departmentRepository = new DepartmentRepository();
