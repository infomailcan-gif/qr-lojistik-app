"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, User, Lock, Sparkles, Zap, Box, Layers, Truck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";

// Animated grid background
const CyberGrid = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Dark gradient base */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
    
    {/* Animated grid */}
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.4) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }}
    />

    {/* Scanning line */}
    <motion.div
      className="absolute inset-x-0 h-40 bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent"
      animate={{ y: ["-20%", "120%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />

    {/* Floating orbs */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full blur-3xl"
        style={{
          width: `${150 + i * 50}px`,
          height: `${150 + i * 50}px`,
          background: i % 2 === 0 
            ? "radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)"
            : "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)",
          left: `${10 + i * 18}%`,
          top: `${15 + (i % 3) * 25}%`,
        }}
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8 + i * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}

    {/* Corner accents */}
    <div className="absolute top-0 left-0 w-40 h-40 border-l-2 border-t-2 border-cyan-500/30 rounded-br-3xl" />
    <div className="absolute bottom-0 right-0 w-40 h-40 border-r-2 border-b-2 border-purple-500/30 rounded-tl-3xl" />
  </div>
);

// Floating icons
const FloatingIcons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[Box, Layers, Truck].map((Icon, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: `${15 + i * 35}%`,
          top: `${20 + (i % 2) * 60}%`,
        }}
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, -10, 0],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 5 + i,
          repeat: Infinity,
          delay: i * 0.5,
        }}
      >
        <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-500/20" />
      </motion.div>
    ))}
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Auth fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!username.trim()) {
        setError("Lütfen kullanıcı adınızı girin");
        return;
      }
      
      if (!password.trim()) {
        setError("Lütfen şifrenizi girin");
        return;
      }

      const session = await auth.signIn(username, password);
      
      // Redirect managers and super admins to dashboard
      if (session.user.role === "manager" || session.user.role === "super_admin") {
        router.push("/app/dashboard");
      } else {
        router.push("/app");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Giriş başarısız. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <CyberGrid />
      <FloatingIcons />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
        
        {/* Main card */}
        <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden">
          {/* Top accent line */}
          <motion.div
            className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ backgroundSize: "200% 200%" }}
          />

          {/* Header */}
          <div className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="relative mx-auto"
            >
              <motion.div
                className="absolute inset-0 bg-cyan-500/30 rounded-2xl blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Box className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-2 flex-wrap">
                Modern Lojistik
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                </motion.span>
              </h1>
              <p className="text-lg sm:text-xl font-semibold text-slate-300 mt-2">
                Yönetim Sistemi
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs sm:text-sm text-slate-500 mt-3 flex items-center justify-center gap-2"
              >
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                Hızlı • Güvenli • Akıllı
              </motion.p>
            </motion.div>
          </div>

          {/* Form */}
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <motion.form
              onSubmit={handleLogin}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  Kullanıcı Adı
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Kullanıcı adınızı girin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="h-12 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Şifre
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-12 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl"
                >
                  <p className="text-sm text-rose-400">{error}</p>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-12 sm:h-14 text-base font-semibold bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 shadow-lg shadow-cyan-500/25 relative overflow-hidden group"
                  disabled={loading}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  />
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <LogIn className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Giriş Yap
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.form>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="py-4 text-center border-t border-slate-700/50"
          >
            <p className="text-xs text-slate-500">
              Powered by{" "}
              <span className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Canberk Şıklı
              </span>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
