"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone } from "lucide-react";
import { popupAnnouncementRepository, type PopupAnnouncement } from "@/lib/repositories/popup-announcement";

const POPUP_DISMISSED_KEY = "qr_lojistik_popup_dismissed";

export function AnnouncementPopup() {
  const [popup, setPopup] = useState<PopupAnnouncement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    loadPopup();
  }, []);

  const loadPopup = async () => {
    try {
      const data = await popupAnnouncementRepository.getPopup();
      
      if (!data || !data.is_active || (!data.title && !data.image_url)) {
        return;
      }

      // Bu oturum (sekme) içinde daha önce kapatılmış mı kontrol et
      const dismissedId = sessionStorage.getItem(POPUP_DISMISSED_KEY);
      // updated_at ile karşılaştır - yeni güncelleme gelirse tekrar göster
      if (dismissedId === data.updated_at) {
        return;
      }

      setPopup(data);
      // Kısa gecikme ile göster (sayfa yüklendikten sonra)
      setTimeout(() => setShow(true), 500);
    } catch (error) {
      console.error("Error loading popup announcement:", error);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Kapatıldığını sessionStorage'a kaydet - bu sekmede tekrar gösterilmez
    if (popup) {
      sessionStorage.setItem(POPUP_DISMISSED_KEY, popup.updated_at);
    }
  };

  if (!popup) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Popup Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md sm:max-w-lg pointer-events-auto">
              {/* Card */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80">
                {/* Gradient Header Bar */}
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 active:bg-black/30 backdrop-blur-sm transition-all group"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5 text-slate-600 group-hover:text-slate-800 transition-colors" />
                </button>

                {/* Image */}
                {popup.image_url && (
                  <div className="relative w-full bg-slate-100">
                    <img
                      src={popup.image_url}
                      alt={popup.title || "Duyuru"}
                      className="w-full max-h-[60vh] object-contain"
                      onError={(e) => {
                        // Resim yüklenemezse gizle
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-5 sm:p-6">
                  {/* Title */}
                  {popup.title && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25 flex-shrink-0">
                        <Megaphone className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">
                          {popup.title}
                        </h2>
                      </div>
                    </div>
                  )}

                  {/* Dismiss Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDismiss}
                    className="mt-5 w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm sm:text-base"
                  >
                    Tamam, Anladım
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
