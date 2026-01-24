"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

interface BanSettings {
  is_active: boolean;
  ban_message: string;
  ban_subtitle: string;
  redirect_url: string | null;
  show_redirect_button: boolean;
  redirect_button_text: string;
  video_url: string;
}

const DEFAULT_SETTINGS: BanSettings = {
  is_active: true,
  ban_message: "Hesabınıza erişim yasaklanmıştır.",
  ban_subtitle: "Sistem yöneticisi ile iletişime geçiniz.",
  redirect_url: null,
  show_redirect_button: false,
  redirect_button_text: "Ana Sayfaya Git",
  video_url: "https://cdn.pixabay.com/video/2020/05/25/40130-424930923_large.mp4",
};

// Particle system for cyberpunk effect
const CyberParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    }> = [];

    const colors = ["#00f0ff", "#ff0066", "#ffcc00", "#00ff88", "#ff00ff"];

    const createParticle = () => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 200 + 100,
      };
    };

    // Initialize particles
    for (let i = 0; i < 150; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Reset old particles
        if (p.life > p.maxLife) {
          particles[i] = createParticle();
          return;
        }

        const alpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();

        // Draw connections
        particles.forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color + Math.floor((1 - dist / 100) * 50).toString(16).padStart(2, "0");
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-10 pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

// Glitch text effect
const GlitchText = ({ text, className = "" }: { text: string; className?: string }) => {
  const [glitchText, setGlitchText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const glitchChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
    
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsGlitching(true);
        
        let iterations = 0;
        const scrambleInterval = setInterval(() => {
          setGlitchText(
            text
              .split("")
              .map((char, index) => {
                if (index < iterations || char === " ") return char;
                return glitchChars[Math.floor(Math.random() * glitchChars.length)];
              })
              .join("")
          );

          if (iterations >= text.length) {
            clearInterval(scrambleInterval);
            setGlitchText(text);
            setIsGlitching(false);
          }
          iterations += 1;
        }, 30);
      }
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, [text]);

  return (
    <div className={`relative ${className}`}>
      <span
        className="relative z-10"
        style={{
          textShadow: isGlitching
            ? "2px 0 #ff0066, -2px 0 #00f0ff"
            : "0 0 10px rgba(0, 240, 255, 0.5)",
        }}
      >
        {glitchText}
      </span>
      {isGlitching && (
        <>
          <span
            className="absolute inset-0 text-[#ff0066] z-0"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)",
              transform: "translateX(-2px)",
              opacity: 0.8,
            }}
          >
            {glitchText}
          </span>
          <span
            className="absolute inset-0 text-[#00f0ff] z-0"
            style={{
              clipPath: "polygon(0 55%, 100% 55%, 100% 100%, 0 100%)",
              transform: "translateX(2px)",
              opacity: 0.8,
            }}
          >
            {glitchText}
          </span>
        </>
      )}
    </div>
  );
};

