"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Lock, Skull, Wifi, WifiOff, Terminal, Eye, EyeOff } from "lucide-react";
import { siteLockdown } from "@/lib/site-lockdown";

interface LockdownSettings {
  lockdown_message: string;
  lockdown_subtitle: string;
}

export default function AccessDeniedPage() {
  const [settings, setSettings] = useState<LockdownSettings>({
    lockdown_message: "ERİŞİMİNİZ SİSTEM YÖNETİCİSİ TARAFINDAN KISITLANMIŞTIR",
    lockdown_subtitle: "Yetkisiz erişim tespit edildi. Güvenlik protokolleri devreye alındı."
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    // Lockdown ayarlarını al
    const fetchSettings = async () => {
      try {
        const data = await siteLockdown.getSettings();
        if (data) {
          setSettings({
            lockdown_message: data.lockdown_message,
            lockdown_subtitle: data.lockdown_subtitle
          });
        }
      } catch (error) {
        console.error("Error fetching lockdown settings:", error);
      }
    };

    fetchSettings();

    // Saat güncelleme
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Glitch efekti
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 3000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("tr-TR", { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit" 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Rastgele hex string oluştur
  const generateHexString = () => {
    return Array(8).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase();
  };

  const [hexStrings, setHexStrings] = useState<string[]>([]);

  useEffect(() => {
    const hexInterval = setInterval(() => {
      setHexStrings(Array(20).fill(0).map(() => generateHexString()));
    }, 100);

    return () => clearInterval(hexInterval);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite"
          }}
        />
      </div>

      {/* Scan Lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.1) 2px, rgba(0, 255, 65, 0.1) 4px)"
        }}
      />

      {/* Moving Scan Line */}
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating Hex Codes - Left Side */}
      <div className="absolute left-4 top-1/4 font-mono text-[10px] text-green-500/30 space-y-1 hidden md:block">
        {hexStrings.slice(0, 10).map((hex, i) => (
          <div key={i} className="tracking-wider">0x{hex}</div>
        ))}
      </div>

      {/* Floating Hex Codes - Right Side */}
      <div className="absolute right-4 top-1/4 font-mono text-[10px] text-cyan-500/30 space-y-1 hidden md:block text-right">
        {hexStrings.slice(10, 20).map((hex, i) => (
          <div key={i} className="tracking-wider">0x{hex}</div>
        ))}
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-red-500/50" />
      <div className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-red-500/50" />
      <div className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-red-500/50" />
      <div className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-red-500/50" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Status Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-0 right-0 flex justify-between items-center px-6 md:px-12"
        >
          <div className="flex items-center gap-2 text-red-500 font-mono text-xs">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>CONNECTION BLOCKED</span>
          </div>
          <div className="flex items-center gap-4 text-green-500/70 font-mono text-xs">
            <span>{formatDate(currentTime)}</span>
            <span className="text-cyan-400">{formatTime(currentTime)}</span>
          </div>
        </motion.div>

        {/* Warning Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1 }}
          className="relative mb-8"
        >
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 rounded-full animate-ping bg-red-500/20" style={{ animationDuration: "2s" }} />
          
          {/* Main Shield */}
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            {/* Rotating Border */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #ef4444, #f97316, #ef4444, #dc2626, #ef4444)",
                animation: "spin 4s linear infinite"
              }}
            />
            
            {/* Inner Circle */}
            <div className="absolute inset-1 rounded-full bg-black flex items-center justify-center">
              <div className="relative">
                <Shield className="w-16 h-16 md:w-20 md:h-20 text-red-500" />
                <Lock className="w-6 h-6 md:w-8 md:h-8 text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alert Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-full mb-6"
        >
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-red-400 font-mono text-sm tracking-wider">SECURITY BREACH DETECTED</span>
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center max-w-4xl"
        >
          <h1 
            className={`text-2xl md:text-4xl lg:text-5xl font-bold text-red-500 mb-4 tracking-wider leading-tight ${
              glitchActive ? "glitch-text" : ""
            }`}
            style={{
              textShadow: glitchActive 
                ? "2px 0 cyan, -2px 0 magenta" 
                : "0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)"
            }}
          >
            {settings.lockdown_message}
          </h1>
          
          <p className="text-gray-400 font-mono text-sm md:text-base tracking-wide mb-8">
            {settings.lockdown_subtitle}
          </p>

          {/* Access Denied Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 bg-red-500/20 blur-xl" />
            <div className="relative border-2 border-red-500/50 bg-black/80 px-8 py-4 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 text-red-500">
                <Eye className="w-5 h-5" />
                <span className="font-mono text-lg tracking-[0.3em]">ACCESS DENIED</span>
                <EyeOff className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Terminal Style Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 font-mono text-xs text-green-500/60 max-w-lg w-full px-4"
        >
          <div className="border border-green-500/30 bg-black/50 p-4 rounded">
            <div className="flex items-center gap-2 mb-3 text-green-400">
              <Terminal className="w-4 h-4" />
              <span>SYSTEM LOG</span>
            </div>
            <div className="space-y-1 text-green-500/50">
              <p>&gt; Initializing security protocols...</p>
              <p>&gt; Scanning unauthorized access attempt...</p>
              <p>&gt; IP Address: <span className="text-cyan-400">[BLOCKED]</span></p>
              <p>&gt; User Agent: <span className="text-cyan-400">[CLASSIFIED]</span></p>
              <p>&gt; Status: <span className="text-red-400">ACCESS RESTRICTED</span></p>
              <p className="animate-pulse">&gt; Waiting for administrator approval_</p>
            </div>
          </div>
        </motion.div>

        {/* Powered By */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6 left-0 right-0 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border border-cyan-500/20 rounded-full">
            <span className="text-gray-500 text-xs font-mono">powered by</span>
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 font-bold text-sm tracking-wider"
              style={{
                textShadow: "0 0 20px rgba(6, 182, 212, 0.5)"
              }}
            >
              CANBERK
            </span>
          </div>
        </motion.div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000), 
              y: -10 
            }}
            animate={{ 
              y: typeof window !== "undefined" ? window.innerHeight + 10 : 1000,
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .glitch-text {
          animation: glitch 0.2s ease-in-out;
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  );
}
