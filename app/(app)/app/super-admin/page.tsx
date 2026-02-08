"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Users,
  Building2,
  Plus,
  Trash2,
  Edit,
  Check,
  Shield,
  UserCheck,
  User,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Loader2,
  Power,
  Lock,
  Unlock,
  Terminal,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { auth, type UserRole, type MockUser } from "@/lib/auth";
import { departmentRepository } from "@/lib/repositories/department";
import { activityTracker, type PageVisit } from "@/lib/activity-tracker";
import { userRepository, type UserWithBan } from "@/lib/repositories/user";
import { siteLockdown, type SiteLockdownSettings } from "@/lib/site-lockdown";
import { announcementRepository, type Announcement } from "@/lib/repositories/announcement";
import { loginLogRepository, type LoginLog, type ActiveSession } from "@/lib/repositories/login-log";
import type { Department } from "@/lib/types/box";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Clock, FileText, ChevronLeft, ChevronRight, Megaphone, Volume2, LogIn, LogOut, Wifi, WifiOff, Monitor, Globe, Activity as ActivityIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface UserFormData {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  department_id: string;
}

export default function SuperAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  const [users, setUsers] = useState<Omit<UserWithBan, "password">[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const activityPerPage = 20;

  // Login Logs State
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loginStats, setLoginStats] = useState({ totalLogins24h: 0, uniqueUsers24h: 0, failedLogins24h: 0, activeNow: 0 });
  const [loginLogsPage, setLoginLogsPage] = useState(1);
  const loginLogsPerPage = 20;

  // Site Lockdown State
  const [lockdownSettings, setLockdownSettings] = useState<SiteLockdownSettings | null>(null);
  const [lockdownMessage, setLockdownMessage] = useState("");
  const [lockdownSubtitle, setLockdownSubtitle] = useState("");
  const [lockdownSaving, setLockdownSaving] = useState(false);

  // Announcement/Duyuru State
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementSpeed, setAnnouncementSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [announcementBgColor, setAnnouncementBgColor] = useState("#3b82f6");
  const [announcementTextColor, setAnnouncementTextColor] = useState("#ffffff");
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Omit<UserWithBan, "password"> | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({
    username: "",
    password: "",
    name: "",
    role: "user",
    department_id: "",
  });

  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState("");

  const [deleteDialog, setDeleteDialog] = useState<{
    type: "user" | "department";
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  const checkSuperAdminAccess = async () => {
    const session = await auth.getSession();
    if (!session || session.user.role !== "super_admin") {
      router.push("/app");
      return;
    }
    loadData();
  };

  const loadData = useCallback(async () => {
    try {
      const [usersData, deptsData, visitsData, lockdownData, announcementData, logsData, sessionsData, statsData] = await Promise.all([
        auth.getAvailableUsers(),
        departmentRepository.getAll(),
        activityTracker.getAllRecentPageVisits(200),
        siteLockdown.getSettings(),
        announcementRepository.getAnnouncement(),
        loginLogRepository.getLogs({ limit: 200 }),
        loginLogRepository.getActiveSessions(),
        loginLogRepository.getStats(),
      ]);
      
      setUsers(usersData as any);
      setDepartments(deptsData);
      setPageVisits(visitsData);
      setLoginLogs(logsData);
      setActiveSessions(sessionsData);
      setLoginStats(statsData);
      
      if (lockdownData) {
        setLockdownSettings(lockdownData);
        setLockdownMessage(lockdownData.lockdown_message);
        setLockdownSubtitle(lockdownData.lockdown_subtitle);
      }

      if (announcementData) {
        setAnnouncement(announcementData);
        setAnnouncementMessage(announcementData.message);
        setAnnouncementSpeed(announcementData.marquee_speed);
        setAnnouncementBgColor(announcementData.background_color);
        setAnnouncementTextColor(announcementData.text_color);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleOpenUserModal = (user?: Omit<MockUser, "password">) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        password: "",
        name: user.name,
        role: user.role,
        department_id: user.department_id,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: "",
        password: "",
        name: "",
        role: "user",
        department_id: departments[0]?.id || "",
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    // Validasyon
    if (!userForm.name.trim()) {
      toast({
        title: "Hata",
        description: "Ad soyad gerekli",
        variant: "destructive",
      });
      return;
    }
    if (!userForm.username.trim()) {
      toast({
        title: "Hata",
        description: "Kullanıcı adı gerekli",
        variant: "destructive",
      });
      return;
    }
    if (!editingUser && !userForm.password) {
      toast({
        title: "Hata",
        description: "Şifre gerekli",
        variant: "destructive",
      });
      return;
    }
    if (!userForm.department_id) {
      toast({
        title: "Hata",
        description: "Departman seçimi gerekli",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      const department = departments.find((d) => d.id === userForm.department_id);

      if (editingUser) {
        const updates: any = {
          username: userForm.username.trim(),
          name: userForm.name.trim(),
          role: userForm.role,
          department_id: userForm.department_id,
          department_name: department?.name || "",
        };
        if (userForm.password) {
          updates.password = userForm.password;
        }
        await auth.updateUser(editingUser.id, updates);
        toast({
          title: "Başarılı",
          description: "Kullanıcı güncellendi",
        });
      } else {
        await auth.createUser({
          username: userForm.username.trim(),
          password: userForm.password,
          name: userForm.name.trim(),
          role: userForm.role,
          department_id: userForm.department_id,
          department_name: department?.name || "",
        });
        toast({
          title: "Başarılı",
          description: "Kullanıcı oluşturuldu",
        });
      }

      setShowUserModal(false);
      await loadData();
    } catch (error: any) {
      console.error("Save user error:", error);
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = (user: Omit<MockUser, "password">) => {
    setDeleteDialog({
      type: "user",
      id: user.id,
      name: user.name,
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialog) return;

    setSaving(true);
    
    try {
      await auth.deleteUser(deleteDialog.id);
      toast({
        title: "Başarılı",
        description: "Kullanıcı silindi",
      });
      await loadData();
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı silinemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setDeleteDialog(null);
    }
  };

  const handleOpenDepartmentModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setDepartmentName(department.name);
    } else {
      setEditingDepartment(null);
      setDepartmentName("");
    }
    setShowDepartmentModal(true);
  };

  const handleSaveDepartment = async () => {
    // Validasyon
    if (!departmentName.trim()) {
      toast({
        title: "Hata",
        description: "Departman adı gerekli",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      if (editingDepartment) {
        await departmentRepository.update(editingDepartment.id, departmentName.trim());
        toast({
          title: "Başarılı",
          description: "Departman güncellendi",
        });
      } else {
        await departmentRepository.create(departmentName.trim());
        toast({
          title: "Başarılı",
          description: "Departman oluşturuldu",
        });
      }
      setShowDepartmentModal(false);
      setDepartmentName("");
      await loadData();
    } catch (error: any) {
      console.error("Save department error:", error);
      toast({
        title: "Hata",
        description: error.message || "Departman kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = (department: Department) => {
    setDeleteDialog({
      type: "department",
      id: department.id,
      name: department.name,
    });
  };

  const confirmDeleteDepartment = async () => {
    if (!deleteDialog) return;

    setSaving(true);
    
    try {
      await departmentRepository.delete(deleteDialog.id);
      toast({
        title: "Başarılı",
        description: "Departman silindi",
      });
      await loadData();
    } catch (error: any) {
      console.error("Delete department error:", error);
      toast({
        title: "Hata",
        description: error.message || "Departman silinemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setDeleteDialog(null);
    }
  };

  // Site Lockdown Fonksiyonları
  const handleToggleLockdown = async (enabled: boolean) => {
    setLockdownSaving(true);
    try {
      const session = await auth.getSession();
      const userName = session?.user?.name || "Unknown";
      
      let success: boolean;
      if (enabled) {
        success = await siteLockdown.activate(userName);
      } else {
        success = await siteLockdown.deactivate();
      }
      
      if (success) {
        setLockdownSettings(prev => prev ? { ...prev, is_active: enabled } : null);
        toast({
          title: enabled ? "Site Kilitlendi" : "Site Açıldı",
          description: enabled 
            ? "Tüm kullanıcıların erişimi engellendi" 
            : "Kullanıcılar artık siteye erişebilir",
        });
      } else {
        toast({
          title: "Hata",
          description: "İşlem başarısız oldu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling lockdown:", error);
      toast({
        title: "Hata",
        description: "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLockdownSaving(false);
    }
  };

  const handleSaveLockdownMessage = async () => {
    setLockdownSaving(true);
    try {
      const success = await siteLockdown.updateMessage(lockdownMessage.trim(), lockdownSubtitle.trim());
      
      if (success) {
        setLockdownSettings(prev => prev ? { 
          ...prev, 
          lockdown_message: lockdownMessage,
          lockdown_subtitle: lockdownSubtitle 
        } : null);
        toast({
          title: "Başarılı",
          description: "Mesaj güncellendi",
        });
      } else {
        toast({
          title: "Hata",
          description: "Mesaj güncellenemedi",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving lockdown message:", error);
      toast({
        title: "Hata",
        description: "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLockdownSaving(false);
    }
  };

  // Announcement/Duyuru Fonksiyonları
  const handleToggleAnnouncement = async (enabled: boolean) => {
    setAnnouncementSaving(true);
    try {
      const session = await auth.getSession();
      const userName = session?.user?.name || "Unknown";
      
      const success = await announcementRepository.toggleActive(enabled, userName);
      
      if (success) {
        setAnnouncement(prev => prev ? { ...prev, is_active: enabled } : null);
        toast({
          title: enabled ? "Duyuru Aktif" : "Duyuru Kapalı",
          description: enabled 
            ? "Kayan yazı tüm kullanıcılara gösterilecek" 
            : "Kayan yazı gizlendi",
        });
      } else {
        toast({
          title: "Hata",
          description: "İşlem başarısız oldu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error toggling announcement:", error);
      toast({
        title: "Hata",
        description: "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      toast({
        title: "Hata",
        description: "Duyuru mesajı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setAnnouncementSaving(true);
    try {
      const session = await auth.getSession();
      const userName = session?.user?.name || "Unknown";
      
      const success = await announcementRepository.updateAnnouncement({
        message: announcementMessage.trim(),
        is_active: announcement?.is_active || false,
        marquee_speed: announcementSpeed,
        background_color: announcementBgColor,
        text_color: announcementTextColor,
        updated_by: userName,
      });
      
      if (success) {
        setAnnouncement(prev => prev ? { 
          ...prev, 
          message: announcementMessage,
          marquee_speed: announcementSpeed,
          background_color: announcementBgColor,
          text_color: announcementTextColor,
        } : null);
        toast({
          title: "Başarılı",
          description: "Duyuru güncellendi",
        });
      } else {
        toast({
          title: "Hata",
          description: "Duyuru güncellenemedi",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast({
        title: "Hata",
        description: "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/20">
            <Crown className="w-3 h-3 mr-1" />
            Süper Admin
          </Badge>
        );
      case "manager":
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 shadow-lg shadow-purple-500/20">
            <Shield className="w-3 h-3 mr-1" />
            Müdür
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0">
            <User className="w-3 h-3 mr-1" />
            Kullanıcı
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-amber-200" />
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-500 animate-spin"
              style={{ animationDuration: "0.8s" }}
            />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-4 text-slate-600 font-medium animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-0 sm:px-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-amber-500/30">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
                Süper Admin
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Kullanıcı ve departman yönetimi
              </p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="border-amber-200 hover:bg-amber-50 hover:border-amber-300"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-2">Yenile</span>
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-1">
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              Kullanıcılar
              <Badge variant="secondary" className="ml-1 bg-white/20">
                {users.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Building2 className="h-4 w-4" />
              Departmanlar
              <Badge variant="secondary" className="ml-1 bg-white/20">
                {departments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Eye className="h-4 w-4" />
              Kullanıcı Aktiviteleri
              <Badge variant="secondary" className="ml-1 bg-white/20">
                {pageVisits.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="login-logs" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
              <LogIn className="h-4 w-4" />
              Giriş Logları
              {loginStats.activeNow > 0 && (
                <Badge className="ml-1 bg-green-500 text-white animate-pulse">
                  {loginStats.activeNow} online
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="site-control" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
              <ShieldAlert className="h-4 w-4" />
              Site Kontrolü
              {lockdownSettings?.is_active && (
                <Badge className="ml-1 bg-red-500 text-white animate-pulse">
                  AKTİF
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
              <Megaphone className="h-4 w-4" />
              Duyurular
              {announcement?.is_active && (
                <Badge className="ml-1 bg-blue-500 text-white animate-pulse">
                  YAYIN
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Crown, label: "Süper Admin", count: users.filter((u) => u.role === "super_admin").length, gradient: "from-amber-500 to-orange-500", bg: "from-amber-50 to-orange-50" },
              { icon: Shield, label: "Müdür", count: users.filter((u) => u.role === "manager").length, gradient: "from-purple-500 to-indigo-500", bg: "from-purple-50 to-indigo-50" },
              { icon: UserCheck, label: "Kullanıcı", count: users.filter((u) => u.role === "user").length, gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-gradient-to-br ${stat.bg} border-slate-200`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{stat.count}</p>
                        <p className="text-sm text-slate-500">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Add User Button */}
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleOpenUserModal()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kullanıcı
              </Button>
            </motion.div>
          </div>

          {/* Users List */}
          <div className="grid gap-4">
            <AnimatePresence>
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 group-hover:from-amber-100 group-hover:to-orange-100 group-hover:text-amber-700 transition-all"
                            whileHover={{ scale: 1.05 }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </motion.div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-slate-800">{user.name}</h3>
                              {getRoleBadge(user.role)}
                            </div>
                            <p className="text-sm text-slate-500">
                              @{user.username} • {user.department_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenUserModal(user)}
                            className="hover:bg-amber-50 text-slate-400 hover:text-amber-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="hover:bg-red-50 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          {/* Add Department Button */}
          <div className="flex justify-end">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => handleOpenDepartmentModal()}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/25"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Departman
              </Button>
            </motion.div>
          </div>

          {/* Departments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {departments.map((department, index) => (
                <motion.div
                  key={department.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:border-cyan-300 hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">
                              {department.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {users.filter((u) => u.department_id === department.id).length} kullanıcı
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDepartmentModal(department)}
                            className="hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDepartment(department)}
                            className="hover:bg-red-50 text-slate-400 hover:text-red-500 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Kullanıcı Sayfa Aktiviteleri</h3>
                  <p className="text-xs text-slate-500">Kullanıcıların hangi sayfada ne kadar kaldığını görün</p>
                </div>
              </div>

              {pageVisits.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz aktivite kaydı yok</p>
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
                            Sayfa
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                            Süre
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">
                            Tarih/Saat
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {pageVisits
                            .slice((activityPage - 1) * activityPerPage, activityPage * activityPerPage)
                            .map((visit, index) => (
                              <motion.tr
                                key={visit.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ delay: index * 0.02 }}
                                className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                                      {visit.user_name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-slate-800">{visit.user_name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    <div>
                                      <p className="text-sm font-medium text-slate-700">{visit.page_name}</p>
                                      <p className="text-xs text-slate-400 font-mono">{visit.page_path}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm font-semibold text-slate-700">
                                      {visit.duration_seconds > 60 
                                        ? `${Math.floor(visit.duration_seconds / 60)} dk ${visit.duration_seconds % 60} sn`
                                        : `${visit.duration_seconds} sn`}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="text-sm text-slate-600">
                                    {new Date(visit.entered_at).toLocaleString("tr-TR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pageVisits.length > activityPerPage && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                      <div className="text-sm text-slate-500">
                        Sayfa {activityPage} / {Math.ceil(pageVisits.length / activityPerPage)} ({pageVisits.length} kayıt)
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                          disabled={activityPage === 1}
                          className="h-9"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Önceki
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActivityPage(Math.min(Math.ceil(pageVisits.length / activityPerPage), activityPage + 1))}
                          disabled={activityPage >= Math.ceil(pageVisits.length / activityPerPage)}
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
        </TabsContent>

        {/* Login Logs Tab */}
        <TabsContent value="login-logs" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Şu An Online", value: loginStats.activeNow, icon: Wifi, gradient: "from-green-500 to-emerald-600", bg: "from-green-50 to-emerald-50", pulse: true },
              { title: "Giriş (24 saat)", value: loginStats.totalLogins24h, icon: LogIn, gradient: "from-blue-500 to-indigo-600", bg: "from-blue-50 to-indigo-50", pulse: false },
              { title: "Benzersiz Kullanıcı", value: loginStats.uniqueUsers24h, icon: Users, gradient: "from-purple-500 to-pink-600", bg: "from-purple-50 to-pink-50", pulse: false },
              { title: "Başarısız Giriş", value: loginStats.failedLogins24h, icon: AlertTriangle, gradient: "from-red-500 to-rose-600", bg: "from-red-50 to-rose-50", pulse: false },
            ].map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                <Card className={`bg-gradient-to-br ${stat.bg} border-0`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">{stat.title}</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
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
          </div>

          {/* Active Sessions */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                    <Wifi className="h-5 w-5 text-white" />
                  </div>
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-green-700">Şu An Sistemde ({activeSessions.length} kişi)</h3>
                  <p className="text-xs text-slate-500">Son 5 dakika içinde aktif olan kullanıcılar</p>
                </div>
              </div>
              
              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <WifiOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Şu an aktif kullanıcı yok</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeSessions.map((session, index) => {
                    const ua = session.user_agent || "";
                    let browser = "Bilinmiyor";
                    let device = "Masaüstü";
                    if (ua.includes("Chrome")) browser = "Chrome";
                    else if (ua.includes("Firefox")) browser = "Firefox";
                    else if (ua.includes("Safari")) browser = "Safari";
                    else if (ua.includes("Edge")) browser = "Edge";
                    if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) device = "Mobil";
                    
                    const startDate = new Date(session.created_at);
                    const now = new Date();
                    const diffMinutes = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60));
                    const hours = Math.floor(diffMinutes / 60);
                    const mins = diffMinutes % 60;
                    const duration = hours > 0 ? `${hours} saat ${mins} dk` : `${diffMinutes} dk`;
                    
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
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
                          {session.current_page && (
                            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-green-50 border border-green-200">
                              <Eye className="h-3 w-3 text-green-600" />
                              <span className="text-green-700 font-medium">{session.current_page}</span>
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
                            <span>{browser} • {device}</span>
                          </div>
                          {session.ip_address && (
                            <div className="flex items-center gap-1.5">
                              <Globe className="h-3 w-3" />
                              <span className="font-mono">{session.ip_address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>Sistemde: {duration}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Login Logs */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 shadow-lg">
                  <ActivityIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Giriş/Çıkış Geçmişi</h3>
                  <p className="text-xs text-slate-500">Kim, ne zaman sisteme giriş yaptı</p>
                </div>
                <Badge variant="secondary" className="ml-auto">{loginLogs.length} kayıt</Badge>
              </div>

              {loginLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ActivityIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz giriş kaydı yok</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Kullanıcı</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">İşlem</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">IP</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Tarih/Saat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginLogs
                          .slice((loginLogsPage - 1) * loginLogsPerPage, loginLogsPage * loginLogsPerPage)
                          .map((log, index) => (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-semibold text-sm">
                                  {log.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 text-sm">{log.user_name}</p>
                                  <p className="text-xs text-slate-500">@{log.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {log.action === "login" ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                  <LogIn className="w-3 h-3 mr-1" />Giriş
                                </Badge>
                              ) : log.action === "auto_login" ? (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                  <Wifi className="w-3 h-3 mr-1" />Oto. Giriş
                                </Badge>
                              ) : log.action === "logout" ? (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  <LogOut className="w-3 h-3 mr-1" />Çıkış
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 border-red-200">
                                  <AlertTriangle className="w-3 h-3 mr-1" />Başarısız
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell">
                              <span className="font-mono text-xs text-slate-500">{log.ip_address || "-"}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-sm text-slate-600">
                                {new Date(log.created_at).toLocaleString("tr-TR", {
                                  day: "2-digit", month: "2-digit", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {loginLogs.length > loginLogsPerPage && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                      <div className="text-sm text-slate-500">
                        Sayfa {loginLogsPage} / {Math.ceil(loginLogs.length / loginLogsPerPage)} ({loginLogs.length} kayıt)
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setLoginLogsPage(Math.max(1, loginLogsPage - 1))} disabled={loginLogsPage === 1} className="h-9">
                          <ChevronLeft className="h-4 w-4 mr-1" />Önceki
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setLoginLogsPage(Math.min(Math.ceil(loginLogs.length / loginLogsPerPage), loginLogsPage + 1))} disabled={loginLogsPage >= Math.ceil(loginLogs.length / loginLogsPerPage)} className="h-9">
                          Sonraki<ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Control Tab */}
        <TabsContent value="site-control" className="space-y-6">
          {/* Warning Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/10 border border-red-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-red-700">Dikkat: Kritik Alan</h3>
                <p className="text-sm text-red-600/80 mt-1">
                  Site kilidi aktif edildiğinde super admin hariç tüm kullanıcıların erişimi engellenecektir.
                  Bu özellik sadece acil durumlarda kullanılmalıdır.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Control Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className={`border-2 transition-all duration-500 ${
              lockdownSettings?.is_active 
                ? "border-red-500 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg shadow-red-500/20" 
                : "border-slate-200 bg-white/80"
            }`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`relative p-4 rounded-2xl transition-all duration-500 ${
                      lockdownSettings?.is_active 
                        ? "bg-gradient-to-br from-red-500 to-rose-500 shadow-xl shadow-red-500/40" 
                        : "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/30"
                    }`}>
                      {lockdownSettings?.is_active ? (
                        <Lock className="h-8 w-8 text-white" />
                      ) : (
                        <Unlock className="h-8 w-8 text-white" />
                      )}
                      {lockdownSettings?.is_active && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        lockdownSettings?.is_active ? "text-red-600" : "text-slate-800"
                      }`}>
                        {lockdownSettings?.is_active ? "Site Kilitli" : "Site Açık"}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {lockdownSettings?.is_active 
                          ? `${lockdownSettings.activated_by} tarafından kilitlendi` 
                          : "Tüm kullanıcılar erişebilir"}
                      </p>
                      {lockdownSettings?.is_active && lockdownSettings.activated_at && (
                        <p className="text-xs text-red-500/70 mt-0.5">
                          {new Date(lockdownSettings.activated_at).toLocaleString("tr-TR")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-slate-600 mb-1">
                        Site Kilidi
                      </span>
                      <Switch
                        checked={lockdownSettings?.is_active || false}
                        onCheckedChange={handleToggleLockdown}
                        disabled={lockdownSaving}
                        className="data-[state=checked]:bg-red-500"
                      />
                    </div>
                    {lockdownSaving && (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Message Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                    <Terminal className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Engel Ekranı Mesajları</h3>
                    <p className="text-xs text-slate-500">Site kilitlendiğinde gösterilecek mesajları özelleştirin</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Ana Mesaj</Label>
                    <Textarea
                      value={lockdownMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLockdownMessage(e.target.value)}
                      placeholder="ERİŞİMİNİZ SİSTEM YÖNETİCİSİ TARAFINDAN KISITLANMIŞTIR"
                      className="min-h-[80px] border-slate-200 focus:border-violet-300 resize-none"
                    />
                    <p className="text-xs text-slate-400">Bu mesaj büyük ve dikkat çekici şekilde gösterilir</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Alt Mesaj</Label>
                    <Textarea
                      value={lockdownSubtitle}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLockdownSubtitle(e.target.value)}
                      placeholder="Güvenlik protokolleri devreye alındı."
                      className="min-h-[60px] border-slate-200 focus:border-violet-300 resize-none"
                    />
                    <p className="text-xs text-slate-400">Ek açıklama için kullanılır</p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveLockdownMessage}
                      disabled={lockdownSaving}
                      className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25"
                    >
                      {lockdownSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Mesajları Kaydet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900 border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">Önizleme</span>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    Cyberpunk Theme
                  </Badge>
                </div>
                <div className="p-6 relative" style={{ background: "linear-gradient(135deg, #000a0f 0%, #001015 100%)" }}>
                  {/* Mini Grid Background */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: "20px 20px"
                    }}
                  />
                  
                  <div className="relative text-center py-6">
                    {lockdownMessage && (
                      <h3 
                        className="text-lg md:text-xl font-bold mb-2 tracking-wide"
                        style={{
                          color: "#0ff",
                          textShadow: "0 0 20px rgba(0,255,255,0.5)"
                        }}
                      >
                        {lockdownMessage}
                      </h3>
                    )}
                    
                    {lockdownSubtitle && (
                      <p className="text-cyan-300/70 font-mono text-xs md:text-sm tracking-wide mb-4">
                        {lockdownSubtitle}
                      </p>
                    )}

                    {!lockdownMessage && !lockdownSubtitle && (
                      <p className="text-gray-500 text-sm italic mb-4">Mesaj girilmedi</p>
                    )}

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                      <span className="text-gray-500 text-[10px] font-mono">powered by</span>
                      <span className="font-bold text-xs" style={{ color: "#0ff", textShadow: "0 0 10px #0ff" }}>
                        Canberk Şıklı
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="space-y-6">
          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10 border border-blue-200 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Megaphone className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-700">Kayan Yazı Duyuru Sistemi</h3>
                <p className="text-sm text-blue-600/80 mt-1">
                  Tüm kullanıcılara ekranın üstünde kayan bir yazı ile mesaj gönderin. 
                  Mobil ve masaüstü uyumludur.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Control Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className={`border-2 transition-all duration-500 ${
              announcement?.is_active 
                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20" 
                : "border-slate-200 bg-white/80"
            }`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`relative p-4 rounded-2xl transition-all duration-500 ${
                      announcement?.is_active 
                        ? "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-xl shadow-blue-500/40" 
                        : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-xl shadow-slate-500/30"
                    }`}>
                      {announcement?.is_active ? (
                        <Volume2 className="h-8 w-8 text-white" />
                      ) : (
                        <Megaphone className="h-8 w-8 text-white" />
                      )}
                      {announcement?.is_active && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
                      )}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        announcement?.is_active ? "text-blue-600" : "text-slate-800"
                      }`}>
                        {announcement?.is_active ? "Duyuru Yayında" : "Duyuru Kapalı"}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {announcement?.is_active 
                          ? "Kayan yazı tüm kullanıcılara gösteriliyor" 
                          : "Duyuru aktif değil"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-slate-600 mb-1">
                        Duyuru Durumu
                      </span>
                      <Switch
                        checked={announcement?.is_active || false}
                        onCheckedChange={handleToggleAnnouncement}
                        disabled={announcementSaving || !announcementMessage.trim()}
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                    {announcementSaving && (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Announcement Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Duyuru Ayarları</h3>
                    <p className="text-xs text-slate-500">Kayan yazının içeriğini ve görünümünü özelleştirin</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Duyuru Mesajı */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Duyuru Mesajı</Label>
                    <Textarea
                      value={announcementMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnnouncementMessage(e.target.value)}
                      placeholder="Örn: Sistem bakımı nedeniyle yarın 10:00-12:00 arası erişim kısıtlı olacaktır."
                      className="min-h-[100px] border-slate-200 focus:border-blue-300 resize-none"
                    />
                    <p className="text-xs text-slate-400">Bu mesaj ekranın üstünde kayan yazı olarak gösterilecek</p>
                  </div>

                  {/* Hız Seçimi */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Kayan Yazı Hızı</Label>
                    <Select
                      value={announcementSpeed}
                      onValueChange={(value: "slow" | "normal" | "fast") => setAnnouncementSpeed(value)}
                    >
                      <SelectTrigger className="border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Yavaş (30 saniye)</SelectItem>
                        <SelectItem value="normal">Normal (20 saniye)</SelectItem>
                        <SelectItem value="fast">Hızlı (10 saniye)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Renk Seçimleri */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Arka Plan Rengi</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={announcementBgColor}
                          onChange={(e) => setAnnouncementBgColor(e.target.value)}
                          className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                        />
                        <Input
                          value={announcementBgColor}
                          onChange={(e) => setAnnouncementBgColor(e.target.value)}
                          className="flex-1 border-slate-200 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-medium">Yazı Rengi</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={announcementTextColor}
                          onChange={(e) => setAnnouncementTextColor(e.target.value)}
                          className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                        />
                        <Input
                          value={announcementTextColor}
                          onChange={(e) => setAnnouncementTextColor(e.target.value)}
                          className="flex-1 border-slate-200 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveAnnouncement}
                      disabled={announcementSaving || !announcementMessage.trim()}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25"
                    >
                      {announcementSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Duyuruyu Kaydet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Önizleme</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-600 border-blue-200">
                    Canlı Görünüm
                  </Badge>
                </div>
                <div className="relative overflow-hidden" style={{ backgroundColor: announcementBgColor }}>
                  {announcementMessage ? (
                    <div className="py-3 overflow-hidden">
                      <div className="announcement-marquee-track flex whitespace-nowrap">
                        {[0, 1, 2, 3].map((i) => (
                          <span 
                            key={i}
                            className="inline-flex items-center gap-2 px-4 flex-shrink-0 font-medium text-sm"
                            style={{ color: announcementTextColor }}
                          >
                            📢 {announcementMessage}
                            <span className="mx-6 opacity-50">•</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center">
                      <span className="text-sm opacity-70" style={{ color: announcementTextColor }}>
                        Mesaj girilmedi - önizleme için bir mesaj yazın
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Usage Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="p-5">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Kullanım İpuçları
                </h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Duyuru aktif edildiğinde tüm kullanıcılar ekranın üstünde kayan yazıyı görecek</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Acil duyurular için dikkat çekici renkler (kırmızı, turuncu) kullanın</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Mesajlar kısa ve öz olmalı - uzun mesajlar okunmayı zorlaştırır</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Mobil cihazlarda duyuru otomatik olarak küçük ekrana uyum sağlar</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="border-amber-200">
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
            </DialogTitle>
            <DialogDescription>
              Kullanıcı bilgilerini girin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ad Soyad</Label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Kullanıcı adı soyadı"
                className="border-slate-200 focus:border-amber-300"
              />
            </div>

            <div className="space-y-2">
              <Label>Kullanıcı Adı</Label>
              <Input
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="Giriş için kullanıcı adı"
                className="border-slate-200 focus:border-amber-300"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Şifre {editingUser && "(boş bırakılırsa değişmez)"}
              </Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder={editingUser ? "••••••••" : "Şifre girin"}
                className="border-slate-200 focus:border-amber-300"
              />
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: UserRole) =>
                  setUserForm({ ...userForm, role: value })
                }
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Kullanıcı
                    </div>
                  </SelectItem>
                  <SelectItem value="manager">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Müdür
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Süper Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departman</Label>
              <Select
                value={userForm.department_id}
                onValueChange={(value) =>
                  setUserForm({ ...userForm, department_id: value })
                }
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Departman seçin" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowUserModal(false)} disabled={saving}>
              İptal
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 min-w-[100px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Modal */}
      <Dialog open={showDepartmentModal} onOpenChange={setShowDepartmentModal}>
        <DialogContent className="border-cyan-200 mx-4 sm:mx-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cyan-600 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editingDepartment ? "Departman Düzenle" : "Yeni Departman"}
            </DialogTitle>
            <DialogDescription>
              Departman adını girin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Departman Adı</Label>
              <Input
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Departman adı"
                className="border-slate-200 focus:border-cyan-300 h-11"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !saving) {
                    handleSaveDepartment();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowDepartmentModal(false)} disabled={saving}>
              İptal
            </Button>
            <Button
              onClick={handleSaveDepartment}
              disabled={saving}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 min-w-[100px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => !saving && setDeleteDialog(null)}>
        <DialogContent className="border-red-200 mx-4 sm:mx-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Silme Onayı
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-slate-700">{deleteDialog?.name}</span>{" "}
              {deleteDialog?.type === "user" ? "kullanıcısını" : "departmanını"} silmek
              istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteDialog(null)} disabled={saving}>
              İptal
            </Button>
            <Button
              onClick={
                deleteDialog?.type === "user" ? confirmDeleteUser : confirmDeleteDepartment
              }
              disabled={saving}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 min-w-[80px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
