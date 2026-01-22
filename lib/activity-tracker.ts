// Global Activity Tracker - Supabase Realtime ile canlı aktivite takibi

import { supabase, isSupabaseConfigured } from "./supabase/client";

export interface Activity {
  id: string;
  user_id?: string;
  user_name: string;
  user_department: string;
  action: ActivityAction;
  entity_type: "box" | "pallet" | "shipment";
  entity_code?: string;
  entity_name?: string;
  details?: string;
  created_at: string;
}

export type ActivityAction =
  | "box_created"
  | "box_updated"
  | "box_sealed"
  | "box_line_added"
  | "box_line_removed"
  | "box_photo_added"
  | "pallet_created"
  | "pallet_box_added"
  | "pallet_box_removed"
  | "shipment_created"
  | "shipment_pallet_added"
  | "shipment_pallet_removed"
  | "viewing"
  | "page_visit";

export interface PageVisit {
  id: string;
  user_id: string;
  user_name: string;
  page_path: string;
  page_name: string;
  duration_seconds: number;
  entered_at: string;
  left_at: string | null;
}

const ACTIVITY_STORAGE_KEY = "qr_lojistik_activities";
const PAGE_VISITS_STORAGE_KEY = "qr_lojistik_page_visits";
const MAX_ACTIVITIES = 50; // Son 50 aktiviteyi sakla
const MAX_PAGE_VISITS = 200; // Son 200 sayfa ziyaretini sakla

// Aktivite metinleri
export const activityLabels: Record<ActivityAction, string> = {
  box_created: "koli oluşturdu",
  box_updated: "koli güncelledi",
  box_sealed: "koli kapattı",
  box_line_added: "koliye ürün ekledi",
  box_line_removed: "koliden ürün çıkardı",
  box_photo_added: "koliye fotoğraf ekledi",
  pallet_created: "palet oluşturdu",
  pallet_box_added: "palete koli ekledi",
  pallet_box_removed: "paletten koli çıkardı",
  shipment_created: "sevkiyat oluşturdu",
  shipment_pallet_added: "sevkiyata palet ekledi",
  shipment_pallet_removed: "sevkiyattan palet çıkardı",
  viewing: "görüntülüyor",
  page_visit: "sayfa ziyareti",
};

export class ActivityTracker {
  // localStorage fallback methods
  private getLocalActivities(): Activity[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalActivities(activities: Activity[]): void {
    if (typeof window === "undefined") return;
    const trimmed = activities.slice(0, MAX_ACTIVITIES);
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(trimmed));
  }

  // Yeni aktivite kaydet - Supabase veya localStorage
  async log(
    user: { id: string; name: string; department_name: string },
    action: ActivityAction,
    entityType: "box" | "pallet" | "shipment",
    entityCode?: string,
    entityName?: string,
    details?: string
  ): Promise<void> {
    const newActivity: Activity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      user_name: user.name,
      user_department: user.department_name,
      action,
      entity_type: entityType,
      entity_code: entityCode,
      entity_name: entityName,
      details,
      created_at: new Date().toISOString(),
    };

    // Supabase'e kaydet
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("activities").insert({
          user_id: user.id,
          user_name: user.name,
          user_department: user.department_name,
          action,
          entity_type: entityType,
          entity_code: entityCode,
          entity_name: entityName,
          details,
        });

