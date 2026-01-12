import { Department } from "../types/box";
import { supabase, isSupabaseConfigured } from "../supabase/client";

// Seed data
const SEED_DEPARTMENTS = [
  "Restoran",
  "Mutfak",
  "IT",
  "Depo",
  "Oyun Alanı",
  "Yemekhane",
  "Bilgi İşlem",
  "Server Odası",
];

class DepartmentRepository {
  private localKey = "qr_lojistik_departments";

  // Generate seed departments for local storage
  private generateSeedDepartments(): Department[] {
    return SEED_DEPARTMENTS.map((name, index) => ({
      id: `dept-${index + 1}`,
      name,
      created_at: new Date().toISOString(),
    }));
  }

  // Get from localStorage
  private getLocalDepartments(): Department[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(this.localKey);
    if (!stored) {
      const seed = this.generateSeedDepartments();
      localStorage.setItem(this.localKey, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(stored);
  }

  // Save to localStorage
  private saveLocalDepartments(departments: Department[]): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.localKey, JSON.stringify(departments));
    }
  }

  // Get all departments
  async getAll(): Promise<Department[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    }
    
    // Fallback to local storage
    return this.getLocalDepartments();
  }

  // Get by ID
  async getById(id: string): Promise<Department | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) return null;
      return data;
    }
    
    const departments = this.getLocalDepartments();
    return departments.find((d) => d.id === id) || null;
  }

  // Create a new department
  async create(name: string): Promise<Department> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("departments")
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    
    // Local storage implementation
    const departments = this.getLocalDepartments();
    
    // Check if department name already exists
    if (departments.find((d) => d.name.toLowerCase() === name.toLowerCase())) {
      throw new Error("Bu departman adı zaten kullanılıyor");
    }

    const newDepartment: Department = {
      id: `dept-${Date.now()}`,
      name,
      created_at: new Date().toISOString(),
    };

    departments.push(newDepartment);
    this.saveLocalDepartments(departments);
    return newDepartment;
  }

  // Update a department
  async update(id: string, name: string): Promise<Department> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("departments")
        .update({ name })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    
    // Local storage implementation
    const departments = this.getLocalDepartments();
    const index = departments.findIndex((d) => d.id === id);
    
    if (index === -1) {
      throw new Error("Departman bulunamadı");
    }

    // Check if department name already exists (excluding current)
    if (departments.find((d) => d.name.toLowerCase() === name.toLowerCase() && d.id !== id)) {
      throw new Error("Bu departman adı zaten kullanılıyor");
    }

    departments[index] = { ...departments[index], name };
    this.saveLocalDepartments(departments);
    return departments[index];
  }

  // Delete a department
  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return;
    }
    
    // Local storage implementation
    const departments = this.getLocalDepartments();
    const index = departments.findIndex((d) => d.id === id);
    
    if (index === -1) {
      throw new Error("Departman bulunamadı");
    }

    departments.splice(index, 1);
    this.saveLocalDepartments(departments);
  }

  // Seed database (for Supabase initial setup)
  async seedDatabase(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase not configured");
    }

    // Check if already seeded
    const { data: existing } = await supabase
      .from("departments")
      .select("id")
      .limit(1);

    if (existing && existing.length > 0) {
      return; // Already seeded
    }

    const departments = SEED_DEPARTMENTS.map((name) => ({ name }));
    const { error } = await supabase.from("departments").insert(departments);
    
    if (error) throw error;
  }
}

export const departmentRepository = new DepartmentRepository();

