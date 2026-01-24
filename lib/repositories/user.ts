// User Repository - Supabase with localStorage fallback
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { MockUser, UserRole } from "@/lib/auth";

const USERS_STORAGE_KEY = "qr_lojistik_users";

export interface UserWithBan extends MockUser {
  is_banned?: boolean;
  ban_reason?: string;
  banned_at?: string;
  banned_by?: string;
}

// Default users - aynı supabase-setup.sql'deki gibi
const DEFAULT_USERS: UserWithBan[] = [
  {
    id: "u1111111-1111-1111-1111-111111111111",
    username: "admin",
    password: "admin123",
    name: "Sistem Yöneticisi",
    role: "super_admin",
    department_id: "d3333333-3333-3333-3333-333333333333",
    department_name: "IT",
    is_banned: false,
  },
  {
    id: "u2222222-2222-2222-2222-222222222222",
    username: "mudur",
    password: "mudur123",
    name: "Ahmet Müdür",
    role: "manager",
    department_id: "d4444444-4444-4444-4444-444444444444",
    department_name: "Depo",
    is_banned: false,
  },
  {
    id: "u3333333-3333-3333-3333-333333333333",
    username: "depo1",
    password: "depo123",
    name: "Mehmet Depocu",
    role: "user",
    department_id: "d4444444-4444-4444-4444-444444444444",
    department_name: "Depo",
    is_banned: false,
  },
  {
    id: "u4444444-4444-4444-4444-444444444444",
    username: "restoran1",
    password: "restoran123",
    name: "Ali Restoran",
    role: "user",
    department_id: "d1111111-1111-1111-1111-111111111111",
    department_name: "Restoran",
    is_banned: false,
  },
];

class UserRepository {
  // localStorage methods
  private getLocalUsers(): UserWithBan[] {
    if (typeof window === "undefined") return DEFAULT_USERS;
    
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      // İlk kez açılıyor, default kullanıcıları kaydet
      this.saveLocalUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
    
    try {
      const users = JSON.parse(stored);
      // Eğer dizi boşsa, default kullanıcıları geri yükle
      if (!Array.isArray(users) || users.length === 0) {
        this.saveLocalUsers(DEFAULT_USERS);
        return DEFAULT_USERS;
      }
      return users;
    } catch {
      this.saveLocalUsers(DEFAULT_USERS);
      return DEFAULT_USERS;
    }
  }

  private saveLocalUsers(users: UserWithBan[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users to localStorage:", error);
    }
  }

