"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Building2, Calendar, User, Layers, Truck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/app/AnimatedBackground";
import { PageTransition } from "@/components/app/PageTransition";
import { boxRepository } from "@/lib/repositories/box";
import type { BoxWithPalletAndShipment } from "@/lib/types/box";

export default function PublicBoxPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [box, setBox] = useState<BoxWithPalletAndShipment | null>(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadBox();
  }, [params.code]);

  const loadBox = async () => {
    try {
      const data = await boxRepository.getByCodeWithPalletAndShipment(params.code);
      setBox(data);
    } catch (error) {
      console.error("Error loading box:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-lg text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10 max-w-md mx-auto p-4"
        >
          <div className="p-6 rounded-full bg-red-50 border border-red-200 inline-block mb-6">
            <Package className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-slate-800">Koli Bulunamadı</h1>
          <p className="text-slate-500 mb-8">
            {params.code} kodlu koli bulunamadı veya silinmiş olabilir.
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
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-slate-500">QR Lojistik</p>
                <p className="font-semibold text-slate-800">Koli Detay</p>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-slate-800">{box.name}</h1>
                <Badge className={getStatusColor(box.status)}>
                  {getStatusText(box.status)}
                </Badge>
              </div>
              <p className="text-slate-500 font-mono text-lg">{box.code}</p>
            </motion.div>
          </motion.div>

          {/* Info Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
          >
            <Card className="border-cyan-200 bg-white/70 backdrop-blur-xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                    <Building2 className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Departman</p>
                    <p className="text-lg font-semibold text-slate-800">{box.department.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-white/70 backdrop-blur-xl shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Oluşturan</p>
                    <p className="text-lg font-semibold text-slate-800">{box.created_by}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-white/70 backdrop-blur-xl shadow-lg sm:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Oluşturulma Tarihi</p>
                    <p className="text-lg font-semibold text-slate-800">{formatDate(box.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pallet & Shipment Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <Card className={`${box.pallet_info || box.shipment_info || box.is_direct_shipment ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70'} backdrop-blur-xl shadow-lg`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-xl ${box.pallet_info || box.shipment_info || box.is_direct_shipment ? 'text-emerald-800' : 'text-amber-800'} flex items-center gap-2`}>
                  {box.pallet_info || box.shipment_info || box.is_direct_shipment ? (
                    <Layers className="h-6 w-6" />
                  ) : (
                    <AlertTriangle className="h-6 w-6" />
                  )}
                  Palet & Sevkiyat Durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                {box.is_direct_shipment ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-100 border border-orange-300">
                      <Truck className="h-5 w-5 text-orange-600" />
                      <span className="text-orange-800 font-medium">Bu ürün direk sevkiyat için işaretlenmiş</span>
                    </div>
                    {box.shipment_info ? (
                      <div 
                        className="flex items-center gap-3 p-4 rounded-lg bg-purple-100 border border-purple-300 cursor-pointer hover:bg-purple-200 transition-colors"
                        onClick={() => router.push(`/q/shipment/${box.shipment_info!.code}`)}
                      >
                        <div className="p-2 rounded-lg bg-purple-200">
                          <Truck className="h-5 w-5 text-purple-700" />
                        </div>
                        <div>
                          <p className="text-xs text-purple-600">Sevkiyat</p>
                          <p className="font-semibold text-purple-800">{box.shipment_info.name_or_plate}</p>
                          <p className="text-xs text-purple-600 font-mono">{box.shipment_info.code}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-100 border border-amber-300">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <span className="text-amber-800">Bu ürün henüz bir sevkiyata eklenmemiş</span>
                      </div>
                    )}
                  </div>
                ) : box.pallet_info ? (
                  <div className="space-y-3">
                    <div 
                      className="flex items-center gap-3 p-4 rounded-lg bg-cyan-100 border border-cyan-300 cursor-pointer hover:bg-cyan-200 transition-colors"
                      onClick={() => router.push(`/q/pallet/${box.pallet_info!.code}`)}
                    >
                      <div className="p-2 rounded-lg bg-cyan-200">
                        <Layers className="h-5 w-5 text-cyan-700" />
                      </div>
                      <div>
                        <p className="text-xs text-cyan-600">Palet</p>
                        <p className="font-semibold text-cyan-800">{box.pallet_info.name}</p>
                        <p className="text-xs text-cyan-600 font-mono">{box.pallet_info.code}</p>
                      </div>
                    </div>
                    {box.shipment_info ? (
                      <div 
                        className="flex items-center gap-3 p-4 rounded-lg bg-purple-100 border border-purple-300 cursor-pointer hover:bg-purple-200 transition-colors"
                        onClick={() => router.push(`/q/shipment/${box.shipment_info!.code}`)}
                      >
                        <div className="p-2 rounded-lg bg-purple-200">
                          <Truck className="h-5 w-5 text-purple-700" />
                        </div>
                        <div>
                          <p className="text-xs text-purple-600">Sevkiyat</p>
                          <p className="font-semibold text-purple-800">{box.shipment_info.name_or_plate}</p>
                          <p className="text-xs text-purple-600 font-mono">{box.shipment_info.code}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 border border-slate-300">
                        <Truck className="h-5 w-5 text-slate-500" />
                        <span className="text-slate-600">Palet henüz bir sevkiyata eklenmemiş</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-100 border border-amber-300">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-800">Bu koli henüz herhangi bir palete veya sevkiyata eklenmemiş</p>
                      <p className="text-sm text-amber-700 mt-1">Lütfen bu koliyi bir palete ekleyin.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Box Photos */}
          {(box.photo_url || (box as any).photo_url_2) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-green-200 bg-white/70 backdrop-blur-xl shadow-lg overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                    📷 Koli Fotoğrafları
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {box.photo_url && (
                      <div 
                        className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => setFullscreenPhoto(box.photo_url)}
                      >
                        <img
                          src={box.photo_url}
                          alt={`${box.name} fotoğrafı 1`}
                          className="w-full h-48 object-contain bg-slate-50"
                        />
                      </div>
                    )}
                    {(box as any).photo_url_2 && (
                      <div 
                        className="rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => setFullscreenPhoto((box as any).photo_url_2)}
                      >
                        <img
                          src={(box as any).photo_url_2}
                          alt={`${box.name} fotoğrafı 2`}
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

          {/* Content List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: box.photo_url ? 0.4 : 0.3 }}
          >
            <Card className="border-blue-200 bg-white/70 backdrop-blur-xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800">
                  İçerik Listesi ({box.lines.length} ürün)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {box.lines.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Bu kolide henüz ürün yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {box.lines.map((line, index) => (
                      <motion.div
                        key={line.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + 0.05 * index }}
                        className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-base font-bold text-white shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xl mb-2 text-slate-800">{line.product_name}</h3>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                              Adet: {line.qty}
                            </span>
                            {line.kind && (
                              <span className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
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
