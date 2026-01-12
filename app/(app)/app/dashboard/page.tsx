"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Package,
  Users,
  Building2,
  TrendingUp,
  Eye,
  Edit3,
  Loader2,
  Box,
  Clock,
  BarChart3,
  Layers,
  ChevronRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Radio,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { auth, type User } from "@/lib/auth";
import { boxRepository } from "@/lib/repositories/box";
import { departmentRepository } from "@/lib/repositories/department";
import { activityTracker, activityLabels, type Activity as ActivityType } from "@/lib/activity-tracker";
import type { BoxWithDepartment, BoxWithDetails } from "@/lib/types/box";
import type { Department } from "@/lib/types/box";

export default function ManagerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [boxes, setBoxes] = useState<BoxWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedBox, setSelectedBox] = useState<BoxWithDetails | null>(null);
  const [boxModalOpen, setBoxModalOpen] = useState(false);
  const [loadingBox, setLoadingBox] = useState(false);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load activities
  const loadActivities = useCallback(() => {
    const recentActivities = activityTracker.getRecent(15);
    setActivities(recentActivities);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  // 5 saniyede bir otomatik yenileme
  useEffect(() => {
    const interval = setInterval(() => {
      loadActivities();
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadActivities]);

  // Listen for real-time activity events
  useEffect(() => {
    const handleNewActivity = () => {
      loadActivities();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("activity-logged", handleNewActivity);
      return () => window.removeEventListener("activity-logged", handleNewActivity);
    }
  }, [loadActivities]);

  const checkAuth = async () => {
    const session = await auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "manager" && session.user.role !== "super_admin") {
      router.push("/app");
      return;
    }

    setUser(session.user);
    await loadData();
    loadActivities();
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const [boxesData, depsData] = await Promise.all([
        boxRepository.getAll(),
        departmentRepository.getAll(),
      ]);

      setBoxes(boxesData);
      setDepartments(depsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    loadActivities();
    setRefreshing(false);
  };

  const openBoxDetail = async (boxCode: string) => {
    setLoadingBox(true);
    setBoxModalOpen(true);
    try {
      const boxDetail = await boxRepository.getByCode(boxCode);
      setSelectedBox(boxDetail);
    } catch (error) {
      console.error("Error loading box:", error);
    } finally {
      setLoadingBox(false);
    }
  };

  // Statistics calculations
  const stats = useMemo(() => {
    const totalBoxes = boxes.length;
    const sealedBoxes = boxes.filter((b) => b.status === "sealed").length;
    const draftBoxes = boxes.filter((b) => b.status === "draft").length;

    // Last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24h = boxes.filter((b) => new Date(b.created_at) >= yesterday).length;

    // Department stats
    const deptStats = departments.map((dept) => {
      const deptBoxes = boxes.filter((b) => b.department.id === dept.id);
      return {
        ...dept,
        totalBoxes: deptBoxes.length,
        sealed: deptBoxes.filter((b) => b.status === "sealed").length,
        draft: deptBoxes.filter((b) => b.status === "draft").length,
      };
    }).sort((a, b) => b.totalBoxes - a.totalBoxes);

    // Top users
    const userCounts = new Map<string, { count: number; department: string }>();
    boxes.forEach((box) => {
      const existing = userCounts.get(box.created_by);
      if (existing) {
        existing.count++;
      } else {
        userCounts.set(box.created_by, { count: 1, department: box.department.name });
      }
    });
    const topUsers = Array.from(userCounts.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalBoxes,
      sealedBoxes,
      draftBoxes,
      last24h,
      deptStats,
      topUsers,
    };
  }, [boxes, departments]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 10) return "şimdi";
    if (seconds < 60) return `${seconds} sn önce`;
    if (minutes < 60) return `${minutes} dk önce`;
    return `${Math.floor(minutes / 60)} saat önce`;
  };

  const getActionIcon = (action: string) => {
    if (action.includes("created") || action.includes("oluştur")) return "🆕";
    if (action.includes("sealed") || action.includes("kapat")) return "🔒";
    if (action.includes("added") || action.includes("ekledi")) return "➕";
    if (action.includes("removed") || action.includes("çıkar")) return "➖";
    if (action.includes("updated") || action.includes("güncelle")) return "✏️";
    if (action.includes("photo") || action.includes("fotoğraf")) return "📷";
    return "📦";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                Yönetim Paneli
              </h1>
              <p className="text-sm text-slate-500">Anlık durum ve operasyon takibi</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">
            Son güncelleme: {lastUpdate.toLocaleTimeString("tr-TR")}
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-cyan-200 hover:bg-cyan-50"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: "Toplam Koli",
            value: stats.totalBoxes,
            icon: Package,
            gradient: "from-blue-500 to-indigo-600",
            bgGradient: "from-blue-50 to-indigo-50",
            glow: "shadow-blue-500/20",
          },
          {
            title: "Kapalı Koliler",
            value: stats.sealedBoxes,
            icon: CheckCircle2,
            gradient: "from-emerald-500 to-teal-600",
            bgGradient: "from-emerald-50 to-teal-50",
            glow: "shadow-emerald-500/20",
          },
          {
            title: "Açık Koliler",
            value: stats.draftBoxes,
            icon: AlertCircle,
            gradient: "from-amber-500 to-orange-600",
            bgGradient: "from-amber-50 to-orange-50",
            glow: "shadow-amber-500/20",
          },
          {
            title: "Son 24 Saat",
            value: stats.last24h,
            icon: TrendingUp,
            gradient: "from-purple-500 to-pink-600",
            bgGradient: "from-purple-50 to-pink-50",
            glow: "shadow-purple-500/20",
          },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${kpi.bgGradient} shadow-lg ${kpi.glow}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-full -translate-y-8 translate-x-8" />
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-500">{kpi.title}</p>
                    <motion.p
                      key={kpi.value}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1"
                    >
                      {kpi.value.toLocaleString("tr-TR")}
                    </motion.p>
                  </div>
                  <motion.div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                  >
                    <kpi.icon className="h-5 w-5 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden h-full">
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="activityGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="currentColor" className="text-cyan-400" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#activityGrid)" />
              </svg>
            </div>
            
            <CardHeader className="relative border-b border-slate-700/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="relative"
                >
                  <div className="h-3 w-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                  <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping opacity-75" />
                </motion.div>
                <span className="text-white">Canlı Aktivite</span>
                <div className="ml-auto flex items-center gap-2">
                  {activities.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        activityTracker.clear();
                        loadActivities();
                      }}
                      className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Temizle
                    </Button>
                  )}
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-0 flex items-center gap-1">
                    <Radio className="h-3 w-3" />
                    5sn
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative p-4 space-y-3 max-h-[450px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {activities.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 text-slate-400"
                  >
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Henüz aktivite yok</p>
                    <p className="text-xs text-slate-500 mt-1">Kullanıcılar işlem yaptığında burada görünecek</p>
                  </motion.div>
                ) : (
                  activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      layout
                      initial={{ opacity: 0, x: -20, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.9 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all cursor-pointer group"
                      onClick={() => activity.entityCode && openBoxDetail(activity.entityCode)}
                    >
                      <div className="flex items-start gap-3">
                        <motion.div
                          className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-lg"
                          animate={index === 0 ? {
                            boxShadow: [
                              "0 0 0 0 rgba(6, 182, 212, 0)",
                              "0 0 0 8px rgba(6, 182, 212, 0.1)",
                              "0 0 0 0 rgba(6, 182, 212, 0)",
                            ],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {getActionIcon(activity.action)}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white truncate">
                              {activity.userName}
                            </span>
                            <span className="text-cyan-400 text-sm">
                              {activityLabels[activity.action] || activity.action}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                              {activity.userDepartment}
                            </Badge>
                            {activity.entityCode && (
                              <Badge variant="outline" className="text-xs border-cyan-600/50 text-cyan-300 font-mono">
                                {activity.entityCode}
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm overflow-hidden h-full">
            <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                <Building2 className="h-5 w-5 text-cyan-600" />
                Departman Bazlı Durum
                <Sparkles className="h-4 w-4 text-amber-500 ml-auto" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.deptStats.map((dept, index) => (
                  <motion.div
                    key={dept.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 hover:border-cyan-300 transition-all cursor-pointer group"
                    onClick={() => router.push(`/app/boxes?department=${dept.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-800 truncate">{dept.name}</h3>
                      <motion.div
                        className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        whileHover={{ rotate: 90 }}
                      >
                        <ChevronRight className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                    </div>
                    
                    <div className="flex items-end gap-4">
                      <div>
                        <motion.p
                          key={dept.totalBoxes}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          className="text-3xl font-bold text-slate-800"
                        >
                          {dept.totalBoxes}
                        </motion.p>
                        <p className="text-xs text-slate-500">toplam koli</p>
                      </div>
                      <div className="flex-1">
                        {/* Progress bar */}
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: dept.totalBoxes > 0
                                ? `${(dept.sealed / dept.totalBoxes) * 100}%`
                                : "0%",
                            }}
                            transition={{ delay: 0.5 + index * 0.05, duration: 0.8 }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-emerald-600">{dept.sealed} kapalı</span>
                          <span className="text-xs text-amber-600">{dept.draft} açık</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {stats.deptStats.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-slate-400">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Henüz departman verisi yok</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Users Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
              <Users className="h-5 w-5 text-purple-600" />
              En Aktif Personeller
              <Badge className="ml-auto bg-purple-100 text-purple-700 border-0">
                {stats.topUsers.length} kişi
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.topUsers.map((userData, index) => {
                const userBoxes = boxes.filter((b) => b.created_by === userData.name);
                
                return (
                  <motion.div
                    key={userData.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="relative p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-purple-300 transition-all group"
                  >
                    {/* Rank badge */}
                    <div
                      className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                        index === 0
                          ? "bg-gradient-to-br from-amber-400 to-amber-600"
                          : index === 1
                          ? "bg-gradient-to-br from-slate-400 to-slate-600"
                          : index === 2
                          ? "bg-gradient-to-br from-orange-400 to-orange-600"
                          : "bg-gradient-to-br from-slate-300 to-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div className="ml-4">
                      <h4 className="font-semibold text-slate-800 text-lg">{userData.name}</h4>
                      <p className="text-sm text-slate-500">{userData.department}</p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold text-slate-800">{userData.count}</span>
                          <span className="text-xs text-slate-500">koli</span>
                        </div>
                      </div>

                      {/* Recent boxes */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-400 mb-2">Son koliler:</p>
                        <div className="flex flex-wrap gap-1">
                          {userBoxes.slice(0, 3).map((box) => (
                            <motion.button
                              key={box.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openBoxDetail(box.code)}
                              className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 font-mono transition-colors"
                            >
                              {box.code}
                            </motion.button>
                          ))}
                          {userBoxes.length > 3 && (
                            <span className="px-2 py-1 text-xs text-slate-400">
                              +{userBoxes.length - 3} daha
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Box Detail Modal */}
      <Dialog open={boxModalOpen} onOpenChange={setBoxModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Package className="h-5 w-5 text-white" />
              </div>
              Koli Detayı
              {selectedBox && (
                <Badge variant="outline" className="ml-2 font-mono">
                  {selectedBox.code}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {loadingBox ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : selectedBox ? (
            <div className="space-y-6">
              {/* Box Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Koli Adı</p>
                  <p className="font-semibold text-slate-800">{selectedBox.name}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Departman</p>
                  <p className="font-semibold text-slate-800">{selectedBox.department.name}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Oluşturan</p>
                  <p className="font-semibold text-slate-800">{selectedBox.created_by}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Durum</p>
                  <Badge
                    variant={selectedBox.status === "sealed" ? "default" : "secondary"}
                    className={
                      selectedBox.status === "sealed"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-amber-500 hover:bg-amber-600"
                    }
                  >
                    {selectedBox.status === "sealed" ? "Kapalı" : "Açık"}
                  </Badge>
                </div>
              </div>

              {/* Box Photo */}
              {selectedBox.photo_url && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={selectedBox.photo_url}
                    alt="Koli fotoğrafı"
                    className="w-full max-h-64 object-contain bg-slate-50"
                  />
                </div>
              )}

              {/* Box Contents */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-600" />
                  İçerik Listesi ({selectedBox.lines.length} ürün)
                </h4>
                
                {selectedBox.lines.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBox.lines.map((line, index) => (
                      <motion.div
                        key={line.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{line.product_name}</p>
                          <p className="text-sm text-slate-500">
                            Adet: {line.qty}
                            {line.kind && ` • Cins: ${line.kind}`}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Henüz içerik eklenmemiş</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/app/boxes/${selectedBox.code}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Görüntüle
                </Button>
                {selectedBox.status === "draft" && (
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    onClick={() => router.push(`/app/boxes/${selectedBox.code}/edit`)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Düzenle
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Koli bulunamadı</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
