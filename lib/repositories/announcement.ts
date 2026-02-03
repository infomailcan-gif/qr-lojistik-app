// Announcement Repository - Duyuru ve kayan yazı sistemi
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const ANNOUNCEMENT_STORAGE_KEY = "qr_lojistik_announcement";

export interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
  marquee_speed: "slow" | "normal" | "fast";
  background_color: string;
  text_color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

class AnnouncementRepository {
  // Default duyuru ayarları
  private getDefaultAnnouncement(): Announcement {
    return {
      id: "default-announcement",
      message: "",
      is_active: false,
      marquee_speed: "normal",
      background_color: "#3b82f6", // blue-500
      text_color: "#ffffff",
      created_by: "System",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Local storage'dan duyuruyu al
  private getLocalAnnouncement(): Announcement {
    if (typeof window === "undefined") return this.getDefaultAnnouncement();
    const stored = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    if (!stored) return this.getDefaultAnnouncement();
    try {
      return JSON.parse(stored);
    } catch {
      return this.getDefaultAnnouncement();
    }
  }

  // Local storage'a kaydet
  private saveLocalAnnouncement(announcement: Announcement): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(announcement));
    } catch (error) {
      console.error("Error saving announcement to localStorage:", error);
    }
  }

  // Aktif duyuruyu getir
  async getAnnouncement(): Promise<Announcement> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getLocalAnnouncement();
    }

    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("id", "main-announcement")
        .single();

      if (error) {
        // Eğer kayıt yoksa varsayılanı döndür
        if (error.code === "PGRST116") {
          return this.getDefaultAnnouncement();
        }
        throw error;
      }

      return data as Announcement;
    } catch (error) {
      console.error("Error fetching announcement from Supabase:", error);
      return this.getLocalAnnouncement();
    }
  }

  // Duyuruyu güncelle
  async updateAnnouncement(params: {
    message: string;
    is_active: boolean;
    marquee_speed?: "slow" | "normal" | "fast";
    background_color?: string;
    text_color?: string;
    updated_by: string;
  }): Promise<boolean> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const current = this.getLocalAnnouncement();
      const updated: Announcement = {
        ...current,
        message: params.message,
        is_active: params.is_active,
        marquee_speed: params.marquee_speed || current.marquee_speed,
        background_color: params.background_color || current.background_color,
        text_color: params.text_color || current.text_color,
        created_by: params.updated_by,
        updated_at: now,
      };
      this.saveLocalAnnouncement(updated);
      return true;
    }

    try {
      const { error } = await supabase
        .from("announcements")
        .upsert({
          id: "main-announcement",
          message: params.message,
          is_active: params.is_active,
          marquee_speed: params.marquee_speed || "normal",
          background_color: params.background_color || "#3b82f6",
          text_color: params.text_color || "#ffffff",
          created_by: params.updated_by,
          updated_at: now,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating announcement in Supabase:", error);
      // Fallback to localStorage
      const current = this.getLocalAnnouncement();
      const updated: Announcement = {
        ...current,
        message: params.message,
        is_active: params.is_active,
        marquee_speed: params.marquee_speed || current.marquee_speed,
        background_color: params.background_color || current.background_color,
        text_color: params.text_color || current.text_color,
        created_by: params.updated_by,
        updated_at: now,
      };
      this.saveLocalAnnouncement(updated);
      return true;
    }
  }

  // Duyuruyu aktifleştir/deaktifle
  async toggleActive(is_active: boolean, updated_by: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const current = this.getLocalAnnouncement();
      current.is_active = is_active;
      current.updated_at = new Date().toISOString();
      current.created_by = updated_by;
      this.saveLocalAnnouncement(current);
      return true;
    }

    try {
      const { error } = await supabase
        .from("announcements")
        .update({
          is_active,
          updated_at: new Date().toISOString(),
          created_by: updated_by,
        })
        .eq("id", "main-announcement");

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error toggling announcement in Supabase:", error);
      // Fallback
      const current = this.getLocalAnnouncement();
      current.is_active = is_active;
      current.updated_at = new Date().toISOString();
      current.created_by = updated_by;
      this.saveLocalAnnouncement(current);
      return true;
    }
  }

  // Sadece mesajı güncelle
  async updateMessage(message: string, updated_by: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const current = this.getLocalAnnouncement();
      current.message = message;
      current.updated_at = new Date().toISOString();
      current.created_by = updated_by;
      this.saveLocalAnnouncement(current);
      return true;
    }

    try {
      const { error } = await supabase
        .from("announcements")
        .update({
          message,
          updated_at: new Date().toISOString(),
          created_by: updated_by,
        })
        .eq("id", "main-announcement");

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating message in Supabase:", error);
      // Fallback
      const current = this.getLocalAnnouncement();
      current.message = message;
      current.updated_at = new Date().toISOString();
      current.created_by = updated_by;
      this.saveLocalAnnouncement(current);
      return true;
    }
  }
}

export const announcementRepository = new AnnouncementRepository();
