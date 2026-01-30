"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoCarouselProps {
  photos: (string | null | undefined)[];
  onPhotoClick?: (photoUrl: string) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PhotoCarousel({ photos, onPhotoClick, size = "md", className = "" }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filter out null/undefined photos
  const validPhotos = photos.filter((p): p is string => !!p);
  
  if (validPhotos.length === 0) return null;
  if (validPhotos.length === 1) {
    // Single photo - no carousel needed
    return (
      <div 
        className={`relative rounded-xl overflow-hidden border border-border cursor-pointer group ${className}`}
        onClick={() => onPhotoClick?.(validPhotos[0])}
      >
        <img
          src={validPhotos[0]}
          alt="Fotoğraf"
          className={`w-full object-contain bg-accent ${
            size === "sm" ? "h-24" : size === "md" ? "h-40" : "h-56"
          }`}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>
    );
  }
  
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validPhotos.length - 1 : prev - 1));
  };
  
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === validPhotos.length - 1 ? 0 : prev + 1));
  };
  
  // Swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev === validPhotos.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe) {
      setCurrentIndex((prev) => (prev === 0 ? validPhotos.length - 1 : prev - 1));
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Photo Container */}
      <div 
        className="relative rounded-xl overflow-hidden border border-border cursor-pointer group"
        onClick={() => onPhotoClick?.(validPhotos[currentIndex])}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={validPhotos[currentIndex]}
            alt={`Fotoğraf ${currentIndex + 1}`}
            className={`w-full object-contain bg-accent ${
              size === "sm" ? "h-24" : size === "md" ? "h-40" : "h-56"
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
        
        {/* Navigation Arrows - visible on hover or always on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity"
          onClick={handlePrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity"
          onClick={handleNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        
        {/* Photo counter badge */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
          {currentIndex + 1} / {validPhotos.length}
        </div>
      </div>
      
      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2">
        {validPhotos.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? "bg-primary w-4" 
                : "bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
      
      {/* Swipe hint for mobile */}
      <p className="text-xs text-center text-slate-400 mt-1 sm:hidden">
        ← Kaydırın →
      </p>
    </div>
  );
}
