"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Filter, Edit, Trash2, Eye, Sparkles, Boxes, ArrowRight, Shield, Search, X, ChevronLeft, ChevronRight, Truck, Layers, AlertTriangle, AlertOctagon } from "lucide-react";
import { usePerformance } from "@/hooks/use-performance";
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
import { Input } from "@/components/ui/input";
import { PhotoCarousel } from "@/components/ui/photo-carousel";

type FilterTab = "all" | "sealed" | "draft";
type AssignmentFilter = "all" | "in_pallet" | "not_in_pallet" | "in_shipment" | "not_in_shipment";

export default function BoxesPage() {
  const router = useRouter();
  const { shouldReduceMotion, animationDuration, staggerDelay } = usePerformance();
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState<BoxWithDepartment[]>([]);
  const [filteredBoxes, setFilteredBoxes] = useState<BoxWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [currentUserName, setCurrentUserName] = useState("");
  const [userDepartmentId, setUserDepartmentId] = useState("");
  const [userRole, setUserRole] = useState<string>("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");

  const [selectedBox, setSelectedBox] = useState<BoxWithDepartment | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Performans optimizasyonu için animasyon ayarları
  const motionConfig = useMemo(() => ({
    initial: shouldReduceMotion ? {} : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 },
    transition: { duration: animationDuration }
  }), [shouldReduceMotion, animationDuration]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [boxes, activeTab, selectedDepartment, currentUserName, userRole, searchQuery, assignmentFilter]);

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
        boxRepository.getAll(),
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

  // Türkçe karakter desteği ile case-insensitive arama
  const turkishToLower = (text: string): string => {
    const map: { [key: string]: string } = {
      'İ': 'i', 'I': 'ı', 'Ş': 'ş', 'Ğ': 'ğ', 'Ü': 'ü', 'Ö': 'ö', 'Ç': 'ç'
    };
    let result = text;
    for (const [upper, lower] of Object.entries(map)) {
      result = result.split(upper).join(lower);
    }
    return result.toLowerCase();
  };

  const applyFilters = () => {
    let filtered = [...boxes];
    
    // KULLANICI YETKİLENDİRMESİ: Normal kullanıcılar sadece kendi kolilerini görsün
    if (userRole === "user") {
      filtered = filtered.filter((b) => b.created_by === currentUserName);
    }
    
    // Arama filtresi - Türkçe karakter destekli
    if (searchQuery.trim()) {
      const query = turkishToLower(searchQuery.trim());
      filtered = filtered.filter((b) => 
        turkishToLower(b.name).includes(query) ||
        turkishToLower(b.code).includes(query) ||
        turkishToLower(b.department.name).includes(query) ||
        turkishToLower(b.created_by).includes(query)
      );
    }
    
    if (activeTab === "sealed") {
      filtered = filtered.filter((b) => b.status === "sealed");
    } else if (activeTab === "draft") {
      filtered = filtered.filter((b) => b.status === "draft");
    }
    
    // Departman filtresi sadece manager/super_admin için geçerli
    if (selectedDepartment !== "all" && (userRole === "manager" || userRole === "super_admin")) {
      filtered = filtered.filter((b) => b.department_id === selectedDepartment);
    }
    
    // Palet/Sevkiyat atama filtresi
    if (assignmentFilter === "in_pallet") {
      filtered = filtered.filter((b) => b.pallet_code);
    } else if (assignmentFilter === "not_in_pallet") {
      filtered = filtered.filter((b) => !b.pallet_code && !(b as any).is_direct_shipment);
    } else if (assignmentFilter === "in_shipment") {
      filtered = filtered.filter((b) => b.pallet_code || (b as any).shipment_code);
    } else if (assignmentFilter === "not_in_shipment") {
      filtered = filtered.filter((b) => !b.pallet_code && !(b as any).shipment_code);
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
      
      await boxRepository.delete(selectedBox.code);
      
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

  // Kullanıcı rolüne göre filtrelenmiş koli sayılarını hesapla
  const userFilteredBoxes = userRole === "user" 
    ? boxes.filter(b => b.created_by === currentUserName)
    : boxes;
    
  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "Tümü", count: userFilteredBoxes.length },
    { id: "sealed", label: "Kapalı", count: userFilteredBoxes.filter(b => b.status === "sealed").length },
    { id: "draft", label: "Taslak", count: userFilteredBoxes.filter(b => b.status === "draft").length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="relative mx-auto w-16 h-16">
            {/* Basit spinning border - CSS animation (GPU optimized) */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"
              style={{ animationDuration: "0.8s" }}
            />
            {/* Center icon - statik */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="mt-4 text-slate-600 font-medium animate-pulse">
            Koliler yükleniyor...
          </p>
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
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl blur-lg opacity-40"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </motion.div>
            
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                Kolilerim
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                </motion.span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                {userRole === "user" ? "Oluşturduğunuz kolileri yönetin" : "Tüm kolileri görüntüleyin ve yönetin"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Button - Full width on mobile */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => router.push("/app/boxes/new")} 
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 h-12 sm:h-10 text-base sm:text-sm active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
            Yeni Koli Oluştur
          </Button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3 sm:space-y-4"
      >
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Koli ara (ad, kod, departman)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-white/80 border-slate-200 focus:border-blue-400"
          />
        </div>

        {/* Filter Tabs - Horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white/80 text-slate-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-300"
              }`}
            >
              {tab.label}
              <motion.span 
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? "bg-white/25 text-white"
                    : "bg-blue-100 text-blue-600"
                }`}
                animate={{ scale: activeTab === tab.id ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                {tab.count}
              </motion.span>
            </motion.button>
          ))}
        </div>

        {/* Stats and Filters Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Department Filter - Only visible for managers and super_admin */}
          {userRole !== "user" ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="flex-1 sm:w-[200px] border-blue-200 bg-white/80 h-10">
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
            <motion.div 
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
              whileHover={{ scale: 1.02 }}
            >
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                {departments.find(d => d.id === userDepartmentId)?.name || "Departman"}
              </span>
            </motion.div>
          )}
          
          <motion.div 
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-200"
            animate={{ 
              boxShadow: filteredBoxes.length > 0 ? ["0 0 0 0 rgba(59,130,246,0)", "0 0 0 4px rgba(59,130,246,0.1)", "0 0 0 0 rgba(59,130,246,0)"] : "none"
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Boxes className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-semibold">
              {filteredBoxes.length} koli
            </span>
          </motion.div>
          
          {/* Palet/Sevkiyat Atama Filtresi */}
          <Select value={assignmentFilter} onValueChange={(v) => setAssignmentFilter(v as AssignmentFilter)}>
            <SelectTrigger className="w-[180px] border-slate-200 bg-white/80 h-10">
              <SelectValue placeholder="Atama Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Koliler</SelectItem>
              <SelectItem value="in_pallet">Palete Eklenmiş</SelectItem>
              <SelectItem value="not_in_pallet">Palete Eklenmemiş</SelectItem>
              <SelectItem value="in_shipment">Sevkiyata Eklenmiş</SelectItem>
              <SelectItem value="not_in_shipment">Sevkiyata Eklenmemiş</SelectItem>
            </SelectContent>
          </Select>
          
          {userRole !== "user" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200"
            >
              <Shield className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">Yönetici</span>
            </motion.div>
          )}
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
            filteredBoxes
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map((box, index) => (
              <motion.div
                key={box.id}
                layout={!shouldReduceMotion}
                initial={motionConfig.initial}
                animate={motionConfig.animate}
                exit={motionConfig.exit}
                transition={{ 
                  duration: animationDuration,
                  delay: shouldReduceMotion ? 0 : staggerDelay * Math.min(index, 6)
                }}
                whileHover={shouldReduceMotion ? {} : { y: -2 }}
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

                  <CardContent className="p-4 sm:p-5 space-y-3 relative">
                    <div className="flex items-start gap-3">
                      {/* Küçük resim - Hem web hem mobil için */}
                      {box.photo_url && (
                        <motion.div 
                          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-slate-200 flex-shrink-0 cursor-pointer hover:border-blue-400 active:border-blue-500 transition-colors shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenPhoto(box.photo_url);
                          }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <img 
                            src={box.photo_url} 
                            alt={box.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Büyütme ikonu overlay - Mobilde her zaman görünür */}
                          <div className="absolute inset-0 bg-black/20 sm:bg-black/0 sm:hover:bg-black/30 active:bg-black/40 transition-colors flex items-center justify-center">
                            <Eye className="h-4 w-4 text-white drop-shadow-lg" />
                          </div>
                        </motion.div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg truncate text-slate-800 group-hover:text-blue-600 transition-colors">
                              {box.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-400 font-mono truncate">
                              {box.code}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge className={`${getStatusColor(box.status)} text-xs`}>
                              {getStatusText(box.status)}
                            </Badge>
                            {(box as any).is_direct_shipment && (
                              <Badge className="bg-orange-500 text-white border-orange-600 text-xs animate-pulse">
                                <Truck className="h-3 w-3 mr-1" />
                                Direk Sevkiyat
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200 text-sm font-medium truncate">
                        {box.department.name}
                      </div>
                    </div>

                    {/* Kırılacak Eşya Uyarısı */}
                    {(box as any).is_fragile && (
                      <motion.div 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200"
                        animate={{ 
                          backgroundColor: ["rgba(254,226,226,1)", "rgba(254,202,202,1)", "rgba(254,226,226,1)"],
                          borderColor: ["rgba(252,165,165,1)", "rgba(248,113,113,1)", "rgba(252,165,165,1)"]
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <AlertOctagon className="h-4 w-4 text-red-600 animate-pulse" />
                        <span className="text-xs font-bold text-red-700">DİKKAT! KIRILACAK EŞYA</span>
                      </motion.div>
                    )}

                    {/* Palet/Sevkiyat Durumu */}
                    {box.pallet_code ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <Layers className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs text-emerald-700">
                          <span className="font-medium">{box.pallet_code}</span> paletinde
                        </span>
                      </div>
                    ) : (box as any).is_direct_shipment && (box as any).shipment_code ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200">
                        <Truck className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-purple-700">
                          <span className="font-medium">{(box as any).shipment_code}</span> sevkiyatında
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-amber-700 font-medium">
                          {(box as any).is_direct_shipment ? "Sevkiyata eklenmedi" : "Palete eklenmedi"}
                        </span>
                      </div>
                    )}
                    
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

      {/* Pagination */}
      {filteredBoxes.length > itemsPerPage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200"
        >
          <div className="text-sm text-slate-500">
            Sayfa {currentPage} / {Math.ceil(filteredBoxes.length / itemsPerPage)} ({filteredBoxes.length} koli)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-9 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Önceki
            </Button>
            
            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, Math.ceil(filteredBoxes.length / itemsPerPage)) }, (_, i) => {
                const totalPages = Math.ceil(filteredBoxes.length / itemsPerPage);
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
                    className={`w-9 h-9 ${currentPage === pageNum ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" : "border-blue-200 hover:bg-blue-50"}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(Math.ceil(filteredBoxes.length / itemsPerPage), currentPage + 1))}
              disabled={currentPage >= Math.ceil(filteredBoxes.length / itemsPerPage)}
              className="h-9 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
            >
              Sonraki
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

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
          
          {/* Fotoğraflar - Kaydırmalı Carousel */}
          {(selectedBox?.photo_url || selectedBox?.photo_url_2) && (
            <div className="py-2">
              <PhotoCarousel
                photos={[selectedBox?.photo_url, selectedBox?.photo_url_2]}
                onPhotoClick={(url) => setFullscreenPhoto(url)}
                size="md"
              />
            </div>
          )}
          
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

      {/* Fullscreen Photo Modal - Mobil ve Web için optimize edildi */}
      <Dialog open={!!fullscreenPhoto} onOpenChange={() => setFullscreenPhoto(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full p-0 bg-black/95 border-0 rounded-xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Fotoğraf</DialogTitle>
          </DialogHeader>
          {fullscreenPhoto && (
            <div className="relative flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
              {/* Kapatma butonu - Mobil için büyük ve görünür */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-50 h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
                onClick={() => setFullscreenPhoto(null)}
              >
                <X className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
              
              {/* Fotoğraf */}
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={fullscreenPhoto}
                alt="Koli fotoğrafı"
                className="max-w-full max-h-[85vh] sm:max-h-[80vh] object-contain p-2"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Mobilde kapatmak için tıklama alanı */}
              <div 
                className="absolute inset-0 -z-10"
                onClick={() => setFullscreenPhoto(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
