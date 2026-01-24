"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface PhotoDropzoneProps {
  onPhotoSelect: (dataUrl: string) => void;
  photoPreview: string | null;
  onRemove: () => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  maxSize?: number; // MB
  colorScheme?: "blue" | "cyan" | "purple" | "slate";
  height?: string;
}

// Resim sıkıştırma fonksiyonu - kaliteyi koruyarak boyutu küçültür
const compressImage = (file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Orijinal boyutları al
        let { width, height } = img;
        
        // Eğer resim zaten küçükse sıkıştırma yapma
        if (width <= maxWidth && height <= maxHeight && file.size < 500 * 1024) {
          resolve(event.target?.result as string);
          return;
        }
        
        // En-boy oranını koru
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        
        // Canvas oluştur ve resmi çiz
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context oluşturulamadı"));
          return;
        }
        
        // Yüksek kaliteli resim rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG formatında sıkıştır (daha iyi sıkıştırma)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error("Resim yüklenemedi"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
};

export function PhotoDropzone({
  onPhotoSelect,
  photoPreview,
  onRemove,
  label = "Fotoğraf",
  required = false,
  error = false,
  maxSize = 5,
  colorScheme = "blue",
  height = "h-56",
}: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const colorClasses = {
    blue: {
      border: "border-blue-400",
      borderDashed: "border-blue-300",
      bg: "bg-blue-50/50",
      bgHover: "hover:bg-blue-50",
      bgDragging: "bg-blue-100",
      text: "text-blue-600",
      textMuted: "text-blue-400",
      icon: "text-blue-400",
    },
    cyan: {
      border: "border-cyan-400",
      borderDashed: "border-cyan-500/50",
      bg: "bg-cyan-500/5",
      bgHover: "hover:bg-cyan-500/10",
      bgDragging: "bg-cyan-500/20",
      text: "text-cyan-400",
      textMuted: "text-cyan-400",
      icon: "text-cyan-400",
    },
    purple: {
      border: "border-purple-400",
      borderDashed: "border-purple-500/50",
      bg: "bg-purple-500/5",
      bgHover: "hover:bg-purple-500/10",
      bgDragging: "bg-purple-500/20",
      text: "text-purple-600",
      textMuted: "text-purple-400",
      icon: "text-purple-500",
    },
    slate: {
      border: "border-slate-400",
      borderDashed: "border-slate-300",
      bg: "bg-slate-50/50",
      bgHover: "hover:bg-slate-50",
      bgDragging: "bg-slate-100",
      text: "text-slate-600",
      textMuted: "text-slate-400",
      icon: "text-slate-400",
    },
  };

  const colors = colorClasses[colorScheme];

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir resim dosyası seçin",
        variant: "destructive",
      });
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "Hata",
        description: `Dosya boyutu ${maxSize}MB'dan küçük olmalı`,
        variant: "destructive",
      });
      return;
    }

    setIsCompressing(true);
    try {
      // Resmi sıkıştır
      const compressedDataUrl = await compressImage(file);
      onPhotoSelect(compressedDataUrl);
      
      // Sıkıştırma bilgisi göster
      const originalSize = (file.size / 1024).toFixed(0);
      const compressedSize = (compressedDataUrl.length * 0.75 / 1024).toFixed(0); // Base64 to bytes approx
      if (parseInt(originalSize) > parseInt(compressedSize) + 50) {
        toast({
          title: "Resim optimize edildi",
          description: `${originalSize}KB → ${compressedSize}KB`,
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Resim işlenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
    }
  }, [maxSize, onPhotoSelect]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag counter for proper drag leave handling
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  if (photoPreview) {
    return (
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <img
          src={photoPreview}
          alt={label}
          className={`w-full ${height} object-contain rounded-xl border border-slate-200 shadow-lg bg-slate-50`}
        />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 shadow-lg"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={dropZoneRef}
      onClick={() => !isCompressing && fileInputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: isCompressing ? 1 : 1.01 }}
      whileTap={{ scale: isCompressing ? 1 : 0.99 }}
      className={`relative border-2 border-dashed rounded-xl ${height} min-h-[180px] text-center cursor-pointer transition-all duration-200 select-none ${
        isCompressing
          ? "border-amber-400 bg-amber-50/50 cursor-wait"
          : isDragging
          ? `${colors.bgDragging} ${colors.border} scale-[1.02] ring-4 ring-${colorScheme}-200`
          : error
          ? "border-red-400 bg-red-50/50"
          : `${colors.borderDashed} ${colors.bg} ${colors.bgHover}`
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={isCompressing}
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {isCompressing ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mb-3"
            >
              <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-500" />
            </motion.div>
            <p className="text-amber-600 font-semibold">Resim optimize ediliyor...</p>
          </>
        ) : isDragging ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1], y: [0, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Upload className={`h-14 w-14 ${colors.icon} mb-3`} />
            </motion.div>
            <p className={`${colors.text} font-semibold text-lg`}>Bırakın!</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <Camera className={`h-10 w-10 ${colors.icon}`} />
              <span className={`${colors.textMuted} text-2xl`}>/</span>
              <Upload className={`h-10 w-10 ${colors.icon}`} />
            </div>
            <p className={`${colors.text} font-semibold text-base`}>
              {label} {required && <span className="text-red-500">*</span>}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Tıklayın veya sürükleyip bırakın
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Max {maxSize}MB • Otomatik sıkıştırma
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
