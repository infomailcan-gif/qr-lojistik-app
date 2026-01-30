"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save, Lock, Camera, X, Building2, Package, Sparkles, CheckCircle, Pencil, Upload, Truck, AlertTriangle, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { boxRepository } from "@/lib/repositories/box";
import { auth, type User } from "@/lib/auth";
import { activityTracker } from "@/lib/activity-tracker";
import { uploadBoxPhoto } from "@/lib/supabase/storage";
import type { CreateBoxLineData } from "@/lib/types/box";

interface LineItemForm extends CreateBoxLineData {
  tempId: string;
}

export default function NewBoxPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const [boxName, setBoxName] = useState("");
  const [lines, setLines] = useState<LineItemForm[]>([]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoDataUrl2, setPhotoDataUrl2] = useState<string | null>(null);
  const [isDirectShipment, setIsDirectShipment] = useState(false);
  const [isFragile, setIsFragile] = useState(false);
  
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("");
  const [kind, setKind] = useState("");
  
  const [errors, setErrors] = useState<{
    boxName?: string;
    lines?: string;
    productName?: string;
    qty?: string;
    photo?: string;
  }>({});
  
  // Ürün düzenleme state'leri
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editKind, setEditKind] = useState("");
  
  // Drag & drop state'leri
  const [isDragging1, setIsDragging1] = useState(false);
  const [isDragging2, setIsDragging2] = useState(false);
  const [isCompressing1, setIsCompressing1] = useState(false);
  const [isCompressing2, setIsCompressing2] = useState(false);
  const dragCounter1 = useRef(0);
  const dragCounter2 = useRef(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Oturum bilgisi alınamadı",
        variant: "destructive",
      });
      router.push("/login");
    }
  };

  const validateLineItem = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!productName.trim()) {
      newErrors.productName = "Ürün adı gerekli";
    }
    
    const qtyNum = parseInt(qty);
    if (!qty || isNaN(qtyNum) || qtyNum < 1) {
      newErrors.qty = "Adet 1 veya daha fazla olmalı";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addLine = () => {
    if (!validateLineItem()) return;
    
    const newLine: LineItemForm = {
      tempId: Math.random().toString(36).substring(7),
      product_name: productName.trim(),
      qty: parseInt(qty),
      kind: kind.trim(),
    };
    
    setLines([...lines, newLine]);
    
    setProductName("");
    setQty("");
    setKind("");
    setErrors({});
    
    toast({
      title: "Ürün eklendi",
      description: `${newLine.product_name} eklendi`,
    });
  };

  const removeLine = (tempId: string) => {
    setLines(lines.filter((l) => l.tempId !== tempId));
    toast({
      title: "Ürün kaldırıldı",
    });
  };

  const startEditLine = (line: LineItemForm) => {
    setEditingLineId(line.tempId);
    setEditProductName(line.product_name);
    setEditQty(line.qty.toString());
    setEditKind(line.kind || "");
  };

  const cancelEditLine = () => {
    setEditingLineId(null);
    setEditProductName("");
    setEditQty("");
    setEditKind("");
  };

  const saveEditLine = () => {
    if (!editProductName.trim()) {
      toast({ title: "Hata", description: "Ürün adı gerekli", variant: "destructive" });
      return;
    }
    const qtyNum = parseInt(editQty);
    if (!editQty || isNaN(qtyNum) || qtyNum < 1) {
      toast({ title: "Hata", description: "Adet 1 veya daha fazla olmalı", variant: "destructive" });
      return;
    }

    setLines(lines.map((line) => 
      line.tempId === editingLineId 
        ? { ...line, product_name: editProductName.trim(), qty: qtyNum, kind: editKind.trim() }
        : line
    ));
    
    toast({ title: "Ürün güncellendi" });
    cancelEditLine();
  };

  // Resim sıkıştırma fonksiyonu
  const compressImage = useCallback((file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
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

  // Dosya işleme fonksiyonu
  const processFile = useCallback(async (file: File, target: 1 | 2) => {
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

    // Sıkıştırma başladı göster
    if (target === 1) setIsCompressing1(true);
    else setIsCompressing2(true);

    try {
      const compressedDataUrl = await compressImage(file);
      
      if (target === 1) {
        setPhotoDataUrl(compressedDataUrl);
        setErrors((prev) => ({ ...prev, photo: undefined }));
      } else {
        setPhotoDataUrl2(compressedDataUrl);
      }
      
      // Sıkıştırma bilgisi göster
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
      if (target === 1) setIsCompressing1(false);
      else setIsCompressing2(false);
    }
  }, [compressImage]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, 1);
  };

  const handlePhoto2Select = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, 2);
  };

  const removePhoto = () => {
    setPhotoDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto2 = () => {
    setPhotoDataUrl2(null);
    if (fileInput2Ref.current) {
      fileInput2Ref.current.value = "";
    }
  };

  // Drag & Drop handlers - geliştirilmiş versiyon
  const handleDragEnter = useCallback((e: React.DragEvent, target: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 1) {
      dragCounter1.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging1(true);
      }
    } else {
      dragCounter2.current++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging2(true);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, target: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, target: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 1) {
      dragCounter1.current--;
      if (dragCounter1.current === 0) {
        setIsDragging1(false);
      }
    } else {
      dragCounter2.current--;
      if (dragCounter2.current === 0) {
        setIsDragging2(false);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, target: 1 | 2) => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 1) {
      setIsDragging1(false);
      dragCounter1.current = 0;
    } else {
      setIsDragging2(false);
      dragCounter2.current = 0;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0], target);
    }
  }, [processFile]);

  const validateBox = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!boxName.trim()) {
      newErrors.boxName = "Koli adı gerekli";
    }
    
    if (lines.length === 0) {
      newErrors.lines = "En az 1 ürün eklemelisiniz";
    }

    if (!photoDataUrl) {
      newErrors.photo = "Koli fotoğrafı zorunlu";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDraft = async () => {
    if (!boxName.trim() || !user) {
      toast({
        title: "Eksik bilgi",
        description: "Koli adı gerekli",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Fotoğraf varsa önce yükle
      let photoUrl: string | null = null;
      let photoUrl2: string | null = null;
      
      if (photoDataUrl) {
        try {
          photoUrl = await uploadBoxPhoto(photoDataUrl, `draft-${Date.now()}`);
          if (photoDataUrl2) {
            photoUrl2 = await uploadBoxPhoto(photoDataUrl2, `draft-${Date.now()}-2`);
          }
        } catch (uploadError: any) {
          toast({
            title: "Fotoğraf Yükleme Hatası",
            description: uploadError?.message || "Fotoğraf yüklenemedi. Taslak fotoğrafsız kaydedilecek.",
            variant: "destructive",
          });
          // Fotoğrafsız devam et
        }
      }
      
      const box = await boxRepository.create(
        {
          name: boxName.trim(),
          department_id: user.department_id,
          is_direct_shipment: isDirectShipment,
          is_fragile: isFragile,
        },
        user.id,
        user.name
      );
      
      // Log box creation
      activityTracker.log(
        user,
        "box_created",
        "box",
        box.code,
        box.name
      );
      
      for (const line of lines) {
        await boxRepository.addLine(box.code, {
          product_name: line.product_name,
          qty: line.qty,
          kind: line.kind,
        });
        
        // Log line addition
        activityTracker.log(
          user,
          "box_line_added",
          "box",
          box.code,
          box.name,
          line.product_name
        );
      }

      if (photoUrl) {
        await boxRepository.update(box.code, { photo_url: photoUrl, photo_url_2: photoUrl2 });
        activityTracker.log(
          user,
          "box_photo_added",
          "box",
          box.code,
          box.name
        );
      }
      
      toast({
        title: "Taslak kaydedildi",
        description: `${box.code} kodu ile taslak oluşturuldu${isDirectShipment ? ' (Direk Sevkiyat)' : ''}`,
      });
      
      router.push(`/app/boxes/${box.code}`);
    } catch (error: any) {
      console.error("Draft save error:", error);
      toast({
        title: "Hata",
        description: error?.message || "Taslak kaydedilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sealBox = async () => {
    if (!validateBox() || !user) {
      return;
    }
    
    setLoading(true);
    try {
      // Önce fotoğrafı yüklemeyi dene - hata varsa erken yakala
      let photoUrl: string;
      let photoUrl2: string | null = null;
      
      try {
        photoUrl = await uploadBoxPhoto(photoDataUrl!, `temp-${Date.now()}`);
        if (photoDataUrl2) {
          photoUrl2 = await uploadBoxPhoto(photoDataUrl2, `temp-${Date.now()}-2`);
        }
      } catch (uploadError: any) {
        toast({
          title: "Fotoğraf Yükleme Hatası",
          description: uploadError?.message || "Fotoğraf yüklenemedi. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const box = await boxRepository.create(
        {
          name: boxName.trim(),
          department_id: user.department_id,
          is_direct_shipment: isDirectShipment,
          is_fragile: isFragile,
        },
        user.id,
        user.name
      );
      
      // Log box creation
      activityTracker.log(
        user,
        "box_created",
        "box",
        box.code,
        box.name
      );
      
      for (const line of lines) {
        await boxRepository.addLine(box.code, {
          product_name: line.product_name,
          qty: line.qty,
          kind: line.kind,
        });
        
        // Log line addition
        activityTracker.log(
          user,
          "box_line_added",
          "box",
          box.code,
          box.name,
          line.product_name
        );
      }

      // Fotoğraf URL'lerini kaydet
      await boxRepository.update(box.code, { 
        photo_url: photoUrl,
        photo_url_2: photoUrl2,
        status: "sealed" 
      });
      
      // Log photo and seal
      activityTracker.log(
        user,
        "box_photo_added",
        "box",
        box.code,
        box.name
      );
      
      activityTracker.log(
        user,
        "box_sealed",
        "box",
        box.code,
        box.name
      );
      
      toast({
        title: isDirectShipment ? "Direk Sevkiyat Ürünü Oluşturuldu" : "Koli kapatıldı",
        description: `${box.code} başarıyla oluşturuldu${isDirectShipment ? ' (Direk Sevkiyat)' : ' ve kapatıldı'}`,
      });
      
      router.push(`/app/boxes/${box.code}`);
    } catch (error: any) {
      console.error("Box creation error:", error);
      toast({
        title: "Hata",
        description: error?.message || "Koli oluşturulamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div className="relative mx-auto w-16 h-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent"
            />
          </motion.div>
          <p className="mt-4 text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0 hover:bg-blue-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <Package className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              Yeni Koli Oluştur
              <Sparkles className="h-5 w-5 text-amber-500" />
            </h1>
            <p className="text-sm text-slate-500">İçerik ekleyin ve fotoğraf yükleyin</p>
          </div>
        </div>
      </motion.div>

      {/* User's Department Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Departmanınız</p>
                <p className="text-lg font-semibold text-slate-800">{user.department_name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 bg-white/50 rounded-lg p-2 border border-cyan-100">
              Oluşturduğunuz koli otomatik olarak departmanınıza ({user.department_name}) atanacaktır.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Step A: Box Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg">
                1
              </span>
              Koli Adı
            </CardTitle>
            <CardDescription>Bu koliye tanımlayıcı bir isim verin</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Örn: IT Ekipman Kolisi #1"
              value={boxName}
              onChange={(e) => setBoxName(e.target.value)}
              className={`h-12 bg-white border-slate-200 focus:border-blue-400 ${errors.boxName ? "border-red-400" : ""}`}
            />
            {errors.boxName && (
              <p className="text-sm text-red-500 mt-2">{errors.boxName}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Direct Shipment Option */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className={`border-orange-200 ${isDirectShipment ? 'bg-orange-50/80' : 'bg-white/80'} backdrop-blur-sm overflow-hidden transition-colors`}>
          <div className="h-1 bg-gradient-to-r from-orange-400 to-red-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <Truck className="h-6 w-6 text-orange-600" />
              Büyük Ürün - Direk Sevkiyat
            </CardTitle>
            <CardDescription>
              Bu ürün koliye sığmayacak kadar büyükse ve direk tıra yüklenecekse işaretleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isDirectShipment 
                  ? 'border-orange-400 bg-orange-100' 
                  : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50'
              }`}
              onClick={() => setIsDirectShipment(!isDirectShipment)}
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                isDirectShipment 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-slate-300'
              }`}>
                {isDirectShipment && <CheckCircle className="h-4 w-4 text-white" />}
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  Bu ürün direk sevkiyat tırına yüklenecek
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Bu seçenek işaretlenirse, ürün palete eklenmeden doğrudan sevkiyata eklenebilir. 
                  Büyük makineler, uzun borular vb. için kullanın.
                </p>
              </div>
            </div>
            
            {isDirectShipment && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-100 border border-amber-300"
              >
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Dikkat:</strong> Bu ürün palete eklenemeyecek. Sadece doğrudan sevkiyata eklenebilecek.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Fragile Item Option */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.27 }}
      >
        <Card className={`border-red-200 ${isFragile ? 'bg-red-50/80' : 'bg-white/80'} backdrop-blur-sm overflow-hidden transition-colors`}>
          <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <AlertOctagon className="h-6 w-6 text-red-600" />
              Kırılacak Eşya
            </CardTitle>
            <CardDescription>
              Bu kolide kırılacak, hassas eşya varsa işaretleyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                isFragile 
                  ? 'border-red-400 bg-red-100' 
                  : 'border-slate-200 hover:border-red-300 hover:bg-red-50'
              }`}
              onClick={() => setIsFragile(!isFragile)}
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                isFragile 
                  ? 'border-red-500 bg-red-500' 
                  : 'border-slate-300'
              }`}>
                {isFragile && <CheckCircle className="h-4 w-4 text-white" />}
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  Bu kolide kırılacak eşya var
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Bu seçenek işaretlenirse, QR kodun üstüne &quot;DİKKAT! KIRILACAK EŞYA&quot; yazısı eklenir ve 
                  koli listesinde kırmızı uyarı ile gösterilir.
                </p>
              </div>
            </div>
            
            {isFragile && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-100 border border-red-300"
              >
                <AlertOctagon className="h-5 w-5 text-red-600 shrink-0 animate-pulse" />
                <p className="text-sm text-red-800">
                  <strong>Dikkat:</strong> Bu koli kırılacak eşya olarak işaretlenecek. Taşıma sırasında dikkatli olunmalıdır.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Step B: Line Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg">
                2
              </span>
              İçerik Listesi
            </CardTitle>
            <CardDescription>Kolideki ürünleri ekleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Line Form */}
            <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1 block text-slate-600">Ürün Adı *</label>
                  <Input
                    placeholder="Ürün adı"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className={`bg-white ${errors.productName ? "border-red-400" : "border-slate-200"}`}
                  />
                  {errors.productName && (
                    <p className="text-xs text-red-500 mt-1">{errors.productName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-slate-600">Adet *</label>
                  <Input
                    type="number"
                    placeholder="Adet"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    min="1"
                    className={`bg-white ${errors.qty ? "border-red-400" : "border-slate-200"}`}
                  />
                  {errors.qty && (
                    <p className="text-xs text-red-500 mt-1">{errors.qty}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-slate-600">Cins (opsiyonel)</label>
                <Input
                  placeholder="Örn: Porselen, Cam, Metal"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="bg-white border-slate-200"
                />
              </div>
              <Button
                onClick={addLine}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ürün Ekle
              </Button>
            </div>

            {/* Lines List */}
            {errors.lines && (
              <p className="text-sm text-red-500">{errors.lines}</p>
            )}
            
            <div className="max-h-[500px] overflow-y-auto pr-2">
            <AnimatePresence>
              {lines.map((line, index) => (
                <motion.div
                  key={line.tempId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  {editingLineId === line.tempId ? (
                    // Düzenleme modu
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium mb-1 block text-slate-600">Ürün Adı *</label>
                          <Input
                            placeholder="Ürün adı"
                            value={editProductName}
                            onChange={(e) => setEditProductName(e.target.value)}
                            className="bg-white border-slate-200"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block text-slate-600">Adet *</label>
                          <Input
                            type="number"
                            placeholder="Adet"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            min="1"
                            className="bg-white border-slate-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block text-slate-600">Cins (opsiyonel)</label>
                        <Input
                          placeholder="Örn: Porselen, Cam, Metal"
                          value={editKind}
                          onChange={(e) => setEditKind(e.target.value)}
                          className="bg-white border-slate-200"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={saveEditLine}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Kaydet
                        </Button>
                        <Button
                          onClick={cancelEditLine}
                          variant="outline"
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          İptal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Görüntüleme modu
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-slate-800">{line.product_name}</p>
                        <p className="text-sm text-slate-500">
                          Adet: <span className="font-semibold text-blue-600">{line.qty}</span>
                          {line.kind && <span className="ml-2">• Cins: {line.kind}</span>}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditLine(line)}
                        className="text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.tempId)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            </div>

            {lines.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Henüz ürün eklenmedi</p>
                <p className="text-sm">Yukarıdaki formu kullanarak ürün ekleyin</p>
              </div>
            )}

            {lines.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-emerald-700 font-medium">{lines.length} ürün eklendi</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Step C: Photo Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-slate-200 bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg">
                3
              </span>
              Koli Fotoğrafları
            </CardTitle>
            <CardDescription>Kolinin fotoğraflarını yükleyin (1. zorunlu, 2. opsiyonel)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={fileInput2Ref}
              onChange={handlePhoto2Select}
              accept="image/*"
              className="hidden"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fotoğraf 1 */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Fotoğraf 1 <span className="text-red-500">*</span></p>
                {photoDataUrl ? (
                  <motion.div 
                    className="relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <img
                      src={photoDataUrl}
                      alt="Koli fotoğrafı 1"
                      className="w-full h-56 object-contain rounded-xl border border-slate-200 shadow-lg bg-slate-50"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 shadow-lg"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    onClick={() => !isCompressing1 && fileInputRef.current?.click()}
                    onDragEnter={(e) => handleDragEnter(e, 1)}
                    onDragOver={(e) => handleDragOver(e, 1)}
                    onDragLeave={(e) => handleDragLeave(e, 1)}
                    onDrop={(e) => handleDrop(e, 1)}
                    whileHover={{ scale: isCompressing1 ? 1 : 1.01 }}
                    whileTap={{ scale: isCompressing1 ? 1 : 0.99 }}
                    className={`border-2 border-dashed rounded-xl p-8 min-h-[180px] text-center cursor-pointer transition-all duration-200 select-none ${
                      isCompressing1
                        ? "border-amber-400 bg-amber-50/50 cursor-wait"
                        : isDragging1 
                        ? "border-blue-500 bg-blue-100 scale-[1.02] ring-4 ring-blue-200" 
                        : errors.photo 
                        ? "border-red-400 bg-red-50/50" 
                        : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"
                    }`}
                  >
                    {isCompressing1 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mb-3"
                        >
                          <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-500" />
                        </motion.div>
                        <p className="text-amber-600 font-semibold">Resim optimize ediliyor...</p>
                      </div>
                    ) : isDragging1 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <motion.div animate={{ scale: [1, 1.2, 1], y: [0, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                          <Upload className="h-14 w-14 mx-auto text-blue-500 mb-3" />
                        </motion.div>
                        <p className="text-blue-600 font-semibold text-lg">Bırakın!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <Camera className="h-10 w-10 text-slate-400" />
                          <span className="text-slate-300 text-2xl">/</span>
                          <Upload className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-slate-700 font-semibold">Fotoğraf 1 ekle</p>
                        <p className="text-sm text-slate-500 mt-2">Tıklayın veya sürükleyip bırakın</p>
                        <p className="text-xs text-slate-400 mt-1">Max 5MB • Otomatik sıkıştırma</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Fotoğraf 2 */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Fotoğraf 2 (opsiyonel)</p>
                {photoDataUrl2 ? (
                  <motion.div 
                    className="relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <img
                      src={photoDataUrl2}
                      alt="Koli fotoğrafı 2"
                      className="w-full h-56 object-contain rounded-xl border border-slate-200 shadow-lg bg-slate-50"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 shadow-lg"
                      onClick={removePhoto2}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    onClick={() => !isCompressing2 && fileInput2Ref.current?.click()}
                    onDragEnter={(e) => handleDragEnter(e, 2)}
                    onDragOver={(e) => handleDragOver(e, 2)}
                    onDragLeave={(e) => handleDragLeave(e, 2)}
                    onDrop={(e) => handleDrop(e, 2)}
                    whileHover={{ scale: isCompressing2 ? 1 : 1.01 }}
                    whileTap={{ scale: isCompressing2 ? 1 : 0.99 }}
                    className={`border-2 border-dashed rounded-xl p-8 min-h-[180px] text-center cursor-pointer transition-all duration-200 select-none ${
                      isCompressing2
                        ? "border-amber-400 bg-amber-50/50 cursor-wait"
                        : isDragging2 
                        ? "border-blue-500 bg-blue-100 scale-[1.02] ring-4 ring-blue-200" 
                        : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/50"
                    }`}
                  >
                    {isCompressing2 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mb-3"
                        >
                          <div className="h-12 w-12 rounded-full border-4 border-amber-200 border-t-amber-500" />
                        </motion.div>
                        <p className="text-amber-600 font-semibold">Resim optimize ediliyor...</p>
                      </div>
                    ) : isDragging2 ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <motion.div animate={{ scale: [1, 1.2, 1], y: [0, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity }}>
                          <Upload className="h-14 w-14 mx-auto text-blue-500 mb-3" />
                        </motion.div>
                        <p className="text-blue-600 font-semibold text-lg">Bırakın!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <Camera className="h-10 w-10 text-slate-400" />
                          <span className="text-slate-300 text-2xl">/</span>
                          <Upload className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-slate-700 font-semibold">Fotoğraf 2 ekle</p>
                        <p className="text-sm text-slate-500 mt-2">Tıklayın veya sürükleyip bırakın</p>
                        <p className="text-xs text-slate-400 mt-1">Max 5MB • Otomatik sıkıştırma</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {errors.photo && (
              <p className="text-sm text-red-500">{errors.photo}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 pb-8"
      >
        <Button
          onClick={saveDraft}
          disabled={loading || !boxName.trim()}
          variant="outline"
          className="flex-1 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
        >
          <Save className="h-4 w-4 mr-2" />
          Taslak Kaydet
        </Button>
        <Button
          onClick={sealBox}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg"
        >
          <Lock className="h-4 w-4 mr-2" />
          Koliyi Kapat
        </Button>
      </motion.div>
    </div>
  );
}
