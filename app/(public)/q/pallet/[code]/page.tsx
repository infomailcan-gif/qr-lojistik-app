"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layers, 
  Package, 
  Calendar, 
  User, 
  Building2, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink,
  Sparkles,
  Zap,
  Box
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/app/AnimatedBackground";
import { PageTransition } from "@/components/app/PageTransition";
import { palletRepository } from "@/lib/repositories/pallet";
import type { PalletWithBoxes } from "@/lib/types/pallet";

// Cyber grid background
const CyberGrid = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Grid pattern */}
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
    
    {/* Scanning line effect */}
    <motion.div
      className="absolute inset-x-0 h-32 bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent"
      animate={{ y: ["-100%", "1000%"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
    
    {/* Floating orbs */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-64 h-64 rounded-full blur-3xl"
        style={{
          background: i % 2 === 0 
            ? "radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)"
            : "radial-gradient(circle, rgba(20,184,166,0.15), transparent 70%)",
          left: `${(i * 20) - 10}%`,
          top: `${(i % 3) * 30}%`,
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -40, 0],
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8 + i * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}

    {/* Particle effect */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={`particle-${i}`}
        className="absolute w-1 h-1 bg-cyan-400/50 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -100],
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 3,
        }}
      />
    ))}
  </div>
);

// Glowing border effect component
const GlowingCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 100 }}
    className={`relative ${className}`}
  >
    <motion.div
      className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/50 to-teal-500/50 rounded-2xl blur-sm opacity-50"
      animate={{
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 3, repeat: Infinity }}
    />
    <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-cyan-500/30 overflow-hidden">
      {children}
    </div>
  </motion.div>
);