        if (error) {
          console.error("Supabase activity insert error:", error);
          // Fallback to localStorage
          this.saveToLocal(newActivity);
        }
      } catch (error) {
        console.error("Activity log error:", error);
        this.saveToLocal(newActivity);
      }
    } else {
      // localStorage fallback
      this.saveToLocal(newActivity);
    }

    // Custom event dispatch for real-time updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("activity-logged", { detail: newActivity }));
    }
  }

  private saveToLocal(activity: Activity): void {
    const activities = this.getLocalActivities();
    activities.unshift(activity);
    this.saveLocalActivities(activities);
  }

  // Son aktiviteleri getir - Supabase veya localStorage
  async getRecent(limit: number = 15): Promise<Activity[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Supabase activity fetch error:", error);
          return this.getLocalActivities().slice(0, limit);
        }

        return (data || []).map((item) => ({
          id: item.id,
          user_id: item.user_id,
          user_name: item.user_name,
          user_department: item.user_department,
          action: item.action as ActivityAction,
          entity_type: item.entity_type as "box" | "pallet" | "shipment",
          entity_code: item.entity_code,
          entity_name: item.entity_name,
          details: item.details,
          created_at: item.created_at,
        }));
      } catch (error) {
        console.error("Activity fetch error:", error);
        return this.getLocalActivities().slice(0, limit);
      }
    }

    return this.getLocalActivities().slice(0, limit);
  }

  // Belirli bir kullanıcının aktivitelerini getir
  async getByUser(userId: string, limit: number = 10): Promise<Activity[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Supabase activity fetch error:", error);
          return this.getLocalActivities().filter((a) => a.user_id === userId).slice(0, limit);
        }

        return (data || []).map((item) => ({
          id: item.id,
          user_id: item.user_id,
          user_name: item.user_name,
          user_department: item.user_department,
          action: item.action as ActivityAction,
          entity_type: item.entity_type as "box" | "pallet" | "shipment",
          entity_code: item.entity_code,
          entity_name: item.entity_name,
          details: item.details,
          created_at: item.created_at,
        }));
      } catch (error) {
        return this.getLocalActivities().filter((a) => a.user_id === userId).slice(0, limit);
      }
    }

    return this.getLocalActivities().filter((a) => a.user_id === userId).slice(0, limit);
  }

  // Belirli bir entity'nin aktivitelerini getir
  async getByEntity(entityType: string, entityCode: string, limit: number = 10): Promise<Activity[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .eq("entity_type", entityType)
          .eq("entity_code", entityCode)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          console.error("Supabase activity fetch error:", error);
          return this.getLocalActivities()
            .filter((a) => a.entity_type === entityType && a.entity_code === entityCode)
            .slice(0, limit);
        }

        return (data || []).map((item) => ({
          id: item.id,
          user_id: item.user_id,
          user_name: item.user_name,
          user_department: item.user_department,
          action: item.action as ActivityAction,
          entity_type: item.entity_type as "box" | "pallet" | "shipment",
          entity_code: item.entity_code,
          entity_name: item.entity_name,
          details: item.details,
          created_at: item.created_at,
        }));
      } catch (error) {
        return this.getLocalActivities()
          .filter((a) => a.entity_type === entityType && a.entity_code === entityCode)
          .slice(0, limit);
      }
    }

    return this.getLocalActivities()
      .filter((a) => a.entity_type === entityType && a.entity_code === entityCode)
      .slice(0, limit);
  }

  // Realtime subscription - Dashboard için
  subscribeToActivities(callback: (activity: Activity) => void): (() => void) | null {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    const channel = supabase
      .channel("activities-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
        },
        (payload) => {
          const item = payload.new;
          const activity: Activity = {
            id: item.id,
            user_id: item.user_id,
            user_name: item.user_name,
            user_department: item.user_department,
            action: item.action as ActivityAction,
            entity_type: item.entity_type as "box" | "pallet" | "shipment",
            entity_code: item.entity_code,
            entity_name: item.entity_name,
            details: item.details,
            created_at: item.created_at,
          };
          callback(activity);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }

  // Tüm aktiviteleri temizle
  async clear(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("activity-cleared"));
    }

    // Supabase'deki aktiviteleri silme - sadece admin yapabilir
    // Bu işlem için ayrı bir endpoint gerekebilir
  }

  // Tüm uygulama verilerini temizle (boxes, pallets, shipments, activities)
  static clearAllData(): void {
    if (typeof window !== "undefined") {
      const keysToRemove = [
        "qr_lojistik_boxes",
        "qr_lojistik_box_lines",
        "qr_lojistik_pallets",
        "qr_lojistik_shipments",
        "qr_logistics_shipments",
        "qr_lojistik_activities",
        "qr_lojistik_page_visits",
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      window.dispatchEvent(new CustomEvent("all-data-cleared"));
    }
  }

  // ====== SAYFA ZİYARET TAKİBİ ======
  
  private getLocalPageVisits(): PageVisit[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(PAGE_VISITS_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveLocalPageVisits(visits: PageVisit[]): void {
    if (typeof window === "undefined") return;
    const trimmed = visits.slice(-MAX_PAGE_VISITS);
    localStorage.setItem(PAGE_VISITS_STORAGE_KEY, JSON.stringify(trimmed));
  }

  // Sayfa ziyareti başlat
  async startPageVisit(
    user: { id: string; name: string },
    pagePath: string,
    pageName: string
  ): Promise<string> {
    const visitId = `visit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newVisit: PageVisit = {
      id: visitId,
      user_id: user.id,
      user_name: user.name,
      page_path: pagePath,
      page_name: pageName,
      duration_seconds: 0,
      entered_at: now,
      left_at: null,
    };

    // Supabase'e kaydet
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("page_visits").insert({
          id: visitId,
          user_id: user.id,
          user_name: user.name,
          page_path: pagePath,
          page_name: pageName,
          duration_seconds: 0,
          entered_at: now,
        });
      } catch (error) {
        console.error("Page visit start error:", error);
        // Fallback to localStorage
        const visits = this.getLocalPageVisits();
        visits.push(newVisit);
        this.saveLocalPageVisits(visits);
      }
    } else {
      // localStorage fallback
      const visits = this.getLocalPageVisits();
      visits.push(newVisit);
      this.saveLocalPageVisits(visits);
    }

    return visitId;
  }

  // Sayfa ziyareti bitir
  async endPageVisit(visitId: string): Promise<void> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        // Get the visit to calculate duration
        const { data: visit } = await supabase
          .from("page_visits")
          .select("entered_at")
          .eq("id", visitId)
          .single();

        if (visit) {
          const enteredAt = new Date(visit.entered_at);
          const leftAt = new Date(now);
          const durationSeconds = Math.floor((leftAt.getTime() - enteredAt.getTime()) / 1000);

          await supabase
            .from("page_visits")
            .update({
              left_at: now,
              duration_seconds: durationSeconds,
            })
            .eq("id", visitId);
        }
      } catch (error) {
        console.error("Page visit end error:", error);
        // Fallback to localStorage
        this.endLocalPageVisit(visitId, now);
      }
    } else {
      // localStorage fallback
      this.endLocalPageVisit(visitId, now);
    }
  }

  private endLocalPageVisit(visitId: string, now: string): void {
    const visits = this.getLocalPageVisits();
    const visitIndex = visits.findIndex(v => v.id === visitId);
    if (visitIndex >= 0) {
      const enteredAt = new Date(visits[visitIndex].entered_at);
      const leftAt = new Date(now);
      const durationSeconds = Math.floor((leftAt.getTime() - enteredAt.getTime()) / 1000);
      visits[visitIndex].left_at = now;
      visits[visitIndex].duration_seconds = durationSeconds;
      this.saveLocalPageVisits(visits);
    }
  }

  // Kullanıcının sayfa ziyaretlerini getir
  async getPageVisitsByUser(userId: string, limit: number = 50): Promise<PageVisit[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("page_visits")
          .select("*")
          .eq("user_id", userId)
          .order("entered_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Page visits fetch error:", error);
        return this.getLocalPageVisits().filter(v => v.user_id === userId).slice(0, limit);
      }
    }

    return this.getLocalPageVisits()
      .filter(v => v.user_id === userId)
      .sort((a, b) => new Date(b.entered_at).getTime() - new Date(a.entered_at).getTime())
      .slice(0, limit);
  }

  // Tüm kullanıcıların son sayfa ziyaretlerini getir
  async getAllRecentPageVisits(limit: number = 100): Promise<PageVisit[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("page_visits")
          .select("*")
          .order("entered_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("All page visits fetch error:", error);
        return this.getLocalPageVisits()
          .sort((a, b) => new Date(b.entered_at).getTime() - new Date(a.entered_at).getTime())
          .slice(0, limit);
      }
    }

    return this.getLocalPageVisits()
      .sort((a, b) => new Date(b.entered_at).getTime() - new Date(a.entered_at).getTime())
      .slice(0, limit);
  }
}

export const activityTracker = new ActivityTracker();
