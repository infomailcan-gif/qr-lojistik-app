"use client";

import { useEffect, useState } from "react";

// Performans için basitleştirilmiş arka plan - mobilde minimal, desktop'ta detaylı
export function AnimatedBackground() {
  const [isMobile, setIsMobile] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    // Mobil cihaz kontrolü
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Reduced motion tercihi kontrolü
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("resize", checkMobile);
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  // Mobil veya reduced motion tercihinde minimal arka plan
  if (isMobile || prefersReducedMotion) {
    return (
      <div className="fixed inset-0 -z-10">
        {/* Basit gradient - GPU dostu */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />
        
        {/* Hafif grid pattern - statik */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
        
        {/* Köşe aksan - statik */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-indigo-500/5 to-transparent" />
      </div>
    );
  }

  // Desktop için daha detaylı ama yine de optimize edilmiş arka plan
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40" />
      
      {/* Tech Grid - statik */}
      <div 
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Statik Orbs - animasyon yerine CSS gradient kullan */}
      <div
        className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)",
        }}
      />
      
      <div
        className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full opacity-50"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.10) 0%, transparent 70%)",
        }}
      />

      {/* Köşe aksan */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-500/8 to-transparent" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-indigo-500/8 to-transparent" />

      {/* Hafif CSS animasyonlu scan line - GPU optimized */}
      <div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-scan-slow"
      />
    </div>
  );
}
