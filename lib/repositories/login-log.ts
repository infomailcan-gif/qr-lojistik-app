// Login Log Repository - Giriş/çıkış logları için
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const LOGIN_LOGS_STORAGE_KEY = "qr_lojistik_login_logs";
const ACTIVE_SESSIONS_STORAGE_KEY = "qr_lojistik_active_sessions";

export type LoginAction = "login" | "logout" | "failed_login" | "auto_login";

export interface LoginLog {
  id: string;
  user_id: string | null;
  username: string;
  user_name: string;
  department_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  action: LoginAction;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  user_id: string;
  username: string;
  user_name: string;
  department_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_activity: string;
  created_at: string;
  current_page?: string;
  current_action?: string;
}

class LoginLogRepository {
  // ====== LOGIN LOGS ======
  
  private getLocalLogs(): LoginLog[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(LOGIN_LOGS_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalLogs(logs: LoginLog[]): void {
    if (typeof window === "undefined") return;
    try {
      // Son 1000 kaydı tut
      const trimmed = logs.slice(-1000);
      localStorage.setItem(LOGIN_LOGS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error("Error saving login logs to localStorage:", error);
    }
  }

  // IP adresi al (client-side)
  async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }

  // Log kaydet
  async logAction(params: {
    user_id: string | null;
    username: string;
    user_name: string;
    department_name?: string | null;
    action: LoginAction;
  }): Promise<void> {
    const ip_address = await this.getClientIP();
    const user_agent = typeof window !== "undefined" ? navigator.userAgent : null;

    if (!isSupabaseConfigured || !supabase) {
      const logs = this.getLocalLogs();
      const newLog: LoginLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: params.user_id,
        username: params.username,
        user_name: params.user_name,
        department_name: params.department_name || null,
        ip_address,
        user_agent,
        action: params.action,
        created_at: new Date().toISOString(),
      };
      logs.push(newLog);
      this.saveLocalLogs(logs);
      return;
    }

    try {
      const { error } = await supabase.from("login_logs").insert({
        user_id: params.user_id,
        username: params.username,
        user_name: params.user_name,
        department_name: params.department_name,
        ip_address,
        user_agent,
        action: params.action,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error logging action to Supabase:", error);
      // Fallback to localStorage
      const logs = this.getLocalLogs();
      const newLog: LoginLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: params.user_id,
        username: params.username,
        user_name: params.user_name,
        department_name: params.department_name || null,
        ip_address,
        user_agent,
        action: params.action,
        created_at: new Date().toISOString(),
      };
      logs.push(newLog);
      this.saveLocalLogs(logs);
    }
  }

  // Logları getir
  async getLogs(options?: {
    limit?: number;
    action?: LoginAction;
    username?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<LoginLog[]> {
    const limit = options?.limit || 100;

    if (!isSupabaseConfigured || !supabase) {
      let logs = this.getLocalLogs();
      
      // Filtrele
      if (options?.action) {
        logs = logs.filter(l => l.action === options.action);
      }
      if (options?.username) {
        const searchTerm = options.username.toLowerCase();
        logs = logs.filter(l => 
          l.username.toLowerCase().includes(searchTerm) ||
          l.user_name.toLowerCase().includes(searchTerm)
        );
      }
      if (options?.startDate) {
        logs = logs.filter(l => new Date(l.created_at) >= options.startDate!);
      }
      if (options?.endDate) {
        logs = logs.filter(l => new Date(l.created_at) <= options.endDate!);
      }
      
      // Tarihe göre sırala (en yeni en üstte)
      logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return logs.slice(0, limit);
    }

    try {
      let query = supabase
        .from("login_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (options?.action) {
        query = query.eq("action", options.action);
      }
      if (options?.username) {
        // Hem username hem user_name üzerinde arama yap
        query = query.or(`username.ilike.%${options.username}%,user_name.ilike.%${options.username}%`);
      }
      if (options?.startDate) {
        query = query.gte("created_at", options.startDate.toISOString());
      }
      if (options?.endDate) {
        query = query.lte("created_at", options.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching login logs from Supabase:", error);
      return this.getLocalLogs().slice(0, limit);
    }
  }

  // Tüm logları temizle
  async clearLogs(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStorage.removeItem(LOGIN_LOGS_STORAGE_KEY);
      return;
    }

    try {
      // Son 30 günden eski logları sil
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error } = await supabase
        .from("login_logs")
        .delete()
        .lt("created_at", thirtyDaysAgo.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error("Error clearing login logs:", error);
    }
  }

  // ====== ACTIVE SESSIONS ======

  private getLocalSessions(): ActiveSession[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(ACTIVE_SESSIONS_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalSessions(sessions: ActiveSession[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ACTIVE_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error saving sessions to localStorage:", error);
    }
  }

  // Oturum başlat veya güncelle - mevcut session varsa sadece last_activity güncellenir
  async startSession(params: {
    user_id: string;
    username: string;
    user_name: string;
    department_name?: string | null;
    forceNew?: boolean; // Yeni giriş için true gönderilir
  }): Promise<void> {
    const ip_address = await this.getClientIP();
    const user_agent = typeof window !== "undefined" ? navigator.userAgent : null;
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const sessions = this.getLocalSessions();
      const existingIndex = sessions.findIndex(s => s.user_id === params.user_id);
      
      if (existingIndex >= 0 && !params.forceNew) {
        // Mevcut session varsa sadece last_activity ve IP/user_agent güncelle
        sessions[existingIndex].last_activity = now;
        sessions[existingIndex].ip_address = ip_address;
        sessions[existingIndex].user_agent = user_agent;
        this.saveLocalSessions(sessions);
        return;
      }
      
      // Mevcut session yoksa veya forceNew ise yeni oluştur
      const filteredSessions = sessions.filter(s => s.user_id !== params.user_id);
      const session: ActiveSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: params.user_id,
        username: params.username,
        user_name: params.user_name,
        department_name: params.department_name || null,
        ip_address,
        user_agent,
        last_activity: now,
        created_at: now,
      };

      filteredSessions.push(session);
      this.saveLocalSessions(filteredSessions);
      return;
    }

    try {
      // Önce mevcut oturumu kontrol et
      const { data: existing } = await supabase
        .from("active_sessions")
        .select("id, created_at")
        .eq("user_id", params.user_id)
        .single();

      if (existing && !params.forceNew) {
        // Mevcut oturum varsa sadece last_activity ve IP/user_agent güncelle (created_at korunur)
        await supabase
          .from("active_sessions")
          .update({
            last_activity: now,
            ip_address,
            user_agent,
            username: params.username,
            user_name: params.user_name,
            department_name: params.department_name,
          })
          .eq("user_id", params.user_id);
      } else {
        // Mevcut oturum yoksa veya forceNew ise yeni oluştur
        // Önce eski oturumu sil (varsa)
        await supabase
          .from("active_sessions")
          .delete()
          .eq("user_id", params.user_id);

        // Yeni oturum oluştur
        await supabase.from("active_sessions").insert({
          user_id: params.user_id,
          username: params.username,
          user_name: params.user_name,
          department_name: params.department_name,
          ip_address,
          user_agent,
          last_activity: now,
        });
      }
    } catch (error) {
      console.error("Error managing session in Supabase:", error);
    }
  }

  // Aktivite güncelle (heartbeat) - sayfa ve işlem bilgisi ile
  async updateActivity(user_id: string, currentPage?: string, currentAction?: string): Promise<void> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const sessions = this.getLocalSessions();
      const session = sessions.find(s => s.user_id === user_id);
      if (session) {
        session.last_activity = now;
        if (currentPage) session.current_page = currentPage;
        if (currentAction) session.current_action = currentAction;
        this.saveLocalSessions(sessions);
      }
      return;
    }

    try {
      const updateData: any = { last_activity: now };
      if (currentPage) updateData.current_page = currentPage;
      if (currentAction) updateData.current_action = currentAction;
      
      await supabase
        .from("active_sessions")
        .update(updateData)
        .eq("user_id", user_id);
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  }

  // Oturumu sonlandır
  async endSession(user_id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const sessions = this.getLocalSessions();
      const filtered = sessions.filter(s => s.user_id !== user_id);
      this.saveLocalSessions(filtered);
      return;
    }

    try {
      await supabase.from("active_sessions").delete().eq("user_id", user_id);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }

  // Aktif oturumları getir
  async getActiveSessions(): Promise<ActiveSession[]> {
    // Son 5 dakika içinde aktif olanları getir
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    if (!isSupabaseConfigured || !supabase) {
      const sessions = this.getLocalSessions();
      return sessions.filter(s => new Date(s.last_activity) >= fiveMinutesAgo);
    }

    try {
      const { data, error } = await supabase
        .from("active_sessions")
        .select("*")
        .gte("last_activity", fiveMinutesAgo.toISOString())
        .order("last_activity", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      const sessions = this.getLocalSessions();
      return sessions.filter(s => new Date(s.last_activity) >= fiveMinutesAgo);
    }
  }

  // Eski oturumları temizle
  async cleanupOldSessions(): Promise<void> {
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    if (!isSupabaseConfigured || !supabase) {
      const sessions = this.getLocalSessions();
      const active = sessions.filter(s => new Date(s.last_activity) >= tenMinutesAgo);
      this.saveLocalSessions(active);
      return;
    }

    try {
      await supabase
        .from("active_sessions")
        .delete()
        .lt("last_activity", tenMinutesAgo.toISOString());
    } catch (error) {
      console.error("Error cleaning up old sessions:", error);
    }
  }

  // İstatistikler
  async getStats(): Promise<{
    totalLogins24h: number;
    uniqueUsers24h: number;
    failedLogins24h: number;
    activeNow: number;
  }> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    if (!isSupabaseConfigured || !supabase) {
      const logs = this.getLocalLogs();
      const last24h = logs.filter(l => new Date(l.created_at) >= twentyFourHoursAgo);
      const sessions = await this.getActiveSessions();

      // login ve auto_login'i birlikte say
      const loginActions = last24h.filter(l => l.action === "login" || l.action === "auto_login");

      return {
        totalLogins24h: loginActions.length,
        uniqueUsers24h: new Set(loginActions.map(l => l.username)).size,
        failedLogins24h: last24h.filter(l => l.action === "failed_login").length,
        activeNow: sessions.length,
      };
    }

    try {
      // Son 24 saat giriş sayısı (login + auto_login)
      const { count: loginCount } = await supabase
        .from("login_logs")
        .select("*", { count: "exact", head: true })
        .in("action", ["login", "auto_login"])
        .gte("created_at", twentyFourHoursAgo.toISOString());

      // Başarısız giriş sayısı
      const { count: failedCount } = await supabase
        .from("login_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "failed_login")
        .gte("created_at", twentyFourHoursAgo.toISOString());

      // Benzersiz kullanıcı sayısı (login + auto_login)
      const { data: uniqueData } = await supabase
        .from("login_logs")
        .select("username")
        .in("action", ["login", "auto_login"])
        .gte("created_at", twentyFourHoursAgo.toISOString());

      const uniqueUsers = new Set(uniqueData?.map(d => d.username) || []).size;

      // Aktif oturum sayısı
      const sessions = await this.getActiveSessions();

      return {
        totalLogins24h: loginCount || 0,
        uniqueUsers24h: uniqueUsers,
        failedLogins24h: failedCount || 0,
        activeNow: sessions.length,
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return {
        totalLogins24h: 0,
        uniqueUsers24h: 0,
        failedLogins24h: 0,
        activeNow: 0,
      };
    }
  }
}

export const loginLogRepository = new LoginLogRepository();

