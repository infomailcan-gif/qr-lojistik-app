"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Plus, Package, Sparkles, Zap, ArrowRight, Eye, Edit, Trash2, Hexagon } from "lucide-react";
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

export default function PalletsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pallets, setPallets] = useState<PalletWithBoxCount[]>([]);
  const [currentUserName, setCurrentUserName] = useState("");

  const [selectedPallet, setSelectedPallet] = useState<PalletWithBoxCount | null>(null);
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

      setCurrentUserName(session.user.name);
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
          <motion.div className="relative mx-auto w-16 h-16">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-cyan-200"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent"
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 opacity-20"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
          <p className="mt-4 text-slate-500 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl blur-lg opacity-40"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 shadow-xl">
              <Layers className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              Paletlerim
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-amber-500" />
              </motion.span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Oluşturduğunuz paletleri yönetin ve düzenleyin
            </p>
          </div>
        </div>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => router.push("/app/pallets/new")} 
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg shadow-cyan-500/25 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Palet
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-200">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="h-4 w-4 text-cyan-600" />
          </motion.div>
          <span className="text-sm font-semibold text-cyan-700">{pallets.length} palet</span>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
          <Package className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">
            {pallets.reduce((acc, p) => acc + p.box_count, 0)} toplam koli
          </span>
        </div>
      </motion.div>

      {/* Pallet List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {pallets.length === 0 ? (
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
            pallets.map((pallet, index) => (
              <motion.div
                key={pallet.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.05 * (index % 9), type: "spring", stiffness: 150 }}
                whileHover={{ y: -4 }}
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl truncate text-slate-800 group-hover:text-cyan-600 transition-colors">
                          {pallet.name}
                        </h3>
                        <p className="text-sm text-slate-400 font-mono mt-1">
                          {pallet.code}
                        </p>
                      </div>
                      <motion.div 
                        className="p-3 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 border border-cyan-200"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                      >
                        <Layers className="h-6 w-6 text-cyan-600" />
                      </motion.div>
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
    </div>
  );
}
