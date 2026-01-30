"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Plus, Package, Sparkles, Zap, ArrowRight, Eye, Edit, Trash2, Shield, Search, Truck, AlertTriangle, X, AlertOctagon } from "lucide-react";
import { usePerformance } from "@/hooks/use-performance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { palletRepository } from "@/lib/repositories/pallet";
import { boxRepository } from "@/lib/repositories/box";
import { auth } from "@/lib/auth";
import type { PalletWithBoxCount } from "@/lib/types/pallet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PalletsPage() {
  const router = useRouter();
  const { shouldReduceMotion, animationDuration, staggerDelay } = usePerformance();
  const [loading, setLoading] = useState(true);
  const [pallets, setPallets] = useState<PalletWithBoxCount[]>([]);
  const [currentUserName, setCurrentUserName] = useState("");
  const [userRole, setUserRole] = useState<string>("user");
  
  // Performans optimizasyonu için animasyon ayarları
  const motionConfig = useMemo(() => ({
    initial: shouldReduceMotion ? {} : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 },
    transition: { duration: animationDuration }
  }), [shouldReduceMotion, animationDuration]);

  const [selectedPallet, setSelectedPallet] = useState<PalletWithBoxCount | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [shipmentFilter, setShipmentFilter] = useState<"all" | "in_shipment" | "not_in_shipment">("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      setCurrentUserName(session.user.name);
      setUserRole(session.user.role);
      const allPallets = await palletRepository.getAll();
      setPallets(allPallets);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Paletler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // KULLANICI YETKİLENDİRMESİ: Normal kullanıcılar sadece kendi paletlerini görsün
  const filteredPallets = useMemo(() => {
    let filtered = pallets;
    
    if (userRole === "user") {
      filtered = filtered.filter(p => p.created_by === currentUserName);
    }
    
    // Arama filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query)
      );
    }
    
    // Sevkiyat atama filtresi
    if (shipmentFilter === "in_shipment") {
      filtered = filtered.filter(p => p.shipment_code);
    } else if (shipmentFilter === "not_in_shipment") {
      filtered = filtered.filter(p => !p.shipment_code);
    }
    
    return filtered;
  }, [pallets, userRole, currentUserName, searchQuery, shipmentFilter]);

  const handlePalletClick = (pallet: PalletWithBoxCount) => {
    setSelectedPallet(pallet);
    setActionModalOpen(true);
  };

  const handleView = () => {
    if (selectedPallet) {
      router.push(`/app/pallets/${selectedPallet.code}`);
    }
    setActionModalOpen(false);
  };

  const handleEdit = () => {
    if (selectedPallet) {
      router.push(`/app/pallets/${selectedPallet.code}`);
    }
    setActionModalOpen(false);
  };

  const handleDeleteClick = () => {
    setActionModalOpen(false);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPallet) return;
    
    setIsDeleting(true);
    try {
      const palletData = await palletRepository.getByCode(selectedPallet.code);
      if (palletData) {
        for (const box of palletData.boxes) {
          await boxRepository.clearPallet(box.code);
        }
      }
      
      await palletRepository.delete(selectedPallet.code);
      toast({
        title: "Palet Silindi",
        description: `${selectedPallet.code} başarıyla silindi`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Palet silinemedi",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setSelectedPallet(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16">
            {/* Basit spinning border - CSS animation */}
            <div className="absolute inset-0 rounded-full border-4 border-cyan-200" />
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"
              style={{ animationDuration: "0.8s" }}
            />
            {/* Center icon - statik */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-4 text-slate-600 font-medium animate-pulse">
            Paletler yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-0 sm:px-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl sm:rounded-2xl blur-lg opacity-40"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-xl shadow-cyan-500/30">
                <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </motion.div>
            
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                Paletlerim
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </motion.span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                {userRole === "user" ? "Oluşturduğunuz paletleri yönetin" : "Tüm paletleri görüntüleyin"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Button - Full width on mobile */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => router.push("/app/pallets/new")} 
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg shadow-cyan-500/25 h-12 sm:h-10 text-base sm:text-sm active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Yeni Palet Oluştur
          </Button>
        </motion.div>
      </motion.div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Palet ara (ad, kod)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white/80 border-slate-200 focus:border-cyan-400"
          />
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-200">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="h-4 w-4 text-cyan-600" />
          </motion.div>
          <span className="text-sm font-semibold text-cyan-700">{filteredPallets.length} palet</span>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <Package className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">
            {filteredPallets.reduce((acc, p) => acc + p.box_count, 0)} toplam koli
          </span>
        </div>
        
        {/* Sevkiyat Atama Filtresi */}
        <Select value={shipmentFilter} onValueChange={(v) => setShipmentFilter(v as "all" | "in_shipment" | "not_in_shipment")}>
          <SelectTrigger className="w-[180px] border-slate-200 bg-white/80 h-10">
            <SelectValue placeholder="Atama Durumu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Paletler</SelectItem>
            <SelectItem value="in_shipment">Sevkiyata Eklenmiş</SelectItem>
            <SelectItem value="not_in_shipment">Sevkiyata Eklenmemiş</SelectItem>
          </SelectContent>
        </Select>
        
        {userRole !== "user" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <Shield className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Tüm Paletler</span>
          </div>
        )}
      </motion.div>

      {/* Pallet List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredPallets.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="col-span-full"
            >
              <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-200 mb-6"
                  >
                    <Layers className="h-16 w-16 text-cyan-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Palet bulunamadı</h3>
                  <p className="text-slate-500 text-center max-w-sm mb-6">
                    Henüz palet oluşturmadınız. Kolileri gruplamak için yeni palet oluşturun.
                  </p>
                  <Button
                    onClick={() => router.push("/app/pallets/new")}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Paletinizi Oluşturun
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredPallets.map((pallet, index) => (
              <motion.div
                key={pallet.id}
                layout={!shouldReduceMotion}
                initial={motionConfig.initial}
                animate={motionConfig.animate}
                exit={motionConfig.exit}
                transition={{ 
                  duration: animationDuration,
                  delay: shouldReduceMotion ? 0 : staggerDelay * Math.min(index, 6)
                }}
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
              >
                <Card
                  className="relative overflow-hidden border-slate-200 bg-white/80 backdrop-blur-sm hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10 transition-all cursor-pointer group"
                  onClick={() => handlePalletClick(pallet)}
                >
                  {/* Top Gradient Line */}
                  <div className="h-1 bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500" />
                  
                  {/* Shimmer effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  />
                  
                  <CardContent className="p-5 space-y-4 relative">
                    <div className="flex items-start gap-3">
                      {/* Küçük resim kutucuğu */}
                      {pallet.photo_url && (
                        <motion.div 
                          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-slate-200 flex-shrink-0 cursor-pointer hover:border-cyan-400 active:border-cyan-500 transition-colors shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenPhoto(pallet.photo_url);
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <img 
                            src={pallet.photo_url} 
                            alt={pallet.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 sm:bg-black/0 sm:hover:bg-black/30 active:bg-black/40 transition-colors flex items-center justify-center">
                            <Eye className="h-4 w-4 text-white drop-shadow-lg" />
                          </div>
                        </motion.div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-xl truncate text-slate-800 group-hover:text-cyan-600 transition-colors">
                              {pallet.name}
                            </h3>
                            <p className="text-sm text-slate-400 font-mono mt-1">
                              {pallet.code}
                            </p>
                          </div>
                          {!pallet.photo_url && (
                            <motion.div 
                              className="p-3 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 border border-cyan-200"
                              whileHover={{ rotate: 10, scale: 1.1 }}
                            >
                              <Layers className="h-6 w-6 text-cyan-600" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Box Count */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                        <Package className="h-5 w-5 text-emerald-600" />
                        <motion.span 
                          key={pallet.box_count}
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                          className="font-bold text-xl text-emerald-700"
                        >
                          {pallet.box_count}
                        </motion.span>
                        <span className="text-sm text-emerald-600">koli</span>
                      </div>
                    </div>

                    {/* Kırılacak Eşya Uyarısı - paletteki kolilerden birinde kırılacak eşya varsa */}
                    {(pallet as any).has_fragile && (
                      <motion.div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200"
                        animate={{ 
                          backgroundColor: ["rgba(254,226,226,1)", "rgba(254,202,202,1)", "rgba(254,226,226,1)"],
                          borderColor: ["rgba(252,165,165,1)", "rgba(248,113,113,1)", "rgba(252,165,165,1)"]
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <AlertOctagon className="h-4 w-4 text-red-600 animate-pulse" />
                        <span className="text-xs font-bold text-red-700">DİKKAT! KIRILACAK EŞYA İÇERİYOR</span>
                      </motion.div>
                    )}

                    {/* Sevkiyat Durumu */}
                    {pallet.shipment_code ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200">
                        <Truck className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-purple-700">
                          <span className="font-medium">{pallet.shipment_code}</span> sevkiyatında
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-amber-700 font-medium">
                          Sevkiyata eklenmedi
                        </span>
                      </div>
                    )}

                    {/* Kolilere Git Butonu */}
                    {pallet.box_count > 0 && (
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/app/pallets/${pallet.code}`);
                        }}
                      >
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-blue-700 font-medium">
                          Bu palete ait kolileri görüntüle ({pallet.box_count} koli)
                        </span>
                        <ArrowRight className="h-3 w-3 text-blue-500 ml-auto" />
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Oluşturan</p>
                        <p className="text-sm font-medium text-slate-600">{pallet.created_by}</p>
                      </div>
                      <motion.div
                        className="text-slate-400 group-hover:text-cyan-500 transition-colors"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md border-cyan-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-600">
              <Layers className="h-5 w-5" />
              {selectedPallet?.name}
            </DialogTitle>
            <DialogDescription>
              Kod: {selectedPallet?.code} • {selectedPallet?.box_count} koli
            </DialogDescription>
          </DialogHeader>
          
          {/* Fotoğraflar */}
          {(selectedPallet?.photo_url || selectedPallet?.photo_url_2) && (
            <div className="flex gap-3 py-2">
              {selectedPallet?.photo_url && (
                <div 
                  className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-cyan-400 transition-colors"
                  onClick={() => setFullscreenPhoto(selectedPallet.photo_url)}
                >
                  <img src={selectedPallet.photo_url} alt="Fotoğraf 1" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white opacity-0 hover:opacity-100 drop-shadow-lg" />
                  </div>
                </div>
              )}
              {selectedPallet?.photo_url_2 && (
                <div 
                  className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-slate-200 cursor-pointer hover:border-cyan-400 transition-colors"
                  onClick={() => setFullscreenPhoto(selectedPallet.photo_url_2)}
                >
                  <img src={selectedPallet.photo_url_2} alt="Fotoğraf 2" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white opacity-0 hover:opacity-100 drop-shadow-lg" />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleView}
              variant="outline"
              className="h-14 justify-start gap-3 hover:bg-cyan-50 hover:border-cyan-300 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                <Eye className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-700 group-hover:text-cyan-600">Görüntüle</p>
                <p className="text-xs text-slate-400">Palet detaylarını görüntüle</p>
              </div>
            </Button>
            
            <Button
              onClick={handleEdit}
              variant="outline"
              className="h-14 justify-start gap-3 hover:bg-amber-50 hover:border-amber-300 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <Edit className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-700 group-hover:text-amber-600">Düzenle</p>
                <p className="text-xs text-slate-400">Palet bilgilerini düzenle</p>
              </div>
            </Button>
            
            <Button
              onClick={handleDeleteClick}
              variant="outline"
              className="h-14 justify-start gap-3 hover:bg-red-50 hover:border-red-300 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 text-white">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-700 group-hover:text-red-600">Sil</p>
                <p className="text-xs text-slate-400">Paleti kalıcı olarak sil</p>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionModalOpen(false)}>
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Paleti Sil
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-slate-700">{selectedPallet?.name}</span> ({selectedPallet?.code}) paletini silmek istediğinize emin misiniz? Bu işlem geri alınamaz. Paletteki koliler paletten çıkarılacak ama silinmeyecek.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-rose-500"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Modal */}
      <AnimatePresence>
        {fullscreenPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setFullscreenPhoto(null)}
          >
            <motion.img
              src={fullscreenPhoto}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain rounded-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            />
            <button
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              onClick={() => setFullscreenPhoto(null)}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
