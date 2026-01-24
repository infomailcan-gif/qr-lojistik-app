"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  ban_message: "ERİŞİMİNİZ ENGELLENMİŞTİR",
  ban_subtitle: "Bu hesap sistem yöneticisi tarafından askıya alınmıştır.",
  redirect_url: null,
  show_redirect_button: false,
  redirect_button_text: "Ana Sayfaya Git",
  video_url: "https://cdn.pixabay.com/video/2020/05/25/40130-424930923_large.mp4",
};

// Terminal typing effect component
const TerminalText = ({ lines, onComplete }: { lines: string[]; onComplete?: () => void }) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  useEffect(() => {
    if (currentLineIndex >= lines.length) {
      onComplete?.();
      return;
    }

    const currentLine = lines[currentLineIndex];
    
    if (currentCharIndex < currentLine.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => {
          const newLines = [...prev];
          newLines[currentLineIndex] = currentLine.substring(0, currentCharIndex + 1);
          return newLines;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, 15 + Math.random() * 25);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [currentLineIndex, currentCharIndex, lines, onComplete]);

  return (
    <div className="font-mono text-xs sm:text-sm space-y-1">
      {displayedLines.map((line, i) => (
        <div key={i} className={`${line.includes("DENIED") || line.includes("BLOCKED") || line.includes("FAILED") ? "text-red-500" : line.includes("WARNING") ? "text-yellow-500" : "text-green-400"}`}>
          {line}
          {i === currentLineIndex && <span className="animate-pulse">_</span>}
        </div>
      ))}
    </div>
  );
};

// Radar scan effect
const RadarScan = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
      <div className="relative w-64 h-64">
        <div className="absolute inset-0 rounded-full border border-cyan-500/30" />
        <div className="absolute inset-4 rounded-full border border-cyan-500/20" />
        <div className="absolute inset-8 rounded-full border border-cyan-500/10" />
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, rgba(0, 255, 255, 0.3) 30deg, transparent 60deg)",
            animation: "spin 4s linear infinite",
          }}
        />
      </div>
    </div>
  );
};

// Binary rain effect
const BinaryRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00ff4120";
      ctx.font = "15px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = Math.random() > 0.5 ? "1" : "0";
        ctx.fillText(text, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-30" />;
};

// Glitch effect for text
const GlitchText = ({ children, className = "" }: { children: string; className?: string }) => {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{children}</span>
      {isGlitching && (
        <>
          <span 
            className="absolute inset-0 text-red-500 z-0" 
            style={{ transform: "translateX(-2px) translateY(-1px)", opacity: 0.8 }}
          >
            {children}
          </span>
          <span 
            className="absolute inset-0 text-cyan-500 z-0" 
            style={{ transform: "translateX(2px) translateY(1px)", opacity: 0.8 }}
          >
            {children}
          </span>
        </>
      )}
    </span>
  );
};

// Hexagonal background pattern
const HexPattern = () => (
  <svg className="fixed inset-0 w-full h-full z-0 opacity-5" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="hex" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
        <path 
          d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" 
          fill="none" 
          stroke="cyan" 
          strokeWidth="0.5"
        />
        <path 
          d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34" 
          fill="none" 
          stroke="cyan" 
          strokeWidth="0.5"
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex)" />
  </svg>
);

// Circuit lines animation
const CircuitLines = () => (
  <div className="fixed inset-0 z-0 overflow-hidden opacity-10">
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="cyan" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {[...Array(10)].map((_, i) => (
        <g key={i}>
          <line
            x1="0"
            y1={10 + i * 10}
            x2="100"
            y2={10 + i * 10}
            stroke="url(#circuit-gradient)"
            strokeWidth="0.1"
            strokeDasharray="5 3"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="16"
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
            />
          </line>
        </g>
      ))}
    </svg>
  </div>
);

// Warning stripes
const WarningStripes = () => (
  <div className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent overflow-hidden">
    <div 
      className="h-full w-[200%]"
      style={{
        background: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(234, 179, 8, 0.3) 10px, rgba(234, 179, 8, 0.3) 20px)",
        animation: "slide 1s linear infinite",
      }}
    />
  </div>
);

