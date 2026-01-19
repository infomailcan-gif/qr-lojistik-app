// User Repository - Supabase with localStorage fallback
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { MockUser, UserRole } from "@/lib/auth";

const USERS_STORAGE_KEY = "qr_lojistik_users";

interface SupabaseUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  department_id: string;
  created_at: string;
  updated_at: string;
}

class UserRepository {
  // localStorage methods
  private getLocalUsers(): MockUser[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalUsers(users: MockUser[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  // Get all users (without password for display)
  async getAll(): Promise<Omit<MockUser, "password">[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getLocalUsers().map(({ password, ...user }) => user);
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          username,
          name,
          role,
          department_id,
          departments!users_department_id_fkey(name)
        `
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((user: any) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role as UserRole,
        department_id: user.department_id,
        department_name: user.departments?.name || "Unknown",
      }));
    } catch (error) {
      console.error("Error fetching users from Supabase:", error);
      // Fallback to localStorage
      return this.getLocalUsers().map(({ password, ...user }) => user);
    }
  }

  // Get user by username with password (for login)
  async getByUsername(
    username: string
  ): Promise<(MockUser & { department_name: string }) | null> {
    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      const user = users.find((u) => u.username === username);
      return user || null;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          *,
          departments!users_department_id_fkey(name)
        `
        )
        .eq("username", username)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        username: data.username,
        password: data.password,
        name: data.name,
        role: data.role as UserRole,
        department_id: data.department_id,
        department_name: data.departments?.name || "Unknown",
      };
    } catch (error) {
      console.error("Error fetching user from Supabase:", error);
      // Fallback to localStorage
      const users = this.getLocalUsers();
      const user = users.find((u) => u.username === username);
      return user || null;
    }
  }

  // Create user
  async create(userData: Omit<MockUser, "id">): Promise<MockUser> {
    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();

      // Check if username already exists
      if (users.some((u) => u.username === userData.username)) {
        throw new Error("Bu kullanıcı adı zaten kullanılıyor");
      }

      const newUser: MockUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...userData,
      };

      users.push(newUser);
      this.saveLocalUsers(users);
      return newUser;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          username: userData.username,
          password: userData.password,
          name: userData.name,
          role: userData.role,
          department_id: userData.department_id,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        username: data.username,
        password: data.password,
        name: data.name,
        role: data.role,
        department_id: data.department_id,
        department_name: userData.department_name,
      };
    } catch (error: any) {
      console.error("Error creating user in Supabase:", error);

      if (error.code === "23505") {
        throw new Error("Bu kullanıcı adı zaten kullanılıyor");
      }

      throw new Error("Kullanıcı oluşturulamadı: " + error.message);
    }
  }

  // Update user
  async update(
    userId: string,
    updates: Partial<Omit<MockUser, "id">>
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      const index = users.findIndex((u) => u.id === userId);

      if (index === -1) {
        throw new Error("Kullanıcı bulunamadı");
      }

      // Check if new username conflicts
      if (updates.username && updates.username !== users[index].username) {
        if (users.some((u) => u.username === updates.username)) {
          throw new Error("Bu kullanıcı adı zaten kullanılıyor");
        }
      }

      users[index] = { ...users[index], ...updates };
      this.saveLocalUsers(users);
      return;
    }

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.username) updateData.username = updates.username;
      if (updates.password) updateData.password = updates.password;
      if (updates.name) updateData.name = updates.name;
      if (updates.role) updateData.role = updates.role;
      if (updates.department_id)
        updateData.department_id = updates.department_id;

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating user in Supabase:", error);

      if (error.code === "23505") {
        throw new Error("Bu kullanıcı adı zaten kullanılıyor");
      }

      throw new Error("Kullanıcı güncellenemedi: " + error.message);
    }
  }

  // Delete user
  async delete(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      const filtered = users.filter((u) => u.id !== userId);

      if (filtered.length === users.length) {
        throw new Error("Kullanıcı bulunamadı");
      }

      this.saveLocalUsers(filtered);
      return;
    }

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error deleting user from Supabase:", error);
      throw new Error("Kullanıcı silinemedi: " + error.message);
    }
  }
}

export const userRepository = new UserRepository();


