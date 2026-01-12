"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Building2, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/app/AnimatedBackground";
import { PageTransition } from "@/components/app/PageTransition";
import { boxRepository } from "@/lib/repositories/box";
import type { BoxWithDetails } from "@/lib/types/box";

export default function PublicBoxPage({ params }: { params: { code: string } }) {
  const [loading, setLoading] = useState(true);
  const [box, setBox] = useState<BoxWithDetails | null>(null);

  useEffect(() => {
    loadBox();
  }, [params.code]);

  const loadBox = async () => {
    try {
      const data = await boxRepository.getByCode(params.code);
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

          {/* Content List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
      </div>
    </PageTransition>
  );
}
