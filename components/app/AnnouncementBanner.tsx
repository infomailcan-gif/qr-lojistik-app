"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { announcementRepository, type Announcement } from "@/lib/repositories/announcement";

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadAnnouncement();
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(loadAnnouncement, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnnouncement = async () => {
    try {
      const data = await announcementRepository.getAnnouncement();
      setAnnouncement(data);
      // Duyuru değiştiğinde dismiss'i sıfırla
      if (data && data.message !== announcement?.message) {
        setDismissed(false);
      }
    } catch (error) {
      console.error("Error loading announcement:", error);
    }
  };

  // Gösterilmeyecekse render etme
  if (!announcement?.is_active || !announcement?.message || dismissed) {
    return null;
  }

  // Hız değerlerini saniyeye çevir
  const speedMap: Record<string, number> = {
    slow: 30,
    normal: 20,
    fast: 10,
  };
  const duration = speedMap[announcement.marquee_speed] || 20;

  return (
    <div
      className="announcement-banner w-full overflow-hidden"
      style={{ backgroundColor: announcement.background_color }}
    >
      {/* Close Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/20 hover:bg-black/40 active:bg-black/50 transition-all"
        style={{ color: announcement.text_color }}
        aria-label="Duyuruyu kapat"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Marquee - Pure CSS */}
      <div className="relative py-2 overflow-hidden" style={{ minHeight: "36px" }}>
        <div
          className="announcement-scroll flex whitespace-nowrap"
          style={{
            ["--marquee-duration" as string]: `${duration}s`,
          }}
        >
          {/* 6 kopya - kısa mesajlarda bile boşluk kalmasın */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-6 flex-shrink-0"
              style={{ color: announcement.text_color }}
            >
              <Megaphone className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                {announcement.message}
              </span>
              <span className="mx-4 opacity-40">|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
