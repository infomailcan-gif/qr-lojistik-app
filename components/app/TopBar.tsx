"use client";

import { LogOut, User, Cpu, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  userName: string;
  onSignOut: () => void;
}

export function TopBar({ userName, onSignOut }: TopBarProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl"
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 blur-lg opacity-40"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-lg">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-xl opacity-50"
                style={{
                  background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.3), transparent)",
                }}
              />
              <span className="relative text-lg font-bold text-white tracking-tight">QR</span>
            </div>
          </motion.div>
          
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
              QR Lojistik
            </h1>
            <div className="flex items-center gap-1.5">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Wifi className="h-3 w-3 text-emerald-500" />
              </motion.div>
              <p className="text-xs text-slate-500">Akıllı Lojistik Sistemi</p>
            </div>
          </div>
        </div>

        {/* Status & User */}
        <div className="flex items-center gap-3">
          {/* System Status */}
          <motion.div 
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200/60"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="relative"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-50" />
            </motion.div>
            <span className="text-xs font-medium text-emerald-700">Sistem Aktif</span>
          </motion.div>

          {/* User Badge */}
          <motion.div 
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border border-slate-200/60 group cursor-default"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="p-1 rounded-md bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
              <User className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
              {userName}
            </span>
          </motion.div>

          {/* Sign Out Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className="relative overflow-hidden hover:bg-red-50 hover:text-red-600 group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <LogOut className="h-5 w-5 relative z-10" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Tech Border Line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3), transparent)",
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.header>
  );
}
