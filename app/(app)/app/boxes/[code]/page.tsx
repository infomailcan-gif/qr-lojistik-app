"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Calendar, User, Building2, Edit, Download, QrCode, FileText, Image as ImageIcon, Printer, Plus, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { boxRepository } from "@/lib/repositories/box";
import type { BoxWithDetails } from "@/lib/types/box";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

export default function BoxDetailPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [box, setBox] = useState<BoxWithDetails | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadBox();
  }, [params.code]);

  useEffect(() => {
    if (box) {
      generateQRCode();
    }
  }, [box]);

  const loadBox = async () => {
    try {
      const data = await boxRepository.getByCode(params.code);
      if (!data) {
        toast({
          title: "Koli bulunamadı",
          description: `${params.code} kodlu koli bulunamadı`,
          variant: "destructive",
        });
        router.push("/app/boxes");
        return;
      }
      setBox(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Koli yüklenemedi",
        variant: "destructive",
      });
      router.push("/app/boxes");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!box) return;
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const qrUrl = `${baseUrl}/q/box/${box.code}`;
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: "#1e40af",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(dataUrl);
    } catch (error) {
      console.error("QR code generation error:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl || !box) return;
    
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
      ctx.fillStyle = "#1e40af";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Handle Turkish characters by using proper encoding
      const boxName = box.name;
      ctx.fillText(boxName, qrSize / 2, qrSize + textHeight / 2);
      
      // Download
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${box.code}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Kod İndirildi",
        description: `${box.code} QR kodu indirildi`,
      });
    };
    img.src = qrCodeUrl;
  };

  const printQRCode = () => {
    if (!qrCodeUrl || !box) return;
    
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
      ctx.fillStyle = "#1e40af";
      ctx.font = "bold 32px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const boxName = box.name;
      ctx.fillText(boxName, qrSize / 2, qrSize + textHeight / 2);
      
      // Open print window
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>QR Kod - ${box.code}</title>
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
        description: `${box.code} QR kodu yazdırılıyor`,
      });
    };
    img.src = qrCodeUrl;
  };

  const downloadPDF = () => {
    if (!box) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Calculate font size based on content amount
    const itemCount = box.lines.length;
    let baseFontSize = 11;
    let lineHeight = 8;
    
    // Adjust font size if too many items
    if (itemCount > 40) {
      baseFontSize = 9;
      lineHeight = 6;
    } else if (itemCount > 25) {
      baseFontSize = 10;
      lineHeight = 7;
    }
    
    // Helper function to replace Turkish characters for PDF compatibility
    const turkishToAscii = (text: string) => {
      const map: { [key: string]: string } = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      };
      return text.replace(/[çÇğĞıİöÖşŞüÜ]/g, (char) => map[char] || char);
    };
    
    let currentPage = 1;
    let yPos = margin;
    
    const addHeader = () => {
      // Title - Koli İçeriği
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text("KOLI ICERIGI", margin, yPos);
      yPos += 10;
      
      // Box name
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(turkishToAscii(box.name), margin, yPos);
      yPos += 7;
      
      // Box code
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Kod: ${box.code}`, margin, yPos);
      yPos += 12;
      
      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    };
    
    // Add header to first page
    addHeader();
    
    // Content list
    doc.setFont("helvetica", "normal");
    doc.setFontSize(baseFontSize);
    
    box.lines.forEach((line, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - 25) {
        doc.addPage();
        currentPage++;
        yPos = margin;
        
        // Add simple header on continuation pages
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(`${turkishToAscii(box.name)} - Sayfa ${currentPage}`, margin, yPos);
        yPos += 10;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(baseFontSize);
      }
      
      doc.setTextColor(30, 30, 30);
      
      // Number
      const numText = `${index + 1}.`;
      doc.setFont("helvetica", "bold");
      doc.text(numText, margin, yPos);
      
      // Product name and details
      doc.setFont("helvetica", "normal");
      let itemText = turkishToAscii(line.product_name);
      if (line.qty > 1) {
        itemText += ` (${line.qty} adet)`;
      }
      if (line.kind) {
        itemText += ` - ${turkishToAscii(line.kind)}`;
      }
      
      // Truncate if too long
      const maxChars = baseFontSize >= 11 ? 70 : 85;
      if (itemText.length > maxChars) {
        itemText = itemText.substring(0, maxChars - 3) + "...";
      }
      
      doc.text(itemText, margin + 12, yPos);
      yPos += lineHeight;
    });
    
    // Summary at the end
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`Toplam: ${box.lines.length} urun`, margin, yPos);
    
    // Save
    doc.save(`${box.code}-icerik-listesi.pdf`);
    
    toast({
      title: "PDF Indirildi",
      description: `${box.code} icerik listesi indirildi`,
    });
  };

  const getStatusColor = (status: "draft" | "sealed") => {
    return status === "sealed"
      ? "bg-green-50 text-green-600 border-green-200"
      : "bg-amber-50 text-amber-600 border-amber-200";
  };

  const getStatusText = (status: "draft" | "sealed") => {
    return status === "sealed" ? "Kapalı" : "Taslak";
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

  const handleEdit = () => {
    router.push(`/app/boxes/${params.code}/edit`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!box) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-800">{box.name}</h1>
              <Badge className={getStatusColor(box.status)}>
                {getStatusText(box.status)}
              </Badge>
            </div>
            <p className="text-slate-500 font-mono">{box.code}</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4" />
          Düzenle
        </Button>
      </motion.div>

      {/* Download Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <Button
          onClick={downloadQRCode}
          disabled={!qrCodeUrl}
          className="h-16 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          <Download className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">QR Kod İndir</p>
            <p className="text-xs opacity-80">600x600 PNG</p>
          </div>
        </Button>
        
        <Button
          onClick={printQRCode}
          disabled={!qrCodeUrl}
          className="h-16 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          <Printer className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">QR Kod Yazdır</p>
            <p className="text-xs opacity-80">Direkt yazdır</p>
          </div>
        </Button>
        
        <Button
          onClick={downloadPDF}
          className="h-16 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
        >
          <FileText className="h-6 w-6 mr-3" />
          <div className="text-left">
            <p className="font-semibold">İçerik Listesi PDF</p>
            <p className="text-xs opacity-80">Malzeme listesi</p>
          </div>
        </Button>
      </motion.div>

      {/* QR Code Preview */}
      {qrCodeUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                QR Kod
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-center">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                <p className="mt-3 text-lg font-bold text-blue-800">{box.name}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Photo */}
      {box.photo_url && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Koli Fotoğrafı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative cursor-pointer group"
                onClick={() => setFullscreenPhoto(box.photo_url)}
              >
                <img
                  src={box.photo_url}
                  alt="Koli fotoğrafı"
                  className="w-full max-h-96 object-contain rounded-lg border border-slate-200"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg">
                  <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Meta Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Koli Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200">
                <Building2 className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Departman</p>
                <p className="font-medium text-slate-800">{box.department.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Oluşturan</p>
                <p className="font-medium text-slate-800">{box.created_by}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Oluşturulma</p>
                <p className="font-medium text-sm text-slate-800">{formatDate(box.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Revizyon</p>
                <p className="font-medium text-slate-800">v{box.revision}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">İçerik Listesi ({box.lines.length} ürün)</CardTitle>
          </CardHeader>
          <CardContent>
            {box.lines.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Bu kolide henüz ürün yok</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                {box.lines.map((line, index) => (
                  <motion.div
                    key={line.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 text-slate-800">{line.product_name}</h3>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200">
                          Adet: {line.qty}
                        </span>
                        {line.kind && (
                          <span className="px-2 py-1 rounded bg-purple-50 text-purple-600 border border-purple-200">
                            {line.kind}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row justify-center gap-4 pb-8"
      >
        <Button 
          size="lg" 
          className="min-w-[200px] bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          Koliyi Düzenle
        </Button>
        <Button 
          size="lg" 
          variant="outline"
          className="min-w-[200px] border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400"
          onClick={() => router.push("/app/boxes/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Koli Oluştur
        </Button>
      </motion.div>

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
                alt="Koli fotoğrafı"
                className="max-w-full max-h-[85vh] sm:max-h-[80vh] object-contain p-2"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
