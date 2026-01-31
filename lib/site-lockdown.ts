import { supabase } from "@/lib/supabase/client";

export interface SiteLockdownSettings {
  id: string;
  is_active: boolean;
  lockdown_message: string;
  lockdown_subtitle: string;
  activated_at: string | null;
  activated_by: string | null;
  updated_at: string;
}

export const siteLockdown = {
  /**
   * Lockdown durumunu kontrol et
   */
  async isActive(): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { data, error } = await supabase
        .from("site_lockdown")
        .select("is_active")
        .eq("id", "default")
        .single();
      
      if (error) {
        console.error("Error checking lockdown status:", error);
        return false;
      }
      
      return data?.is_active || false;
    } catch (error) {
      console.error("Error checking lockdown status:", error);
      return false;
    }
  },

  /**
   * Tüm lockdown ayarlarını al
   */
  async getSettings(): Promise<SiteLockdownSettings | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from("site_lockdown")
        .select("*")
        .eq("id", "default")
        .single();
      
      if (error) {
        console.error("Error fetching lockdown settings:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching lockdown settings:", error);
      return null;
    }
  },

  /**
   * Lockdown'u aktif et
   */
  async activate(activatedBy: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from("site_lockdown")
        .update({
          is_active: true,
          activated_at: new Date().toISOString(),
          activated_by: activatedBy,
          updated_at: new Date().toISOString()
        })
        .eq("id", "default");
      
      if (error) {
        console.error("Error activating lockdown:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error activating lockdown:", error);
      return false;
    }
  },

  /**
   * Lockdown'u deaktif et
   */
  async deactivate(): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from("site_lockdown")
        .update({
          is_active: false,
          activated_at: null,
          activated_by: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", "default");
      
      if (error) {
        console.error("Error deactivating lockdown:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deactivating lockdown:", error);
      return false;
    }
  },

  /**
   * Lockdown mesajını güncelle
   */
  async updateMessage(message: string, subtitle?: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const updates: any = {
        lockdown_message: message,
        updated_at: new Date().toISOString()
      };
      
      if (subtitle !== undefined) {
        updates.lockdown_subtitle = subtitle;
      }
      
      const { error } = await supabase
        .from("site_lockdown")
        .update(updates)
        .eq("id", "default");
      
      if (error) {
        console.error("Error updating lockdown message:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating lockdown message:", error);
      return false;
    }
  },

  /**
   * Tüm ayarları güncelle
   */
  async updateSettings(settings: Partial<Omit<SiteLockdownSettings, "id">>): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { error } = await supabase
        .from("site_lockdown")
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq("id", "default");
      
      if (error) {
        console.error("Error updating lockdown settings:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error updating lockdown settings:", error);
      return false;
    }
  }
};
