"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Layers, 
  Package, 
  Calendar, 
  User, 
  Building2, 
  ExternalLink,
  Box,
  Truck,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/app/AnimatedBackground";
import { PageTransition } from "@/components/app/PageTransition";
import { palletRepository } from "@/lib/repositories/pallet";
import type { PalletWithBoxes } from "@/lib/types/pallet";

export default function PublicPalletPage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pallet, setPallet] = useState<PalletWithBoxes | null>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadPallet();
  }, [params.code]);

  const loadPallet = async () => {
    try {
      const data = await palletRepository.getByCode(params.code);
      setPallet(data);
    } catch (error) {
      console.error("Error loading pallet:", error);
    } finally {
      setLoading(false);
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
      ? "bg-green-50 text-green-600 border-green-200"
      : "bg-amber-50 text-amber-600 border-amber-200";
  };

  const getStatusText = (status: "draft" | "sealed") => {
    return status === "sealed" ? "Kapalı" : "Taslak";
  };

  const navigateToBox = (boxCode: string) => {
    router.push(`/q/box/${boxCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-16 w-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-lg text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!pallet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10 max-w-md mx-auto p-4"
        >
          <div className="p-6 rounded-full bg-red-50 border border-red-200 inline-block mb-6">
            <Layers className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-slate-800">Palet Bulunamadı</h1>
          <p className="text-slate-500 mb-8">
            {params.code} kodlu palet bulunamadı veya silinmiş olabilir.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        <AnimatedBackground />
        
        <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-3 mb-4 p-3 rounded-2xl bg-white/70 backdrop-blur-xl border border-slate-200 shadow-lg">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-slate-500">QR Lojistik</p>
                <p className="font-semibold text-slate-800">Palet Detay</p>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold text-slate-800 mb-2">{pallet.name}</h1>
              <p className="text-slate-500 font-mono text-lg">{pallet.code}</p>
            </motion.div>
          </motion.div>

          {/* Info Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            <Card className="border-blue-200 bg-white/70 backdrop-blur-xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Oluşturan</p>
                    <p className="text-lg font-semibold text-slate-800">{pallet.created_by}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-white/70 backdrop-blur-xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tarih</p>
                    <p className="text-base font-semibold text-slate-800">
                      {new Date(pallet.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-white/70 backdrop-blur-xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <Package className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Koli Sayısı</p>
                    <p className="text-2xl font-bold text-emerald-600">{pallet.boxes.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Shipment Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <Card className={`${pallet.shipment_code ? 'border-purple-200 bg-purple-50/70' : 'border-amber-200 bg-amber-50/70'} backdrop-blur-xl shadow-lg`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-xl ${pallet.shipment_code ? 'text-purple-800' : 'text-amber-800'} flex items-center gap-2`}>
                  {pallet.shipment_code ? (
                    <Truck className="h-6 w-6" />
                  ) : (
                    <AlertTriangle className="h-6 w-6" />
                  )}
                  Sevkiyat Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pallet.shipment_code ? (
                  <div 
                    className="flex items-center gap-4 p-4 rounded-xl bg-purple-100 border border-purple-300 cursor-pointer hover:bg-purple-200 transition-colors"
                    onClick={() => router.push(`/q/shipment/${pallet.shipment_code}`)}
                  >
                    <div className="p-3 rounded-lg bg-purple-200">
                      <Truck className="h-6 w-6 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-xs text-purple-600">Sevkiyat Kodu</p>
                      <p className="font-semibold text-purple-800 font-mono">{pallet.shipment_code}</p>
                      <p className="text-xs text-purple-600 mt-1">Detay için tıklayın</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-100 border border-amber-300">
                    <div className="p-3 rounded-lg bg-amber-200">
                      <AlertTriangle className="h-6 w-6 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">Bu palet henüz bir sevkiyata eklenmemiş</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pallet Photos */}
          {(pallet.photo_url || (pallet as any).photo_url_2) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card className="border-cyan-200 bg-white/70 backdrop-blur-xl shadow-lg overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                    📷 Palet Fotoğrafları
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pallet.photo_url && (
                      <div 
                        className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-cyan-400 transition-colors"
                        onClick={() => setFullscreenPhoto(pallet.photo_url)}
                      >
                        <img
                          src={pallet.photo_url}
                          alt={`${pallet.name} fotoğrafı 1`}
                          className="w-full h-48 object-contain bg-slate-50"
                        />
                      </div>
                    )}
                    {(pallet as any).photo_url_2 && (
                      <div 
                        className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-cyan-400 transition-colors"
                        onClick={() => setFullscreenPhoto((pallet as any).photo_url_2)}
                      >
                        <img
                          src={(pallet as any).photo_url_2}
                          alt={`${pallet.name} fotoğrafı 2`}
                          className="w-full h-48 object-contain bg-slate-50"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-2">Büyütmek için fotoğrafa tıklayın</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Boxes List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pallet.photo_url ? 0.4 : 0.3 }}
          >
            <Card className="border-cyan-200 bg-white/70 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800 flex items-center gap-2">
                  <Box className="h-6 w-6 text-cyan-600" />
                  Paletteki Koliler ({pallet.boxes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pallet.boxes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Bu palette henüz koli eklenmemiş</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pallet.boxes.map((box, index) => (
                      <motion.div
                        key={box.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + 0.05 * index }}
                        onClick={() => navigateToBox(box.code)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer group"
                      >
                        {/* Box Photo or Number */}
                        {box.photo_url ? (
                          <div className="h-14 w-14 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                            <img 
                              src={box.photo_url} 
                              alt={box.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-lg font-bold text-white shrink-0">
                            {index + 1}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-slate-800 group-hover:text-cyan-600 transition-colors truncate">
                              {box.name}
                            </h3>
                            <Badge className={getStatusColor(box.status)}>
                              {getStatusText(box.status)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="font-mono text-cyan-600 text-sm">{box.code}</span>
                            <span className="flex items-center gap-1 text-sm text-slate-500">
                              <Building2 className="h-3 w-3" />
                              {box.department_name}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-slate-500">
                              <User className="h-3 w-3" />
                              {box.created_by}
                            </span>
                          </div>
                        </div>
                        
                        <ExternalLink className="h-5 w-5 text-slate-400 group-hover:text-cyan-500 transition-colors flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12 mb-4"
          >
            <p className="text-sm text-slate-400">
              Powered by <span className="font-semibold text-slate-600">Canberk Şıklı</span>
            </p>
          </motion.div>
        </div>

        {/* Fullscreen Photo Modal */}
        {fullscreenPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setFullscreenPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={fullscreenPhoto}
              alt="Fotoğraf"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setFullscreenPhoto(null)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
