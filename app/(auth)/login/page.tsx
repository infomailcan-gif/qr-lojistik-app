"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, User, Lock, Loader2, Box, Truck, Package, Scan, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

// 3D Floating Cube Component
const FloatingCube = ({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ 
      opacity: [0.1, 0.4, 0.1],
      scale: [1, 1.2, 1],
      rotateX: [0, 360],
      rotateY: [0, 360],
      z: [-50, 50, -50]
    }}
    transition={{
      duration: 8 + delay,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut"
    }}
  >
    <div 
      className="relative preserve-3d"
      style={{ 
        width: size, 
        height: size,
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Cube faces */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 backdrop-blur-sm"
           style={{ transform: `translateZ(${size/2}px)` }} />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-indigo-600/30 border border-purple-400/50 backdrop-blur-sm"
           style={{ transform: `rotateY(180deg) translateZ(${size/2}px)` }} />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-600/30 border border-blue-400/50 backdrop-blur-sm"
           style={{ transform: `rotateY(90deg) translateZ(${size/2}px)` }} />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/50 backdrop-blur-sm"
           style={{ transform: `rotateY(-90deg) translateZ(${size/2}px)` }} />
    </div>
  </motion.div>
);

// Particle Effect
const Particle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-cyan-400"
    initial={{ 
      x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400),
      y: typeof window !== 'undefined' ? window.innerHeight : 800,
      opacity: 0 
    }}
    animate={{ 
      y: -100,
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0]
    }}
    transition={{
      duration: 4 + Math.random() * 2,
      repeat: Infinity,
      delay: delay,
      ease: "easeOut"
    }}
  />
);

// Scanning Line Animation
const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
    initial={{ top: "0%" }}
    animate={{ top: "100%" }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }}
  />
);

// Hexagon Grid Pattern
const HexGrid = () => (
  <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
        <polygon 
          points="24.8,22 37.3,29.2 37.3,43.4 24.8,50.6 12.3,43.4 12.3,29.2" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5"
          className="text-cyan-400"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hexagons)" />
  </svg>
);

