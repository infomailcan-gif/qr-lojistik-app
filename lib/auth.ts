// Authentication System - Supabase with localStorage fallback
import { userRepository } from "@/lib/repositories/user";

export type UserRole = "user" | "manager" | "super_admin";

export interface MockUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  department_id: string;
  department_name: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department_id: string;
  department_name: string;
}

export interface Session {
  user: User;
}

const SESSION_STORAGE_KEY = "qr_lojistik_session";

class MockAuth {
  async login(username: string, password: string): Promise<Session> {
    const user = await userRepository.getByUsername(username);

    if (!user || user.password !== password) {
      throw new Error("Kullanıcı adı veya şifre hatalı");
    }

    const session: Session = {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
      },
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    return session;
  }

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  async getSession(): Promise<Session | null> {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  // User Management Functions (for super_admin)
  async getAvailableUsers(): Promise<Omit<MockUser, "password">[]> {
    return await userRepository.getAll();
  }

  async createUser(userData: Omit<MockUser, "id">): Promise<void> {
    await userRepository.create(userData);
  }

  async updateUser(
    userId: string,
    updates: Partial<Omit<MockUser, "id">>
  ): Promise<void> {
    await userRepository.update(userId, updates);

    // If current user is being updated, update session
    const session = await this.getSession();
    if (session && session.user.id === userId) {
      const user = await userRepository.getAll();
      const updatedUser = user.find((u) => u.id === userId);

      if (updatedUser) {
        const updatedSession: Session = {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            role: updatedUser.role,
            department_id: updatedUser.department_id,
            department_name: updatedUser.department_name,
          },
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify(updatedSession)
          );
        }
      }
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Don't allow deleting yourself
    const session = await this.getSession();
    if (session && session.user.id === userId) {
      throw new Error("Kendi hesabınızı silemezsiniz");
    }

    await userRepository.delete(userId);
  }
}

export const auth = new MockAuth();
