// Popup Announcement Repository - Duyuru popup sistemi
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const POPUP_STORAGE_KEY = "qr_lojistik_popup_announcement";

export interface PopupAnnouncement {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

class PopupAnnouncementRepository {
  // Default popup ayarları
  private getDefaultPopup(): PopupAnnouncement {
    return {
      id: "main-popup",
      title: "",
      image_url: "",
      is_active: false,
      created_by: "System",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Local storage'dan popup'ı al
  private getLocalPopup(): PopupAnnouncement {
    if (typeof window === "undefined") return this.getDefaultPopup();
    const stored = localStorage.getItem(POPUP_STORAGE_KEY);
    if (!stored) return this.getDefaultPopup();
    try {
      return JSON.parse(stored);
    } catch {
      return this.getDefaultPopup();
    }
  }

  // Local storage'a kaydet
  private saveLocalPopup(popup: PopupAnnouncement): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(popup));
    } catch (error) {
      console.error("Error saving popup to localStorage:", error);
    }
  }

  // Aktif popup'ı getir
  async getPopup(): Promise<PopupAnnouncement> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getLocalPopup();
    }

    try {
      const { data, error } = await supabase
        .from("popup_announcements")
        .select("*")
        .eq("id", "main-popup")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return this.getDefaultPopup();
        }
        throw error;
      }

      return data as PopupAnnouncement;
    } catch (error) {
      console.error("Error fetching popup from Supabase:", error);
      return this.getLocalPopup();
    }
  }

  // Popup'ı güncelle
  async updatePopup(params: {
    title: string;
    image_url: string;
    is_active: boolean;
    updated_by: string;
  }): Promise<boolean> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const current = this.getLocalPopup();
      const updated: PopupAnnouncement = {
        ...current,
        title: params.title,
        image_url: params.image_url,
        is_active: params.is_active,
        created_by: params.updated_by,
        updated_at: now,
      };
      this.saveLocalPopup(updated);
      return true;
    }

    try {
      const { error } = await supabase
        .from("popup_announcements")
        .upsert({
          id: "main-popup",
          title: params.title,
          image_url: params.image_url,
          is_active: params.is_active,
          created_by: params.updated_by,
          updated_at: now,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating popup in Supabase:", error);
      // Fallback to localStorage
      const current = this.getLocalPopup();
      const updated: PopupAnnouncement = {
        ...current,
        title: params.title,
        image_url: params.image_url,
        is_active: params.is_active,
        created_by: params.updated_by,
        updated_at: now,
      };
      this.saveLocalPopup(updated);
      return true;
    }
  }

  // Popup'ı aktifle/deaktiflestir
  async toggleActive(is_active: boolean, updated_by: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) {
      const current = this.getLocalPopup();
      current.is_active = is_active;
      current.updated_at = new Date().toISOString();
      current.created_by = updated_by;
      this.saveLocalPopup(current);
      return true;
    }

    try {
      const { data: existing } = await supabase
        .from("popup_announcements")
        .select("*")
        .eq("id", "main-popup")
        .single();

      if (existing) {
        const { error } = await supabase
          .from("popup_announcements")
          .update({
            is_active,
            updated_at: new Date().toISOString(),
            created_by: updated_by,
          })
          .eq("id", "main-popup");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("popup_announcements")
          .upsert({
            id: "main-popup",
            title: "",
            image_url: "",
            is_active,
            created_by: updated_by,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error("Error toggling popup in Supabase:", error);
      const current = this.getLocalPopup();
      current.is_active = is_active;
      current.updated_at = new Date().toISOString();
      current.created_by = updated_by;
      this.saveLocalPopup(current);
      return true;
    }
  }
}

export const popupAnnouncementRepository = new PopupAnnouncementRepository();
