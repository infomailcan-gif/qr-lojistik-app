import { supabase, isSupabaseConfigured } from "./supabase/client";

export type UserRole = "user" | "manager" | "super_admin";

export interface User {
  id: string;
  email?: string;
  name: string;
  username: string;
  role: UserRole;
  department_id: string;
  department_name: string;
}

// Mock user type for internal use
export interface MockUser extends User {
  password: string;
}

export interface AuthSession {
  user: User;
  token?: string;
}

// Mock users storage key
const MOCK_USERS_STORAGE_KEY = "qr_lojistik_users";

// Default predefined users for mock auth
const DEFAULT_MOCK_USERS: MockUser[] = [
  {
    id: "user-1",
    username: "ali",
    password: "123456",
    name: "Ali Yılmaz",
    role: "user" as UserRole,
    department_id: "dept-3",
    department_name: "IT",
  },
  {
    id: "user-2",
    username: "ayse",
    password: "123456",
    name: "Ayşe Demir",
    role: "user" as UserRole,
    department_id: "dept-1",
    department_name: "Restoran",
  },
  {
    id: "user-3",
    username: "mehmet",
    password: "123456",
    name: "Mehmet Kaya",
    role: "user" as UserRole,
    department_id: "dept-2",
    department_name: "Mutfak",
  },
  {
    id: "user-4",
    username: "fatma",
    password: "123456",
    name: "Fatma Şahin",
    role: "user" as UserRole,
    department_id: "dept-4",
    department_name: "Depo",
  },
  {
    id: "user-5",
    username: "admin",
    password: "admin123",
    name: "Sistem Yöneticisi",
    role: "manager" as UserRole,
    department_id: "dept-7",
    department_name: "Bilgi İşlem",
  },
  {
    id: "user-6",
    username: "can",
    password: "123456",
    name: "Can Özkan",
    role: "user" as UserRole,
    department_id: "dept-5",
    department_name: "Oyun Alanı",
  },
  {
    id: "user-7",
    username: "zeynep",
    password: "123456",
    name: "Zeynep Arslan",
    role: "user" as UserRole,
    department_id: "dept-6",
    department_name: "Yemekhane",
  },
  {
    id: "user-8",
    username: "burak",
    password: "123456",
    name: "Burak Çelik",
    role: "user" as UserRole,
    department_id: "dept-8",
    department_name: "Server Odası",
  },
  {
    id: "user-9",
    username: "superadmin",
    password: "super123",
    name: "Süper Yönetici",
    role: "super_admin" as UserRole,
    department_id: "dept-7",
    department_name: "Bilgi İşlem",
  },
];

// Helper to get/set mock users from localStorage
function getMockUsers(): MockUser[] {
  if (typeof window === "undefined") return DEFAULT_MOCK_USERS;
  const stored = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_USERS));
    return DEFAULT_MOCK_USERS;
  }
  return JSON.parse(stored);
}

function saveMockUsers(users: MockUser[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
  }
}

// Mock auth for development without Supabase
class MockAuth {
  private readonly STORAGE_KEY = "mock_auth_session";

  async signIn(username: string, password: string): Promise<AuthSession> {
    // Find user by username
    const users = getMockUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error("Kullanıcı adı veya şifre hatalı");
    }

    const session: AuthSession = {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
      },
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    }

    return session;
  }

  async signOut(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  // Get all available users (for admin purposes)
  getAvailableUsers(): Omit<MockUser, "password">[] {
    const users = getMockUsers();
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      department_id: u.department_id,
      department_name: u.department_name,
    }));
  }

  // Create a new user (super admin only)
  createUser(userData: {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    department_id: string;
    department_name: string;
  }): MockUser {
    const users = getMockUsers();
    
    // Check if username already exists
    if (users.find((u) => u.username.toLowerCase() === userData.username.toLowerCase())) {
      throw new Error("Bu kullanıcı adı zaten kullanılıyor");
    }

    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      ...userData,
    };

    users.push(newUser);
    saveMockUsers(users);
    return newUser;
  }

  // Update user (super admin only)
  updateUser(userId: string, updates: Partial<Omit<MockUser, "id">>): MockUser {
    const users = getMockUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error("Kullanıcı bulunamadı");
    }

    // If username is being changed, check it doesn't conflict
    if (updates.username && updates.username !== users[userIndex].username) {
      if (users.find((u) => u.username.toLowerCase() === updates.username!.toLowerCase())) {
        throw new Error("Bu kullanıcı adı zaten kullanılıyor");
      }
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    saveMockUsers(users);
    return users[userIndex];
  }

  // Delete user (super admin only)
  deleteUser(userId: string): void {
    const users = getMockUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error("Kullanıcı bulunamadı");
    }

    // Prevent deleting the last super admin
    const user = users[userIndex];
    if (user.role === "super_admin") {
      const superAdminCount = users.filter((u) => u.role === "super_admin").length;
      if (superAdminCount <= 1) {
        throw new Error("Son süper admin silinemez");
      }
    }

    users.splice(userIndex, 1);
    saveMockUsers(users);
  }

  // Get user by ID
  getUserById(userId: string): MockUser | null {
    const users = getMockUsers();
    return users.find((u) => u.id === userId) || null;
  }
}

// Supabase auth wrapper
class SupabaseAuth {
  async signIn(email: string, password: string): Promise<AuthSession | null> {
    if (!supabase) return null;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || "Login failed");
    }

    const role =
      (data.user.user_metadata?.role as UserRole) || ("user" as UserRole);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email || "User",
        username: data.user.user_metadata?.username || data.user.email || "user",
        role,
        department_id: data.user.user_metadata?.department_id || "",
        department_name: data.user.user_metadata?.department_name || "",
      },
      token: data.session?.access_token,
    };
  }

  async signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async getSession(): Promise<AuthSession | null> {
    if (!supabase) return null;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return null;

    const role =
      (session.user.user_metadata?.role as UserRole) || ("user" as UserRole);

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email || "User",
        username: session.user.user_metadata?.username || session.user.email || "user",
        role,
        department_id: session.user.user_metadata?.department_id || "",
        department_name: session.user.user_metadata?.department_name || "",
      },
      token: session.access_token,
    };
  }
}

// Export unified auth interface
// Force mock auth for local development
export const auth = new MockAuth();
export const usingMockAuth = true;

// Log auth mode on startup
if (typeof window !== "undefined") {
  console.log("🔐 Auth Mode: MOCK AUTH (Local Development)");
  console.log("📝 Available users: ali, ayse, mehmet, fatma, can, zeynep, burak");
  console.log("👨‍💼 Admin: admin/admin123");
  console.log("🔐 Super Admin: superadmin/super123");
}
