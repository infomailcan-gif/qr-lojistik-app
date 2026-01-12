// Global Activity Tracker - Tüm kullanıcı işlemlerini kaydeder

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userDepartment: string;
  action: ActivityAction;
  entityType: "box" | "pallet" | "shipment";
  entityCode?: string;
  entityName?: string;
  details?: string;
  timestamp: string;
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
  | "viewing";

const ACTIVITY_STORAGE_KEY = "qr_lojistik_activities";
const MAX_ACTIVITIES = 50; // Son 50 aktiviteyi sakla

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
};

export class ActivityTracker {
  private getActivities(): Activity[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveActivities(activities: Activity[]): void {
    if (typeof window === "undefined") return;
    // Sadece son MAX_ACTIVITIES kadar aktiviteyi sakla
    const trimmed = activities.slice(0, MAX_ACTIVITIES);
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(trimmed));
  }

  // Yeni aktivite kaydet
  log(
    user: { id: string; name: string; department_name: string },
    action: ActivityAction,
    entityType: "box" | "pallet" | "shipment",
    entityCode?: string,
    entityName?: string,
    details?: string
  ): void {
    const activities = this.getActivities();

    const newActivity: Activity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: user.name,
      userDepartment: user.department_name,
      action,
      entityType,
      entityCode,
      entityName,
      details,
      timestamp: new Date().toISOString(),
    };

    // En yeniler başta
    activities.unshift(newActivity);
    this.saveActivities(activities);

    // Custom event dispatch for real-time updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("activity-logged", { detail: newActivity }));
    }
  }

  // Son aktiviteleri getir
  getRecent(limit: number = 10): Activity[] {
    const activities = this.getActivities();
    return activities.slice(0, limit);
  }

  // Belirli bir kullanıcının aktivitelerini getir
  getByUser(userId: string, limit: number = 10): Activity[] {
    const activities = this.getActivities();
    return activities.filter((a) => a.userId === userId).slice(0, limit);
  }

  // Belirli bir entity'nin aktivitelerini getir
  getByEntity(entityType: string, entityCode: string, limit: number = 10): Activity[] {
    const activities = this.getActivities();
    return activities
      .filter((a) => a.entityType === entityType && a.entityCode === entityCode)
      .slice(0, limit);
  }

  // Son X dakikadaki aktif kullanıcıları getir
  getActiveUsers(minutes: number = 5): { userId: string; userName: string; department: string; lastAction: string; timestamp: string }[] {
    const activities = this.getActivities();
    const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    
    const userMap = new Map<string, { userName: string; department: string; lastAction: string; timestamp: string }>();
    
    for (const activity of activities) {
      if (activity.timestamp < cutoff) break; // Aktiviteler sıralı olduğu için burada durabiliz
      
      if (!userMap.has(activity.userId)) {
        userMap.set(activity.userId, {
          userName: activity.userName,
          department: activity.userDepartment,
          lastAction: activityLabels[activity.action],
          timestamp: activity.timestamp,
        });
      }
    }

    return Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      ...data,
    }));
  }

  // Tüm aktiviteleri temizle
  clear(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      // Dispatch event for real-time update
      window.dispatchEvent(new CustomEvent("activity-cleared"));
    }
  }

  // Tüm uygulama verilerini temizle (boxes, pallets, shipments, activities)
  static clearAllData(): void {
    if (typeof window !== "undefined") {
      // Clear all localStorage keys related to this app
      const keysToRemove = [
        "qr_lojistik_boxes",
        "qr_lojistik_box_lines",
        "qr_lojistik_pallets",
        "qr_lojistik_shipments",
        "qr_logistics_shipments", // Shipment repository farklı key kullanıyor
        "qr_lojistik_activities",
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      window.dispatchEvent(new CustomEvent("all-data-cleared"));
    }
  }
}

export const activityTracker = new ActivityTracker();

