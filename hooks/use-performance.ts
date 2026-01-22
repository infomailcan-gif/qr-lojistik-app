"use client";

import { useState, useEffect } from "react";

// Performans optimizasyonu için hook
// Mobil cihazlarda ve reduced motion tercihinde animasyonları devre dışı bırakır
export function usePerformance() {
  const [isMobile, setIsMobile] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [isLowEndDevice, setIsLowEndDevice] = useState(true);

  useEffect(() => {
    // Mobil cihaz kontrolü
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Reduced motion tercihi kontrolü
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    
    // Düşük performanslı cihaz kontrolü (donanım concurrency)
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const isLowEnd = hardwareConcurrency <= 4;
    setIsLowEndDevice(isLowEnd);
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.removeEventListener("resize", checkMobile);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  // Animasyon devre dışı bırakılmalı mı?
  const shouldReduceMotion = isMobile || prefersReducedMotion || isLowEndDevice;

  // Performans modu aktif mi?
  const isPerformanceMode = shouldReduceMotion;

  return {
    isMobile,
    prefersReducedMotion,
    isLowEndDevice,
    shouldReduceMotion,
    isPerformanceMode,
    // Animasyon ayarları
    animationDuration: shouldReduceMotion ? 0.1 : 0.3,
    staggerDelay: shouldReduceMotion ? 0 : 0.03,
    springConfig: shouldReduceMotion 
      ? { duration: 0.1 } 
      : { type: "spring", stiffness: 300, damping: 30 },
  };
}

// Basit reduced motion hook
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(query.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}






