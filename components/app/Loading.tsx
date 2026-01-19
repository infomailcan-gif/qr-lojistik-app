"use client";

import { Cpu, Package } from "lucide-react";

// Performans optimize loading spinner - CSS animasyonları kullanır
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  const borderClasses = {
    sm: "border-2",
    md: "border-3",
    lg: "border-4",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Outer ring - statik */}
      <div
        className={`absolute inset-0 rounded-full ${borderClasses[size]} border-blue-200`}
      />
      
      {/* Spinning ring - CSS animation (GPU optimized) */}
      <div
        className={`absolute inset-0 rounded-full ${borderClasses[size]} border-transparent border-t-blue-500 border-r-indigo-500 animate-spin`}
        style={{ animationDuration: "0.8s" }}
      />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 relative">
      {/* Hafif Background Grid - statik */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Main Content */}
      <div className="flex flex-col items-center gap-5 relative z-10 animate-scale-in">
        {/* Logo - statik */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-lg">
          <Package className="h-8 w-8 text-white" />
        </div>

        {/* Spinner */}
        <LoadingSpinner size="lg" />

        {/* Text - hafif pulse */}
        <div className="text-center">
          <p className="text-slate-600 font-medium animate-pulse-light">
            Yükleniyor...
          </p>
        </div>
      </div>
    </div>
  );
}
