"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Lock } from "lucide-react";
import { siteLockdown } from "@/lib/site-lockdown";

interface LockdownSettings {
  lockdown_message: string;
  lockdown_subtitle: string;
}

// Matrix Rain Effect Component
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const charArray = chars.split("");
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0ff";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Gradient color effect
        const gradient = ctx.createLinearGradient(x, y - 50, x, y);
        gradient.addColorStop(0, "rgba(0, 255, 255, 0)");
        gradient.addColorStop(0.5, "rgba(0, 255, 255, 0.5)");
        gradient.addColorStop(1, "rgba(0, 255, 255, 1)");
        ctx.fillStyle = gradient;

        ctx.fillText(char, x, y);

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

  return <canvas ref={canvasRef} className="absolute inset-0 opacity-30" />;
};

// Floating Data Particles
const DataParticle = ({ delay }: { delay: number }) => {
  const startX = Math.random() * 100;
  const duration = 8 + Math.random() * 4;

  return (
    <motion.div
      className="absolute w-1 h-8 rounded-full"
      style={{
        left: `${startX}%`,
        background: "linear-gradient(180deg, transparent, #0ff, transparent)",
        boxShadow: "0 0 10px #0ff, 0 0 20px #0ff",
      }}
      initial={{ top: "-5%", opacity: 0 }}
      animate={{
        top: "105%",
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "linear",
      }}
    />
  );
};

// Neon Circuit Lines
const CircuitLine = ({ direction, position }: { direction: "horizontal" | "vertical"; position: number }) => {
  const isHorizontal = direction === "horizontal";
  
  return (
    <motion.div
      className="absolute"
      style={{
        [isHorizontal ? "top" : "left"]: `${position}%`,
        [isHorizontal ? "left" : "top"]: 0,
        [isHorizontal ? "width" : "height"]: "100%",
        [isHorizontal ? "height" : "width"]: "1px",
        background: "linear-gradient(90deg, transparent, #0ff, transparent)",
        boxShadow: "0 0 5px #0ff",
        opacity: 0.3,
      }}
      animate={{
        opacity: [0.1, 0.5, 0.1],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: Math.random() * 2,
      }}
    />
  );
};

// Hexagon Grid Node
const HexNode = ({ x, y, delay }: { x: number; y: number; delay: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      background: "#0ff",
      boxShadow: "0 0 10px #0ff, 0 0 20px #0ff, 0 0 30px #0ff",
    }}
    animate={{
      scale: [1, 1.5, 1],
      opacity: [0.3, 1, 0.3],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay,
    }}
  />
);