// Orbital Ring
const OrbitalRing = ({ size, duration, delay, color }: { size: number; duration: number; delay: number; color: string }) => (
  <motion.div
    className={`absolute rounded-full border ${color}`}
    style={{
      width: size,
      height: size,
      left: '50%',
      top: '50%',
      marginLeft: -size/2,
      marginTop: -size/2,
    }}
    animate={{ rotate: 360 }}
    transition={{
      duration: duration,
      repeat: Infinity,
      ease: "linear",
      delay: delay
    }}
  >
    <motion.div 
      className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"
      style={{ top: -6, left: '50%', marginLeft: -6 }}
      animate={{ scale: [1, 1.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </motion.div>
);

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Hata",
        description: "Kullanıcı adı ve şifre gerekli",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await auth.login(username, password);
      toast({
        title: "Başarılı",
        description: "Giriş yapıldı, yönlendiriliyorsunuz...",
      });
      router.push("/app");
    } catch (error: any) {
      toast({
        title: "Giriş Başarısız",
        description: error.message || "Kullanıcı adı veya şifre hatalı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const icons = [Box, Truck, Package, Scan, Shield, Zap];

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0e1a]">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f1629] to-[#0a0e1a]">
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Hexagon Grid */}
      <HexGrid />

      {/* Floating Cubes - Hidden on small screens for performance */}
      {mounted && (
        <div className="hidden md:block">
          <FloatingCube delay={0} size={40} x={10} y={20} />
          <FloatingCube delay={2} size={30} x={85} y={15} />
          <FloatingCube delay={4} size={50} x={75} y={70} />
          <FloatingCube delay={1} size={35} x={15} y={75} />
          <FloatingCube delay={3} size={25} x={90} y={50} />
        </div>
      )}

      {/* Particles - Reduced on mobile */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <Particle key={i} delay={i * 0.3} />
          ))}
        </div>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4 sm:px-6"
      >
        {/* Logo Section with 3D Effect */}
        <motion.div 
          className="relative mb-8 flex justify-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {/* Orbital Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <OrbitalRing size={180} duration={20} delay={0} color="border-cyan-500/30" />
            <OrbitalRing size={220} duration={25} delay={2} color="border-purple-500/20" />
            <OrbitalRing size={260} duration={30} delay={4} color="border-blue-500/10" />
          </div>

          <motion.div 
            className="relative"
            animate={{ 
              rotateY: [0, 10, -10, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
          >
            {/* Logo Container */}
            <div className="relative p-6 sm:p-8">
              {/* Glowing Background */}
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Icon */}
              <motion.div
                className="relative z-10 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 shadow-2xl shadow-cyan-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Box className="h-10 w-10 sm:h-14 sm:w-14 text-white" />
                
                {/* Scan Line Effect */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <ScanLine />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            QR Lojistik
          </h1>
          <motion.p 
            className="text-slate-400 mt-2 text-sm sm:text-base"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Akıllı Depo Yönetim Sistemi
          </motion.p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative"
        >
          {/* Card Glow Effect */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-3xl opacity-50 blur-sm animate-pulse" />
          
          {/* Glass Card */}
          <div className="relative bg-[#0f1629]/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Animated Border */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.1), transparent)',
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6 relative z-10">
              {/* Username Field */}
              <motion.div 
                className="space-y-2"
                whileFocus={{ scale: 1.02 }}
              >
                <Label htmlFor="username" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-cyan-400" />
                  Kullanıcı Adı
                </Label>
                <div className="relative group">
                  <motion.div
                    className={`absolute -inset-[1px] rounded-xl transition-all duration-300 ${
                      focusedField === 'username' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 opacity-100' 
                        : 'bg-slate-700 opacity-50'
                    }`}
                    animate={focusedField === 'username' ? { opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Kullanıcı adınızı girin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className="relative bg-[#0a0e1a] border-0 text-white placeholder:text-slate-500 h-12 sm:h-14 rounded-xl px-4 text-base focus:ring-2 focus:ring-cyan-500/50 transition-all"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-purple-400" />
                  Şifre
                </Label>
                <div className="relative group">
                  <motion.div
                    className={`absolute -inset-[1px] rounded-xl transition-all duration-300 ${
                      focusedField === 'password' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 opacity-100' 
                        : 'bg-slate-700 opacity-50'
                    }`}
                    animate={focusedField === 'password' ? { opacity: [0.5, 1, 0.5] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Şifrenizi girin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="relative bg-[#0a0e1a] border-0 text-white placeholder:text-slate-500 h-12 sm:h-14 rounded-xl px-4 text-base focus:ring-2 focus:ring-purple-500/50 transition-all"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
              </motion.div>

              {/* Login Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-300 relative overflow-hidden group"
                  disabled={loading}
                >
                  {/* Button Shine Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Giriş Yapılıyor...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        <span>Giriş Yap</span>
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>
            </form>

            {/* Floating Icons */}
            <div className="absolute -top-4 -right-4 hidden sm:block">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="p-2 rounded-lg bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/30"
              >
                <Truck className="h-5 w-5 text-cyan-400" />
              </motion.div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden sm:block">
              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -10, 10, 0]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm border border-purple-500/30"
              >
                <Package className="h-5 w-5 text-purple-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Feature Icons Row */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex justify-center gap-4 sm:gap-6 mt-8"
        >
          {icons.map((Icon, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + index * 0.1 }}
              whileHover={{ scale: 1.2, y: -5 }}
              className="p-2 sm:p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm"
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Powered By Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center"
      >
        <p className="text-slate-500 text-xs sm:text-sm font-medium tracking-wide">
          Powered by{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-semibold">
            Canberk Şıklı
          </span>
        </p>
      </motion.div>

      {/* Corner Decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 sm:w-48 sm:h-48">
        <svg className="w-full h-full text-cyan-500/10" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 sm:w-48 sm:h-48 rotate-180">
        <svg className="w-full h-full text-purple-500/10" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
