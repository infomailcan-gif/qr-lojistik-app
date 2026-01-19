"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Plus, Package, Box, Calendar, User, Eye, Edit, Trash2, Sparkles, Send, MapPin, Shield } from "lucide-react";
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
import type { ShipmentWithCounts } from "@/lib/types/shipment";
import { auth } from "@/lib/auth";

export default function ShipmentsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("user");
  const [allShipments, setAllShipments] = useState<ShipmentWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedShipment, setSelectedShipment] = useState<ShipmentWithCounts | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      
      setUserName(session.user.name);
      setUserRole(session.user.role);
      
      const data = await shipmentRepository.getAll();
      setAllShipments(data);
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // KULLANICI YETKİLENDİRMESİ: Normal kullanıcılar sadece kendi sevkiyatlarını görsün
  const shipments = useMemo(() => {
    if (userRole === "user") {
      return allShipments.filter(s => s.created_by === userName);
    }
    return allShipments;
  }, [allShipments, userRole, userName]);

  const handleShipmentClick = (shipment: ShipmentWithCounts) => {
    setSelectedShipment(shipment);
    setActionModalOpen(true);
  };

  const handleView = () => {
    if (selectedShipment) {
      router.push(`/app/shipments/${selectedShipment.code}`);
    }
    setActionModalOpen(false);
  };

  const handleEdit = () => {
    if (selectedShipment) {
      router.push(`/app/shipments/${selectedShipment.code}`);
    }
    setActionModalOpen(false);
  };

  const handleDeleteClick = () => {
    setActionModalOpen(false);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedShipment) return;
    
    setIsDeleting(true);
    try {
      const shipmentData = await shipmentRepository.getByCode(selectedShipment.code);
      if (shipmentData) {
        for (const pallet of shipmentData.pallets) {
          await palletRepository.clearShipment(pallet.code);
        }
      }
      
      await shipmentRepository.delete(selectedShipment.code);
      toast({
        title: "Sevkiyat Silindi",
        description: `${selectedShipment.code} başarıyla silindi`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sevkiyat silinemedi",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setSelectedShipment(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div className="relative mx-auto w-20 h-20">
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Spinning border */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-1 rounded-full border-4 border-purple-500/30 border-t-purple-500"
            />
            {/* Center icon */}
            <motion.div
              className="absolute inset-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              animate={{ scale: [1, 0.9, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Truck className="h-6 w-6 text-white" />
            </motion.div>
          </motion.div>
          <motion.p 
            className="mt-6 text-slate-600 font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Sevkiyatlar yükleniyor...
          </motion.p>
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
                className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl blur-lg opacity-40"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl shadow-purple-500/30">
                <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </motion.div>
            
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                Sevkiyatlarım
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </motion.span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                {userRole === "user" ? "Oluşturduğunuz sevkiyatları yönetin" : "Tüm sevkiyatları görüntüleyin"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Button - Full width on mobile */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => router.push("/app/shipments/new")} 
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 h-12 sm:h-10 text-base sm:text-sm active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Yeni Sevkiyat Oluştur
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Send className="h-4 w-4 text-purple-600" />
          </motion.div>
          <span className="text-sm font-semibold text-purple-700">{shipments.length} sevkiyat</span>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
          <Package className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">
            {shipments.reduce((acc, s) => acc + s.pallet_count, 0)} toplam palet
          </span>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
          <Box className="h-4 w-4 text-pink-600" />
          <span className="text-sm font-semibold text-pink-700">
            {shipments.reduce((acc, s) => acc + s.box_count, 0)} toplam koli
          </span>
        </div>
        
        {userRole !== "user" && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <Shield className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Tüm Sevkiyatlar</span>
          </div>
        )}
      </motion.div>

      {/* Shipment List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {shipments.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full"
            >
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200 mb-6"
                  >
                    <Truck className="h-16 w-16 text-purple-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    Henüz sevkiyat oluşturmadınız
                  </h3>
                  <p className="text-slate-500 text-center max-w-sm mb-6">
                    Paletleri hedeflerine göndermek için yeni bir sevkiyat oluşturun
                  </p>
                  <Button
                    onClick={() => router.push("/app/shipments/new")}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Sevkiyatı Oluştur
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            shipments.map((shipment, index) => (
              <motion.div
                key={shipment.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card
                  className="relative overflow-hidden border-slate-200 bg-white/80 backdrop-blur-sm hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer group"
                  onClick={() => handleShipmentClick(shipment)}
                >
                  {/* Top Gradient Line */}
                  <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500" />
                  
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  />

                  <CardContent className="p-5 space-y-4 relative">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold truncate text-slate-800 group-hover:text-purple-600 transition-colors">
                          {shipment.name_or_plate}
                        </h3>
                        <p className="text-sm text-slate-400 font-mono">
                          {shipment.code}
                        </p>
                      </div>
                      <motion.div 
                        className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                      >
                        <Truck className="w-5 h-5 text-purple-600" />
                      </motion.div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <Package className="w-3.5 h-3.5" />
                          <span>Paletler</span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-700">
                          {shipment.pallet_count}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-3 border border-pink-100">
                        <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                          <Box className="w-3.5 h-3.5" />
                          <span>Koliler</span>
                        </div>
                        <p className="text-2xl font-bold text-pink-700">
                          {shipment.box_count}
                        </p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{shipment.created_by}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(shipment.created_at)}</span>
                      </div>
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
        <DialogContent className="sm:max-w-md border-purple-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <Truck className="h-5 w-5" />
              {selectedShipment?.name_or_plate}
            </DialogTitle>
            <DialogDescription>
              Kod: {selectedShipment?.code} • {selectedShipment?.pallet_count} palet, {selectedShipment?.box_count} koli
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleView}
              variant="outline"
              className="h-14 justify-start gap-3 hover:bg-purple-50 hover:border-purple-300 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Eye className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-700 group-hover:text-purple-600">Görüntüle</p>
                <p className="text-xs text-slate-400">Sevkiyat detaylarını görüntüle</p>
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
                <p className="text-xs text-slate-400">Sevkiyat bilgilerini düzenle</p>
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
                <p className="text-xs text-slate-400">Sevkiyatı kalıcı olarak sil</p>
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
              Sevkiyatı Sil
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-slate-700">{selectedShipment?.name_or_plate}</span> ({selectedShipment?.code}) sevkiyatını silmek istediğinize emin misiniz? Bu işlem geri alınamaz. Sevkiyattaki paletler sevkiyattan çıkarılacak ama silinmeyecek.
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
    </div>
  );
}
