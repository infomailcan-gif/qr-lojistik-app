"use client";

import { useState, useEffect, useCallback } from "react";
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

// Shimmer animation component
const ShimmerEffect = () => (
  <motion.div
    className="absolute inset-0 -translate-x-full"
    animate={{ x: ["0%", "200%"] }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    style={{
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
    }}
  />
);

// Floating particles
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-cyan-400/30"
        initial={{ x: Math.random() * 100, y: Math.random() * 100, opacity: 0 }}
        animate={{
          y: [0, -30, 0],
          opacity: [0, 0.8, 0],
          scale: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
        style={{ left: `${15 + i * 15}%`, top: `${60 + Math.random() * 30}%` }}
      />
    ))}
  </div>
);

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
      const boxes = allBoxes.filter(
        (b) =>
          b.department.id === session.user.department_id &&
          b.status === "sealed" &&
          !b.pallet_code
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

  const processPhotoFile = useCallback((file: File) => {
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

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPhotoFile(file);
  };

  const handlePhotoDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(true);
  }, []);

  const handlePhotoDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
  }, []);

  const handlePhotoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPhoto(false);
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
    let boxCode = "";

    if (addMethod === "select") {
      const box = availableBoxes.find((b) => b.id === selectedBoxId);
      if (!box) {
        toast({
          title: "Hata",
          description: "Lütfen bir koli seçin",
          variant: "destructive",
        });
        return;
      }
      boxCode = box.code;
    } else {
      if (!boxCodeInput.trim()) {
        toast({
          title: "Hata",
          description: "Lütfen koli kodu girin",
          variant: "destructive",
        });
        return;
      }
      boxCode = boxCodeInput.trim().toUpperCase();
    }

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
      setSelectedBoxId("");
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
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : "bg-amber-500/10 text-amber-400 border-amber-500/30";
  };

  const getStatusText = (status: "draft" | "sealed") => {
    return status === "sealed" ? "Kapalı" : "Taslak";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="h-16 w-16 border-4 border-cyan-500/30 rounded-full" />
            <div className="absolute inset-0 h-16 w-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <motion.div
              className="absolute inset-2 h-12 w-12 border-2 border-teal-400 border-b-transparent rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-6 text-cyan-400 font-medium"
          >
            Yükleniyor...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!pallet) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with glow effect */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 relative"
      >
        <div className="flex items-start gap-4 flex-1">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <div className="flex-1">
            <motion.div 
              className="flex items-center gap-3 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                animate={{ 
                  boxShadow: ["0 0 20px rgba(6,182,212,0.3)", "0 0 40px rgba(6,182,212,0.5)", "0 0 20px rgba(6,182,212,0.3)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600"
              >
                <Layers className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                  {pallet.name}
                </h1>
                <p className="text-slate-400 font-mono text-sm">{pallet.code}</p>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Edit/Delete Buttons */}
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setEditDialogOpen(true)}
              className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              className="bg-slate-800/50 hover:bg-red-500/20 hover:border-red-500/50 border-slate-700 text-red-400"
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
        <Card className="border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl overflow-hidden relative">
          <FloatingParticles />
          <ShimmerEffect />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-cyan-300">
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
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </motion.span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Paleti hızlıca bulmak için QR kodu taratın
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
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
                  <div className="relative p-3 bg-white rounded-2xl shadow-2xl text-center">
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
                      className="w-full h-14 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-cyan-500/25 relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                      />
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
                      className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/25 relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                      />
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
        <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-cyan-300 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Palet Fotoğrafları
            </CardTitle>
            <CardDescription className="text-slate-400">
              Palete fotoğraf ekleyerek QR taratıldığında görüntülenmesini sağlayın (maksimum 2 fotoğraf)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fotoğraf 1 */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Fotoğraf 1</p>
                {pallet.photo_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-cyan-500/30">
                    <img
                      src={pallet.photo_url}
                      alt="Palet fotoğrafı 1"
                      className="w-full h-40 object-contain bg-slate-800"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemovePhoto(1)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => openPhotoDialog(1)}
                      className="w-full h-40 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border-2 border-dashed border-cyan-500/50 text-cyan-400"
                      variant="ghost"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="h-6 w-6" />
                        <span className="text-sm">Fotoğraf 1 Ekle</span>
                      </div>
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Fotoğraf 2 */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Fotoğraf 2 (opsiyonel)</p>
                {(pallet as any).photo_url_2 ? (
                  <div className="relative rounded-xl overflow-hidden border border-cyan-500/30">
                    <img
                      src={(pallet as any).photo_url_2}
                      alt="Palet fotoğrafı 2"
                      className="w-full h-40 object-contain bg-slate-800"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemovePhoto(2)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => openPhotoDialog(2)}
                      className="w-full h-40 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 hover:from-cyan-500/30 hover:to-teal-500/30 border-2 border-dashed border-cyan-500/50 text-cyan-400"
                      variant="ghost"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="h-6 w-6" />
                        <span className="text-sm">Fotoğraf 2 Ekle</span>
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
        <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-cyan-300 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Palet Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
            >
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                <User className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Oluşturan</p>
                <p className="font-semibold text-slate-200">{pallet.created_by}</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20"
            >
              <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Oluşturulma</p>
                <p className="font-semibold text-sm text-slate-200">
                  {formatDate(pallet.created_at)}
                </p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.03, y: -2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20"
            >
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Package className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Koli Sayısı</p>
                <motion.p 
                  key={pallet.boxes.length}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-2xl text-emerald-400"
                >
                  {pallet.boxes.length}
                </motion.p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Box Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-cyan-300">Koli Ekle</CardTitle>
                <CardDescription className="text-slate-400">
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
                <CardContent className="space-y-4 border-t border-slate-700/50 pt-6">
                  {/* Method Selection */}
                  <div className="flex gap-2">
                    <Button
                      variant={addMethod === "select" ? "default" : "outline"}
                      onClick={() => setAddMethod("select")}
                      className={`flex-1 ${addMethod === "select" ? "bg-cyan-600 hover:bg-cyan-700" : "border-slate-600 hover:bg-slate-700"}`}
                    >
                      Listeden Seç
                    </Button>
                    <Button
                      variant={addMethod === "code" ? "default" : "outline"}
                      onClick={() => setAddMethod("code")}
                      className={`flex-1 ${addMethod === "code" ? "bg-cyan-600 hover:bg-cyan-700" : "border-slate-600 hover:bg-slate-700"}`}
                    >
                      Kod ile Ekle
                    </Button>
                  </div>

                  {/* Method: Select from list */}
                  {addMethod === "select" && (
                    <div className="space-y-3">
                      <Select value={selectedBoxId} onValueChange={setSelectedBoxId}>
                        <SelectTrigger className="h-12 bg-slate-800/50 border-slate-600">
                          <SelectValue placeholder="Koli seçin..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {availableBoxes.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-400">
                              Palete eklenebilecek koli yok
                            </div>
                          ) : (
                            availableBoxes.map((box) => (
                              <SelectItem key={box.id} value={box.id}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-cyan-400">
                                    {box.code}
                                  </span>
                                  <span>-</span>
                                  <span>{box.name}</span>
                                  <span className="text-xs text-slate-400">
                                    ({box.department.name})
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {availableBoxes.length === 0 && (
                        <p className="text-xs text-slate-400">
                          Tüm kapalı koliler zaten bir palete eklenmiş.
                        </p>
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
                          className="pl-10 h-12 font-mono bg-slate-800/50 border-slate-600"
                        />
                      </div>
                      <p className="text-xs text-slate-400">
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
                          (addMethod === "select" && !selectedBoxId) ||
                          (addMethod === "code" && !boxCodeInput.trim())
                        }
                        className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ekle
                      </Button>
                    </motion.div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddBox(false);
                        setSelectedBoxId("");
                        setBoxCodeInput("");
                      }}
                      className="border-slate-600 hover:bg-slate-700"
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
        <Card className="border-cyan-500/20 bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-cyan-300 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Paletteki Koliler 
              <Badge variant="outline" className="ml-2 border-cyan-500/50 text-cyan-400">
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
                  className="inline-block p-6 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6"
                >
                  <Package className="h-16 w-16 text-slate-500" />
                </motion.div>
                <p className="text-lg text-slate-400">Bu palette henüz koli yok</p>
                <p className="text-sm text-slate-500 mt-2">
                  Yukarıdaki panelden koli ekleyebilirsiniz
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {pallet.boxes.map((box, index) => (
                  <motion.div
                    key={box.id}
                    initial={{ opacity: 0, x: -30, rotateY: -10 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 0.05 * index, type: "spring", stiffness: 150 }}
                    whileHover={{ 
                      scale: 1.01, 
                      x: 5,
                      boxShadow: "0 0 30px rgba(6,182,212,0.2)"
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/50 border border-slate-600/50 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  >
                    {box.photo_url ? (
                      <motion.div 
                        className="h-12 w-12 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-cyan-500/20 border border-slate-600"
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
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-lg font-bold text-white shrink-0 shadow-lg shadow-cyan-500/20"
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
                        <h3 className="font-semibold truncate text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {box.name}
                        </h3>
                        <Badge className={getStatusColor(box.status)}>
                          {getStatusText(box.status)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-mono text-cyan-400/80">{box.code}</span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Building2 className="h-3 w-3" />
                          {box.department_name}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="flex items-center gap-1 text-slate-400">
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
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
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
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-cyan-300">Paleti Düzenle</DialogTitle>
            <DialogDescription className="text-slate-400">
              Palet bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Palet Adı</label>
              <Input
                value={editPalletName}
                onChange={(e) => setEditPalletName(e.target.value)}
                placeholder="Örn: Palet-1"
                className="bg-slate-800/50 border-slate-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-slate-600">
              İptal
            </Button>
            <Button onClick={handleEditPallet} disabled={isEditing} className="bg-cyan-600 hover:bg-cyan-700">
              {isEditing ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-400">Paleti Sil</DialogTitle>
            <DialogDescription className="text-slate-400">
              Bu paleti silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              Paletteki koliler paletten çıkarılacak ama silinmeyecek.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-slate-600">
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeletePallet} disabled={isDeleting}>
              {isDeleting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
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
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cyan-300 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Palet Fotoğrafı {photoIndex}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Palet için fotoğraf çekin, seçin veya sürükleyip bırakın
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Önizleme"
                  className="w-full max-h-64 object-contain rounded-lg border border-cyan-500/30"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            ) : (
              <label 
                className="block"
                onDragOver={handlePhotoDragOver}
                onDragLeave={handlePhotoDragLeave}
                onDrop={handlePhotoDrop}
              >
                <div className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                  isDraggingPhoto 
                    ? "border-cyan-400 bg-cyan-500/20 scale-[1.02]" 
                    : "border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10"
                }`}>
                  {isDraggingPhoto ? (
                    <>
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                        <Upload className="h-12 w-12 text-cyan-400 mb-3" />
                      </motion.div>
                      <span className="text-cyan-300 font-semibold">Bırakın!</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <Camera className="h-10 w-10 text-cyan-400" />
                        <span className="text-cyan-500/50 text-2xl">/</span>
                        <Upload className="h-10 w-10 text-cyan-400" />
                      </div>
                      <span className="text-cyan-400 font-medium">Fotoğraf Çek / Seç</span>
                      <span className="text-slate-500 text-sm mt-1">veya sürükleyip bırakın</span>
                      <span className="text-slate-600 text-xs mt-1">Max 5MB</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
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
              className="border-slate-600"
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
