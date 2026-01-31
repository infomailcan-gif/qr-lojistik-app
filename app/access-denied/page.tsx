"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";
import { siteLockdown } from "@/lib/site-lockdown";

interface LockdownSettings {
  lockdown_message: string;
  lockdown_subtitle: string;
}

// Data Stream Canvas - Hex ve Binary veri akışı
const DataStreamCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Veri tipleri: hex, binary, IP adresi, veri paketi
    const dataTypes = [
      () => "0x" + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, "0"),
      () => Array(8).fill(0).map(() => Math.random() > 0.5 ? "1" : "0").join(""),
      () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      () => `<${["DATA", "PKT", "SYN", "ACK", "REQ", "RSP"][Math.floor(Math.random() * 6)]}>`,
      () => `[${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}]`,
      () => Math.floor(Math.random() * 100) + "%",
    ];

    const columns = Math.floor(canvas.width / 120);
    const streams: { x: number; y: number; speed: number; data: string[]; opacity: number }[] = [];

    for (let i = 0; i < columns; i++) {
      streams.push({
        x: i * 120 + Math.random() * 60,
        y: Math.random() * -500,
        speed: 1 + Math.random() * 2,
        data: Array(15).fill(0).map(() => dataTypes[Math.floor(Math.random() * dataTypes.length)]()),
        opacity: 0.3 + Math.random() * 0.4
      });
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 8, 12, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      streams.forEach((stream, idx) => {
        ctx.font = "12px 'Courier New', monospace";
        
        stream.data.forEach((text, i) => {
          const y = stream.y + i * 22;
          if (y > 0 && y < canvas.height) {
            // Gradient effect - üstten alta soluklaşma
            const alpha = Math.max(0, 1 - (i / stream.data.length)) * stream.opacity;
            
            // Ana renk (cyan)
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.fillText(text, stream.x, y);
            
            // Glow efekti
            ctx.shadowColor = "#0ff";
            ctx.shadowBlur = 10;
            ctx.fillText(text, stream.x, y);
            ctx.shadowBlur = 0;
          }
        });

        stream.y += stream.speed;
        
        if (stream.y > canvas.height + 200) {
          stream.y = -300;
          stream.data = Array(15).fill(0).map(() => dataTypes[Math.floor(Math.random() * dataTypes.length)]());
          stream.speed = 1 + Math.random() * 2;
        }
      });
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

  return <canvas ref={canvasRef} className="absolute inset-0" />;
};

