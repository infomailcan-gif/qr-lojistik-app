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
  Ban,
  ShieldOff,
  Settings,
  Link,
  Video,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  MessageSquare,
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
import { banSettingsRepository, type BanSettings } from "@/lib/repositories/ban-settings";
import type { Department } from "@/lib/types/box";
import { useToast } from "@/components/ui/use-toast";
import { Eye, Clock, FileText, ChevronLeft, ChevronRight } from "lucide-react";

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

  // Ban related state
  const [banSettings, setBanSettings] = useState<BanSettings | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banningUser, setBanningUser] = useState<Omit<UserWithBan, "password"> | null>(null);
  const [banReason, setBanReason] = useState("");
  const [showBanSettingsModal, setShowBanSettingsModal] = useState(false);
  const [banSettingsForm, setBanSettingsForm] = useState({
    is_active: true,
    ban_message: "",
    ban_subtitle: "",
    redirect_url: "",
    show_redirect_button: false,
    redirect_button_text: "",
    video_url: "",
  });

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
      const [usersData, deptsData, visitsData, banSettingsData] = await Promise.all([
        userRepository.getAll(),
        departmentRepository.getAll(),
        activityTracker.getAllRecentPageVisits(200),
        banSettingsRepository.get()
      ]);
      
      setUsers(usersData);
      setDepartments(deptsData);
      setPageVisits(visitsData);
      setBanSettings(banSettingsData);
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

  // Ban handlers
  const handleOpenBanModal = (user: Omit<UserWithBan, "password">) => {
    setBanningUser(user);
    setBanReason("");
    setShowBanModal(true);
  };

  const handleBanUser = async () => {
    if (!banningUser) return;

    setSaving(true);
    
    try {
      const session = await auth.getSession();
      await userRepository.banUser(banningUser.id, banReason, session?.user.name || "Sistem");
      toast({
        title: "Başarılı",
        description: `${banningUser.name} yasaklandı`,
      });
      setShowBanModal(false);
      setBanningUser(null);
      await loadData();
    } catch (error: any) {
      console.error("Ban user error:", error);
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı yasaklanamadı",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnbanUser = async (user: Omit<UserWithBan, "password">) => {
    setSaving(true);
    
    try {
      await userRepository.unbanUser(user.id);
      toast({
        title: "Başarılı",
        description: `${user.name} yasağı kaldırıldı`,
      });
      await loadData();
    } catch (error: any) {
      console.error("Unban user error:", error);
      toast({
        title: "Hata",
        description: error.message || "Yasak kaldırılamadı",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Ban settings handlers
  const handleOpenBanSettings = () => {
    if (banSettings) {
      setBanSettingsForm({
        is_active: banSettings.is_active,
        ban_message: banSettings.ban_message,
        ban_subtitle: banSettings.ban_subtitle,
        redirect_url: banSettings.redirect_url || "",
        show_redirect_button: banSettings.show_redirect_button,
        redirect_button_text: banSettings.redirect_button_text,
        video_url: banSettings.video_url,
      });
    }
    setShowBanSettingsModal(true);
  };

  const handleSaveBanSettings = async () => {
    setSaving(true);
    
    try {
      const session = await auth.getSession();
      await banSettingsRepository.update({
        is_active: banSettingsForm.is_active,
        ban_message: banSettingsForm.ban_message,
        ban_subtitle: banSettingsForm.ban_subtitle,
        redirect_url: banSettingsForm.redirect_url || null,
        show_redirect_button: banSettingsForm.show_redirect_button,
        redirect_button_text: banSettingsForm.redirect_button_text,
        video_url: banSettingsForm.video_url,
      }, session?.user.name);
      
      toast({
        title: "Başarılı",
        description: "Yasak sayfası ayarları güncellendi",
      });
      setShowBanSettingsModal(false);
      await loadData();
    } catch (error: any) {
      console.error("Save ban settings error:", error);
      toast({
        title: "Hata",
        description: error.message || "Ayarlar kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
            <TabsTrigger value="banned" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
              <Ban className="h-4 w-4" />
              Yasaklı Kullanıcılar
              <Badge variant="secondary" className="ml-1 bg-white/20">
                {users.filter(u => u.is_banned).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <Eye className="h-4 w-4" />
              Kullanıcı Aktiviteleri
              <Badge variant="secondary" className="ml-1 bg-white/20">
                {pageVisits.length}
              </Badge>
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
                              <h3 className={`font-semibold ${user.is_banned ? 'text-red-600 line-through' : 'text-slate-800'}`}>{user.name}</h3>
                              {getRoleBadge(user.role)}
                              {user.is_banned && (
                                <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg shadow-red-500/20">
                                  <Ban className="w-3 h-3 mr-1" />
                                  Yasaklı
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              @{user.username} • {user.department_name}
                              {user.is_banned && user.ban_reason && (
                                <span className="text-red-400 ml-2">• Sebep: {user.ban_reason}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.is_banned ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnbanUser(user)}
                              disabled={saving}
                              className="hover:bg-green-50 text-red-400 hover:text-green-600"
                              title="Yasağı Kaldır"
                            >
                              <ShieldOff className="h-4 w-4" />
                            </Button>
                          ) : user.role !== "super_admin" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenBanModal(user)}
                              className="hover:bg-red-50 text-slate-400 hover:text-red-500"
                              title="Yasakla"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : null}
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

        {/* Banned Users Tab */}
        <TabsContent value="banned" className="space-y-6">
          {/* Ban Settings Button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg">
                <Ban className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Yasaklı Kullanıcılar Yönetimi</h3>
                <p className="text-xs text-slate-500">
                  Yasak sayfası {banSettings?.is_active ? (
                    <span className="text-green-600 font-medium">aktif</span>
                  ) : (
                    <span className="text-red-600 font-medium">devre dışı</span>
                  )}
                </p>
              </div>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleOpenBanSettings}
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg shadow-red-500/25"
              >
                <Settings className="h-4 w-4 mr-2" />
                Sayfa Ayarları
              </Button>
            </motion.div>
          </div>

          {/* Preview Link */}
          {banSettings?.is_active && (
            <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ExternalLink className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-slate-800">Yasak Sayfası Önizleme</p>
                      <p className="text-sm text-slate-500">Yasaklı kullanıcıların göreceği sayfayı önizleyin</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/banned", "_blank")}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Önizle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Settings Display */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
            <CardContent className="p-5">
              <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-red-500" />
                Mevcut Yasak Mesajı
              </h4>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-lg font-semibold text-slate-800 mb-1">{banSettings?.ban_message || "Hesabınıza erişim yasaklanmıştır."}</p>
                <p className="text-sm text-slate-500">{banSettings?.ban_subtitle || "Sistem yöneticisi ile iletişime geçiniz."}</p>
              </div>
              {banSettings?.redirect_url && banSettings?.show_redirect_button && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <Link className="h-4 w-4" />
                  Yönlendirme: <span className="text-blue-600">{banSettings.redirect_url}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banned Users List */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Yasaklı Kullanıcılar ({users.filter(u => u.is_banned).length})</h4>
            
            {users.filter(u => u.is_banned).length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
                <CardContent className="p-8 text-center">
                  <ShieldOff className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">Henüz yasaklı kullanıcı yok</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                <AnimatePresence>
                  {users.filter(u => u.is_banned).map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200 hover:border-red-300 hover:shadow-lg transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-400 flex items-center justify-center text-lg font-bold text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-red-700">{user.name}</h3>
                                  {getRoleBadge(user.role)}
                                </div>
                                <p className="text-sm text-slate-500">
                                  @{user.username} • {user.department_name}
                                </p>
                                {user.ban_reason && (
                                  <p className="text-sm text-red-500 mt-1">
                                    <span className="font-medium">Sebep:</span> {user.ban_reason}
                                  </p>
                                )}
                                {user.banned_at && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    Yasaklanma: {new Date(user.banned_at).toLocaleString("tr-TR")}
                                    {user.banned_by && ` • ${user.banned_by} tarafından`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleUnbanUser(user)}
                              disabled={saving}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Yasağı Kaldır
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
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

      {/* Ban User Modal */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent className="border-red-200 mx-4 sm:mx-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Kullanıcı Yasakla
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-slate-700">{banningUser?.name}</span> kullanıcısını yasaklamak üzeresiniz.
              Bu kullanıcı sisteme giriş yapamayacak ve yasak sayfasına yönlendirilecektir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Yasaklama Sebebi (Opsiyonel)</Label>
              <Input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Yasaklama sebebini girin..."
                className="border-slate-200 focus:border-red-300"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowBanModal(false)} disabled={saving}>
              İptal
            </Button>
            <Button
              onClick={handleBanUser}
              disabled={saving}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 min-w-[100px]"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Yasakla
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Settings Modal */}
      <Dialog open={showBanSettingsModal} onOpenChange={setShowBanSettingsModal}>
        <DialogContent className="border-red-200 mx-4 sm:mx-auto max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Yasak Sayfası Ayarları
            </DialogTitle>
            <DialogDescription>
              Yasaklı kullanıcıların göreceği sayfanın ayarlarını yapılandırın
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                {banSettingsForm.is_active ? (
                  <ToggleRight className="h-6 w-6 text-green-500" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-slate-400" />
                )}
                <div>
                  <p className="font-medium text-slate-800">Yasak Sayfası</p>
                  <p className="text-xs text-slate-500">
                    {banSettingsForm.is_active ? "Aktif - Yasaklı kullanıcılar bu sayfaya yönlendirilir" : "Devre dışı - Yasaklı kullanıcılar normal login sayfasına döner"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBanSettingsForm(f => ({ ...f, is_active: !f.is_active }))}
                className={banSettingsForm.is_active ? "border-green-300 text-green-600" : "border-slate-300 text-slate-500"}
              >
                {banSettingsForm.is_active ? "Aktif" : "Devre Dışı"}
              </Button>
            </div>

            {/* Ban Message */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-red-500" />
                Ana Mesaj
              </Label>
              <Input
                value={banSettingsForm.ban_message}
                onChange={(e) => setBanSettingsForm(f => ({ ...f, ban_message: e.target.value }))}
                placeholder="Hesabınıza erişim yasaklanmıştır."
                className="border-slate-200 focus:border-red-300"
              />
            </div>

            {/* Ban Subtitle */}
            <div className="space-y-2">
              <Label>Alt Mesaj</Label>
              <Input
                value={banSettingsForm.ban_subtitle}
                onChange={(e) => setBanSettingsForm(f => ({ ...f, ban_subtitle: e.target.value }))}
                placeholder="Sistem yöneticisi ile iletişime geçiniz."
                className="border-slate-200 focus:border-red-300"
              />
            </div>

            {/* Video URL */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-500" />
                Arka Plan Video URL
              </Label>
              <Input
                value={banSettingsForm.video_url}
                onChange={(e) => setBanSettingsForm(f => ({ ...f, video_url: e.target.value }))}
                placeholder="https://..."
                className="border-slate-200 focus:border-purple-300"
              />
              <p className="text-xs text-slate-500">Cyberpunk/teknoloji temali video adresi (MP4 formati onerilir)</p>
            </div>

            {/* Redirect Button Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Link className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-slate-800">Yönlendirme Butonu</p>
                  <p className="text-xs text-slate-500">Sayfada yönlendirme butonu göster</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBanSettingsForm(f => ({ ...f, show_redirect_button: !f.show_redirect_button }))}
                className={banSettingsForm.show_redirect_button ? "border-blue-300 text-blue-600" : "border-slate-300 text-slate-500"}
              >
                {banSettingsForm.show_redirect_button ? "Göster" : "Gizle"}
              </Button>
            </div>

            {banSettingsForm.show_redirect_button && (
              <>
                {/* Redirect URL */}
                <div className="space-y-2">
                  <Label>Yonlendirme Adresi</Label>
                  <Input
                    value={banSettingsForm.redirect_url}
                    onChange={(e) => setBanSettingsForm(f => ({ ...f, redirect_url: e.target.value }))}
                    placeholder="https://example.com veya /login"
                    className="border-slate-200 focus:border-blue-300"
                  />
                </div>

                {/* Redirect Button Text */}
                <div className="space-y-2">
                  <Label>Buton Metni</Label>
                  <Input
                    value={banSettingsForm.redirect_button_text}
                    onChange={(e) => setBanSettingsForm(f => ({ ...f, redirect_button_text: e.target.value }))}
                    placeholder="Ana Sayfaya Git"
                    className="border-slate-200 focus:border-blue-300"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowBanSettingsModal(false)} disabled={saving}>
              İptal
            </Button>
            <Button
              onClick={handleSaveBanSettings}
              disabled={saving}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 min-w-[100px]"
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
    </div>
  );
}