export default function BannedPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<BanSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [terminalComplete, setTerminalComplete] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const terminalLines = [
    "> Initializing security protocol...",
    "> Scanning user credentials...",
    "> Authentication check: FAILED",
    "> Access level: BLOCKED",
    "> Security status: COMPROMISED",
    "> WARNING: Unauthorized access attempt detected",
    "> User privileges: REVOKED",
    "> System response: ACCESS DENIED",
    "> Logging incident to security database...",
    "> Session terminated.",
  ];

  useEffect(() => {
    loadSettings();
    setTimeout(() => setShowContent(true), 300);
    
    const updateTime = () => {
      setCurrentTime(new Date().toISOString().replace("T", " ").substring(0, 19));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
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
            ban_message: data.ban_message || DEFAULT_SETTINGS.ban_message,
            ban_subtitle: data.ban_subtitle || DEFAULT_SETTINGS.ban_subtitle,
            redirect_url: data.redirect_url,
            show_redirect_button: data.show_redirect_button,
            redirect_button_text: data.redirect_button_text,
            video_url: data.video_url || DEFAULT_SETTINGS.video_url,
          });

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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-cyan-500 font-mono text-sm animate-pulse">INITIALIZING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Background Effects */}
      <BinaryRain />
      <HexPattern />
      <CircuitLines />
      <RadarScan />

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 opacity-15"
        style={{ filter: "hue-rotate(180deg) contrast(1.2)" }}
      >
        <source src={settings.video_url} type="video/mp4" />
      </video>

      {/* Scanline overlay */}
      <div 
        className="fixed inset-0 z-10 pointer-events-none opacity-30"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
        }}
      />

      {/* Vignette */}
      <div 
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Top warning stripe */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <WarningStripes />
      </div>

      {/* Main Content */}
      <div className={`relative z-20 min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-1000 ${showContent ? "opacity-100" : "opacity-0"}`}>
        
        {/* Security Header */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start text-xs font-mono text-cyan-500/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span>SECURITY ALERT</span>
            </div>
            <div>THREAT LEVEL: <span className="text-red-500">CRITICAL</span></div>
          </div>
          <div className="text-right space-y-1">
            <div>TIMESTAMP: {currentTime}</div>
            <div>NODE: FIREWALL-SEC-01</div>
          </div>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl w-full">
          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-red-500/50 flex items-center justify-center bg-red-500/10 backdrop-blur-sm">
                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div className="absolute -inset-2 rounded-full border border-red-500/30 animate-ping" />
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-wider mb-4">
              <GlitchText className="text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                {settings.ban_message}
              </GlitchText>
            </h1>
            <p className="text-lg text-gray-400 font-mono">{settings.ban_subtitle}</p>
          </div>

          {/* Terminal Box */}
          <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg overflow-hidden mb-8">
            {/* Terminal Header */}
            <div className="bg-gray-900/90 px-4 py-2 border-b border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-cyan-500/60 font-mono">security@firewall:~</span>
            </div>
            
            {/* Terminal Content */}
            <div className="p-4 min-h-[200px]">
              <TerminalText lines={terminalLines} onComplete={() => setTerminalComplete(true)} />
            </div>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "FIREWALL", status: "ACTIVE", color: "green" },
              { label: "ACCESS", status: "DENIED", color: "red" },
              { label: "PROTOCOL", status: "SEC-7", color: "cyan" },
            ].map((item) => (
              <div 
                key={item.label}
                className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-lg p-3 text-center"
              >
                <div className="text-xs text-gray-500 font-mono mb-1">{item.label}</div>
                <div className={`text-sm font-bold font-mono ${
                  item.color === "green" ? "text-green-500" : 
                  item.color === "red" ? "text-red-500" : "text-cyan-500"
                }`}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          {settings.show_redirect_button && terminalComplete && (
            <div className="flex justify-center">
              <button
                onClick={handleRedirect}
                className="group relative px-8 py-3 bg-transparent border-2 border-cyan-500/50 rounded font-mono text-cyan-400 overflow-hidden transition-all hover:border-cyan-400 hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  {settings.redirect_button_text}
                </span>
                <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end text-xs font-mono text-gray-600">
          <div>
            <div>INCIDENT ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
            <div>IP LOGGED: ***.***.***</div>
          </div>
          <div className="text-right">
            <div className="text-cyan-500/40">QUANTUM SECURITY SYSTEMS</div>
            <div>v3.2.1 | ENTERPRISE FIREWALL</div>
          </div>
        </div>
      </div>

      {/* Bottom warning stripe */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <WarningStripes />
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes slide {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