// Scanning line effect
const ScanLines = () => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
      <div
        className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent animate-scan"
        style={{
          animation: "scan 3s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes scan {
          0% {
            top: -2px;
          }
          100% {
            top: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// Explosion effect component
const ExplosionEffect = () => {
  const [explosions, setExplosions] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        const newExplosion = {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
        };
        setExplosions((prev) => [...prev, newExplosion]);

        setTimeout(() => {
          setExplosions((prev) => prev.filter((e) => e.id !== newExplosion.id));
        }, 1000);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-15 pointer-events-none">
      {explosions.map((explosion) => (
        <div
          key={explosion.id}
          className="absolute"
          style={{
            left: `${explosion.x}%`,
            top: `${explosion.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-8 bg-gradient-to-b from-orange-500 via-yellow-400 to-transparent"
                style={{
                  transform: `rotate(${i * 30}deg)`,
                  transformOrigin: "bottom center",
                  animation: "explode 1s ease-out forwards",
                  animationDelay: `${i * 0.02}s`,
                }}
              />
            ))}
          </div>
          <style jsx>{`
            @keyframes explode {
              0% {
                opacity: 1;
                transform: rotate(${0}deg) scaleY(0);
              }
              50% {
                opacity: 1;
                transform: rotate(${0}deg) scaleY(1);
              }
              100% {
                opacity: 0;
                transform: rotate(${0}deg) scaleY(0.5) translateY(-50px);
              }
            }
          `}</style>
        </div>
      ))}
    </div>
  );
};

// Digital rain effect (Matrix-style)
const DigitalRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0f0";
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Gradient effect for each character
        const gradient = ctx.createLinearGradient(x, y - fontSize, x, y);
        gradient.addColorStop(0, "rgba(0, 255, 0, 0)");
        gradient.addColorStop(1, "rgba(0, 255, 0, 0.8)");
        ctx.fillStyle = gradient;

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-5 pointer-events-none opacity-20"
    />
  );
};

// Hexagon grid background
const HexagonGrid = () => {
  return (
    <div className="fixed inset-0 z-5 pointer-events-none opacity-10">
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id="hexagons"
            width="50"
            height="43.4"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(2)"
          >
            <polygon
              points="25,0 50,12.5 50,37.5 25,50 0,37.5 0,12.5"
              fill="none"
              stroke="rgba(0, 240, 255, 0.3)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" />
      </svg>
    </div>
  );
};

export default function BannedPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<BanSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    loadSettings();
    // Animate content appearance
    setTimeout(() => setShowContent(true), 500);
  }, []);

  const loadSettings = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("ban_settings")
          .select("*")
          .eq("id", "default")
          .single();

        if (!error && data) {
          setSettings({
            is_active: data.is_active,
            ban_message: data.ban_message,
            ban_subtitle: data.ban_subtitle,
            redirect_url: data.redirect_url,
            show_redirect_button: data.show_redirect_button,
            redirect_button_text: data.redirect_button_text,
            video_url: data.video_url || DEFAULT_SETTINGS.video_url,
          });

          // If ban page is not active, redirect to login
          if (!data.is_active) {
            router.push("/login");
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error loading ban settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = () => {
    if (settings.redirect_url) {
      window.location.href = settings.redirect_url;
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-40"
        style={{ filter: "hue-rotate(180deg) saturate(1.5)" }}
      >
        <source src={settings.video_url} type="video/mp4" />
      </video>

      {/* Dark overlay with gradient */}
      <div className="fixed inset-0 z-1 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      <div className="fixed inset-0 z-1 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

      {/* Digital Rain Effect */}
      <DigitalRain />

      {/* Hexagon Grid */}
      <HexagonGrid />

      {/* Cyber Particles */}
      <CyberParticles />

      {/* Scan Lines */}
      <ScanLines />

      {/* Explosion Effects */}
      <ExplosionEffect />

      {/* CRT Effect Overlay */}
      <div
        className="fixed inset-0 z-30 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)",
        }}
      />

      {/* Vignette Effect */}
      <div
        className="fixed inset-0 z-25 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Main Content */}
      <div className="relative z-40 min-h-screen flex items-center justify-center p-4">
        <div
          className={`max-w-2xl w-full transition-all duration-1000 transform ${
            showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Warning Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-600/20 to-orange-600/20 flex items-center justify-center backdrop-blur-sm border border-red-500/30 animate-pulse">
                <svg
                  className="w-16 h-16 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              {/* Pulsing rings */}
              <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-ping" />
              <div
                className="absolute inset-[-10px] rounded-full border border-red-500/30 animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
            </div>
          </div>

          {/* Main Card */}
          <div
            className="relative backdrop-blur-xl bg-black/40 rounded-2xl p-8 border border-cyan-500/30 overflow-hidden"
            style={{
              boxShadow:
                "0 0 50px rgba(0, 240, 255, 0.1), inset 0 0 50px rgba(0, 240, 255, 0.05)",
            }}
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-cyan-500/50" />
            <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-cyan-500/50" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-cyan-500/50" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-cyan-500/50" />

            {/* Access Denied Badge */}
            <div className="flex justify-center mb-6">
              <div className="px-6 py-2 bg-gradient-to-r from-red-600/80 to-orange-600/80 rounded-full border border-red-400/50 backdrop-blur-sm">
                <span className="text-white font-bold tracking-[0.3em] text-sm uppercase">
                  ERİŞİM ENGELLENDİ
                </span>
              </div>
            </div>

            {/* Main Message */}
            <div className="text-center mb-8">
              <GlitchText
                text={settings.ban_message}
                className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 mb-4"
              />
              <p className="text-cyan-300/80 text-lg">{settings.ban_subtitle}</p>
            </div>

            {/* Status Indicators */}
            <div className="flex justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/30">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-mono">SECURITY_BREACH</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-orange-400 text-sm font-mono">ACCESS_DENIED</span>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-black/50 rounded-lg p-4 mb-8 border border-cyan-500/20 font-mono text-xs">
              <div className="text-cyan-500/60 mb-2">&gt; SYSTEM_LOG</div>
              <div className="space-y-1 text-cyan-400/80">
                <p>&gt; Kullanıcı erişimi engellendi</p>
                <p>&gt; Güvenlik protokolü aktif</p>
                <p>&gt; Oturum sonlandırıldı</p>
                <p className="text-red-400">&gt; ERR_ACCESS_FORBIDDEN</p>
              </div>
            </div>

            {/* Redirect Button */}
            {settings.show_redirect_button && (
              <div className="flex justify-center">
                <button
                  onClick={handleRedirect}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25"
                >
                  <span className="relative z-10">{settings.redirect_button_text}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-cyan-500/20 text-center">
              <p className="text-cyan-500/40 text-xs font-mono">
                QUANTUM SECURITY SYSTEMS v2.0.26 | {new Date().toISOString()}
              </p>
            </div>
          </div>

          {/* Bottom Warning */}
          <div className="mt-6 text-center">
            <p className="text-red-400/60 text-xs font-mono animate-pulse">
              ⚠ TÜM ERİŞİM GİRİŞİMLERİ KAYIT ALTINA ALINMAKTADIR ⚠
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