// Yatay veri akışı çizgileri
const HorizontalDataLine = ({ y, direction, speed }: { y: number; direction: "left" | "right"; speed: number }) => {
  const [data, setData] = useState("");

  useEffect(() => {
    const generateData = () => {
      const chars = "0123456789ABCDEF<>[]{}::/\\|";
      let result = "";
      for (let i = 0; i < 50; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      setData(result);
    };

    generateData();
    const interval = setInterval(generateData, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="absolute whitespace-nowrap font-mono text-[10px] text-cyan-500/30"
      style={{ top: `${y}%` }}
      initial={{ x: direction === "left" ? "100vw" : "-100vw" }}
      animate={{ x: direction === "left" ? "-100vw" : "100vw" }}
      transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
    >
      {data}
    </motion.div>
  );
};

// Network Node
const NetworkNode = ({ x, y, delay }: { x: number; y: number; delay: number }) => (
  <motion.div
    className="absolute"
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    <motion.div
      className="w-3 h-3 rounded-full bg-cyan-400"
      style={{ boxShadow: "0 0 15px #0ff, 0 0 30px #0ff" }}
      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity, delay }}
    />
    {/* Bağlantı çizgileri */}
    <motion.div
      className="absolute w-20 h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent"
      style={{ top: "50%", left: "100%" }}
      animate={{ opacity: [0.2, 0.6, 0.2] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: delay + 0.3 }}
    />
  </motion.div>
);

// Veri paketi animasyonu
const DataPacket = ({ startX, endX, y, delay }: { startX: number; endX: number; y: number; delay: number }) => (
  <motion.div
    className="absolute h-1 w-8 rounded-full"
    style={{
      top: `${y}%`,
      background: "linear-gradient(90deg, transparent, #0ff, #0ff, transparent)",
      boxShadow: "0 0 10px #0ff",
    }}
    initial={{ left: `${startX}%`, opacity: 0 }}
    animate={{ left: `${endX}%`, opacity: [0, 1, 1, 0] }}
    transition={{ duration: 2, repeat: Infinity, delay, ease: "linear" }}
  />
);

// Server Rack Göstergesi
const ServerIndicator = ({ side }: { side: "left" | "right" }) => {
  const [values, setValues] = useState<number[]>([]);

  useEffect(() => {
    const update = () => {
      setValues(Array(8).fill(0).map(() => Math.random() * 100));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`absolute ${side === "left" ? "left-4" : "right-4"} top-1/3 hidden lg:flex flex-col gap-2`}>
      {values.map((val, i) => (
        <div key={i} className="flex items-center gap-2">
          {side === "right" && (
            <span className="text-[8px] font-mono text-cyan-500/50 w-8 text-right">
              {Math.floor(val)}%
            </span>
          )}
          <div className="w-16 h-1.5 bg-cyan-900/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: val > 80 ? "#f00" : val > 50 ? "#ff0" : "#0ff",
                boxShadow: `0 0 5px ${val > 80 ? "#f00" : val > 50 ? "#ff0" : "#0ff"}`,
              }}
              animate={{ width: `${val}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {side === "left" && (
            <span className="text-[8px] font-mono text-cyan-500/50 w-8">
              {Math.floor(val)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default function AccessDeniedPage() {
  const [settings, setSettings] = useState<LockdownSettings>({
    lockdown_message: "",
    lockdown_subtitle: ""
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await siteLockdown.getSettings();
        if (data) {
          setSettings({
            lockdown_message: data.lockdown_message || "",
            lockdown_subtitle: data.lockdown_subtitle || ""
          });
        }
      } catch (error) {
        console.error("Error fetching lockdown settings:", error);
      }
    };

    fetchSettings();

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 5000);

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

  return (
    <div className="min-h-screen bg-[#000a0d] relative overflow-hidden">
      {/* Data Stream Background */}
      <DataStreamCanvas />

      {/* Radial Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,20,30,0.3) 0%, rgba(0,8,12,0.9) 70%)"
        }}
      />

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Yatay veri akış çizgileri */}
      {[15, 35, 55, 75, 85].map((y, i) => (
        <HorizontalDataLine key={i} y={y} direction={i % 2 === 0 ? "left" : "right"} speed={20 + i * 5} />
      ))}

      {/* Network Nodes */}
      {[
        { x: 5, y: 15 }, { x: 95, y: 20 }, { x: 8, y: 80 }, { x: 92, y: 75 },
        { x: 50, y: 5 }, { x: 50, y: 95 },
      ].map((pos, i) => (
        <NetworkNode key={i} x={pos.x} y={pos.y} delay={i * 0.4} />
      ))}

      {/* Data Packets */}
      {[
        { startX: 5, endX: 45, y: 25, delay: 0 },
        { startX: 95, endX: 55, y: 35, delay: 1 },
        { startX: 10, endX: 50, y: 65, delay: 2 },
        { startX: 90, endX: 50, y: 75, delay: 3 },
      ].map((packet, i) => (
        <DataPacket key={i} {...packet} />
      ))}

      {/* Server Indicators */}
      <ServerIndicator side="left" />
      <ServerIndicator side="right" />

      {/* Neon Corner Frames */}
      <div className="absolute top-4 left-4 w-24 h-24 border-l-2 border-t-2 border-cyan-500/60" 
           style={{ boxShadow: "inset 5px 5px 30px rgba(0,255,255,0.15)" }} />
      <div className="absolute top-4 right-4 w-24 h-24 border-r-2 border-t-2 border-cyan-500/60"
           style={{ boxShadow: "inset -5px 5px 30px rgba(0,255,255,0.15)" }} />
      <div className="absolute bottom-4 left-4 w-24 h-24 border-l-2 border-b-2 border-cyan-500/60"
           style={{ boxShadow: "inset 5px -5px 30px rgba(0,255,255,0.15)" }} />
      <div className="absolute bottom-4 right-4 w-24 h-24 border-r-2 border-b-2 border-cyan-500/60"
           style={{ boxShadow: "inset -5px -5px 30px rgba(0,255,255,0.15)" }} />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Top Status Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-0 right-0 flex justify-between items-center px-6 md:px-12"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ boxShadow: "0 0 10px #f00, 0 0 20px #f00" }}
            />
            <span className="text-red-400/80 font-mono text-[10px] tracking-[0.3em]">RESTRICTED ACCESS</span>
          </div>
          <div className="font-mono text-cyan-400/80 text-[10px] tracking-widest flex items-center gap-4">
            <span className="hidden sm:inline text-cyan-500/50">SYS_TIME:</span>
            {formatTime(currentTime)}
          </div>
        </motion.div>

        {/* Central Shield Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 1.5 }}
          className="relative mb-10"
        >
          {/* Outer pulsing rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full border border-cyan-500/20"
              style={{
                width: 140 + ring * 40,
                height: 140 + ring * 40,
                left: "50%",
                top: "50%",
                marginLeft: -(70 + ring * 20),
                marginTop: -(70 + ring * 20),
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, delay: ring * 0.3 }}
            />
          ))}

          {/* Main Icon Container */}
          <div className="relative">
            {/* Rotating ring */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 160,
                height: 160,
                left: "50%",
                top: "50%",
                marginLeft: -80,
                marginTop: -80,
                border: "2px dashed rgba(0,255,255,0.3)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner glow circle */}
            <div 
              className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, rgba(0,255,255,0.1) 0%, rgba(0,20,30,0.9) 70%)",
                boxShadow: "0 0 60px rgba(0,255,255,0.2), inset 0 0 40px rgba(0,255,255,0.05)",
                border: "1px solid rgba(0,255,255,0.3)",
              }}
            >
              <div className="relative">
                <Shield 
                  className="w-16 h-16 text-cyan-400" 
                  style={{ filter: "drop-shadow(0 0 15px #0ff)" }}
                />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Lock className="w-6 h-6 text-cyan-300" style={{ filter: "drop-shadow(0 0 8px #0ff)" }} />
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center max-w-3xl px-4"
        >
          {settings.lockdown_message && (
            <h1 
              className={`text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-wider leading-tight ${
                glitchActive ? "glitch-text" : ""
              }`}
              style={{
                color: "#0ff",
                textShadow: glitchActive 
                  ? "3px 0 #f0f, -3px 0 #0f0" 
                  : "0 0 20px rgba(0,255,255,0.8), 0 0 40px rgba(0,255,255,0.4), 0 0 60px rgba(0,255,255,0.2)",
              }}
            >
              {settings.lockdown_message}
            </h1>
          )}
          
          {settings.lockdown_subtitle && (
            <p 
              className="text-cyan-300/60 font-mono text-xs sm:text-sm md:text-base tracking-wide"
              style={{ textShadow: "0 0 10px rgba(0,255,255,0.3)" }}
            >
              {settings.lockdown_subtitle}
            </p>
          )}
        </motion.div>

        {/* Powered By */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-0 right-0 text-center"
        >
          <div 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
            style={{
              background: "rgba(0,255,255,0.05)",
              border: "1px solid rgba(0,255,255,0.2)",
              boxShadow: "0 0 30px rgba(0,255,255,0.1)",
            }}
          >
            <span className="text-cyan-500/50 text-[10px] font-mono tracking-wider">powered by</span>
            <span 
              className="font-bold text-sm tracking-wider"
              style={{
                color: "#0ff",
                textShadow: "0 0 10px #0ff, 0 0 20px #0ff",
              }}
            >
              Canberk Şıklı
            </span>
          </div>
        </motion.div>
      </div>

      {/* Scan Line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.6), transparent)",
          boxShadow: "0 0 20px rgba(0,255,255,0.4)",
        }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)"
        }}
      />

      {/* CSS */}
      <style jsx global>{`
        .glitch-text {
          animation: glitch 0.15s ease-in-out;
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
