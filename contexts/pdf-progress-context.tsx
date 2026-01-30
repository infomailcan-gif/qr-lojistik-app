"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Download, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfProgressState {
  isGenerating: boolean;
  type: "boxes" | "pallets" | "shipments" | null;
  progress: number;
  total: number;
  fileName: string;
  isComplete: boolean;
}

interface PdfProgressContextType {
  state: PdfProgressState;
  startPdfGeneration: (type: "boxes" | "pallets" | "shipments", total: number) => void;
  updateProgress: (progress: number) => void;
  completePdfGeneration: (fileName: string) => void;
  resetState: () => void;
}

const initialState: PdfProgressState = {
  isGenerating: false,
  type: null,
  progress: 0,
  total: 0,
  fileName: "",
  isComplete: false,
};

const PdfProgressContext = createContext<PdfProgressContextType | undefined>(undefined);

export function PdfProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PdfProgressState>(initialState);

  const startPdfGeneration = useCallback((type: "boxes" | "pallets" | "shipments", total: number) => {
    setState({
      isGenerating: true,
      type,
      progress: 0,
      total,
      fileName: "",
      isComplete: false,
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const completePdfGeneration = useCallback((fileName: string) => {
    setState(prev => ({
      ...prev,
      isComplete: true,
      fileName,
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const getTypeLabel = () => {
    switch (state.type) {
      case "boxes": return "Koli";
      case "pallets": return "Palet";
      case "shipments": return "Sevkiyat";
      default: return "PDF";
    }
  };

  const getTypeColor = () => {
    switch (state.type) {
      case "boxes": return "from-blue-500 to-indigo-600";
      case "pallets": return "from-cyan-500 to-teal-600";
      case "shipments": return "from-purple-500 to-pink-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <PdfProgressContext.Provider value={{ state, startPdfGeneration, updateProgress, completePdfGeneration, resetState }}>
      {children}
      
      {/* Global PDF Progress Bar - Fixed position */}
      <AnimatePresence>
        {state.isGenerating && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] pointer-events-auto"
          >
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className={`bg-gradient-to-r ${getTypeColor()} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    {state.isComplete ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <CheckCircle className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <FileText className="h-6 w-6" />
                      </motion.div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm">
                        {state.isComplete ? "PDF Hazır!" : `${getTypeLabel()} PDF Oluşturuluyor`}
                      </h3>
                      {!state.isComplete && state.total > 0 && (
                        <p className="text-xs text-white/80">
                          {state.progress} / {state.total} işleniyor...
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {state.isComplete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={resetState}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {!state.isComplete && (
                <div className="p-4">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getTypeColor()}`}
                      initial={{ width: 0 }}
                      animate={{ 
                        width: state.total > 0 
                          ? `${(state.progress / state.total) * 100}%` 
                          : "100%" 
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Lütfen bekleyin, sayfa değiştirseniz bile işlem devam edecek...
                  </p>
                </div>
              )}

              {/* Complete state */}
              {state.isComplete && (
                <div className="p-4">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Download className="h-5 w-5 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-800">İndirme başladı</p>
                      <p className="text-xs text-emerald-600 truncate">{state.fileName}</p>
                    </div>
                  </div>
                  <Button
                    onClick={resetState}
                    className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    Tamam
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PdfProgressContext.Provider>
  );
}

export function usePdfProgress() {
  const context = useContext(PdfProgressContext);
  if (context === undefined) {
    throw new Error("usePdfProgress must be used within a PdfProgressProvider");
  }
  return context;
}