// Binary Stream
const BinaryStream = ({ side }: { side: "left" | "right" }) => {
  const [binary, setBinary] = useState<string[]>([]);

  useEffect(() => {
    const generateBinary = () => {
      const newBinary: string[] = [];
      for (let i = 0; i < 20; i++) {
        let line = "";
        for (let j = 0; j < 8; j++) {
          line += Math.random() > 0.5 ? "1" : "0";
        }
        newBinary.push(line);
      }
      setBinary(newBinary);
    };

    generateBinary();
    const interval = setInterval(generateBinary, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`absolute top-1/4 ${side === "left" ? "left-4" : "right-4"} font-mono text-[10px] text-cyan-500/40 space-y-0.5 hidden lg:block`}
    >
      {binary.map((line, i) => (
        <div key={i} className="tracking-widest">{line}</div>
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
    }, 4000);

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
    <div className="min-h-screen bg-[#000a0f] relative overflow-hidden">
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* Radial Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,10,15,0.8) 70%, rgba(0,10,15,0.95) 100%)"
        }}
      />

      {/* Animated Grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Circuit Lines */}
      {[15, 30, 45, 60, 75, 85].map((pos, i) => (
        <CircuitLine key={`h-${i}`} direction="horizontal" position={pos} />
      ))}
      {[10, 25, 40, 55, 70, 90].map((pos, i) => (
        <CircuitLine key={`v-${i}`} direction="vertical" position={pos} />
      ))}

      {/* Hex Nodes */}
      {[
        { x: 10, y: 20 }, { x: 90, y: 15 }, { x: 85, y: 80 }, { x: 15, y: 75 },
        { x: 50, y: 10 }, { x: 50, y: 90 }, { x: 5, y: 50 }, { x: 95, y: 50 },
      ].map((pos, i) => (
        <HexNode key={i} x={pos.x} y={pos.y} delay={i * 0.3} />
      ))}

      {/* Data Particles */}
      {[...Array(15)].map((_, i) => (
        <DataParticle key={i} delay={i * 0.5} />
      ))}

      {/* Binary Streams */}
      <BinaryStream side="left" />
      <BinaryStream side="right" />

      {/* Neon Corner Frames */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-4 left-4 w-24 h-24 border-l-2 border-t-2 border-cyan-500" style={{ boxShadow: "inset 5px 5px 20px rgba(0,255,255,0.3)" }} />
        <motion.div 
          className="absolute top-4 left-4 w-2 h-2 bg-cyan-400 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ boxShadow: "0 0 10px #0ff, 0 0 20px #0ff" }}
        />
      </div>
      <div className="absolute top-0 right-0 w-32 h-32">
        <div className="absolute top-4 right-4 w-24 h-24 border-r-2 border-t-2 border-cyan-500" style={{ boxShadow: "inset -5px 5px 20px rgba(0,255,255,0.3)" }} />
        <motion.div 
          className="absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
          style={{ boxShadow: "0 0 10px #0ff, 0 0 20px #0ff" }}
        />
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32">
        <div className="absolute bottom-4 left-4 w-24 h-24 border-l-2 border-b-2 border-cyan-500" style={{ boxShadow: "inset 5px -5px 20px rgba(0,255,255,0.3)" }} />
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32">
        <div className="absolute bottom-4 right-4 w-24 h-24 border-r-2 border-b-2 border-cyan-500" style={{ boxShadow: "inset -5px -5px 20px rgba(0,255,255,0.3)" }} />
      </div>

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
              className="w-3 h-3 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ boxShadow: "0 0 10px #f00, 0 0 20px #f00" }}
            />
            <span className="text-red-400 font-mono text-xs tracking-widest">RESTRICTED</span>
          </div>
          <div className="font-mono text-cyan-400 text-xs tracking-widest">
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
          {/* Pulsing Rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
            style={{ width: 200, height: 200, marginLeft: -100, marginTop: -100, left: "50%", top: "50%" }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-500/20"
            style={{ width: 250, height: 250, marginLeft: -125, marginTop: -125, left: "50%", top: "50%" }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />

          {/* Main Icon Container */}
          <div className="relative">
            {/* Rotating Outer Ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                width: 160,
                height: 160,
                border: "3px solid transparent",
                borderTopColor: "#0ff",
                borderRightColor: "#0ff",
                boxShadow: "0 0 30px rgba(0,255,255,0.5), inset 0 0 30px rgba(0,255,255,0.1)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Inner Glow Circle */}
            <div 
              className="w-40 h-40 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, rgba(0,255,255,0.15) 0%, rgba(0,0,0,0.8) 70%)",
                boxShadow: "0 0 60px rgba(0,255,255,0.3), inset 0 0 40px rgba(0,255,255,0.1)",
              }}
            >
              <div className="relative">
                <Shield 
                  className="w-20 h-20 text-cyan-400" 
                  style={{ filter: "drop-shadow(0 0 20px #0ff)" }}
                />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Lock className="w-8 h-8 text-cyan-300" style={{ filter: "drop-shadow(0 0 10px #0ff)" }} />
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
              className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-wider leading-tight ${
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
              className="text-cyan-300/70 font-mono text-sm md:text-base tracking-wide"
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
              background: "linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(0,100,100,0.1) 100%)",
              border: "1px solid rgba(0,255,255,0.3)",
              boxShadow: "0 0 20px rgba(0,255,255,0.2), inset 0 0 20px rgba(0,255,255,0.05)",
            }}
          >
            <span className="text-cyan-500/60 text-xs font-mono">powered by</span>
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

      {/* Scan Line Effect */}
      <motion.div
        className="absolute left-0 right-0 h-[2px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.8), transparent)",
          boxShadow: "0 0 20px rgba(0,255,255,0.5)",
        }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)"
        }}
      />

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); }
          40% { transform: translate(-3px, -3px); }
          60% { transform: translate(3px, 3px); }
          80% { transform: translate(3px, -3px); }
          100% { transform: translate(0); }
        }

        .glitch-text {
          animation: glitch 0.15s ease-in-out;
        }
      `}</style>
    </div>
  );
}