  // Get all users (without password for display)
  async getAll(): Promise<Omit<UserWithBan, "password">[]> {
    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      return users.map(({ password, ...user }) => user);
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
          is_banned,
          ban_reason,
          banned_at,
          banned_by,
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
        is_banned: user.is_banned ?? false,
        ban_reason: user.ban_reason,
        banned_at: user.banned_at,
        banned_by: user.banned_by,
      }));
    } catch (error) {
      console.error("Error fetching users from Supabase:", error);
      // Fallback to localStorage
      const users = this.getLocalUsers();
      return users.map(({ password, ...user }) => user);
    }
  }

  // Get user by username with password (for login)
  async getByUsername(
    username: string
  ): Promise<(UserWithBan & { department_name: string }) | null> {
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
        is_banned: data.is_banned ?? false,
        ban_reason: data.ban_reason,
        banned_at: data.banned_at,
        banned_by: data.banned_by,
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
    // Validasyon
    if (!userData.username || !userData.username.trim()) {
      throw new Error("Kullanıcı adı gerekli");
    }
    if (!userData.password || !userData.password.trim()) {
      throw new Error("Şifre gerekli");
    }
    if (!userData.name || !userData.name.trim()) {
      throw new Error("Ad soyad gerekli");
    }
    if (!userData.department_id) {
      throw new Error("Departman seçimi gerekli");
    }

    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();

      // Check if username already exists
      if (users.some((u) => u.username.toLowerCase() === userData.username.toLowerCase())) {
        throw new Error("Bu kullanıcı adı zaten kullanılıyor");
      }

      const newUser: MockUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: userData.username.trim(),
        password: userData.password,
        name: userData.name.trim(),
        role: userData.role,
        department_id: userData.department_id,
        department_name: userData.department_name,
      };

      users.push(newUser);
      this.saveLocalUsers(users);
      
      console.log("User created locally:", newUser.username);
      return newUser;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          username: userData.username.trim(),
          password: userData.password,
          name: userData.name.trim(),
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
    if (!userId) {
      throw new Error("Kullanıcı ID gerekli");
    }

    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      const index = users.findIndex((u) => u.id === userId);

      if (index === -1) {
        throw new Error("Kullanıcı bulunamadı");
      }

      // Check if new username conflicts
      if (updates.username && updates.username !== users[index].username) {
        if (users.some((u) => u.username.toLowerCase() === updates.username!.toLowerCase())) {
          throw new Error("Bu kullanıcı adı zaten kullanılıyor");
        }
      }

      users[index] = { ...users[index], ...updates };
      this.saveLocalUsers(users);
      
      console.log("User updated locally:", users[index].username);
      return;
    }

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.username) updateData.username = updates.username.trim();
      if (updates.password) updateData.password = updates.password;
      if (updates.name) updateData.name = updates.name.trim();
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
    if (!userId) {
      throw new Error("Kullanıcı ID gerekli");
    }

    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      const userToDelete = users.find((u) => u.id === userId);
      
      if (!userToDelete) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const filtered = users.filter((u) => u.id !== userId);
      this.saveLocalUsers(filtered);
      
      console.log("User deleted locally:", userToDelete.username);
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

  // Reset users to default (for debugging)
  resetToDefault(): void {
    this.saveLocalUsers(DEFAULT_USERS);
    console.log("Users reset to default");
  }

  // Ban a user
  async banUser(userId: string, reason: string, bannedBy: string): Promise<void> {
    if (!userId) {
      throw new Error("Kullanıcı ID gerekli");
    }

    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      const index = users.findIndex((u) => u.id === userId);

      if (index === -1) {
        throw new Error("Kullanıcı bulunamadı");
      }

      // Don't allow banning super_admin
      if (users[index].role === "super_admin") {
        throw new Error("Süper admin kullanıcıları yasaklanamaz");
      }

      users[index] = {
        ...users[index],
        is_banned: true,
        ban_reason: reason,
        banned_at: new Date().toISOString(),
        banned_by: bannedBy,
      };
      this.saveLocalUsers(users);
      console.log("User banned locally:", users[index].username);
      return;
    }

    try {
      // First check if user is super_admin
      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (user?.role === "super_admin") {
        throw new Error("Süper admin kullanıcıları yasaklanamaz");
      }

      const { error } = await supabase
        .from("users")
        .update({
          is_banned: true,
          ban_reason: reason,
          banned_at: new Date().toISOString(),
          banned_by: bannedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error banning user in Supabase:", error);
      throw new Error(error.message || "Kullanıcı yasaklanamadı");
    }
  }

  // Unban a user
  async unbanUser(userId: string): Promise<void> {
    if (!userId) {
      throw new Error("Kullanıcı ID gerekli");
    }

    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      const index = users.findIndex((u) => u.id === userId);

      if (index === -1) {
        throw new Error("Kullanıcı bulunamadı");
      }

      users[index] = {
        ...users[index],
        is_banned: false,
        ban_reason: undefined,
        banned_at: undefined,
        banned_by: undefined,
      };
      this.saveLocalUsers(users);
      console.log("User unbanned locally:", users[index].username);
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_banned: false,
          ban_reason: null,
          banned_at: null,
          banned_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error unbanning user in Supabase:", error);
      throw new Error("Kullanıcı yasağı kaldırılamadı: " + error.message);
    }
  }

  // Get banned users only
  async getBannedUsers(): Promise<Omit<UserWithBan, "password">[]> {
    const allUsers = await this.getAll();
    return allUsers.filter((u) => u.is_banned);
  }

  // Check if user is banned by ID
  async isUserBanned(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const users = this.getLocalUsers();
      const user = users.find((u) => u.id === userId);
      return user?.is_banned ?? false;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("is_banned")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data?.is_banned ?? false;
    } catch (error) {
      console.error("Error checking ban status:", error);
      return false;
    }
  }
}

export const userRepository = new UserRepository();
