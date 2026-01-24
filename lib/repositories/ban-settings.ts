// Ban Settings Repository - Supabase with localStorage fallback
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

const BAN_SETTINGS_STORAGE_KEY = "qr_lojistik_ban_settings";

export interface BanSettings {
  id: string;
  is_active: boolean;
  ban_message: string;
  ban_subtitle: string;
  redirect_url: string | null;
  show_redirect_button: boolean;
  redirect_button_text: string;
  video_url: string;
  updated_at?: string;
  updated_by?: string;
}

const DEFAULT_SETTINGS: BanSettings = {
  id: "default",
  is_active: true,
  ban_message: "Hesabınıza erişim yasaklanmıştır.",
  ban_subtitle: "Sistem yöneticisi ile iletişime geçiniz.",
  redirect_url: null,
  show_redirect_button: false,
  redirect_button_text: "Ana Sayfaya Git",
  video_url: "https://cdn.pixabay.com/video/2020/05/25/40130-424930923_large.mp4",
};

class BanSettingsRepository {
  private getLocalSettings(): BanSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;

    const stored = localStorage.getItem(BAN_SETTINGS_STORAGE_KEY);
    if (!stored) {
      this.saveLocalSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    try {
      return JSON.parse(stored);
    } catch {
      this.saveLocalSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  }

  private saveLocalSettings(settings: BanSettings): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(BAN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving ban settings to localStorage:", error);
    }
  }

  async get(): Promise<BanSettings> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getLocalSettings();
    }

    try {
      const { data, error } = await supabase
        .from("ban_settings")
        .select("*")
        .eq("id", "default")
        .single();

      if (error) {
        // If table doesn't exist or no record, return defaults
        if (error.code === "PGRST116" || error.code === "42P01") {
          return DEFAULT_SETTINGS;
        }
        throw error;
      }

      return {
        id: data.id,
        is_active: data.is_active ?? true,
        ban_message: data.ban_message ?? DEFAULT_SETTINGS.ban_message,
        ban_subtitle: data.ban_subtitle ?? DEFAULT_SETTINGS.ban_subtitle,
        redirect_url: data.redirect_url,
        show_redirect_button: data.show_redirect_button ?? false,
        redirect_button_text: data.redirect_button_text ?? DEFAULT_SETTINGS.redirect_button_text,
        video_url: data.video_url ?? DEFAULT_SETTINGS.video_url,
        updated_at: data.updated_at,
        updated_by: data.updated_by,
      };
    } catch (error) {
      console.error("Error fetching ban settings from Supabase:", error);
      return this.getLocalSettings();
    }
  }

  async update(updates: Partial<Omit<BanSettings, "id">>, updatedBy?: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const current = this.getLocalSettings();
      const updated = {
        ...current,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      };
      this.saveLocalSettings(updated);
      return;
    }

    try {
      const { error } = await supabase
        .from("ban_settings")
        .upsert({
          id: "default",
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating ban settings in Supabase:", error);
      throw new Error("Ban ayarları güncellenemedi: " + error.message);
    }
  }
}

export const banSettingsRepository = new BanSettingsRepository();
