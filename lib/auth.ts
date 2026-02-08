// Authentication System - Supabase with localStorage fallback
import { userRepository } from "@/lib/repositories/user";
import { loginLogRepository } from "@/lib/repositories/login-log";

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
const AUTO_LOGIN_LOGGED_KEY = "qr_lojistik_auto_login_logged";

class MockAuth {
  async login(username: string, password: string): Promise<Session> {
    const user = await userRepository.getByUsername(username);

    if (!user || user.password !== password) {
      // Başarısız giriş logu
      await loginLogRepository.logAction({
        user_id: null,
        username: username,
        user_name: "Bilinmeyen",
        department_name: null,
        action: "failed_login",
      });
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

    // Başarılı giriş logu
    await loginLogRepository.logAction({
      user_id: user.id,
      username: user.username,
      user_name: user.name,
      department_name: user.department_name,
      action: "login",
    });

    // Aktif oturum başlat - yeni giriş olduğu için forceNew: true
    await loginLogRepository.startSession({
      user_id: user.id,
      username: user.username,
      user_name: user.name,
      department_name: user.department_name,
      forceNew: true, // Gerçek login - süre sıfırdan başlar
    });

    return session;
  }

  async logout(): Promise<void> {
    // Çıkış logu
    const session = await this.getSession();
    if (session) {
      await loginLogRepository.logAction({
        user_id: session.user.id,
        username: session.user.username,
        user_name: session.user.name,
        department_name: session.user.department_name,
        action: "logout",
      });

      // Aktif oturumu sonlandır
      await loginLogRepository.endSession(session.user.id);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      // Otomatik giriş bayrağını temizle
      sessionStorage.removeItem(AUTO_LOGIN_LOGGED_KEY);
    }
  }

  // Alias for compatibility
  async signOut(): Promise<void> {
    return this.logout();
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

  // Aktivite güncelle (heartbeat) - sayfa açıkken düzenli çağrılacak
  async updateActivity(currentPage?: string, currentAction?: string): Promise<void> {
    const session = await this.getSession();
    if (session) {
      await loginLogRepository.updateActivity(session.user.id, currentPage, currentAction);
    }
  }

  // Oturum başlat veya güncelle - sayfa ilk yüklendiğinde çağrılacak
  async ensureSession(): Promise<void> {
    try {
      const session = await this.getSession();
      if (!session) return;

      // Auto-login logu - tarayıcı sekmesi/penceresi başına 1 kez
      // sessionStorage sekme kapandığında temizlenir, yeni sekme = yeni log
      if (typeof window !== "undefined") {
        const alreadyLoggedThisTab = sessionStorage.getItem(AUTO_LOGIN_LOGGED_KEY);
        
        if (!alreadyLoggedThisTab) {
          try {
            // auto_login logu kaydet - kullanıcı sisteme erişti (şifre girmeden)
            await loginLogRepository.logAction({
              user_id: session.user.id,
              username: session.user.username,
              user_name: session.user.name,
              department_name: session.user.department_name,
              action: "auto_login",
            });
            console.log("[Auth] auto_login logged for:", session.user.username);
          } catch (err) {
            console.error("[Auth] auto_login log failed:", err);
          }
          // Başarılı olsun olmasın, tekrar denemeyi engelle (bu sekme için)
          sessionStorage.setItem(AUTO_LOGIN_LOGGED_KEY, "true");
        }
      }

      // Aktif oturum başlat/güncelle (forceNew yok - mevcut süreyi korur)
      try {
        await loginLogRepository.startSession({
          user_id: session.user.id,
          username: session.user.username,
          user_name: session.user.name,
          department_name: session.user.department_name,
        });
      } catch (err) {
        console.error("[Auth] startSession failed:", err);
      }
    } catch (err) {
      console.error("[Auth] ensureSession failed:", err);
    }
  }
}

export const auth = new MockAuth();
