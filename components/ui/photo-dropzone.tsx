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

export function PhotoDropzone({
  onPhotoSelect,
  photoPreview,
  onRemove,
  label = "Fotoğraf",
  required = false,
  error = false,
  maxSize = 5,
  colorScheme = "blue",
  height = "h-48",
}: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processFile = useCallback((file: File) => {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      onPhotoSelect(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [maxSize, onPhotoSelect]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

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
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative border-2 border-dashed rounded-xl ${height} text-center cursor-pointer transition-all duration-200 ${
        isDragging
          ? `${colors.bgDragging} ${colors.border} scale-[1.02]`
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
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {isDragging ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Upload className={`h-12 w-12 ${colors.icon} mb-3`} />
            </motion.div>
            <p className={`${colors.text} font-semibold`}>Bırakın!</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Camera className={`h-8 w-8 ${colors.icon}`} />
              <span className={`${colors.textMuted} text-lg`}>/</span>
              <Upload className={`h-8 w-8 ${colors.icon}`} />
            </div>
            <p className={`${colors.text} font-medium text-sm`}>
              {label} {required && "*"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tıklayın, sürükleyin veya yapıştırın
            </p>
            <p className="text-xs text-slate-400">
              Max {maxSize}MB
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
