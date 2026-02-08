"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";
import { announcementRepository, type Announcement } from "@/lib/repositories/announcement";

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

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
    } catch (error) {
      console.error("Error loading announcement:", error);
    }
  };

  // Gösterilmeyecekse veya aktif değilse render etme
  if (!announcement?.is_active || !announcement?.message || !isVisible) {
    return null;
  }

  // Hız değerlerini saniyeye çevir
  const speedMap = {
    slow: 30,
    normal: 20,
    fast: 10,
  };
  const animationDuration = speedMap[announcement.marquee_speed] || 20;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden group"
        style={{ backgroundColor: announcement.background_color }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Close Button - Mobilde her zaman görünür, masaüstünde hover'da */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          style={{ color: announcement.text_color }}
          title="Duyuruyu gizle"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Marquee Container - CSS Animation Based */}
        <div className="relative py-2.5 sm:py-3 overflow-hidden">
          <div 
            className="announcement-marquee-track flex whitespace-nowrap"
            style={{
              animationDuration: `${animationDuration}s`,
              animationPlayState: isHovered ? "paused" : "running",
            }}
          >
            {/* İçeriği 4 kez tekrarla - sürekli döngü için */}
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-4 flex-shrink-0"
                style={{ color: announcement.text_color }}
              >
                <Megaphone className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base whitespace-nowrap">
                  {announcement.message}
                </span>
                <span className="mx-6 opacity-50">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* Gradient Overlays - daha kısa, mobilde daha az yer kaplar */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-6 sm:w-12 pointer-events-none z-[5]"
          style={{
            background: `linear-gradient(to right, ${announcement.background_color}, transparent)`,
          }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-6 sm:w-12 pointer-events-none z-[5]"
          style={{
            background: `linear-gradient(to left, ${announcement.background_color}, transparent)`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
