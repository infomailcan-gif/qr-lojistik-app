"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "@/components/app/AnimatedBackground";
import { TopBar } from "@/components/app/TopBar";
import { BottomNav } from "@/components/app/BottomNav";
import { Sidebar } from "@/components/app/Sidebar";
import { LoadingPage } from "@/components/app/Loading";
import { PageTransition } from "@/components/app/PageTransition";
import { auth, type User } from "@/lib/auth";
import { motion } from "framer-motion";
import { Cpu, Sparkles } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <TopBar userName={user.name} onSignOut={handleSignOut} />
      <Sidebar userRole={user.role} />
      
      <main className="md:ml-64 pb-20 md:pb-4 min-h-[calc(100vh-4rem)]">
        <PageTransition>
          <div className="container px-4 py-6">
            {children}
          </div>
        </PageTransition>

        {/* Futuristic Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative mt-8 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm overflow-hidden"
        >
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
          
          <div className="text-center py-4 relative">
            <motion.div 
              className="flex items-center justify-center gap-3"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10"
              >
                <Cpu className="h-4 w-4 text-blue-500" />
              </motion.div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Powered by</span>
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Canberk Şıklı
                </span>
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </motion.div>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-[10px] text-slate-400 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              QR Lojistik Sistemi v2.0
            </motion.p>
          </div>
        </motion.footer>
      </main>

      <BottomNav userRole={user.role} />
    </div>
  );
}
