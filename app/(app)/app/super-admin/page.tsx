"use client";

import { useEffect, useState } from "react";
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
  Settings,
  Zap,
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
import type { Department } from "@/lib/types/box";
import { useToast } from "@/components/ui/use-toast";
import { ActivityTracker } from "@/lib/activity-tracker";

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
  const [activeTab, setActiveTab] = useState("users");

  const [users, setUsers] = useState<Omit<MockUser, "password">[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Omit<MockUser, "password"> | null>(null);
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

  const loadData = async () => {
    try {
      const mockAuth = auth as any;
      if (mockAuth.getAvailableUsers) {
        setUsers(mockAuth.getAvailableUsers());
      }
      
      const depts = await departmentRepository.getAll();
      setDepartments(depts);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
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

  const handleSaveUser = () => {
    try {
      const mockAuth = auth as any;
      const department = departments.find((d) => d.id === userForm.department_id);

      if (editingUser) {
        const updates: any = {
          username: userForm.username,
          name: userForm.name,
          role: userForm.role,
          department_id: userForm.department_id,
          department_name: department?.name || "",
        };
        if (userForm.password) {
          updates.password = userForm.password;
        }
        mockAuth.updateUser(editingUser.id, updates);
        toast({
          title: "Başarılı",
          description: "Kullanıcı güncellendi",
        });
      } else {
        if (!userForm.password) {
          toast({
            title: "Hata",
            description: "Şifre gerekli",
            variant: "destructive",
          });
          return;
        }
        mockAuth.createUser({
          ...userForm,
          department_name: department?.name || "",
        });
        toast({
          title: "Başarılı",
          description: "Kullanıcı oluşturuldu",
        });
      }

      setShowUserModal(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (user: Omit<MockUser, "password">) => {
    setDeleteDialog({
      type: "user",
      id: user.id,
      name: user.name,
    });
  };

  const confirmDeleteUser = () => {
    if (!deleteDialog) return;

    try {
      const mockAuth = auth as any;
      mockAuth.deleteUser(deleteDialog.id);
      toast({
        title: "Başarılı",
        description: "Kullanıcı silindi",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
    setDeleteDialog(null);
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
    try {
      if (editingDepartment) {
        await departmentRepository.update(editingDepartment.id, departmentName);
        toast({
          title: "Başarılı",
          description: "Departman güncellendi",
        });
      } else {
        await departmentRepository.create(departmentName);
        toast({
          title: "Başarılı",
          description: "Departman oluşturuldu",
        });
      }
      setShowDepartmentModal(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
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

    try {
      await departmentRepository.delete(deleteDialog.id);
      toast({
        title: "Başarılı",
        description: "Departman silindi",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    }
    setDeleteDialog(null);
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
          <motion.div className="relative mx-auto w-16 h-16">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-amber-200"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent"
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 opacity-20"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
          <p className="mt-4 text-slate-500 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-40"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              Süper Admin Paneli
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-amber-500" />
              </motion.span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kullanıcı ve departman yönetimi
            </p>
          </div>
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
            <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              Sistem
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

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Tüm Verileri Temizle
                  </h3>
                  <p className="text-sm text-red-600 mb-4">
                    Bu işlem tüm kolileri, paletleri, sevkiyatları ve aktivite geçmişini silecektir.
                    Bu işlem geri alınamaz! Mobil ve web arasında veri uyumsuzluğu yaşıyorsanız
                    bu butonu kullanarak tüm verileri sıfırlayabilirsiniz.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Tüm verileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
                          ActivityTracker.clearAllData();
                          toast({
                            title: "Veriler Temizlendi",
                            description: "Tüm koliler, paletler, sevkiyatlar ve aktiviteler silindi. Sayfayı yenileyin.",
                          });
                          setTimeout(() => {
                            window.location.reload();
                          }, 1500);
                        }
                      }}
                      className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Tüm Verileri Sil
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">
                    Veri Depolama Bilgisi
                  </h3>
                  <p className="text-sm text-amber-700">
                    Bu uygulama verileri tarayıcınızın yerel depolama alanında (localStorage) saklamaktadır.
                    Bu nedenle farklı tarayıcılar veya cihazlar arasında veriler senkronize olmaz.
                    Her tarayıcı/cihaz kendi verilerini tutar.
                  </p>
                </div>
              </div>
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

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUserModal(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSaveUser}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Modal */}
      <Dialog open={showDepartmentModal} onOpenChange={setShowDepartmentModal}>
        <DialogContent className="border-cyan-200">
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
                className="border-slate-200 focus:border-cyan-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDepartmentModal(false)}>
              İptal
            </Button>
            <Button
              onClick={handleSaveDepartment}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="border-red-200">
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

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)}>
              İptal
            </Button>
            <Button
              onClick={
                deleteDialog?.type === "user" ? confirmDeleteUser : confirmDeleteDepartment
              }
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
