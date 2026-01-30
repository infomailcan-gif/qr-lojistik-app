"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Truck,
  Package,
  Box,
  Plus,
  X,
  Calendar,
  User,
  Search,
  AlertCircle,
  Download,
  QrCode,
  FileText,
  Trash2,
  Edit,
  Layers,
  Camera,
  Printer,
  Upload,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { shipmentRepository } from "@/lib/repositories/shipment";
import { palletRepository } from "@/lib/repositories/pallet";
import { boxRepository } from "@/lib/repositories/box";
import { auth } from "@/lib/auth";
import { uploadShipmentPhoto } from "@/lib/supabase/storage";
import type { ShipmentWithPallets } from "@/lib/types/shipment";
import type { PalletWithBoxCount } from "@/lib/types/pallet";
import type { BoxWithDepartment } from "@/lib/types/box";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import Image from "next/image";

export default function ShipmentDetailPage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const [shipment, setShipment] = useState<ShipmentWithPallets | null>(null);
  const [loading, setLoading] = useState(true);
  const [addPalletOpen, setAddPalletOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<"list" | "code">("list");
  const [availablePallets, setAvailablePallets] = useState<PalletWithBoxCount[]>([]);
  const [palletCode, setPalletCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Direct shipment boxes
  const [addDirectBoxOpen, setAddDirectBoxOpen] = useState(false);
  const [availableDirectBoxes, setAvailableDirectBoxes] = useState<BoxWithDepartment[]>([]);
  const [directBoxesInShipment, setDirectBoxesInShipment] = useState<BoxWithDepartment[]>([]);
  const [directBoxCode, setDirectBoxCode] = useState("");
  const [addingDirectBox, setAddingDirectBox] = useState(false);
  const [directBoxMethod, setDirectBoxMethod] = useState<"list" | "code">("list");
  
  // Edit/Delete states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editNameOrPlate, setEditNameOrPlate] = useState("");
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
    loadShipment();
    loadAvailablePallets();
    loadAvailableDirectBoxes();
  }, [params.code]);

  useEffect(() => {
    if (shipment) {
      generateQRCode();
    }
  }, [shipment]);

  const loadShipment = async () => {
    try {
      const data = await shipmentRepository.getByCode(params.code);
      setShipment(data);
      if (data) {
        setEditNameOrPlate(data.name_or_plate);
      }
      
      // Load direct shipment boxes in this shipment
      const allBoxes = await boxRepository.getAll();
      const directBoxes = allBoxes.filter(
        (b) => (b as any).shipment_code === params.code && (b as any).is_direct_shipment
      );
      setDirectBoxesInShipment(directBoxes);
    } catch (error) {
      console.error("Error loading shipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePallets = async () => {
    try {
      // Get user session to filter pallets
      const session = await auth.getSession();
      if (!session) return;
      
      // Get all pallets and filter by user and not in a shipment
      const allPallets = await palletRepository.getAll();
      const pallets = allPallets.filter(
        (p) => p.created_by === session.user.name && !p.shipment_code
      );
      setAvailablePallets(pallets);
    } catch (error) {
      console.error("Error loading available pallets:", error);
    }
  };

  const loadAvailableDirectBoxes = async () => {
    try {
      // Get user session to filter boxes
      const session = await auth.getSession();
      if (!session) return;
      
      // Get all boxes and filter by: is_direct_shipment=true, sealed, not in a shipment yet
      const allBoxes = await boxRepository.getAll();
      const directBoxes = allBoxes.filter(
        (b) => 
          (b as any).is_direct_shipment === true && 
          b.status === "sealed" && 
          !(b as any).shipment_code &&
          b.created_by === session.user.name
      );
      setAvailableDirectBoxes(directBoxes);
    } catch (error) {
      console.error("Error loading available direct boxes:", error);
    }
  };

  const generateQRCode = async () => {
    if (!shipment) return;
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const qrUrl = `${baseUrl}/q/shipment/${shipment.code}`;
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: "#9333ea",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(dataUrl);
    } catch (error) {
      console.error("QR code generation error:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !shipment) return;
    
    // Create canvas with QR code and name
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = document.createElement("img");
    img.onload = () => {
      const qrSize = 600;
      const textHeight = 80;
      const maxWidth = qrSize - 40;
      
      canvas.width = qrSize;
      canvas.height = qrSize + textHeight;
      
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 0, 0, qrSize, qrSize);
      
      // Draw name below QR - with auto font sizing
      ctx.fillStyle = "#9333ea";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      let shipmentName = shipment.name_or_plate;
      let fontSize = 32;
      
      // Find the right font size
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      while (ctx.measureText(shipmentName).width > maxWidth && fontSize > 14) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      }
      
      // If still too long, truncate
      if (ctx.measureText(shipmentName).width > maxWidth) {
        while (ctx.measureText(shipmentName + "...").width > maxWidth && shipmentName.length > 0) {
          shipmentName = shipmentName.slice(0, -1);
        }
        shipmentName += "...";
      }
      
      ctx.fillText(shipmentName, qrSize / 2, qrSize + textHeight / 2);
      
      // Download
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${shipment.code}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Kod İndirildi",
        description: `${shipment.code} QR kodu indirildi`,
      });
    };
    img.src = qrCodeUrl;
  };

  const printQRCode = () => {
    if (!qrCodeUrl || !shipment) return;
    
    // Create canvas with QR code and name
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = document.createElement("img");
    img.onload = () => {
      const qrSize = 600;
      const textHeight = 80;
      const maxWidth = qrSize - 40;
      
      canvas.width = qrSize;
      canvas.height = qrSize + textHeight;
      
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 0, 0, qrSize, qrSize);
      
      // Draw name below QR - with auto font sizing
      ctx.fillStyle = "#9333ea";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      let shipmentName = shipment.name_or_plate;
      let fontSize = 32;
      
      // Find the right font size
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      while (ctx.measureText(shipmentName).width > maxWidth && fontSize > 14) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      }
      
      // If still too long, truncate
      if (ctx.measureText(shipmentName).width > maxWidth) {
        while (ctx.measureText(shipmentName + "...").width > maxWidth && shipmentName.length > 0) {
          shipmentName = shipmentName.slice(0, -1);
        }
        shipmentName += "...";
      }
      
      ctx.fillText(shipmentName, qrSize / 2, qrSize + textHeight / 2);
      
      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>QR Kod - ${shipment.code}</title>
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
        description: `${shipment.code} QR kodu yazdırılıyor`,
      });
    };
    img.src = qrCodeUrl;
  };

  const downloadPalletListPDF = useCallback(() => {
    if (!shipment) return;

    // Show loading toast
    toast({
      title: "PDF Oluşturuluyor",
      description: "Lütfen bekleyin...",
    });

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const doc = new jsPDF({
        compress: true, // Enable compression
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // Turkish character helper
      const turkishToAscii = (text: string) => {
        const map: { [key: string]: string } = {
          'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G',
          'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O',
          'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
        };
        return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => map[char] || char);
      };
      
      // Simple header
      doc.setFillColor(147, 51, 234);
      doc.rect(0, 0, pageWidth, 30, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("SEVKIYAT RAPORU", margin, 18);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${turkishToAscii(shipment.name_or_plate)} - ${shipment.code}`, margin, 26);
      
      // Shipment Info - compact
      let yPos = 40;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      const totalBoxes = shipment.pallets.reduce((sum, p) => sum + p.box_count, 0);
      doc.text(`Olusturan: ${turkishToAscii(shipment.created_by)} | Tarih: ${new Date(shipment.created_at).toLocaleDateString("tr-TR")}`, margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.text(`Palet: ${shipment.pallets.length} | Koli: ${totalBoxes}`, margin, yPos);
      yPos += 10;
      
      // Simple divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      // Pallets
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Palet Listesi", margin, yPos);
      yPos += 8;
      
      if (shipment.pallets.length === 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Bu sevkiyatta henuz palet yok.", margin, yPos);
      } else {
        doc.setFontSize(10);
        
        shipment.pallets.forEach((pallet, index) => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = 20;
          }
          
          // Pallet header
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, yPos - 3, pageWidth - (margin * 2), 12, "F");
          
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 0, 0);
          doc.text(`${index + 1}. ${turkishToAscii(pallet.name)} (${pallet.code})`, margin + 3, yPos + 5);
          doc.text(`${pallet.box_count} koli`, pageWidth - margin - 20, yPos + 5);
          
          yPos += 14;
          
          // Boxes - compact list
          if (pallet.boxes && pallet.boxes.length > 0) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            
            pallet.boxes.forEach((box) => {
              if (yPos > pageHeight - 15) {
                doc.addPage();
                yPos = 20;
              }
              
              const boxText = `  - ${turkishToAscii(box.name)} (${box.code})`;
              doc.text(boxText.length > 70 ? boxText.substring(0, 67) + "..." : boxText, margin + 5, yPos);
              yPos += 5;
            });
            yPos += 3;
          }
        });
      }
      
      // Save
      doc.save(`${shipment.code}-rapor.pdf`);
      
      toast({
        title: "PDF Indirildi",
        description: "Sevkiyat raporu indirildi",
      });
    }, 100);
  }, [shipment]);

  const handleAddPallet = async (code: string) => {
    setAdding(true);
    try {
      // Get user session to check ownership
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const pallet = await palletRepository.getByCode(code);
      if (!pallet) {
        toast({
          title: "Hata",
          description: `${code} kodlu palet bulunamadı`,
          variant: "destructive",
        });
        return;
      }

      // Check if pallet belongs to user
      if (pallet.created_by !== session.user.name) {
        toast({
          title: "Yetki Hatası",
          description: "Sadece kendi oluşturduğunuz paletleri ekleyebilirsiniz",
          variant: "destructive",
        });
        return;
      }

      if (pallet.shipment_code && pallet.shipment_code !== params.code) {
        toast({
          title: "Palet Zaten Başka Sevkiyatta",
          description: `Bu palet ${pallet.shipment_code} sevkiyatına bağlı`,
          variant: "destructive",
        });
        return;
      }

      await palletRepository.setShipment(code, params.code);

      toast({
        title: "Palet Eklendi",
        description: `${code} kodlu palet sevkiyata eklendi`,
      });

      setAddPalletOpen(false);
      setPalletCode("");
      await loadShipment();
      await loadAvailablePallets();
    } catch (error) {
      console.error("Error adding pallet:", error);
      toast({
        title: "Hata",
        description: "Palet eklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePallet = async (code: string) => {
    try {
      await palletRepository.clearShipment(code);
      toast({
        title: "Palet Çıkarıldı",
        description: `${code} kodlu palet sevkiyattan çıkarıldı`,
      });
      await loadShipment();
      await loadAvailablePallets();
    } catch (error) {
      console.error("Error removing pallet:", error);
      toast({
        title: "Hata",
        description: "Palet çıkarılırken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleAddDirectBox = async (code: string) => {
    setAddingDirectBox(true);
    try {
      // Get user session to check ownership
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const box = await boxRepository.getByCode(code);
      if (!box) {
        toast({
          title: "Hata",
          description: `${code} kodlu ürün bulunamadı`,
          variant: "destructive",
        });
        return;
      }

      // Check if box is a direct shipment item
      if (!(box as any).is_direct_shipment) {
        toast({
          title: "Hata",
          description: "Bu ürün direk sevkiyat ürünü değil. Önce palete ekleyin.",
          variant: "destructive",
        });
        return;
      }

      // Check if box belongs to user
      if (box.created_by !== session.user.name) {
        toast({
          title: "Yetki Hatası",
          description: "Sadece kendi oluşturduğunuz ürünleri ekleyebilirsiniz",
          variant: "destructive",
        });
        return;
      }

      if ((box as any).shipment_code && (box as any).shipment_code !== params.code) {
        toast({
          title: "Ürün Zaten Başka Sevkiyatta",
          description: `Bu ürün ${(box as any).shipment_code} sevkiyatına bağlı`,
          variant: "destructive",
        });
        return;
      }

      // Add to shipment
      await boxRepository.update(code, { shipment_code: params.code });

      toast({
        title: "Direk Sevkiyat Ürünü Eklendi",
        description: `${code} kodlu ürün sevkiyata eklendi`,
      });

      setAddDirectBoxOpen(false);
      setDirectBoxCode("");
      await loadShipment();
      await loadAvailableDirectBoxes();
    } catch (error) {
      console.error("Error adding direct box:", error);
      toast({
        title: "Hata",
        description: "Ürün eklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setAddingDirectBox(false);
    }
  };

  const handleRemoveDirectBox = async (code: string) => {
    try {
      await boxRepository.update(code, { shipment_code: null });
      toast({
        title: "Ürün Çıkarıldı",
        description: `${code} kodlu ürün sevkiyattan çıkarıldı`,
      });
      await loadShipment();
      await loadAvailableDirectBoxes();
    } catch (error) {
      console.error("Error removing direct box:", error);
      toast({
        title: "Hata",
        description: "Ürün çıkarılırken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleEditShipment = async () => {
    if (!editNameOrPlate.trim()) {
      toast({
        title: "Hata",
        description: "Plaka/ad boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    try {
      await shipmentRepository.update(params.code, {
        name_or_plate: editNameOrPlate.trim(),
      });
      toast({
        title: "Sevkiyat Güncellendi",
        description: "Sevkiyat bilgileri başarıyla güncellendi",
      });
      setEditDialogOpen(false);
      await loadShipment();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sevkiyat güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteShipment = async () => {
    setIsDeleting(true);
    try {
      // First remove all pallets from this shipment
      if (shipment) {
        for (const pallet of shipment.pallets) {
          await palletRepository.clearShipment(pallet.code);
        }
      }
      
      await shipmentRepository.delete(params.code);
      toast({
        title: "Sevkiyat Silindi",
        description: "Sevkiyat başarıyla silindi",
      });
      router.push("/app/shipments");
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sevkiyat silinirken bir hata oluştu",
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
        const img = document.createElement("img");
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
    if (!photoPreview || !shipment) return;

    setUploadingPhoto(true);
    try {
      const photoUrl = await uploadShipmentPhoto(photoPreview, photoIndex === 1 ? shipment.code : `${shipment.code}-2`);
      
      if (photoIndex === 1) {
        await shipmentRepository.update(shipment.code, { photo_url: photoUrl });
      } else {
        await shipmentRepository.update(shipment.code, { photo_url_2: photoUrl });
      }
      
      toast({
        title: "Fotoğraf Yüklendi",
        description: `Sevkiyat fotoğrafı ${photoIndex} başarıyla eklendi`,
      });
      
      setPhotoDialogOpen(false);
      setPhotoPreview(null);
      await loadShipment();
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
    if (!shipment) return;
    
    if (!confirm(`Sevkiyat fotoğrafı ${index}'i silmek istediğinize emin misiniz?`)) return;

    try {
      if (index === 1) {
        await shipmentRepository.update(shipment.code, { photo_url: null });
      } else {
        await shipmentRepository.update(shipment.code, { photo_url_2: null });
      }
      
      toast({
        title: "Fotoğraf Silindi",
        description: `Sevkiyat fotoğrafı ${index} başarıyla silindi`,
      });
      
      await loadShipment();
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sevkiyat Bulunamadı</h2>
            <p className="text-muted-foreground mb-4">
              {params.code} kodlu sevkiyat mevcut değil
            </p>
            <Button onClick={() => router.push("/app/shipments")}>
              Sevkiyatlar Sayfasına Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalBoxes = shipment.pallets.reduce((sum, p) => sum + p.box_count, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-background/50 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate">{shipment.name_or_plate}</h1>
                <p className="text-sm text-muted-foreground font-mono">{shipment.code}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setEditDialogOpen(true)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* QR & Download Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-purple-500/20">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {qrCodeUrl && (
                  <div className="p-3 bg-white rounded-xl shadow-lg text-center">
                    <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                    <p className="mt-2 text-sm font-bold text-purple-700">{shipment.name_or_plate}</p>
                  </div>
                )}
                <div className="flex-1 space-y-3 w-full">
                  <h3 className="font-semibold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-purple-500" />
                    Sevkiyat QR & Dökümanlar
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      onClick={downloadQRCode}
                      disabled={!qrCodeUrl}
                      className="h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      QR İndir
                    </Button>
                    <Button
                      onClick={printQRCode}
                      disabled={!qrCodeUrl}
                      className="h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      QR Yazdır
                    </Button>
                    <Button
                      onClick={downloadPalletListPDF}
                      variant="outline"
                      className="h-12"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Palet Listesi PDF
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    QR Link: /q/shipment/{shipment.code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shipment Photos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-purple-500" />
                Sevkiyat Fotoğrafları (maksimum 2)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fotoğraf 1 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Fotoğraf 1</p>
                  {shipment.photo_url ? (
                    <div className="relative rounded-xl overflow-hidden border border-border group cursor-pointer">
                      <img
                        src={shipment.photo_url}
                        alt="Sevkiyat fotoğrafı 1"
                        className="w-full h-40 object-contain bg-accent"
                        onClick={() => setFullscreenPhoto(shipment.photo_url)}
                      />
                      <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none"
                      >
                        <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemovePhoto(1); }}
                        className="absolute top-2 right-2 p-2 rounded-full bg-destructive/80 hover:bg-destructive text-white transition-colors z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => openPhotoDialog(1)}
                      className="w-full h-40 bg-purple-500/10 hover:bg-purple-500/20 border-2 border-dashed border-purple-500/50 text-purple-600"
                      variant="ghost"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="h-6 w-6" />
                        <span className="text-sm">Fotoğraf 1 Ekle</span>
                      </div>
                    </Button>
                  )}
                </div>

                {/* Fotoğraf 2 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Fotoğraf 2 (opsiyonel)</p>
                  {(shipment as any).photo_url_2 ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img
                        src={(shipment as any).photo_url_2}
                        alt="Sevkiyat fotoğrafı 2"
                        className="w-full h-40 object-contain bg-accent"
                      />
                      <button
                        onClick={() => handleRemovePhoto(2)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-destructive/80 hover:bg-destructive text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => openPhotoDialog(2)}
                      className="w-full h-40 bg-purple-500/10 hover:bg-purple-500/20 border-2 border-dashed border-purple-500/50 text-purple-600"
                      variant="ghost"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="h-6 w-6" />
                        <span className="text-sm">Fotoğraf 2 Ekle</span>
                      </div>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Shipment Meta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-accent/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <Layers className="w-4 h-4" />
                    <span>Paletler</span>
                  </div>
                  <p className="text-3xl font-bold">{shipment.pallets.length}</p>
                </div>
                <div className="bg-accent/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                    <Box className="w-4 h-4" />
                    <span>Koliler</span>
                  </div>
                  <p className="text-3xl font-bold">{totalBoxes}</p>
                </div>
                <div className="col-span-2 bg-accent/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>{shipment.created_by}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(shipment.created_at)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Pallet Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Sevkiyata Palet Ekle
                </h2>
              </div>
              <Button
                onClick={() => setAddPalletOpen(true)}
                className="w-full h-12 bg-purple-500/10 hover:bg-purple-500/20 border-2 border-dashed border-purple-500/50 text-purple-600"
                variant="ghost"
              >
                <Plus className="w-4 h-4 mr-2" />
                Palet Ekle
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Direct Shipment Box Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-orange-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  Direk Sevkiyat Ürünü Ekle
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Palete sığmayan büyük ürünleri doğrudan sevkiyata ekleyin
              </p>
              <Button
                onClick={() => setAddDirectBoxOpen(true)}
                className="w-full h-12 bg-orange-500/10 hover:bg-orange-500/20 border-2 border-dashed border-orange-500/50 text-orange-600"
                variant="ghost"
              >
                <Plus className="w-4 h-4 mr-2" />
                Direk Sevkiyat Ürünü Ekle
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pallets List */}
        {shipment.pallets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold mb-4">
                  Sevkiyattaki Paletler ({shipment.pallets.length})
                </h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {shipment.pallets.map((pallet) => (
                    <motion.div
                      key={pallet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-accent/50 rounded-lg p-4 border border-border hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => router.push(`/app/pallets/${pallet.code}`)}
                        >
                          <h3 className="font-semibold hover:text-purple-500 transition-colors">
                            {pallet.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">{pallet.code}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            <Box className="w-3 h-3 mr-1" />
                            {pallet.box_count} koli
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePallet(pallet.code)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      {pallet.boxes.length > 0 && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-border">
                          {pallet.boxes.map((box) => (
                            <div
                              key={box.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 cursor-pointer hover:bg-background transition-colors"
                              onClick={() => router.push(`/app/boxes/${box.code}`)}
                            >
                              {/* Box Photo */}
                              {box.photo_url ? (
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                                  <img 
                                    src={box.photo_url} 
                                    alt={box.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                                  <Box className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{box.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{box.code}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">{box.department_name}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {shipment.pallets.length === 0 && directBoxesInShipment.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-8 text-center">
                <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Bu sevkiyatta henüz palet veya direk sevkiyat ürünü yok. Yukarıdaki butonları kullanarak ekleyin.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Direct Shipment Boxes List */}
        {directBoxesInShipment.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-orange-200">
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  Direk Sevkiyat Ürünleri ({directBoxesInShipment.length})
                </h2>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {directBoxesInShipment.map((box) => (
                    <motion.div
                      key={box.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-orange-50 rounded-lg p-4 border border-orange-200 hover:border-orange-400 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => router.push(`/app/boxes/${box.code}`)}
                        >
                          {box.photo_url ? (
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-orange-200">
                              <img 
                                src={box.photo_url} 
                                alt={box.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <Truck className="w-6 h-6 text-orange-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-orange-800 hover:text-orange-600 transition-colors">
                              {box.name}
                            </h3>
                            <p className="text-sm text-orange-600 font-mono">{box.code}</p>
                            <Badge className="mt-2 bg-orange-500 text-white text-xs">
                              <Truck className="w-3 h-3 mr-1" />
                              Direk Sevkiyat
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDirectBox(box.code)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4 text-emerald-800">
                <Package className="w-5 h-5 text-emerald-600" />
                Hızlı İşlemler
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => router.push("/app")}
                  variant="outline"
                  className="h-12 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Ana Sayfaya Dön
                </Button>
                <Button
                  onClick={() => router.push("/app/shipments/new")}
                  className="h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Sevkiyat Oluştur
                </Button>
                <Button
                  onClick={() => router.push("/app/shipments")}
                  variant="outline"
                  className="h-12 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Tüm Sevkiyatlar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Pallet Dialog */}
      <Dialog open={addPalletOpen} onOpenChange={setAddPalletOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              Sevkiyata Palet Ekle
            </DialogTitle>
            <DialogDescription>
              Sevkiyata eklemek istediğiniz paleti listeden seçin veya palet kodunu girin
            </DialogDescription>
          </DialogHeader>

          {/* Method Tabs */}
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant={addMethod === "list" ? "default" : "outline"}
              onClick={() => setAddMethod("list")}
              size="sm"
            >
              Listeden Seç
            </Button>
            <Button
              variant={addMethod === "code" ? "default" : "outline"}
              onClick={() => setAddMethod("code")}
              size="sm"
            >
              Kod ile Ekle
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {addMethod === "list" ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  {availablePallets.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Eklenebilecek palet bulunamadı</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tüm paletler bir sevkiyata bağlı
                      </p>
                    </div>
                  ) : (
                    availablePallets.map((pallet) => (
                      <motion.div
                        key={pallet.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-accent/50 rounded-lg p-4 border border-border hover:border-purple-500/50 transition-all cursor-pointer"
                        onClick={() => handleAddPallet(pallet.code)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{pallet.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">{pallet.code}</p>
                          </div>
                          <Badge variant="outline">
                            <Box className="w-3 h-3 mr-1" />
                            {pallet.box_count} koli
                          </Badge>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 py-4"
                >
                  <div>
                    <Input
                      placeholder="P-XXXX"
                      value={palletCode}
                      onChange={(e) => setPalletCode(e.target.value.toUpperCase())}
                      className="h-12 text-lg font-mono"
                      disabled={adding}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Eklemek istediğiniz paletin kodunu girin (örn: P-AB12)
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAddPallet(palletCode)}
                    disabled={!palletCode.trim() || adding}
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {adding ? "Ekleniyor..." : "Palet Ekle"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Direct Box Dialog */}
      <Dialog open={addDirectBoxOpen} onOpenChange={setAddDirectBoxOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              Direk Sevkiyat Ürünü Ekle
            </DialogTitle>
            <DialogDescription>
              Palete sığmayan büyük ürünleri doğrudan sevkiyata ekleyin
            </DialogDescription>
          </DialogHeader>

          {/* Method Tabs */}
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant={directBoxMethod === "list" ? "default" : "outline"}
              onClick={() => setDirectBoxMethod("list")}
              size="sm"
              className={directBoxMethod === "list" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              Listeden Seç
            </Button>
            <Button
              variant={directBoxMethod === "code" ? "default" : "outline"}
              onClick={() => setDirectBoxMethod("code")}
              size="sm"
              className={directBoxMethod === "code" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              Kod ile Ekle
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {directBoxMethod === "list" ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  {availableDirectBoxes.length === 0 ? (
                    <div className="text-center py-8">
                      <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Eklenebilecek direk sevkiyat ürünü bulunamadı</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Koli oluştururken &quot;Direk Sevkiyat&quot; seçeneğini işaretleyin
                      </p>
                    </div>
                  ) : (
                    availableDirectBoxes.map((box) => (
                      <motion.div
                        key={box.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-orange-50 rounded-lg p-4 border border-orange-200 hover:border-orange-400 transition-all cursor-pointer"
                        onClick={() => handleAddDirectBox(box.code)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {box.photo_url ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-orange-200">
                                <img 
                                  src={box.photo_url} 
                                  alt={box.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <Truck className="w-5 h-5 text-orange-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-orange-800">{box.name}</h3>
                              <p className="text-sm text-orange-600 font-mono">{box.code}</p>
                            </div>
                          </div>
                          <Badge className="bg-orange-500 text-white">
                            <Truck className="w-3 h-3 mr-1" />
                            Direk
                          </Badge>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 py-4"
                >
                  <div>
                    <Input
                      placeholder="BOX-XXXX"
                      value={directBoxCode}
                      onChange={(e) => setDirectBoxCode(e.target.value.toUpperCase())}
                      className="h-12 text-lg font-mono"
                      disabled={addingDirectBox}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Eklemek istediğiniz direk sevkiyat ürününün kodunu girin
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAddDirectBox(directBoxCode)}
                    disabled={!directBoxCode.trim() || addingDirectBox}
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {addingDirectBox ? "Ekleniyor..." : "Ürün Ekle"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sevkiyatı Düzenle</DialogTitle>
            <DialogDescription>
              Sevkiyat bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plaka veya Sevkiyat Adı</label>
              <Input
                value={editNameOrPlate}
                onChange={(e) => setEditNameOrPlate(e.target.value)}
                placeholder="Örn: 16 ABC 123"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleEditShipment} disabled={isEditing}>
              {isEditing ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Sevkiyatı Sil</DialogTitle>
            <DialogDescription>
              Bu sevkiyatı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              Sevkiyattaki paletler sevkiyattan çıkarılacak ama silinmeyecek.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteShipment} disabled={isDeleting}>
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
                alt="Sevkiyat fotoğrafı"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-500" />
              Sevkiyat Fotoğrafı {photoIndex}
            </DialogTitle>
            <DialogDescription>
              Sevkiyat için fotoğraf çekin, seçin veya sürükleyip bırakın
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Önizleme"
                  className="w-full max-h-64 object-contain rounded-lg border border-border"
                />
                <button
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
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
                    ? "border-purple-400 bg-purple-500/20 scale-[1.02] ring-4 ring-purple-200" 
                    : "border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10"
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
                        <Upload className="h-14 w-14 text-purple-500 mb-3" />
                      </motion.div>
                      <span className="text-purple-600 font-semibold text-lg">Bırakın!</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <Camera className="h-10 w-10 text-purple-500" />
                        <span className="text-purple-400/50 text-2xl">/</span>
                        <Upload className="h-10 w-10 text-purple-500" />
                      </div>
                      <span className="text-purple-600 font-semibold">Fotoğraf Çek / Seç</span>
                      <span className="text-muted-foreground text-sm mt-2">veya sürükleyip bırakın</span>
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
            >
              İptal
            </Button>
            <Button
              onClick={handlePhotoUpload}
              disabled={!photoPreview || uploadingPhoto}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {uploadingPhoto ? "Yükleniyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
