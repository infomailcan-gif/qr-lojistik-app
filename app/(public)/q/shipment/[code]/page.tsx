"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Truck,
  Package,
  Box,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/app/AnimatedBackground";
import { PageTransition } from "@/components/app/PageTransition";
import { shipmentRepository } from "@/lib/repositories/shipment";
import type { ShipmentWithPallets } from "@/lib/types/shipment";

export default function PublicShipmentPage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const [shipment, setShipment] = useState<ShipmentWithPallets | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPallets, setExpandedPallets] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadShipment();
  }, [params.code]);

  const loadShipment = async () => {
    try {
      const data = await shipmentRepository.getWithPallets(params.code);
      setShipment(data);
    } catch (error) {
      console.error("Error loading shipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePallet = (palletId: string) => {
    setExpandedPallets((prev) => {
      const next = new Set(prev);
      if (next.has(palletId)) {
        next.delete(palletId);
      } else {
        next.add(palletId);
      }
      return next;
    });
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
        <AnimatedBackground />
        <div className="text-center relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-16 w-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-lg text-slate-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10"
        >
          <Card className="bg-white/70 backdrop-blur-xl border-slate-200 shadow-lg max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Sevkiyat Bulunamadı
              </h2>
              <p className="text-slate-500">
                {params.code} kodlu sevkiyat mevcut değil
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const totalBoxes = shipment.pallets.reduce(
    (sum, p) => sum + p.box_count,
    0
  );

  return (
    <PageTransition>
      <div className="min-h-screen">
        <AnimatedBackground />
        
        {/* Header */}
        <div className="relative z-10 bg-white/60 backdrop-blur-xl border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25 mb-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {shipment.name_or_plate}
              </h1>
              <p className="text-lg text-slate-500 font-mono">{shipment.code}</p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/70 backdrop-blur-xl border-slate-200 shadow-lg">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-center">
                    <Package className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 mb-1">Paletler</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {shipment.pallets.length}
                    </p>
                  </div>
                  <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 text-center">
                    <Box className="w-5 h-5 text-pink-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 mb-1">Koliler</p>
                    <p className="text-2xl font-bold text-slate-800">{totalBoxes}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-3.5 h-3.5" />
                      <span>Oluşturan: {shipment.created_by}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(shipment.created_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pallets */}
          {shipment.pallets.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/70 backdrop-blur-xl border-slate-200 shadow-lg">
                <CardContent className="p-5">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    Sevkiyattaki Paletler ({shipment.pallets.length})
                  </h2>
                  <div className="space-y-3">
                    {shipment.pallets.map((pallet, index) => {
                      const isExpanded = expandedPallets.has(pallet.id);
                      return (
                        <motion.div
                          key={pallet.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden"
                        >
                          {/* Pallet Header */}
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() =>
                                  router.push(`/q/pallet/${pallet.code}`)
                                }
                              >
                                <h3 className="font-semibold text-slate-800 hover:text-purple-600 transition-colors">
                                  {pallet.name}
                                </h3>
                                <p className="text-sm text-slate-500 font-mono">
                                  {pallet.code}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="mt-2 text-xs border-purple-200 text-purple-600 bg-purple-50"
                                >
                                  <Box className="w-3 h-3 mr-1" />
                                  {pallet.box_count} koli
                                </Badge>
                              </div>
                              {pallet.boxes.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => togglePallet(pallet.id)}
                                  className="hover:bg-slate-200"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Pallet Boxes (Expandable) */}
                          {isExpanded && pallet.boxes.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-200"
                            >
                              <div className="p-4 space-y-2 bg-white/50">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                  Paletteki Koliler
                                </p>
                                {pallet.boxes.map((box) => (
                                  <div
                                    key={box.id}
                                    className="flex items-center gap-3 p-3 rounded bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() =>
                                      router.push(`/q/box/${box.code}`)
                                    }
                                  >
                                    <Box className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-slate-800 truncate">
                                        {box.name}
                                      </p>
                                      <p className="text-xs text-slate-500 font-mono">
                                        {box.code}
                                      </p>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-slate-200"
                                    >
                                      {box.department_name}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/70 backdrop-blur-xl border-slate-200 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">Bu sevkiyatta henüz palet yok</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-slate-400"
          >
            Powered by <span className="font-semibold text-slate-600">Canberk Şıklı</span>
          </motion.p>
        </div>
      </div>
    </PageTransition>
  );
}
