"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Filter, Edit, Trash2, Eye, Sparkles, Boxes, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { boxRepository } from "@/lib/repositories/box";
import { departmentRepository } from "@/lib/repositories/department";
import { auth } from "@/lib/auth";
import type { BoxWithDepartment, Department } from "@/lib/types/box";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterTab = "all" | "sealed" | "draft";

export default function BoxesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState<BoxWithDepartment[]>([]);
  const [filteredBoxes, setFilteredBoxes] = useState<BoxWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [currentUserName, setCurrentUserName] = useState("");
  const [userDepartmentId, setUserDepartmentId] = useState("");
  const [userRole, setUserRole] = useState<string>("user");

  const [selectedBox, setSelectedBox] = useState<BoxWithDepartment | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [boxes, activeTab, selectedDepartment, currentUserName]);

  const loadData = async () => {
    try {
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      
      setCurrentUserName(session.user.name);
      setUserDepartmentId(session.user.department_id);
      setUserRole(session.user.role);
      
      const [allBoxes, deps] = await Promise.all([
        boxRepository.getAll({ createdBy: session.user.name }),
        departmentRepository.getAll(),
      ]);
      
      setBoxes(allBoxes);
      setDepartments(deps);
      
      // Normal kullanıcı için departman filtresini kendi departmanına sabitler
      if (session.user.role === "user") {
        setSelectedDepartment(session.user.department_id);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...boxes];
    
    if (activeTab === "sealed") {
      filtered = filtered.filter((b) => b.status === "sealed");
    } else if (activeTab === "draft") {
      filtered = filtered.filter((b) => b.status === "draft");
    }
    
    if (selectedDepartment !== "all") {
      filtered = filtered.filter((b) => b.department_id === selectedDepartment);
    }
    
    setFilteredBoxes(filtered);
  };

  const handleBoxClick = (box: BoxWithDepartment) => {
    setSelectedBox(box);
    setActionModalOpen(true);
  };

  const handleView = () => {
    if (selectedBox) {
      router.push(`/app/boxes/${selectedBox.code}`);
    }
    setActionModalOpen(false);
  };

  const handleEdit = () => {
    if (selectedBox) {
      router.push(`/app/boxes/${selectedBox.code}/edit`);
    }
    setActionModalOpen(false);
  };

  const handleDeleteClick = () => {
    setActionModalOpen(false);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBox) return;
    
    setIsDeleting(true);
    try {
      if (selectedBox.pallet_code) {
        toast({
          title: "Silinemez",
          description: `Bu koli ${selectedBox.pallet_code} paletine bağlı. Önce paletten çıkarın.`,
          variant: "destructive",
        });
        setIsDeleting(false);
        setDeleteModalOpen(false);
        return;
      }
      
      await boxRepository.delete(selectedBox.id);
      
      toast({
        title: "Koli Silindi",
        description: `${selectedBox.code} başarıyla silindi`,
      });
      
      await loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Koli silinemedi",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setSelectedBox(null);
    }
  };

  const getStatusColor = (status: "draft" | "sealed") => {
    return status === "sealed" 
      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
      : "bg-amber-100 text-amber-700 border-amber-200";
  };

  const getStatusText = (status: "draft" | "sealed") => {
    return status === "sealed" ? "Kapalı" : "Taslak";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "Tümü", count: boxes.length },
    { id: "sealed", label: "Kapalı", count: boxes.filter(b => b.status === "sealed").length },
    { id: "draft", label: "Taslak", count: boxes.filter(b => b.status === "draft").length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <motion.div className="relative mx-auto w-16 h-16">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-blue-200"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent"
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-20"
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
              className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-40"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl">
              <Package className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              Kolilerim
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-amber-500" />
              </motion.span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Oluşturduğunuz tüm kolileri yönetin
            </p>
          </div>
        </div>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => router.push("/app/boxes/new")} 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Koli
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Department Filter - Only visible for managers and super_admin */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {userRole !== "user" ? (
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[200px] border-slate-200">
                  <SelectValue placeholder="Departman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Departmanlar</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 rounded-lg border border-cyan-200">
              <Filter className="h-4 w-4 text-cyan-600" />
              <span className="text-sm text-cyan-700 font-medium">
                {departments.find(d => d.id === userDepartmentId)?.name || "Departman"}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <Boxes className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">
              {filteredBoxes.length} koli bulundu
            </span>
          </div>
        </div>
      </motion.div>

      {/* Box List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredBoxes.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full"
            >
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200 mb-6"
                  >
                    <Package className="h-16 w-16 text-blue-500" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Koli bulunamadı</h3>
                  <p className="text-slate-500 text-center max-w-sm mb-6">
                    Seçili filtreye göre koli bulunamadı. Yeni koli oluşturmak için butona tıklayın.
                  </p>
                  <Button 
                    onClick={() => router.push("/app/boxes/new")}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Koli Oluştur
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredBoxes.map((box, index) => (
              <motion.div
                key={box.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.05 * (index % 6) }}
                whileHover={{ y: -4 }}
              >
                <Card
                  className="relative overflow-hidden border-slate-200 bg-white/80 backdrop-blur-sm hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer group"
                  onClick={() => handleBoxClick(box)}
                >
                  {/* Top Gradient Line */}
                  <div className={`h-1 bg-gradient-to-r ${box.status === "sealed" ? "from-emerald-400 to-teal-500" : "from-amber-400 to-orange-500"}`} />
                  
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  />

                  <CardContent className="p-5 space-y-3 relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate text-slate-800 group-hover:text-blue-600 transition-colors">
                          {box.name}
                        </h3>
                        <p className="text-sm text-slate-400 font-mono truncate">
                          {box.code}
                        </p>
                      </div>
                      <Badge className={getStatusColor(box.status)}>
                        {getStatusText(box.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200 text-sm font-medium truncate">
                        {box.department.name}
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Oluşturan</p>
                        <p className="text-sm font-medium text-slate-600">{box.created_by}</p>
                      </div>
                      <motion.div
                        className="text-slate-400 group-hover:text-blue-500 transition-colors"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Package className="h-5 w-5" />
              {selectedBox?.name}
            </DialogTitle>
            <DialogDescription>
              Kod: {selectedBox?.code} • {selectedBox?.department.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleView}
              variant="outline"
              className="h-14 justify-start gap-3 hover:bg-blue-50 hover:border-blue-300 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Eye className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-700 group-hover:text-blue-600">Görüntüle</p>
                <p className="text-xs text-slate-400">Koli detaylarını görüntüle</p>
              </div>
            </Button>
            
            <Button
              onClick={handleEdit}
              variant="outline"
              className="h-14 justify-start gap-3 hover:bg-amber-50 hover:border-amber-300 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                <Edit className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-700 group-hover:text-amber-600">Düzenle</p>
                <p className="text-xs text-slate-400">Koli bilgilerini düzenle</p>
              </div>
            </Button>
            
            <Button
              onClick={handleDeleteClick}
              variant="outline"
              className="h-14 justify-start gap-3 hover:bg-red-50 hover:border-red-300 group"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 text-white">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-700 group-hover:text-red-600">Sil</p>
                <p className="text-xs text-slate-400">Koliyi kalıcı olarak sil</p>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionModalOpen(false)}>
              İptal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Koliyi Sil
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-slate-700">{selectedBox?.name}</span> ({selectedBox?.code}) kolisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-rose-500"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
