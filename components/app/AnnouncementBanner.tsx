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
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-all opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          style={{ color: announcement.text_color }}
          title="Duyuruyu gizle"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Marquee Container */}
        <div className="relative py-2 sm:py-2.5 overflow-hidden">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: animationDuration,
                ease: "linear",
              },
            }}
            style={{
              animationPlayState: isHovered ? "paused" : "running",
            }}
          >
            {/* İçeriği iki kez tekrarla - sürekli döngü için */}
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4"
                style={{ color: announcement.text_color }}
              >
                <Megaphone className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  {announcement.message}
                </span>
                <span className="mx-8 opacity-50">•</span>
                <Megaphone className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  {announcement.message}
                </span>
                <span className="mx-8 opacity-50">•</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Gradient Overlays */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${announcement.background_color}, transparent)`,
          }}
        />
        <div 
          className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${announcement.background_color}, transparent)`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
