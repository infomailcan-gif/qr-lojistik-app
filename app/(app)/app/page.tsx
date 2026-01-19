"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Layers, Truck, Plus, ArrowRight, Building2, Activity, Zap, Sparkles } from "lucide-react";
import { auth, type User } from "@/lib/auth";
import { boxRepository } from "@/lib/repositories/box";
import { palletRepository } from "@/lib/repositories/pallet";
import { shipmentRepository } from "@/lib/repositories/shipment";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface DashboardStats {
  myBoxes: number;
  myPallets: number;
  myShipments: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    myBoxes: 0,
    myPallets: 0,
    myShipments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = await auth.getSession();
      if (session) {
        setUser(session.user);
        
        const userName = session.user.name;
        
        const [boxes, pallets, shipments] = await Promise.all([
          boxRepository.getAll(),
          palletRepository.getAll(),
          shipmentRepository.getAll(),
        ]);

        const myShipments = shipments.filter(s => s.created_by === userName);

        setStats({
          myBoxes: boxes.length,
          myPallets: pallets.length,
          myShipments: myShipments.length,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Kolilerim",
      value: stats.myBoxes,
      icon: Package,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      bgGradient: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200/60",
      shadowColor: "shadow-blue-500/10",
      href: "/app/boxes",
    },
    {
      title: "Paletlerim",
      value: stats.myPallets,
      icon: Layers,
      gradient: "from-cyan-500 via-teal-500 to-emerald-500",
      bgGradient: "from-cyan-50 to-teal-50",
      borderColor: "border-cyan-200/60",
      shadowColor: "shadow-cyan-500/10",
      href: "/app/pallets",
    },
    {
      title: "Sevkiyatlarım",
      value: stats.myShipments,
      icon: Truck,
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200/60",
      shadowColor: "shadow-purple-500/10",
      href: "/app/shipments",
    },
  ];

  const quickActions = [
    { 
      label: "Koli Oluştur", 
      icon: Package, 
      gradient: "from-blue-500 to-indigo-600",
      bgHover: "hover:bg-blue-50",
      href: "/app/boxes/new" 
    },
    { 
      label: "Palet Oluştur", 
      icon: Layers, 
      gradient: "from-cyan-500 to-teal-500",
      bgHover: "hover:bg-cyan-50",
      href: "/app/pallets/new" 
    },
    { 
      label: "Sevkiyat Oluştur", 
      icon: Truck, 
      gradient: "from-purple-500 to-pink-500",
      bgHover: "hover:bg-purple-50",
      href: "/app/shipments/new" 
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 px-1">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Decorative Elements */}
        <motion.div
          className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        <div className="relative space-y-2">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-6 w-6 text-amber-500" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
              Hoşgeldin, {user?.name || "User"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200/60">
              <Building2 className="h-4 w-4 text-cyan-600" />
              <span className="font-medium text-cyan-700">{user?.department_name || "Departman"}</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200/60">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Activity className="h-4 w-4 text-emerald-600" />
              </motion.div>
              <span className="text-sm text-emerald-700">Aktif</span>
            </div>
          </div>
          
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            İşte lojistik operasyonlarınızın özeti
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {statCards.map((stat, index) => (
          <motion.div key={stat.title} variants={item}>
            <Card 
              className={`relative overflow-hidden border ${stat.borderColor} bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm cursor-pointer group transition-all duration-300 hover:shadow-xl ${stat.shadowColor} hover:-translate-y-1`}
              onClick={() => router.push(stat.href)}
            >
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id={`grid-${index}`} width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="10" cy="10" r="1" fill="currentColor" className="text-slate-300" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#grid-${index})`} />
                </svg>
              </div>

              {/* Glow Effect */}
              <motion.div
                className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${stat.gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`}
              />

              <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 sm:px-6 pt-4 sm:pt-6 relative z-10">
                <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <motion.div 
                  className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  animate={{
                    boxShadow: [
                      "0 4px 15px rgba(0,0,0,0.1)",
                      "0 4px 25px rgba(0,0,0,0.2)",
                      "0 4px 15px rgba(0,0,0,0.1)",
                    ],
                  }}
                  transition={{
                    boxShadow: { duration: 2, repeat: Infinity },
                  }}
                >
                  <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </motion.div>
              </CardHeader>
              
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <motion.div 
                    className="text-3xl sm:text-4xl font-bold text-slate-800"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 + index * 0.1 }}
                  >
                    {loading ? (
                      <div className="h-10 w-16 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      stat.value.toLocaleString("tr-TR")
                    )}
                  </motion.div>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-all"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className={`h-5 w-5 bg-gradient-to-r ${stat.gradient} bg-clip-text text-slate-400`} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm overflow-hidden">
          {/* Header Gradient */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
          
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="h-5 w-5 text-amber-500" />
              </motion.div>
              <CardTitle className="text-lg sm:text-xl text-slate-800">Hızlı Aksiyonlar</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">Yeni kayıt oluşturmak için hızlı erişim</CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(action.href)}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border border-slate-200/60 transition-all ${action.bgHover} group overflow-hidden`}
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  />
                  
                  <motion.div 
                    className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg relative z-10`}
                    whileHover={{ rotate: 5 }}
                  >
                    <action.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </motion.div>
                  
                  <div className="flex-1 text-left relative z-10">
                    <span className="text-sm sm:text-base font-semibold text-slate-700">{action.label}</span>
                  </div>
                  
                  <motion.div
                    className={`p-2 rounded-lg bg-gradient-to-br ${action.gradient} opacity-10 group-hover:opacity-20 transition-opacity relative z-10`}
                  >
                    <Plus className="h-4 w-4 text-slate-600" />
                  </motion.div>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          { label: "Tüm Kolilerim", icon: Package, gradient: "from-blue-500 to-indigo-600", bgGradient: "from-blue-50 to-indigo-50", href: "/app/boxes" },
          { label: "Tüm Paletlerim", icon: Layers, gradient: "from-cyan-500 to-teal-500", bgGradient: "from-cyan-50 to-teal-50", href: "/app/pallets" },
          { label: "Tüm Sevkiyatlarım", icon: Truck, gradient: "from-purple-500 to-pink-500", bgGradient: "from-purple-50 to-pink-50", href: "/app/shipments" },
        ].map((nav, index) => (
          <motion.div
            key={nav.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`bg-gradient-to-br ${nav.bgGradient} border-slate-200/60 backdrop-blur-sm cursor-pointer hover:shadow-lg transition-all group overflow-hidden`}
              onClick={() => router.push(nav.href)}
            >
              <CardContent className="flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${nav.gradient} shadow-lg`}
                    whileHover={{ rotate: 10 }}
                  >
                    <nav.icon className="h-5 w-5 text-white" />
                  </motion.div>
                  <span className="text-sm sm:text-base font-semibold text-slate-700">{nav.label}</span>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