export default function PublicPalletPage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pallet, setPallet] = useState<PalletWithBoxes | null>(null);
  const [expandedBoxes, setExpandedBoxes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPallet();
  }, [params.code]);

  const loadPallet = async () => {
    try {
      const data = await palletRepository.getByCodeWithBoxes(params.code);
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
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      : "bg-amber-500/20 text-amber-400 border-amber-500/40";
  };

  const getStatusText = (status: "draft" | "sealed") => {
    return status === "sealed" ? "Kapalı" : "Taslak";
  };

  const toggleBoxExpand = (boxId: string) => {
    const newExpanded = new Set(expandedBoxes);
    if (newExpanded.has(boxId)) {
      newExpanded.delete(boxId);
    } else {
      newExpanded.add(boxId);
    }
    setExpandedBoxes(newExpanded);
  };

  const navigateToBox = (boxCode: string) => {
    router.push(`/q/box/${boxCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <CyberGrid />
        <div className="text-center relative z-10">
          <motion.div className="relative inline-block">
            {/* Outer ring */}
            <motion.div
              className="w-24 h-24 border-4 border-cyan-500/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner ring */}
            <motion.div
              className="absolute inset-2 w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Core */}
            <motion.div
              className="absolute inset-6 w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full"
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Glow */}
            <motion.div
              className="absolute inset-0 w-24 h-24 bg-cyan-500/30 rounded-full blur-xl"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          <motion.p
            className="mt-8 text-xl font-medium bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Yükleniyor...
          </motion.p>
        </div>
      </div>
    );
  }

  if (!pallet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <CyberGrid />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10 max-w-md mx-auto p-4"
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              boxShadow: ["0 0 30px rgba(239,68,68,0.3)", "0 0 60px rgba(239,68,68,0.5)", "0 0 30px rgba(239,68,68,0.3)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-block p-8 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/10 border border-rose-500/40 mb-8"
          >
            <Layers className="h-20 w-20 text-rose-400" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-rose-400 to-red-300 bg-clip-text text-transparent">
            Palet Bulunamadı
          </h1>
          <p className="text-slate-400 text-lg">
            <span className="font-mono text-rose-400">{params.code}</span> kodlu palet bulunamadı veya silinmiş olabilir.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <CyberGrid />

      <div className="relative z-10 container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* Logo Badge */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30"
          >
            <motion.div 
              className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600"
              animate={{ 
                boxShadow: ["0 0 20px rgba(6,182,212,0.4)", "0 0 40px rgba(6,182,212,0.6)", "0 0 20px rgba(6,182,212,0.4)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Layers className="h-8 w-8 text-white" />
            </motion.div>
            <div className="text-left">
              <p className="text-sm text-slate-400">QR Lojistik</p>
              <p className="font-bold text-cyan-400 flex items-center gap-2">
                Palet Detay
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                </motion.span>
              </p>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              {pallet.name}
            </h1>
            <motion.p 
              className="text-slate-400 font-mono text-xl inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700"
              animate={{ borderColor: ["rgba(6,182,212,0.3)", "rgba(6,182,212,0.6)", "rgba(6,182,212,0.3)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="h-4 w-4 text-cyan-400" />
              {pallet.code}
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <GlowingCard delay={0.4}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/40"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <User className="h-7 w-7 text-blue-400" />
                </motion.div>
                <div>
                  <p className="text-sm text-slate-400">Oluşturan</p>
                  <p className="text-xl font-bold text-slate-200">{pallet.created_by}</p>
                </div>
              </div>
            </CardContent>
          </GlowingCard>

          <GlowingCard delay={0.5}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/40"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <Calendar className="h-7 w-7 text-purple-400" />
                </motion.div>
                <div>
                  <p className="text-sm text-slate-400">Tarih</p>
                  <p className="text-lg font-bold text-slate-200">
                    {new Date(pallet.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </GlowingCard>

          <GlowingCard delay={0.6}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  animate={{ 
                    boxShadow: ["0 0 10px rgba(16,185,129,0.2)", "0 0 20px rgba(16,185,129,0.4)", "0 0 10px rgba(16,185,129,0.2)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Package className="h-7 w-7 text-emerald-400" />
                </motion.div>
                <div>
                  <p className="text-sm text-slate-400">Koli Sayısı</p>
                  <motion.p 
                    key={pallet.boxes.length}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-emerald-400"
                  >
                    {pallet.boxes.length}
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </GlowingCard>
        </div>

        {/* Boxes List */}
        <GlowingCard delay={0.7}>
          <CardHeader className="border-b border-slate-700/50 pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Box className="h-6 w-6 text-cyan-400" />
              </motion.div>
              <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
                Paletteki Koliler
              </span>
              <Badge variant="outline" className="ml-2 border-cyan-500/50 text-cyan-400 text-lg px-3">
                {pallet.boxes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {pallet.boxes.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="inline-block p-8 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6"
                >
                  <Package className="h-20 w-20 text-slate-500" />
                </motion.div>
                <p className="text-xl text-slate-400">Bu palette henüz koli eklenmemiş</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {pallet.boxes.map((box, index) => (
                    <motion.div
                      key={box.id}
                      initial={{ opacity: 0, x: -50, rotateY: -15 }}
                      animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      transition={{ delay: 0.1 * index, type: "spring", stiffness: 100 }}
                      whileHover={{ 
                        scale: 1.02,
                        x: 10,
                      }}
                      className="relative group"
                    >
                      {/* Glow effect on hover */}
                      <motion.div
                        className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/0 to-teal-500/0 group-hover:from-cyan-500/30 group-hover:to-teal-500/30 rounded-xl blur-sm transition-all duration-300"
                      />
                      
                      <div 
                        className="relative flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-slate-800/90 to-slate-700/50 border border-slate-600/50 group-hover:border-cyan-500/50 transition-all cursor-pointer"
                        onClick={() => navigateToBox(box.code)}
                      >
                        {/* Number badge with glow */}
                        <motion.div 
                          className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-xl font-bold text-white shrink-0 shadow-lg"
                          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                          animate={{
                            boxShadow: ["0 0 15px rgba(6,182,212,0.3)", "0 0 30px rgba(6,182,212,0.5)", "0 0 15px rgba(6,182,212,0.3)"]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {index + 1}
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl truncate text-slate-200 group-hover:text-cyan-400 transition-colors">
                              {box.name}
                            </h3>
                            <Badge className={`${getStatusColor(box.status)} font-medium`}>
                              {getStatusText(box.status)}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <motion.span 
                              className="font-mono text-cyan-400/80 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30"
                              whileHover={{ scale: 1.05 }}
                            >
                              {box.code}
                            </motion.span>
                            
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded text-sm bg-slate-700/50 text-slate-300 border border-slate-600/50">
                              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                              {box.department_name}
                            </span>
                            
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded text-sm bg-slate-700/50 text-slate-300 border border-slate-600/50">
                              <User className="h-3.5 w-3.5 text-purple-400" />
                              {box.created_by}
                            </span>
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <motion.div
                          className="flex items-center gap-2 text-slate-500 group-hover:text-cyan-400 transition-colors"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <span className="text-sm hidden sm:inline">Detay</span>
                          <ExternalLink className="h-5 w-5" />
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </GlowingCard>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12 mb-8"
        >
          <motion.p 
            className="text-sm text-slate-500 inline-flex items-center gap-2"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Powered by 
            <span className="font-semibold bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">
              Canberk Şıklı
            </span>
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
