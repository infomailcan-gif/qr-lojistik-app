"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/auth";
import { loginLogRepository } from "@/lib/repositories/login-log";

// Sayfa adlarını Türkçe'ye çevir
const pageNameMap: { [key: string]: string } = {
  "/app": "Ana Sayfa",
  "/app/boxes": "Kolilerim",
  "/app/boxes/new": "Yeni Koli Oluştur",
  "/app/pallets": "Paletler",
  "/app/pallets/new": "Yeni Palet Oluştur",
  "/app/shipments": "Sevkiyatlar",
  "/app/shipments/new": "Yeni Sevkiyat Oluştur",
  "/app/admin": "Yönetim Paneli",
  "/app/admin-logs": "Sistem Logları",
  "/app/dashboard": "Dashboard",
  "/app/settings": "Ayarlar",
  "/app/profile": "Profil",
};

// Dinamik sayfa adlarını çevir
const getDynamicPageName = (pathname: string): string => {
  // Statik sayfa adı varsa kullan
  if (pageNameMap[pathname]) {
    return pageNameMap[pathname];
  }

  // Dinamik rotalar
  if (pathname.includes("/app/boxes/") && pathname.includes("/edit")) {
    return "Koli Düzenleme";
  }
  if (pathname.includes("/app/boxes/")) {
    return "Koli Detayı";
  }
  if (pathname.includes("/app/pallets/")) {
    return "Palet Detayı";
  }
  if (pathname.includes("/app/shipments/")) {
    return "Sevkiyat Detayı";
  }
  if (pathname.includes("/q/box/")) {
    return "QR Koli Görüntüleme";
  }
  if (pathname.includes("/q/pallet/")) {
    return "QR Palet Görüntüleme";
  }
  if (pathname.includes("/q/shipment/")) {
    return "QR Sevkiyat Görüntüleme";
  }

  return pathname.replace("/app/", "").replace("/", " > ") || "Bilinmeyen Sayfa";
};

export function useActivityTracking() {
  const pathname = usePathname();
  const lastActivityRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateActivity = useCallback(async (action?: string) => {
    try {
      const session = await auth.getSession();
      if (!session) return;

      const currentPage = getDynamicPageName(pathname);
      const currentAction = action || `${currentPage} görüntüleniyor`;

      // Sadece aktivite değiştiyse güncelle
      const activityKey = `${currentPage}-${currentAction}`;
      if (lastActivityRef.current !== activityKey) {
        lastActivityRef.current = activityKey;
      }

      await loginLogRepository.updateActivity(
        session.user.id,
        currentPage,
        currentAction
      );
    } catch (error) {
      console.error("Activity tracking error:", error);
    }
  }, [pathname]);

  // Sayfa değiştiğinde aktivite güncelle
  useEffect(() => {
    updateActivity();
  }, [pathname, updateActivity]);

  // Her 30 saniyede bir heartbeat gönder
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      updateActivity();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateActivity]);

  // İşlem bildirme fonksiyonu
  const reportAction = useCallback((action: string) => {
    updateActivity(action);
  }, [updateActivity]);

  return { reportAction };
}

// Global aktivite takibi için wrapper component
export function ActivityTracker({ children }: { children: React.ReactNode }) {
  useActivityTracking();
  return <>{children}</>;
}
