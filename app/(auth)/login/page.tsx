"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn, User, Lock, Sparkles, Zap, Shield, Eye, EyeOff, Cpu, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";

// Animated grid video background
const AnimatedGridBackground = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Grid animation variables
    let animationFrame: number;
    let time = 0;

    const gridSize = 40;
    const lineWidth = 1;

    const animate = () => {
      time += 0.005;

      // Clear with fade effect
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = lineWidth;

      // Vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        const offset = Math.sin(time + x * 0.01) * 10;
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, canvas.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        const offset = Math.cos(time + y * 0.01) * 10;
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(canvas.width, y + offset);
        ctx.stroke();
      }

      // Draw flowing particles
      ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(time * 0.5 + i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(time * 0.3 + i * 0.5) * 0.5 + 0.5) * canvas.height;
        const size = Math.sin(time + i) * 2 + 2;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 opacity-40"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

// Hexagonal tech pattern background
const HexagonalPattern = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Deep space gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />

    {/* Animated canvas grid */}
    <AnimatedGridBackground />

    {/* Hexagonal grid overlay */}
    <div
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='43.4' viewBox='0 0 50 43.4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M25 0l12.5 7.2v14.5L25 28.9 12.5 21.7V7.2L25 0z' fill='none' stroke='%2306b6d4' stroke-width='0.5'/%3E%3C/svg%3E")`,
        backgroundSize: "50px 43.4px",
      }}
    />

    {/* Animated scanning lines */}
    <motion.div
      className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
      animate={{ y: ["0%", "100%"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      style={{ opacity: 0.3 }}
    />
    <motion.div
      className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"
      animate={{ y: ["100%", "0%"] }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      style={{ opacity: 0.3 }}
    />

    {/* Holographic orbs */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: `${200 + i * 40}px`,
          height: `${200 + i * 40}px`,
          background: i % 3 === 0
            ? "radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)"
            : i % 3 === 1
              ? "radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)"
              : "radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)",
          left: `${5 + i * 15}%`,
          top: `${10 + (i % 4) * 20}%`,
          filter: "blur(40px)",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 12 + i * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}

    {/* Corner tech frames */}
    <div className="absolute top-0 left-0 w-32 h-32">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 to-transparent" />
      <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-cyan-500 to-transparent" />
      <div className="absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 border-cyan-500/50" />
    </div>
    <div className="absolute bottom-0 right-0 w-32 h-32">
      <div className="absolute bottom-0 right-0 w-full h-0.5 bg-gradient-to-l from-purple-500 to-transparent" />
      <div className="absolute bottom-0 right-0 w-0.5 h-full bg-gradient-to-t from-purple-500 to-transparent" />
      <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-purple-500/50" />
    </div>
  </div>
);

// Particle system
const ParticleField = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-cyan-400 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -100, 0],
          opacity: [0, 1, 0],
          scale: [0, 1.5, 0],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          delay: Math.random() * 5,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

// Floating tech icons
const FloatingTechIcons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[Shield, Cpu, Network].map((Icon, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          left: `${20 + i * 30}%`,
          top: `${25 + (i % 2) * 50}%`,
        }}
        animate={{
          y: [0, -25, 0],
          rotate: [0, 15, -15, 0],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{
          duration: 6 + i * 1.5,
          repeat: Infinity,
          delay: i * 0.7,
        }}
      >
        <Icon className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-400" strokeWidth={1} />
      </motion.div>
    ))}
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!username.trim()) {
        setError("Lütfen email veya kullanıcı adınızı girin");
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        setError("Lütfen şifrenizi girin");
        setLoading(false);
        return;
      }

      const session = await auth.signIn(username, password);

      if (session.user.role === "manager" || session.user.role === "super_admin") {
        router.push("/app/dashboard");
      } else {
        router.push("/app");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Giriş başarısız. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <HexagonalPattern />
      <ParticleField />
      <FloatingTechIcons />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Holographic glow layers */}
        <motion.div
          className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-[2rem] blur-2xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute -inset-2 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-pink-400/10 rounded-[1.75rem] blur-xl"
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />

        {/* Main holographic card */}
        <div className="relative bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-900/90 backdrop-blur-2xl border border-cyan-500/20 rounded-[1.5rem] overflow-hidden shadow-2xl">
          {/* Animated top border */}
          <motion.div
            className="h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ backgroundSize: "200% 200%" }}
          />

          {/* Holographic shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-purple-400/5"
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Header section */}
          <div className="p-8 sm:p-10 text-center space-y-6 relative">
            {/* Logo with holographic effect */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 15 }}
              className="relative mx-auto w-24 h-24"
            >
              {/* Pulsing rings */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-cyan-400/30"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-purple-400/30"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />

              {/* Logo background glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl blur-xl"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 0.9, 0.6],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Logo container */}
              <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-cyan-500/40">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <Shield className="w-12 h-12 text-white drop-shadow-lg" strokeWidth={2} />
                </motion.div>
              </div>
            </motion.div>

            {/* Title with holographic text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <motion.span
                  className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  Modern Lojistik
                </motion.span>
              </h1>

              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
                <p className="text-xl font-semibold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Yönetim Sistemi
                </p>
              </div>

              {/* Tech badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full backdrop-blur-sm"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">
                  Hızlı • Güvenli • Akıllı
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Form section */}
          <div className="px-8 pb-8 sm:px-10 sm:pb-10">
            <motion.form
              onSubmit={handleLogin}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* Username field */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  Kullanıcı Adı
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition duration-300" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Email (ör: admin@qrlojistik.com)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    className="relative h-12 bg-slate-800/70 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 rounded-xl transition-all"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Şifre
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition duration-300" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="relative h-12 bg-slate-800/70 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 rounded-xl pr-12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="px-4 py-3 bg-rose-500/10 border border-rose-500/30 rounded-xl backdrop-blur-sm"
                >
                  <p className="text-sm text-rose-400">{error}</p>
                </motion.div>
              )}

              {/* Submit button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 hover:from-cyan-600 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-cyan-500/30 relative overflow-hidden group rounded-xl"
                  disabled={loading}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    animate={{
                      x: ["-200%", "200%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />

                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="flex items-center gap-2"
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Giriş Yapılıyor...</span>
                    </motion.div>
                  ) : (
                    <span className="flex items-center justify-center gap-2 relative z-10">
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
            transition={{ delay: 0.7 }}
            className="py-5 text-center border-t border-slate-700/30 bg-slate-900/50"
          >
            <p className="text-xs text-slate-500">
              Powered by{" "}
              <span className="font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Canberk Şıklı
              </span>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
