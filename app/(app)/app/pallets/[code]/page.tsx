"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Layers,
  Plus,
  Package,
  Calendar,
  User,
  Trash2,
  Search,
  Building2,
  Download,
  QrCode,
  Sparkles,
  ChevronRight,
  Zap,
  Edit,
  Camera,
  X,
  Image as ImageIcon,
  Printer,
  Upload,
  Eye,
  Truck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { palletRepository } from "@/lib/repositories/pallet";
import { boxRepository } from "@/lib/repositories/box";
import { auth } from "@/lib/auth";
import { uploadPalletPhoto } from "@/lib/supabase/storage";
import type { PalletWithBoxes } from "@/lib/types/pallet";
import type { BoxWithDepartment } from "@/lib/types/box";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import QRCode from "qrcode";

export default function PalletDetailPage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pallet, setPallet] = useState<PalletWithBoxes | null>(null);
  const [availableBoxes, setAvailableBoxes] = useState<BoxWithDepartment[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Add box form
  const [showAddBox, setShowAddBox] = useState(false);
  const [addMethod, setAddMethod] = useState<"select" | "code">("select");
  const [selectedBoxId, setSelectedBoxId] = useState("");
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([]);
  const [boxCodeInput, setBoxCodeInput] = useState("");
  const [addingBox, setAddingBox] = useState(false);
  
  // Edit/Delete states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editPalletName, setEditPalletName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Photo states
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<1 | 2>(1);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const dragCounterPhoto = useRef(0);

  useEffect(() => {
    loadData();
  }, [params.code]);

  useEffect(() => {
    if (pallet) {
      generateQRCode();
    }
  }, [pallet]);

  const loadData = async () => {
    try {
      // Get user session to filter boxes by department
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const [palletData, allBoxes] = await Promise.all([
        palletRepository.getByCode(params.code),
        boxRepository.getAll(),
      ]);

      // Filter boxes: only show sealed boxes from user's department that are not in a pallet
      // Include direct shipment boxes so they're visible with a different style
      const boxes = allBoxes.filter(
        (b) =>
          b.department.id === session.user.department_id &&
          b.status === "sealed" &&
          !b.pallet_code &&
          !(b as any).shipment_code // exclude boxes already in a shipment
      );

      if (!palletData) {
        toast({
          title: "Palet bulunamadı",
          description: `${params.code} kodlu palet bulunamadı`,
          variant: "destructive",
        });
        router.push("/app/pallets");
        return;
      }

      setPallet(palletData);
      setAvailableBoxes(boxes);
      setEditPalletName(palletData.name);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Palet yüklenemedi",
        variant: "destructive",
      });
      router.push("/app/pallets");
    } finally {
      setLoading(false);
    }
  };

  const handleEditPallet = async () => {
    if (!editPalletName.trim()) {
      toast({
        title: "Hata",
        description: "Palet adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    try {
      await palletRepository.update(params.code, {
        name: editPalletName.trim(),
      });
      toast({
        title: "Palet Güncellendi",
        description: "Palet bilgileri başarıyla güncellendi",
      });
      setEditDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Palet güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeletePallet = async () => {
    setIsDeleting(true);
    try {
      // First remove all boxes from this pallet
      if (pallet) {
        for (const box of pallet.boxes) {
          await boxRepository.clearPallet(box.code);
        }
      }
      
      await palletRepository.delete(params.code);
      toast({
        title: "Palet Silindi",
        description: "Palet başarıyla silindi",
      });
      router.push("/app/pallets");
    } catch (error) {
      toast({
        title: "Hata",
        description: "Palet silinirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Resim sıkıştırma fonksiyonu
  const compressImage = useCallback((file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          
          if (width <= maxWidth && height <= maxHeight && file.size < 500 * 1024) {
            resolve(event.target?.result as string);
            return;
          }
          
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context oluşturulamadı"));
            return;
          }
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error("Resim yüklenemedi"));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Dosya okunamadı"));
      reader.readAsDataURL(file);
    });
  }, []);

  const processPhotoFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir resim dosyası seçin",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Hata",
        description: "Dosya boyutu 5MB'dan küçük olmalı",
        variant: "destructive",
      });
      return;
    }

    setIsCompressingPhoto(true);
    try {
      const compressedDataUrl = await compressImage(file);
      setPhotoPreview(compressedDataUrl);
      
      const originalSize = (file.size / 1024).toFixed(0);
      const compressedSize = (compressedDataUrl.length * 0.75 / 1024).toFixed(0);
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
      setIsCompressingPhoto(false);
    }
  }, [compressImage]);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPhotoFile(file);
  };

  const handlePhotoDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterPhoto.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingPhoto(true);
    }
  }, []);

  const handlePhotoDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handlePhotoDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterPhoto.current--;
    if (dragCounterPhoto.current === 0) {
      setIsDraggingPhoto(false);
    }
  }, []);

  const handlePhotoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
    dragCounterPhoto.current = 0;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processPhotoFile(files[0]);
    }
  }, [processPhotoFile]);

  const handlePhotoUpload = async () => {
    if (!photoPreview || !pallet) return;

    setUploadingPhoto(true);
    try {
      const photoUrl = await uploadPalletPhoto(photoPreview, photoIndex === 1 ? pallet.code : `${pallet.code}-2`);
      
      if (photoIndex === 1) {
        await palletRepository.update(pallet.code, { photo_url: photoUrl });
      } else {
        await palletRepository.update(pallet.code, { photo_url_2: photoUrl } as any);
      }
      
      toast({
        title: "Fotoğraf Yüklendi",
        description: `Palet fotoğrafı ${photoIndex} başarıyla eklendi`,
      });
      
      setPhotoDialogOpen(false);
      setPhotoPreview(null);
      await loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fotoğraf yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (index: 1 | 2) => {
    if (!pallet) return;
    
    if (!confirm(`Palet fotoğrafı ${index}'i silmek istediğinize emin misiniz?`)) return;

    try {
      if (index === 1) {
        await palletRepository.update(pallet.code, { photo_url: null });
      } else {
        await palletRepository.update(pallet.code, { photo_url_2: null } as any);
      }
      
      toast({
        title: "Fotoğraf Silindi",
        description: `Palet fotoğrafı ${index} başarıyla silindi`,
      });
      
      await loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fotoğraf silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const openPhotoDialog = (index: 1 | 2) => {
    setPhotoIndex(index);
    setPhotoDialogOpen(true);
  };

  const generateQRCode = async () => {
    if (!pallet) return;
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const qrUrl = `${baseUrl}/q/pallet/${pallet.code}`;
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: "#0891b2", // Cyan-600
          light: "#ffffff",
        },
      });
      setQrCodeUrl(dataUrl);
    } catch (error) {
      console.error("QR code generation error:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !pallet) return;
    
    // Create canvas with QR code and name
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = document.createElement("img");
    img.onload = () => {
      const qrSize = 600;
      const textHeight = 80;
      
      canvas.width = qrSize;
      canvas.height = qrSize + textHeight;
      
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 0, 0, qrSize, qrSize);
      
      // Draw name below QR
      ctx.fillStyle = "#0891b2";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const palletName = pallet.name;
      ctx.fillText(palletName, qrSize / 2, qrSize + textHeight / 2);
      
      // Download
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${pallet.code}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Kod İndirildi",
        description: `${pallet.code} QR kodu indirildi`,
      });
    };
    img.src = qrCodeUrl;
  };

  const printQRCode = () => {
    if (!qrCodeUrl || !pallet) return;
    
    // Create canvas with QR code and name
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = document.createElement("img");
    img.onload = () => {
      const qrSize = 600;
      const textHeight = 80;
      
      canvas.width = qrSize;
      canvas.height = qrSize + textHeight;
      
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 0, 0, qrSize, qrSize);
      
      // Draw name below QR
      ctx.fillStyle = "#0891b2";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const palletName = pallet.name;
      ctx.fillText(palletName, qrSize / 2, qrSize + textHeight / 2);
      
      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>QR Kod - ${pallet.code}</title>
              <style>
                body { 
                  margin: 0; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh;
                  background: white;
                }
                img { 
                  max-width: 100%; 
                  height: auto; 
                }
                @media print {
                  body { margin: 0; }
                  img { width: 100%; max-width: 400px; }
                }
              </style>
            </head>
            <body>
              <img src="${canvas.toDataURL("image/png")}" alt="QR Code" />
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() { window.close(); };
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      
      toast({
        title: "Yazdırma",
        description: `${pallet.code} QR kodu yazdırılıyor`,
      });
    };
    img.src = qrCodeUrl;
  };

  const handleAddBox = async () => {
    if (addMethod === "select") {
      // Multi-select mode
      if (selectedBoxIds.length === 0) {
        toast({
          title: "Hata",
          description: "Lütfen en az bir koli seçin",
          variant: "destructive",
        });
        return;
      }

      setAddingBox(true);
      try {
        const session = await auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        let addedCount = 0;
        let errorMessages: string[] = [];

        for (const boxId of selectedBoxIds) {
          const box = availableBoxes.find((b) => b.id === boxId);
          if (!box) continue;

          try {
            await boxRepository.setPallet(box.code, params.code);
            addedCount++;
          } catch (error) {
            errorMessages.push(box.code);
          }
        }

        if (addedCount > 0) {
          toast({
            title: "Koliler eklendi",
            description: `${addedCount} koli palete eklendi`,
          });
        }

        if (errorMessages.length > 0) {
          toast({
            title: "Bazı koliler eklenemedi",
            description: `Eklenemeyen koliler: ${errorMessages.join(', ')}`,
            variant: "destructive",
          });
        }

        // Reload data
        await loadData();
        
        // Reset form
        setShowAddBox(false);
        setSelectedBoxIds([]);
      } catch (error) {
        toast({
          title: "Hata",
          description: "Koliler eklenemedi",
          variant: "destructive",
        });
      } finally {
        setAddingBox(false);
      }
    } else {
      // Code input mode (single box)
      if (!boxCodeInput.trim()) {
        toast({
          title: "Hata",
          description: "Lütfen koli kodu girin",
          variant: "destructive",
        });
        return;
      }

      const boxCode = boxCodeInput.trim().toUpperCase();

      setAddingBox(true);
      try {
        // Get user session to check department
        const session = await auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // Check if box exists and get its current pallet
        const boxDetail = await boxRepository.getByCode(boxCode);
        
        if (!boxDetail) {
          toast({
            title: "Koli bulunamadı",
            description: `${boxCode} kodlu koli bulunamadı`,
            variant: "destructive",
          });
          return;
        }

        // Check if box belongs to user's department
        if (boxDetail.department.id !== session.user.department_id) {
          toast({
            title: "Departman uyuşmazlığı",
            description: `Bu koli ${boxDetail.department.name} departmanına ait. Sadece kendi departmanınızdaki kolileri ekleyebilirsiniz.`,
            variant: "destructive",
          });
          return;
        }

        // Check if box was created by the user
        if (boxDetail.created_by !== session.user.name) {
          toast({
            title: "Yetki hatası",
            description: "Sadece kendi oluşturduğunuz kolileri ekleyebilirsiniz",
            variant: "destructive",
          });
          return;
        }

        if (boxDetail.status !== "sealed") {
          toast({
            title: "Koli kapalı değil",
            description: "Sadece kapalı koliler palete eklenebilir",
            variant: "destructive",
          });
          return;
        }

        if (boxDetail.pallet_code) {
          toast({
            title: "Koli zaten başka palette",
            description: `Bu koli ${boxDetail.pallet_code} paletine bağlı`,
            variant: "destructive",
          });
          return;
        }

        // Check if box is marked as direct shipment
        if ((boxDetail as any).is_direct_shipment) {
          toast({
            title: "Direk Sevkiyat Ürünü",
            description: "Bu ürün direk sevkiyata yüklenmek üzere işaretlenmiş. Palete eklenemez. Lütfen ürün ayarlarını düzeltin veya doğrudan sevkiyata ekleyin.",
            variant: "destructive",
          });
          return;
        }

        // Add to pallet
        await boxRepository.setPallet(boxCode, params.code);

        toast({
          title: "Koli eklendi",
          description: `${boxCode} palete eklendi`,
        });

        // Reload data
        await loadData();
        
        // Reset form
        setShowAddBox(false);
        setBoxCodeInput("");
      } catch (error) {
        toast({
          title: "Hata",
          description: "Koli eklenemedi",
          variant: "destructive",
        });
      } finally {
        setAddingBox(false);
      }
    }
  };

  const handleRemoveBox = async (boxCode: string) => {
    if (!confirm(`${boxCode} kolisini paletten çıkarmak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await boxRepository.clearPallet(boxCode);

      toast({
        title: "Koli çıkarıldı",
        description: `${boxCode} paletten çıkarıldı`,
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Koli çıkarılamadı",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: "draft" | "sealed") => {
    return status === "sealed"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-amber-100 text-amber-700 border-amber-200";
  };

  const getStatusText = (status: "draft" | "sealed") => {
    return status === "sealed" ? "Kapalı" : "Taslak";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-200" />
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"
              style={{ animationDuration: "0.8s" }}
            />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-4 text-slate-600 font-medium animate-pulse">
            Palet yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (!pallet) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-0 sm:px-1 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-start gap-3 sm:gap-4 flex-1">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="bg-white/80 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl blur-lg opacity-40"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-xl shadow-cyan-500/30">
                  <Layers className="h-6 w-6 text-white" />
                </div>
              </motion.div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  {pallet.name}
                </h1>
                <p className="text-slate-500 font-mono text-xs sm:text-sm">{pallet.code}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Edit/Delete Buttons */}
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditDialogOpen(true)}
              className="bg-white/80 hover:bg-amber-50 border-slate-200 hover:border-amber-300"
            >
              <Edit className="h-4 w-4 text-amber-600" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              className="bg-white/80 hover:bg-red-50 border-slate-200 hover:border-red-300 text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* QR Code Download Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50 overflow-hidden relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-cyan-700">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <QrCode className="h-6 w-6" />
              </motion.div>
              QR Kod
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
              </motion.span>
            </CardTitle>
            <CardDescription className="text-slate-500">
              Paleti hızlıca bulmak için QR kodu taratın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* QR Code Preview */}
              {qrCodeUrl && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-2xl" />
                  <div className="relative p-3 bg-white rounded-2xl shadow-lg border border-cyan-200 text-center">
                    <img src={qrCodeUrl} alt="QR Code" className="w-36 h-36" />
                    <p className="mt-2 text-sm font-bold text-cyan-700">{pallet.name}</p>
                  </div>
                </motion.div>
              )}
              
              {/* Download & Print Buttons */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={downloadQRCode}
                      disabled={!qrCodeUrl}
                      className="w-full h-14 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-cyan-500/25"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      <span>İndir</span>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={printQRCode}
                      disabled={!qrCodeUrl}
                      className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/25"
                    >
                      <Printer className="h-5 w-5 mr-2" />
                      <span>Yazdır</span>
                    </Button>
                  </motion.div>
                </div>
                <p className="text-xs text-center text-slate-500">
                  Link: /q/pallet/{pallet.code}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pallet Photo Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Camera className="h-5 w-5 text-cyan-600" />
              Palet Fotoğrafları
            </CardTitle>
            <CardDescription className="text-slate-500">
              Palete fotoğraf ekleyerek QR taratıldığında görüntülenmesini sağlayın (maksimum 2 fotoğraf)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fotoğraf 1 */}
              <div>
                <p className="text-sm text-slate-600 mb-2 font-medium">Fotoğraf 1</p>
                {pallet.photo_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-cyan-300 transition-colors">
                    <img
                      src={pallet.photo_url}
                      alt="Palet fotoğrafı 1"
                      className="w-full h-40 object-contain bg-slate-50"
                      onClick={() => setFullscreenPhoto(pallet.photo_url)}
                    />
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none"
                    >
                      <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleRemovePhoto(1); }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white transition-colors z-10"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => openPhotoDialog(1)}
                      className="w-full h-40 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 border-2 border-dashed border-cyan-300 text-cyan-600"
                      variant="ghost"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="h-6 w-6" />
                        <span className="text-sm font-medium">Fotoğraf 1 Ekle</span>
                      </div>
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Fotoğraf 2 */}
              <div>
                <p className="text-sm text-slate-600 mb-2 font-medium">Fotoğraf 2 (opsiyonel)</p>
                {(pallet as any).photo_url_2 ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 group cursor-pointer hover:border-cyan-300 transition-colors">
                    <img
                      src={(pallet as any).photo_url_2}
                      alt="Palet fotoğrafı 2"
                      className="w-full h-40 object-contain bg-slate-50"
                      onClick={() => setFullscreenPhoto((pallet as any).photo_url_2)}
                    />
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none"
                    >
                      <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleRemovePhoto(2); }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white transition-colors z-10"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => openPhotoDialog(2)}
                      className="w-full h-40 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 border-2 border-dashed border-cyan-300 text-cyan-600"
                      variant="ghost"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="h-6 w-6" />
                        <span className="text-sm font-medium">Fotoğraf 2 Ekle</span>
                      </div>
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pallet Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-600" />
              Palet Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"
            >
              <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Oluşturan</p>
                <p className="font-semibold text-slate-800">{pallet.created_by}</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200"
            >
              <div className="p-3 rounded-xl bg-purple-100 border border-purple-200">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Oluşturulma</p>
                <p className="font-semibold text-sm text-slate-800">
                  {formatDate(pallet.created_at)}
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200"
            >
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Koli Sayısı</p>
                <motion.p 
                  key={pallet.boxes.length}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-2xl text-emerald-600"
                >
                  {pallet.boxes.length}
                </motion.p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Shipment Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <Card className={`${pallet.shipment_code ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'} overflow-hidden`}>
          <CardHeader>
            <CardTitle className={`${pallet.shipment_code ? 'text-purple-700' : 'text-amber-700'} flex items-center gap-2`}>
              {pallet.shipment_code ? (
                <Truck className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              Sevkiyat Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pallet.shipment_code ? (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-purple-100 border border-purple-200 cursor-pointer hover:border-purple-300 transition-colors"
                onClick={() => router.push(`/app/shipments/${pallet.shipment_code}`)}
              >
                <div className="p-3 rounded-xl bg-purple-200 border border-purple-300">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-purple-600">Sevkiyat Kodu</p>
                  <p className="font-semibold text-purple-700 font-mono">{pallet.shipment_code}</p>
                  <p className="text-xs text-purple-600 mt-1">Sevkiyat detayını görüntülemek için tıklayın</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-100 border border-amber-200">
                <div className="p-3 rounded-xl bg-amber-200 border border-amber-300">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-700">Bu palet henüz bir sevkiyata eklenmemiş</p>
                  <p className="text-sm text-amber-600 mt-1">Sevkiyat oluşturup bu paleti ekleyebilirsiniz.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Box Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Koli Ekle</CardTitle>
                <CardDescription className="text-slate-500">
                  Palete kapalı koliler ekleyebilirsiniz
                </CardDescription>
              </div>
              {!showAddBox && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setShowAddBox(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                  >
                    <Plus className="h-4 w-4" />
                    Koli Ekle
                  </Button>
                </motion.div>
              )}
            </div>
          </CardHeader>

          <AnimatePresence>
            {showAddBox && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <CardContent className="space-y-4 border-t border-slate-200 pt-6">
                  {/* Method Selection */}
                  <div className="flex gap-2">
                    <Button
                      variant={addMethod === "select" ? "default" : "outline"}
                      onClick={() => setAddMethod("select")}
                      className={`flex-1 ${addMethod === "select" ? "bg-cyan-600 hover:bg-cyan-700" : "border-slate-300 hover:bg-slate-50 text-slate-700"}`}
                    >
                      Listeden Seç
                    </Button>
                    <Button
                      variant={addMethod === "code" ? "default" : "outline"}
                      onClick={() => setAddMethod("code")}
                      className={`flex-1 ${addMethod === "code" ? "bg-cyan-600 hover:bg-cyan-700" : "border-slate-300 hover:bg-slate-50 text-slate-700"}`}
                    >
                      Kod ile Ekle
                    </Button>
                  </div>

                  {/* Method: Select from list */}
                  {addMethod === "select" && (
                    <div className="space-y-3">
                      {availableBoxes.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-600 bg-slate-50 rounded-lg border border-slate-200">
                          Palete eklenebilecek koli yok. Tüm kapalı koliler zaten bir palete eklenmiş.
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                              {selectedBoxIds.length > 0 ? `${selectedBoxIds.length} koli seçildi` : 'Koli seçin'}
                            </p>
                            {selectedBoxIds.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBoxIds([])}
                                className="text-xs text-slate-500 hover:text-slate-800"
                              >
                                Seçimi Temizle
                              </Button>
                            )}
                          </div>
                          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                            {availableBoxes.map((box) => {
                              const isDirectShipment = (box as any).is_direct_shipment;
                              return (
                                <div
                                  key={box.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                    isDirectShipment
                                      ? 'bg-orange-50 border border-orange-200 cursor-not-allowed opacity-75'
                                      : selectedBoxIds.includes(box.id)
                                      ? 'bg-cyan-50 border border-cyan-300 cursor-pointer'
                                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 cursor-pointer'
                                  }`}
                                  onClick={() => {
                                    if (isDirectShipment) {
                                      toast({
                                        title: "Direk Sevkiyat Ürünü",
                                        description: "Bu ürün direk sevkiyata yüklenmek üzere işaretlenmiş. Palete eklenemez. Doğrudan sevkiyata ekleyin.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    if (selectedBoxIds.includes(box.id)) {
                                      setSelectedBoxIds(selectedBoxIds.filter(id => id !== box.id));
                                    } else {
                                      setSelectedBoxIds([...selectedBoxIds, box.id]);
                                    }
                                  }}
                                >
                                  {isDirectShipment ? (
                                    <div className="w-5 h-5 rounded border-2 border-orange-400 bg-orange-400 flex items-center justify-center shrink-0">
                                      <Truck className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      selectedBoxIds.includes(box.id)
                                        ? 'border-cyan-500 bg-cyan-500'
                                        : 'border-slate-400'
                                    }`}>
                                      {selectedBoxIds.includes(box.id) && (
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-mono text-xs ${isDirectShipment ? 'text-orange-600' : 'text-cyan-600'}`}>{box.code}</span>
                                      <span className={`truncate ${isDirectShipment ? 'text-orange-800' : 'text-slate-800'}`}>{box.name}</span>
                                      {isDirectShipment && (
                                        <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                                          Direk Sevkiyat
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-slate-500">{box.department.name}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Method: Code input */}
                  {addMethod === "code" && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="BOX-XXXXXXXX"
                          value={boxCodeInput}
                          onChange={(e) =>
                            setBoxCodeInput(e.target.value.toUpperCase())
                          }
                          className="pl-10 h-12 font-mono bg-white border-slate-300 text-slate-800"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Kolinin BOX kodunu girin
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleAddBox}
                        disabled={
                          addingBox ||
                          (addMethod === "select" && selectedBoxIds.length === 0) ||
                          (addMethod === "code" && !boxCodeInput.trim())
                        }
                        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {addMethod === "select" && selectedBoxIds.length > 1 
                          ? `${selectedBoxIds.length} Koli Ekle` 
                          : 'Ekle'}
                      </Button>
                    </motion.div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddBox(false);
                        setSelectedBoxIds([]);
                        setBoxCodeInput("");
                      }}
                      className="border-slate-300 hover:bg-slate-50 text-slate-700"
                    >
                      İptal
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Boxes List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-600" />
              Paletteki Koliler 
              <Badge variant="outline" className="ml-2 border-cyan-300 text-cyan-700 bg-cyan-50">
                {pallet.boxes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pallet.boxes.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block p-6 rounded-2xl bg-slate-50 border border-slate-200 mb-6"
                >
                  <Package className="h-16 w-16 text-slate-400" />
                </motion.div>
                <p className="text-lg text-slate-600">Bu palette henüz koli yok</p>
                <p className="text-sm text-slate-500 mt-2">
                  Yukarıdaki panelden koli ekleyebilirsiniz
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {pallet.boxes.map((box, index) => (
                  <motion.div
                    key={box.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index, type: "spring", stiffness: 150 }}
                    whileHover={{ 
                      scale: 1.01, 
                      x: 5
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer group"
                  >
                    {box.photo_url ? (
                      <motion.div 
                        className="h-12 w-12 rounded-xl overflow-hidden shrink-0 shadow-md border border-slate-200"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img 
                          src={box.photo_url} 
                          alt={box.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 text-lg font-bold text-white shrink-0 shadow-md"
                        whileHover={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        {index + 1}
                      </motion.div>
                    )}
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => router.push(`/app/boxes/${box.code}`)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate text-slate-800 group-hover:text-cyan-600 transition-colors">
                          {box.name}
                        </h3>
                        <Badge className={getStatusColor(box.status)}>
                          {getStatusText(box.status)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-mono text-cyan-600">{box.code}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building2 className="h-3 w-3" />
                          {box.department_name}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <User className="h-3 w-3" />
                          {box.created_by}
                        </span>
                      </div>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBox(box.code);
                        }}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md border-cyan-200">
          <DialogHeader>
            <DialogTitle className="text-cyan-700 flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Paleti Düzenle
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Palet bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Palet Adı</label>
              <Input
                value={editPalletName}
                onChange={(e) => setEditPalletName(e.target.value)}
                placeholder="Örn: Palet-1"
                className="bg-white border-slate-300 text-slate-800 focus:border-cyan-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-slate-300 text-slate-700">
              İptal
            </Button>
            <Button onClick={handleEditPallet} disabled={isEditing} className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600">
              {isEditing ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Paleti Sil
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Bu paleti silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              Paletteki koliler paletten çıkarılacak ama silinmeyecek.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-slate-300 text-slate-700">
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeletePallet} disabled={isDeleting} className="bg-gradient-to-r from-red-500 to-rose-500">
              {isDeleting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Modal */}
      <Dialog open={!!fullscreenPhoto} onOpenChange={() => setFullscreenPhoto(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full p-0 bg-black/95 border-0 rounded-xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Fotoğraf</DialogTitle>
          </DialogHeader>
          {fullscreenPhoto && (
            <div className="relative flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-50 h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
                onClick={() => setFullscreenPhoto(null)}
              >
                <X className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={fullscreenPhoto}
                alt="Palet fotoğrafı"
                className="max-w-full max-h-[85vh] sm:max-h-[80vh] object-contain p-2"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={(open) => {
        setPhotoDialogOpen(open);
        if (!open) {
          setPhotoPreview(null);
          setIsDraggingPhoto(false);
        }
      }}>
        <DialogContent className="max-w-md border-cyan-200">
          <DialogHeader>
            <DialogTitle className="text-cyan-700 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Palet Fotoğrafı {photoIndex}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Palet için fotoğraf çekin, seçin veya sürükleyip bırakın
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Önizleme"
                  className="w-full max-h-64 object-contain rounded-lg border border-cyan-200"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white text-slate-600 shadow-md"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            ) : (
              <label 
                className="block"
                onDragEnter={handlePhotoDragEnter}
                onDragOver={handlePhotoDragOver}
                onDragLeave={handlePhotoDragLeave}
                onDrop={handlePhotoDrop}
              >
                <div className={`flex flex-col items-center justify-center h-56 min-h-[200px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 select-none ${
                  isCompressingPhoto
                    ? "border-amber-400 bg-amber-50 cursor-wait"
                    : isDraggingPhoto 
                    ? "border-cyan-400 bg-cyan-100 scale-[1.02] ring-4 ring-cyan-200" 
                    : "border-cyan-300 bg-cyan-50 hover:bg-cyan-100"
                }`}>
                  {isCompressingPhoto ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mb-3"
                      >
                        <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-500" />
                      </motion.div>
                      <span className="text-amber-600 font-semibold">Resim optimize ediliyor...</span>
                    </>
                  ) : isDraggingPhoto ? (
                    <>
                      <motion.div animate={{ scale: [1, 1.2, 1], y: [0, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                        <Upload className="h-14 w-14 text-cyan-600 mb-3" />
                      </motion.div>
                      <span className="text-cyan-700 font-semibold text-lg">Bırakın!</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <Camera className="h-10 w-10 text-cyan-600" />
                        <span className="text-cyan-300 text-2xl">/</span>
                        <Upload className="h-10 w-10 text-cyan-600" />
                      </div>
                      <span className="text-cyan-700 font-semibold">Fotoğraf Çek / Seç</span>
                      <span className="text-slate-500 text-sm mt-2">veya sürükleyip bırakın</span>
                      <span className="text-slate-400 text-xs mt-1">Max 5MB • Otomatik sıkıştırma</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                  disabled={isCompressingPhoto}
                />
              </label>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPhotoDialogOpen(false);
                setPhotoPreview(null);
              }}
              className="border-slate-300 text-slate-700"
            >
              İptal
            </Button>
            <Button
              onClick={handlePhotoUpload}
              disabled={!photoPreview || uploadingPhoto}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              {uploadingPhoto ? "Yükleniyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
