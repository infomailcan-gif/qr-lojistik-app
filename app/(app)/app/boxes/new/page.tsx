"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Save, Lock, Camera, X, Building2, Package, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { boxRepository } from "@/lib/repositories/box";
import { auth, type User } from "@/lib/auth";
import { activityTracker } from "@/lib/activity-tracker";
import type { CreateBoxLineData } from "@/lib/types/box";

interface LineItemForm extends CreateBoxLineData {
  tempId: string;
}

export default function NewBoxPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  const [boxName, setBoxName] = useState("");
  const [lines, setLines] = useState<LineItemForm[]>([]);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  
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
      const box = await boxRepository.create(
        {
          name: boxName.trim(),
          department_id: user.department_id,
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
        await boxRepository.addLine(box.id, {
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

      if (photoDataUrl) {
        await boxRepository.update(box.id, { photo_url: photoDataUrl });
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
        description: `${box.code} kodu ile taslak oluşturuldu`,
      });
      
      router.push(`/app/boxes/${box.code}`);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Taslak kaydedilemedi",
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
      const box = await boxRepository.create(
        {
          name: boxName.trim(),
          department_id: user.department_id,
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
        await boxRepository.addLine(box.id, {
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

      await boxRepository.update(box.id, { 
        photo_url: photoDataUrl,
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
        title: "Koli kapatıldı",
        description: `${box.code} başarıyla oluşturuldu ve kapatıldı`,
      });
      
      router.push(`/app/boxes/${box.code}`);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Koli oluşturulamadı",
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
            
            <AnimatePresence>
              {lines.map((line, index) => (
                <motion.div
                  key={line.tempId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
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
                    onClick={() => removeLine(line.tempId)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>

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
              Koli Fotoğrafı
            </CardTitle>
            <CardDescription>Kolinin son halinin fotoğrafını yükleyin (zorunlu)</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />

            {photoDataUrl ? (
              <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img
                  src={photoDataUrl}
                  alt="Koli fotoğrafı"
                  className="w-full max-h-80 object-contain rounded-xl border border-slate-200 shadow-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 shadow-lg"
                  onClick={removePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-sm shadow-lg">
                  <CheckCircle className="h-4 w-4" />
                  Fotoğraf yüklendi
                </div>
              </motion.div>
            ) : (
              <motion.div
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/50 ${
                  errors.photo ? "border-red-400 bg-red-50/50" : "border-slate-300"
                }`}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Camera className="h-14 w-14 mx-auto text-slate-300 mb-4" />
                </motion.div>
                <p className="text-slate-600 font-medium mb-1">Fotoğraf yüklemek için tıklayın</p>
                <p className="text-sm text-slate-400">veya dosyayı buraya sürükleyin</p>
                <p className="text-xs text-slate-400 mt-2">Maksimum 5MB, JPG/PNG/GIF</p>
              </motion.div>
            )}

            {errors.photo && (
              <p className="text-sm text-red-500 mt-2">{errors.photo}</p>
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
