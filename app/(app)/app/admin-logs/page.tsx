"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Users,
  Clock,
  Globe,
  Monitor,
  LogIn,
  LogOut,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Search,
  Filter,
  Wifi,
  WifiOff,
  TrendingUp,
  Shield,
  Eye,
  Trash2,
  ChevronDown,
  MapPin,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { loginLogRepository, type LoginLog, type ActiveSession } from "@/lib/repositories/login-log";
import { useToast } from "@/components/ui/use-toast";

export default function AdminLogsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [stats, setStats] = useState({
    totalLogins24h: 0,
    uniqueUsers24h: 0,
    failedLogins24h: 0,
    activeNow: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    checkAccess();
  }, []);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAccess = async () => {
    const session = await auth.getSession();
    if (!session || session.user.role !== "super_admin") {
      router.push("/app");
      return;
    }
    await loadData();
    setLoading(false);
  };

  const loadData = useCallback(async () => {
    try {
      // Tarih filtresi
      let startDate: Date | undefined;
      const now = new Date();

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "yesterday":
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      const [logsData, sessionsData, statsData] = await Promise.all([
        loginLogRepository.getLogs({
          limit: 200,
          action: actionFilter !== "all" ? (actionFilter as any) : undefined,
          username: searchTerm || undefined,
          startDate,
        }),
        loginLogRepository.getActiveSessions(),
        loginLogRepository.getStats(),
      ]);

      setLogs(logsData);
      setActiveSessions(sessionsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [actionFilter, dateFilter, searchTerm]);

  useEffect(() => {
    if (!loading) {
      loadData();
    }
  }, [actionFilter, dateFilter, searchTerm, loadData, loading]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds} sn önce`;
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  // Sistemde kalma süresi hesaplama (session başlangıcından itibaren)
  const formatSessionDuration = (createdAt: string) => {
    const startDate = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours} saat ${remainingMinutes} dk`;
    }
    return `${minutes} dk`;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "login":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <LogIn className="w-3 h-3 mr-1" />
            Giriş
          </Badge>
        );
      case "auto_login":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Wifi className="w-3 h-3 mr-1" />
            Oto. Giriş
          </Badge>
        );
      case "logout":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <LogOut className="w-3 h-3 mr-1" />
            Çıkış
          </Badge>
        );
      case "failed_login":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Başarısız
          </Badge>
        );
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: "Bilinmiyor", os: "Bilinmiyor", device: "Bilinmiyor" };

    let browser = "Bilinmiyor";
    let os = "Bilinmiyor";
    let device = "Masaüstü";

    // Browser detection
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";
    else if (ua.includes("Opera")) browser = "Opera";

    // OS detection
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    // Device detection
    if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) {
      device = "Mobil";
    } else if (ua.includes("Tablet") || ua.includes("iPad")) {
      device = "Tablet";
    }

    return { browser, os, device };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-rose-200" />
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-rose-500 animate-spin"
              style={{ animationDuration: "0.8s" }}
            />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-4 text-slate-600 font-medium animate-pulse">Yükleniyor...</p>
        </div>
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
        <div className="flex items-center gap-4">
          <div className="relative p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 shadow-xl shadow-rose-500/30">
            <Activity className="h-7 w-7 text-white" />
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
              Sistem Logları
            </h1>
            <p className="text-sm text-slate-500">Giriş/çıkış logları ve aktif oturumlar</p>
          </div>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: "Aktif Kullanıcı",
            value: stats.activeNow,
            icon: Wifi,
            gradient: "from-green-500 to-emerald-600",
            bgGradient: "from-green-50 to-emerald-50",
            pulse: true,
          },
          {
            title: "Giriş (24 saat)",
            value: stats.totalLogins24h,
            icon: LogIn,
            gradient: "from-blue-500 to-indigo-600",
            bgGradient: "from-blue-50 to-indigo-50",
          },
          {
            title: "Benzersiz Kullanıcı",
            value: stats.uniqueUsers24h,
            icon: Users,
            gradient: "from-purple-500 to-pink-600",
            bgGradient: "from-purple-50 to-pink-50",
          },
          {
            title: "Başarısız Giriş",
            value: stats.failedLogins24h,
            icon: AlertTriangle,
            gradient: "from-red-500 to-rose-600",
            bgGradient: "from-red-50 to-rose-50",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.bgGradient}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">{stat.title}</p>
                    <motion.p
                      key={stat.value}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-slate-800 mt-1"
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
                    animate={stat.pulse ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-green-700">
              <div className="relative">
                <Wifi className="h-5 w-5" />
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              Şu An Online ({activeSessions.length} kişi)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Şu an aktif kullanıcı yok</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence>
                  {activeSessions.map((session, index) => {
                    const { browser, os, device } = parseUserAgent(session.user_agent);
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-white border border-green-200 hover:border-green-400 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                              {session.user_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{session.user_name}</p>
                            <p className="text-xs text-slate-500">@{session.username}</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                          {/* Şu anki sayfa/işlem */}
                          {session.current_page && (
                            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-green-50 border border-green-200">
                              <MapPin className="h-3 w-3 text-green-600" />
                              <span className="text-green-700 font-medium">{session.current_page}</span>
                            </div>
                          )}
                          {session.current_action && (
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-3 w-3 text-amber-500" />
                              <span className="text-slate-600">{session.current_action}</span>
                            </div>
                          )}
                          {session.department_name && (
                            <div className="flex items-center gap-1.5">
                              <Shield className="h-3 w-3" />
                              <span>{session.department_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Monitor className="h-3 w-3" />
                            <span>{browser} • {os} • {device}</span>
                          </div>
                          {session.ip_address && (
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-3 w-3" />
                              <span className="font-mono">{session.ip_address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>Sistemde: {formatSessionDuration(session.created_at)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Kullanıcı adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="İşlem Türü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="login">Giriş</SelectItem>
            <SelectItem value="auto_login">Oto. Giriş</SelectItem>
            <SelectItem value="logout">Çıkış</SelectItem>
            <SelectItem value="failed_login">Başarısız</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tarih" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="today">Bugün</SelectItem>
            <SelectItem value="yesterday">Dün</SelectItem>
            <SelectItem value="week">Son 7 Gün</SelectItem>
            <SelectItem value="month">Son 30 Gün</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Login Logs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
              <TrendingUp className="h-5 w-5 text-rose-500" />
              Giriş/Çıkış Geçmişi
              <Badge variant="secondary" className="ml-2">
                {logs.length} kayıt
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Henüz log kaydı yok</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Kullanıcı
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          İşlem
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">
                          IP Adresi
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">
                          Cihaz
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                          Tarih/Saat
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {logs
                          .slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage)
                          .map((log, index) => {
                            const { browser, os, device } = parseUserAgent(log.user_agent);
                            return (
                              <motion.tr
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ delay: index * 0.02 }}
                                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-semibold text-sm">
                                      {log.user_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-800">{log.user_name}</p>
                                      <p className="text-xs text-slate-500">@{log.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  {getActionBadge(log.action)}
                                </td>
                                <td className="py-3 px-4 hidden md:table-cell">
                                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="font-mono text-xs">{log.ip_address || "-"}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 hidden lg:table-cell">
                                  <div className="text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                      <Monitor className="h-3 w-3" />
                                      {browser} • {os}
                                    </div>
                                    <div className="text-slate-400">{device}</div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm">
                                    <p className="text-slate-700">{formatDate(log.created_at)}</p>
                                    <p className="text-xs text-slate-400">{formatTimeAgo(log.created_at)}</p>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {logs.length > logsPerPage && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <div className="text-sm text-slate-500">
                      Sayfa {currentPage} / {Math.ceil(logs.length / logsPerPage)} ({logs.length} kayıt)
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="h-9"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Önceki
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, Math.ceil(logs.length / logsPerPage)) }, (_, i) => {
                          const totalPages = Math.ceil(logs.length / logsPerPage);
                          let pageNum;
                          
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-9 h-9 ${currentPage === pageNum ? "bg-rose-500 hover:bg-rose-600" : ""}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(Math.ceil(logs.length / logsPerPage), currentPage + 1))}
                        disabled={currentPage >= Math.ceil(logs.length / logsPerPage)}
                        className="h-9"
                      >
                        Sonraki
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

