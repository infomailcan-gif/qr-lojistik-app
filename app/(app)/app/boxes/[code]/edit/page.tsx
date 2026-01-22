"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save, Lock, Camera, X, Pencil, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { departmentRepository } from "@/lib/repositories/department";
import { boxRepository } from "@/lib/repositories/box";
import { auth, type User } from "@/lib/auth";
import { activityTracker } from "@/lib/activity-tracker";
import { uploadBoxPhoto } from "@/lib/supabase/storage";
import type { Department, BoxWithDetails, CreateBoxLineData } from "@/lib/types/box";

interface LineItemForm extends CreateBoxLineData {
  tempId: string;
  existingId?: string;
}

export default function EditBoxPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // URL'deki box kodunu sabit tutmak için ref kullan - state güncellemelerinden etkilenmez
  const boxCodeRef = useRef<string>(params.code);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [box, setBox] = useState<BoxWithDetails | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form state
  const [departmentId, setDepartmentId] = useState("");
  const [boxName, setBoxName] = useState("");
  const [lines, setLines] = useState<LineItemForm[]>([]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoDataUrl2, setPhotoDataUrl2] = useState<string | null>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  
  // Current line being added
  const [productName, setProductName] = useState("");
  const [qty, setQty] = useState("");
  const [kind, setKind] = useState("");
  
  // Deleted lines (to track for saving)
  const [deletedLineIds, setDeletedLineIds] = useState<string[]>([]);
  
  // Errors
  const [errors, setErrors] = useState<{
    department?: string;
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

  useEffect(() => {
    // params.code değiştiğinde ref'i güncelle
    boxCodeRef.current = params.code;
    loadData();
  }, [params.code]);

  const loadData = async () => {
    try {
      // Get current user
      const session = await auth.getSession();
      if (session) {
        setCurrentUser(session.user);
      }

      // URL'deki kodu kullan (boxCodeRef'ten)
      const currentCode = boxCodeRef.current;
      
      const [deps, boxData] = await Promise.all([
        departmentRepository.getAll(),
        boxRepository.getByCode(currentCode),
      ]);
      
      setDepartments(deps);
      
      if (!boxData) {
        toast({
          title: "Koli bulunamadı",
          description: `${currentCode} kodlu koli bulunamadı`,
          variant: "destructive",
        });
        router.push("/app/boxes");
        return;
      }
      
      // boxCodeRef'i gerçek veritabanı code değeriyle güncelle (güvenlik için)
      boxCodeRef.current = boxData.code;
      
      setBox(boxData);
      setDepartmentId(boxData.department_id);
      setBoxName(boxData.name);
      setPhotoDataUrl(boxData.photo_url);
      setPhotoDataUrl2((boxData as any).photo_url_2 || null);
      
      // Convert existing lines to form format
      const formLines: LineItemForm[] = boxData.lines.map((line) => ({
        tempId: line.id,
        existingId: line.id,
        product_name: line.product_name,
        qty: line.qty,
        kind: line.kind || "",
      }));
      setLines(formLines);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler yüklenemedi",
        variant: "destructive",
      });
      router.push("/app/boxes");
    } finally {
      setLoading(false);
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
    
    // Reset form
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
    const lineToRemove = lines.find((l) => l.tempId === tempId);
    if (lineToRemove?.existingId) {
      setDeletedLineIds([...deletedLineIds, lineToRemove.existingId]);
    }
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setPhotoDataUrl(event.target?.result as string);
      setErrors((prev) => ({ ...prev, photo: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhoto2Select = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setPhotoDataUrl2(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto2 = () => {
    setPhotoDataUrl2(null);
    if (fileInput2Ref.current) {
      fileInput2Ref.current.value = "";
    }
  };

  const validateBox = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!departmentId) {
      newErrors.department = "Departman seçimi zorunlu";
    }
    
    if (!boxName.trim()) {
      newErrors.boxName = "Koli adı gerekli";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveChanges = async () => {
    if (!validateBox() || !box) return;
    
    setSaving(true);
    try {
      // boxCodeRef.current kullan - bu her zaman doğru koli kodunu içerir
      const currentBoxCode = boxCodeRef.current;
      
      // Fotoğraf değişikliklerini hazırla
      let finalPhotoUrl: string | null | undefined = undefined;
      let finalPhotoUrl2: string | null | undefined = undefined;
      
      // Fotoğraf 1 değişti mi kontrol et
      if (photoDataUrl !== box.photo_url) {
        if (photoDataUrl && photoDataUrl.startsWith("data:")) {
          // Yeni fotoğraf yüklendi - Storage'a yükle
          try {
            const uploadedUrl = await uploadBoxPhoto(photoDataUrl, currentBoxCode);
            finalPhotoUrl = uploadedUrl;
          } catch (uploadError: any) {
            toast({
              title: "Fotoğraf Yükleme Hatası",
              description: uploadError?.message || "Fotoğraf 1 yüklenemedi",
              variant: "destructive",
            });
            setSaving(false);
            return;
          }
        } else {
          // Fotoğraf silindi veya değişmedi
          finalPhotoUrl = photoDataUrl;
        }
      }
      
      // Fotoğraf 2 değişti mi kontrol et
      const originalPhotoUrl2 = (box as any).photo_url_2 || null;
      if (photoDataUrl2 !== originalPhotoUrl2) {
        if (photoDataUrl2 && photoDataUrl2.startsWith("data:")) {
          // Yeni fotoğraf yüklendi - Storage'a yükle
          try {
            const uploadedUrl2 = await uploadBoxPhoto(photoDataUrl2, `${currentBoxCode}-2`);
            finalPhotoUrl2 = uploadedUrl2;
          } catch (uploadError: any) {
            toast({
              title: "Fotoğraf Yükleme Hatası",
              description: uploadError?.message || "Fotoğraf 2 yüklenemedi",
              variant: "destructive",
            });
            setSaving(false);
            return;
          }
        } else {
          // Fotoğraf silindi veya değişmedi
          finalPhotoUrl2 = photoDataUrl2;
        }
      }
      
      // Update objesi hazırla - sadece değişen alanları gönder
      const updateData: any = {
        name: boxName.trim(),
        department_id: departmentId,
      };
      
      if (finalPhotoUrl !== undefined) {
        updateData.photo_url = finalPhotoUrl;
      }
      if (finalPhotoUrl2 !== undefined) {
        updateData.photo_url_2 = finalPhotoUrl2;
      }
      
      // Update box basic info
      await boxRepository.update(currentBoxCode, updateData);
      
      // Delete removed lines
      for (const lineId of deletedLineIds) {
        await boxRepository.deleteLine(lineId);
        // Log line removal
        if (currentUser) {
          activityTracker.log(
            currentUser,
            "box_line_removed",
            "box",
            currentBoxCode,
            box.name
          );
        }
      }
      
      // Add new lines (those without existingId)
      for (const line of lines) {
        if (!line.existingId) {
          await boxRepository.addLine(currentBoxCode, {
            product_name: line.product_name,
            qty: line.qty,
            kind: line.kind,
          });
          // Log line addition
          if (currentUser) {
            activityTracker.log(
              currentUser,
              "box_line_added",
              "box",
              currentBoxCode,
              box.name,
              line.product_name
            );
          }
        }
      }
      
      // Log box update
      if (currentUser) {
        activityTracker.log(
          currentUser,
          "box_updated",
          "box",
          currentBoxCode,
          box.name
        );
      }
      
      toast({
        title: "Değişiklikler kaydedildi",
        description: `${currentBoxCode} başarıyla güncellendi`,
      });
      
      router.push(`/app/boxes/${currentBoxCode}`);
    } catch (error: any) {
      console.error("Box save error:", error);
      toast({
        title: "Hata",
        description: error?.message || "Değişiklikler kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sealBox = async () => {
    if (!validateBox() || !box) return;
    
    if (lines.length === 0) {
      setErrors({ lines: "Koliyi kapatmak için en az 1 ürün eklemelisiniz" });
      return;
    }

    if (!photoDataUrl) {
      setErrors({ photo: "Koliyi kapatmak için fotoğraf zorunlu" });
      return;
    }
    
    setSaving(true);
    try {
      // boxCodeRef.current kullan - bu her zaman doğru koli kodunu içerir
      const currentBoxCode = boxCodeRef.current;
      
      // Fotoğraf değişikliklerini hazırla
      let finalPhotoUrl: string | null = photoDataUrl;
      if (photoDataUrl && photoDataUrl.startsWith("data:")) {
        try {
          const uploadedUrl = await uploadBoxPhoto(photoDataUrl, currentBoxCode);
          finalPhotoUrl = uploadedUrl;
        } catch (uploadError: any) {
          toast({
            title: "Fotoğraf Yükleme Hatası",
            description: uploadError?.message || "Fotoğraf 1 yüklenemedi",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }
      
      let finalPhotoUrl2: string | null = photoDataUrl2;
      if (photoDataUrl2 && photoDataUrl2.startsWith("data:")) {
        try {
          const uploadedUrl2 = await uploadBoxPhoto(photoDataUrl2, `${currentBoxCode}-2`);
          finalPhotoUrl2 = uploadedUrl2;
        } catch (uploadError: any) {
          toast({
            title: "Fotoğraf Yükleme Hatası",
            description: uploadError?.message || "Fotoğraf 2 yüklenemedi",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }
      
      // Update box basic info with photo
      await boxRepository.update(currentBoxCode, {
        name: boxName.trim(),
        department_id: departmentId,
        photo_url: finalPhotoUrl,
        photo_url_2: finalPhotoUrl2,
      });
      
      // Log photo addition
      if (currentUser && photoDataUrl && photoDataUrl !== box.photo_url) {
        activityTracker.log(
          currentUser,
          "box_photo_added",
          "box",
          currentBoxCode,
          box.name
        );
      }
      
      // Delete removed lines
      for (const lineId of deletedLineIds) {
        await boxRepository.deleteLine(lineId);
      }
      
      // Add new lines (those without existingId)
      for (const line of lines) {
        if (!line.existingId) {
          await boxRepository.addLine(currentBoxCode, {
            product_name: line.product_name,
            qty: line.qty,
            kind: line.kind,
          });
        }
      }
      
      // Seal the box
      await boxRepository.update(currentBoxCode, { status: "sealed" });
      
      // Log box sealed
      if (currentUser) {
        activityTracker.log(
          currentUser,
          "box_sealed",
          "box",
          currentBoxCode,
          box.name
        );
      }
      
      toast({
        title: "Koli kapatıldı",
        description: `${currentBoxCode} başarıyla güncellendi ve kapatıldı`,
      });
      
      router.push(`/app/boxes/${currentBoxCode}`);
    } catch (error: any) {
      console.error("Seal box error:", error);
      toast({
        title: "Hata",
        description: error?.message || "İşlem tamamlanamadı",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Koli Düzenle</h1>
          <p className="text-slate-500 font-mono">{box.code}</p>
        </div>
      </motion.div>

      {/* Step A: Department Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                1
              </span>
              Departman Seçimi
            </CardTitle>
            <CardDescription>Koli hangi departmana ait?</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className={`h-12 bg-white/50 ${errors.department ? "border-red-500" : ""}`}>
                <SelectValue placeholder="Departman seçin..." />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-sm text-red-500 mt-2">{errors.department}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Step B: Box Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                2
              </span>
              Koli Adı
            </CardTitle>
            <CardDescription>Bu koliye tanımlayıcı bir isim verin</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Örn: Restoran Kolisi #1"
              value={boxName}
              onChange={(e) => setBoxName(e.target.value)}
              className={`h-12 bg-white/50 ${errors.boxName ? "border-red-500" : ""}`}
            />
            {errors.boxName && (
              <p className="text-sm text-red-500 mt-2">{errors.boxName}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Step C: Line Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                3
              </span>
              İçerik Listesi
            </CardTitle>
            <CardDescription>Kolideki ürünleri ekleyin veya düzenleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Line Form */}
            <div className="space-y-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1 block text-slate-700">Ürün Adı *</label>
                  <Input
                    placeholder="Ürün adı"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className={`bg-white ${errors.productName ? "border-red-500" : ""}`}
                  />
                  {errors.productName && (
                    <p className="text-xs text-red-500 mt-1">{errors.productName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-slate-700">Adet *</label>
                  <Input
                    type="number"
                    placeholder="Adet"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    min="1"
                    className={`bg-white ${errors.qty ? "border-red-500" : ""}`}
                  />
                  {errors.qty && (
                    <p className="text-xs text-red-500 mt-1">{errors.qty}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block text-slate-700">Cins (opsiyonel)</label>
                <Input
                  placeholder="Örn: Porselen, Cam, Metal"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="bg-white"
                />
              </div>
              <Button
                onClick={addLine}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ürün Ekle
              </Button>
            </div>

            {/* Lines List */}
            {errors.lines && (
              <p className="text-sm text-red-500">{errors.lines}</p>
            )}
            
            <AnimatePresence>
              {lines.map((line, index) => (
                <motion.div
                  key={line.tempId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-3 rounded-lg bg-white border border-slate-200"
                >
                  {editingLineId === line.tempId ? (
                    // Düzenleme modu
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium mb-1 block text-slate-700">Ürün Adı *</label>
                          <Input
                            placeholder="Ürün adı"
                            value={editProductName}
                            onChange={(e) => setEditProductName(e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium mb-1 block text-slate-700">Adet *</label>
                          <Input
                            type="number"
                            placeholder="Adet"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            min="1"
                            className="bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block text-slate-700">Cins (opsiyonel)</label>
                        <Input
                          placeholder="Örn: Porselen, Cam, Metal"
                          value={editKind}
                          onChange={(e) => setEditKind(e.target.value)}
                          className="bg-white"
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-slate-800">{line.product_name}</p>
                        <p className="text-sm text-slate-500">
                          Adet: {line.qty}
                          {line.kind && ` • Cins: ${line.kind}`}
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
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {lines.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <p>Henüz ürün eklenmedi</p>
                <p className="text-sm">Yukarıdaki formu kullanarak ürün ekleyin</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Step D: Photo Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                4
              </span>
              Koli Fotoğrafları
            </CardTitle>
            <CardDescription>Kolinin fotoğraflarını yükleyin {box.status === "draft" ? "(en az 1 fotoğraf kapatmak için zorunlu)" : ""} - Maksimum 2 fotoğraf</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Gizli input'lar */}
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
                <p className="text-sm font-medium text-slate-700 mb-2">Fotoğraf 1 {box.status === "draft" && "*"}</p>
                {photoDataUrl ? (
                  <div className="relative">
                    <img
                      src={photoDataUrl}
                      alt="Koli fotoğrafı 1"
                      className="w-full h-48 object-contain rounded-lg border border-slate-200 bg-slate-50"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 ${
                      errors.photo ? "border-red-500 bg-red-50/50" : "border-slate-300"
                    }`}
                  >
                    <Camera className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">Fotoğraf 1 ekle</p>
                    <p className="text-xs text-slate-400">Max 5MB</p>
                  </div>
                )}
              </div>

              {/* Fotoğraf 2 */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Fotoğraf 2 (opsiyonel)</p>
                {photoDataUrl2 ? (
                  <div className="relative">
                    <img
                      src={photoDataUrl2}
                      alt="Koli fotoğrafı 2"
                      className="w-full h-48 object-contain rounded-lg border border-slate-200 bg-slate-50"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removePhoto2}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInput2Ref.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50 border-slate-300"
                  >
                    <Camera className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">Fotoğraf 2 ekle</p>
                    <p className="text-xs text-slate-400">Max 5MB</p>
                  </div>
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
          onClick={saveChanges}
          disabled={saving || !departmentId || !boxName.trim()}
          variant="outline"
          className="flex-1 border-blue-200 hover:bg-blue-50"
        >
          <Save className="h-4 w-4 mr-2" />
          Değişiklikleri Kaydet
        </Button>
        {box.status === "draft" && (
          <Button
            onClick={sealBox}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Lock className="h-4 w-4 mr-2" />
            Koliyi Kapat
          </Button>
        )}
      </motion.div>
    </div>
  );
}
