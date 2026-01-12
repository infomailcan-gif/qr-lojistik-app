"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Building2,
  BarChart3,
  Package,
  Layers,
  Truck,
  Box,
  TrendingUp,
  Calendar,
  Eye,
  ExternalLink,
  Download,
  FileText,
  QrCode,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableRow, TableCell } from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { boxRepository } from "@/lib/repositories/box";
import { palletRepository } from "@/lib/repositories/pallet";
import { shipmentRepository } from "@/lib/repositories/shipment";
import { departmentRepository } from "@/lib/repositories/department";
import type { BoxWithDepartment } from "@/lib/types/box";
import type { PalletWithBoxCount } from "@/lib/types/pallet";
import type { ShipmentWithCounts } from "@/lib/types/shipment";
import type { Department } from "@/lib/types/department";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import { FilterBar } from "@/components/admin/FilterBar";
import { EntityTable } from "@/components/admin/EntityTable";
import { ActivityTracker } from "@/lib/activity-tracker";
import { useToast } from "@/components/ui/use-toast";

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Raw data
  const [boxes, setBoxes] = useState<BoxWithDepartment[]>([]);
  const [pallets, setPallets] = useState<PalletWithBoxCount[]>([]);
  const [shipments, setShipments] = useState<ShipmentWithCounts[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filters
  const [boxSearch, setBoxSearch] = useState("");
  const [boxDepartment, setBoxDepartment] = useState("all");
  const [boxUser, setBoxUser] = useState("all");
  const [boxStatus, setBoxStatus] = useState("all");
  const [boxDateFrom, setBoxDateFrom] = useState("");
  const [boxDateTo, setBoxDateTo] = useState("");

  const [palletSearch, setPalletSearch] = useState("");
  const [palletUser, setPalletUser] = useState("all");
  const [palletDateFrom, setPalletDateFrom] = useState("");
  const [palletDateTo, setPalletDateTo] = useState("");

  const [shipmentSearch, setShipmentSearch] = useState("");
  const [shipmentUser, setShipmentUser] = useState("all");
  const [shipmentDateFrom, setShipmentDateFrom] = useState("");
  const [shipmentDateTo, setShipmentDateTo] = useState("");

  useEffect(() => {
    checkManagerAccess();
  }, []);

  // Her 10 saniyede bir verileri otomatik yenile
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [loading]);

  const checkManagerAccess = async () => {
    const session = await auth.getSession();
    if (!session || (session.user.role !== "manager" && session.user.role !== "super_admin")) {
      router.push("/app");
      return;
    }
    loadData();
  };

  const loadData = async () => {
    try {
      const [boxesData, palletsData, shipmentsData, departmentsData] =
        await Promise.all([
          boxRepository.getAll(),
          palletRepository.getAll(),
          shipmentRepository.getAll(),
          departmentRepository.getAll(),
        ]);

      setBoxes(boxesData);
      setPallets(palletsData);
      setShipments(shipmentsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Derived data for Overview
  const overviewStats = useMemo(() => {
    const totalBoxes = boxes.length;
    const sealedBoxes = boxes.filter((b) => b.status === "sealed").length;
    const draftBoxes = boxes.filter((b) => b.status === "draft").length;
    const totalPallets = pallets.length;
    const totalShipments = shipments.length;

    // Last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24h = boxes.filter(
      (b) => new Date(b.created_at) >= yesterday
    ).length;

    // Last 7 days
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7d = boxes.filter((b) => new Date(b.created_at) >= lastWeek).length;

    // Top 5 users
    const userCounts = new Map<string, number>();
    boxes.forEach((box) => {
      userCounts.set(box.created_by, (userCounts.get(box.created_by) || 0) + 1);
    });
    const topUsers = Array.from(userCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Department distribution
    const deptCounts = new Map<string, number>();
    boxes.forEach((box) => {
      const deptName = box.department.name;
      deptCounts.set(deptName, (deptCounts.get(deptName) || 0) + 1);
    });
    const deptDistribution = Array.from(deptCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    return {
      totalBoxes,
      sealedBoxes,
      draftBoxes,
      totalPallets,
      totalShipments,
      last24h,
      last7d,
      topUsers,
      deptDistribution,
    };
  }, [boxes, pallets, shipments]);

  // Department stats
  const departmentStats = useMemo(() => {
    return departments.map((dept) => {
      const deptBoxes = boxes.filter((b) => b.department.id === dept.id);
      const sealed = deptBoxes.filter((b) => b.status === "sealed").length;
      const draft = deptBoxes.filter((b) => b.status === "draft").length;
      const inPallets = deptBoxes.filter((b) => b.pallet_code).length;

      return {
        ...dept,
        totalBoxes: deptBoxes.length,
        sealed,
        draft,
        inPallets,
      };
    });
  }, [departments, boxes]);

  // User stats
  const userStats = useMemo(() => {
    const userMap = new Map<
      string,
      { boxes: number; sealed: number; lastActivity: Date }
    >();

    boxes.forEach((box) => {
      const current = userMap.get(box.created_by) || {
        boxes: 0,
        sealed: 0,
        lastActivity: new Date(0),
      };
      userMap.set(box.created_by, {
        boxes: current.boxes + 1,
        sealed: current.sealed + (box.status === "sealed" ? 1 : 0),
        lastActivity: new Date(
          Math.max(
            current.lastActivity.getTime(),
            new Date(box.updated_at || box.created_at).getTime()
          )
        ),
      });
    });

    pallets.forEach((pallet) => {
      const current = userMap.get(pallet.created_by) || {
        boxes: 0,
        sealed: 0,
        lastActivity: new Date(0),
      };
      userMap.set(pallet.created_by, {
        ...current,
        lastActivity: new Date(
          Math.max(
            current.lastActivity.getTime(),
            new Date(pallet.updated_at || pallet.created_at).getTime()
          )
        ),
      });
    });

    shipments.forEach((shipment) => {
      const current = userMap.get(shipment.created_by) || {
        boxes: 0,
        sealed: 0,
        lastActivity: new Date(0),
      };
      userMap.set(shipment.created_by, {
        ...current,
        lastActivity: new Date(
          Math.max(
            current.lastActivity.getTime(),
            new Date(shipment.updated_at || shipment.created_at).getTime()
          )
        ),
      });
    });

    return Array.from(userMap.entries())
      .map(([user, stats]) => ({ user, ...stats }))
      .sort((a, b) => b.boxes - a.boxes);
  }, [boxes, pallets, shipments]);

  // Filtered boxes
  const filteredBoxes = useMemo(() => {
    return boxes.filter((box) => {
      // Search
      if (boxSearch) {
        const search = boxSearch.toLowerCase();
        if (
          !box.code.toLowerCase().includes(search) &&
          !box.name.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Department
      if (boxDepartment !== "all" && box.department.id !== boxDepartment) {
        return false;
      }

      // User
      if (boxUser !== "all" && box.created_by !== boxUser) {
        return false;
      }

      // Status
      if (boxStatus !== "all" && box.status !== boxStatus) {
        return false;
      }

      // Date range
      const createdDate = new Date(box.created_at);
      if (boxDateFrom && createdDate < new Date(boxDateFrom)) {
        return false;
      }
      if (boxDateTo && createdDate > new Date(boxDateTo + "T23:59:59")) {
        return false;
      }

      return true;
    });
  }, [boxes, boxSearch, boxDepartment, boxUser, boxStatus, boxDateFrom, boxDateTo]);

  // Filtered pallets
  const filteredPallets = useMemo(() => {
    return pallets.filter((pallet) => {
      // Search
      if (palletSearch) {
        const search = palletSearch.toLowerCase();
        if (
          !pallet.code.toLowerCase().includes(search) &&
          !pallet.name.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // User
      if (palletUser !== "all" && pallet.created_by !== palletUser) {
        return false;
      }

      // Date range
      const createdDate = new Date(pallet.created_at);
      if (palletDateFrom && createdDate < new Date(palletDateFrom)) {
        return false;
      }
      if (
        palletDateTo &&
        createdDate > new Date(palletDateTo + "T23:59:59")
      ) {
        return false;
      }

      return true;
    });
  }, [pallets, palletSearch, palletUser, palletDateFrom, palletDateTo]);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      // Search
      if (shipmentSearch) {
        const search = shipmentSearch.toLowerCase();
        if (
          !shipment.code.toLowerCase().includes(search) &&
          !shipment.name_or_plate.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // User
      if (shipmentUser !== "all" && shipment.created_by !== shipmentUser) {
        return false;
      }

      // Date range
      const createdDate = new Date(shipment.created_at);
      if (shipmentDateFrom && createdDate < new Date(shipmentDateFrom)) {
        return false;
      }
      if (
        shipmentDateTo &&
        createdDate > new Date(shipmentDateTo + "T23:59:59")
      ) {
        return false;
      }

      return true;
    });
  }, [shipments, shipmentSearch, shipmentUser, shipmentDateFrom, shipmentDateTo]);

  // Unique users for filters
  const allUsers = useMemo(() => {
    const users = new Set<string>();
    boxes.forEach((b) => users.add(b.created_by));
    pallets.forEach((p) => users.add(p.created_by));
    shipments.forEach((s) => users.add(s.created_by));
    return Array.from(users).sort();
  }, [boxes, pallets, shipments]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <ShieldCheck className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent">
              Raporlar
            </h1>
            <p className="text-sm text-slate-500">
              Tüm sistem verileri ve detaylı raporlar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          <Button
            onClick={() => {
              if (confirm("TÜM VERİLERİ SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?\n\nBu işlem tüm kolileri, paletleri, sevkiyatları ve aktiviteleri siler.\nBu işlem geri alınamaz!")) {
                ActivityTracker.clearAllData();
                toast({
                  title: "Veriler Temizlendi",
                  description: "Tüm veriler silindi.",
                });
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }
            }}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Tümünü Sil
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tabs List */}
          <div className="overflow-x-auto">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200 p-1 inline-flex min-w-full lg:min-w-0 shadow-sm">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Genel Bakış</span>
                <span className="sm:hidden">Özet</span>
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Departmanlar</span>
                <span className="sm:hidden">Dept.</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Kullanıcılar
              </TabsTrigger>
              <TabsTrigger value="boxes" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Koliler
              </TabsTrigger>
              <TabsTrigger value="pallets" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Paletler
              </TabsTrigger>
              <TabsTrigger value="shipments" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Sevkiyatlar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminKpiCard
                title="Toplam Koliler"
                value={overviewStats.totalBoxes}
                icon={Package}
                subtitle={`${overviewStats.sealedBoxes} kapalı, ${overviewStats.draftBoxes} taslak`}
                color="blue"
                index={0}
              />
              <AdminKpiCard
                title="Toplam Paletler"
                value={overviewStats.totalPallets}
                icon={Layers}
                color="cyan"
                index={1}
              />
              <AdminKpiCard
                title="Toplam Sevkiyatlar"
                value={overviewStats.totalShipments}
                icon={Truck}
                color="purple"
                index={2}
              />
              <AdminKpiCard
                title="Son 24 Saat"
                value={overviewStats.last24h}
                icon={TrendingUp}
                subtitle={`Son 7 gün: ${overviewStats.last7d}`}
                color="green"
                index={3}
              />
            </div>

            {/* Top Users */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Users className="h-5 w-5 text-blue-600" />
                  En Aktif Kullanıcılar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overviewStats.topUsers.map(([user, count], index) => (
                    <motion.div
                      key={user}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <span className="text-slate-800 font-medium">{user}</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-0">{count} koli</Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Distribution */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Building2 className="h-5 w-5 text-cyan-600" />
                  Departmanlara Göre Dağılım
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overviewStats.deptDistribution.map(([dept, count], index) => (
                    <motion.div
                      key={dept}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-cyan-300 transition-colors"
                    >
                      <span className="text-slate-800 font-medium">{dept}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{
                              width: `${(count / overviewStats.totalBoxes) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-slate-800 font-semibold w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentStats.map((dept, index) => (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:border-cyan-300 transition-all shadow-sm hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-800 mb-1">
                            {dept.name}
                          </h3>
                          <p className="text-3xl font-bold text-slate-800">
                            {dept.totalBoxes}
                          </p>
                          <p className="text-sm text-slate-500">toplam koli</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200">
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Kapalı</p>
                          <p className="text-lg font-semibold text-emerald-600">
                            {dept.sealed}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Taslak</p>
                          <p className="text-lg font-semibold text-amber-600">
                            {dept.draft}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-1">Palette</p>
                          <p className="text-lg font-semibold text-purple-600">
                            {dept.inPallets}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <EntityTable headers={["Kullanıcı", "Koliler", "Kapalı", "Son Aktivite"]}>
              {userStats.map((user, index) => (
                <TableRow
                  key={user.user}
                  className="border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      <span className="text-slate-800 font-medium">{user.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-800 font-semibold">{user.boxes}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">
                      {user.sealed}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 text-sm">
                      {formatDateShort(user.lastActivity)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </EntityTable>
          </TabsContent>

          {/* Boxes Tab - Will continue in next part */}
          <TabsContent value="boxes" className="space-y-6">
            {/* Filter Bar */}
            <FilterBar
              searchValue={boxSearch}
              onSearchChange={setBoxSearch}
              departmentValue={boxDepartment}
              onDepartmentChange={setBoxDepartment}
              departments={departments}
              userValue={boxUser}
              onUserChange={setBoxUser}
              users={allUsers}
              statusValue={boxStatus}
              onStatusChange={setBoxStatus}
              dateFromValue={boxDateFrom}
              onDateFromChange={setBoxDateFrom}
              dateToValue={boxDateTo}
              onDateToChange={setBoxDateTo}
              onReset={() => {
                setBoxSearch("");
                setBoxDepartment("all");
                setBoxUser("all");
                setBoxStatus("all");
                setBoxDateFrom("");
                setBoxDateTo("");
              }}
            />

            {/* Results Count */}
            <div className="text-sm text-slate-500">
              {filteredBoxes.length} koli bulundu
            </div>

            {/* Boxes Table */}
            <EntityTable
              headers={[
                "Koli",
                "Departman",
                "Durum",
                "Oluşturan",
                "Tarih",
                "Aksiyonlar",
              ]}
            >
              {filteredBoxes.map((box) => (
                <TableRow
                  key={box.id}
                  className="border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <TableCell>
                    <div>
                      <p className="text-slate-800 font-medium">{box.name}</p>
                      <p className="text-sm text-slate-500 font-mono">{box.code}</p>
                      {box.needs_reprint && (
                        <Badge
                          className="mt-1 text-xs bg-amber-100 text-amber-700 border-0"
                        >
                          Yeniden Yazdır
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-800">{box.department.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        box.status === "sealed"
                          ? "bg-emerald-100 text-emerald-700 border-0"
                          : "bg-amber-100 text-amber-700 border-0"
                      }
                    >
                      {box.status === "sealed" ? "Kapalı" : "Taslak"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 text-sm">{box.created_by}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 text-sm">
                      {formatDate(box.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/app/boxes/${box.code}`)}
                        className="hover:bg-blue-50 text-blue-600"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Görüntüle
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/q/box/${box.code}`, "_blank")}
                        className="hover:bg-slate-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </EntityTable>
          </TabsContent>

          {/* Pallets Tab */}
          <TabsContent value="pallets" className="space-y-6">
            {/* Filter Bar */}
            <FilterBar
              searchValue={palletSearch}
              onSearchChange={setPalletSearch}
              userValue={palletUser}
              onUserChange={setPalletUser}
              users={allUsers}
              dateFromValue={palletDateFrom}
              onDateFromChange={setPalletDateFrom}
              dateToValue={palletDateTo}
              onDateToChange={setPalletDateTo}
              onReset={() => {
                setPalletSearch("");
                setPalletUser("all");
                setPalletDateFrom("");
                setPalletDateTo("");
              }}
            />

            {/* Results Count */}
            <div className="text-sm text-slate-500">
              {filteredPallets.length} palet bulundu
            </div>

            {/* Pallets Table */}
            <EntityTable
              headers={["Palet", "Oluşturan", "Tarih", "Koli Sayısı", "Aksiyonlar"]}
            >
              {filteredPallets.map((pallet) => (
                <TableRow
                  key={pallet.id}
                  className="border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <TableCell>
                    <div>
                      <p className="text-slate-800 font-medium">{pallet.name}</p>
                      <p className="text-sm text-slate-500 font-mono">
                        {pallet.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 text-sm">
                      {pallet.created_by}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 text-sm">
                      {formatDate(pallet.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-cyan-100 text-cyan-700 border-0">{pallet.box_count} koli</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/app/pallets/${pallet.code}`)}
                        className="hover:bg-cyan-50 text-cyan-600"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Görüntüle
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          window.open(`/q/pallet/${pallet.code}`, "_blank")
                        }
                        className="hover:bg-slate-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </EntityTable>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-6">
            {/* Filter Bar */}
            <FilterBar
              searchValue={shipmentSearch}
              onSearchChange={setShipmentSearch}
              userValue={shipmentUser}
              onUserChange={setShipmentUser}
              users={allUsers}
              dateFromValue={shipmentDateFrom}
              onDateFromChange={setShipmentDateFrom}
              dateToValue={shipmentDateTo}
              onDateToChange={setShipmentDateTo}
              onReset={() => {
                setShipmentSearch("");
                setShipmentUser("all");
                setShipmentDateFrom("");
                setShipmentDateTo("");
              }}
            />

            {/* Results Count */}
            <div className="text-sm text-slate-500">
              {filteredShipments.length} sevkiyat bulundu
            </div>

            {/* Shipments Table */}
            <EntityTable
              headers={[
                "Sevkiyat",
                "Oluşturan",
                "Tarih",
                "Paletler",
                "Koliler",
                "Aksiyonlar",
              ]}
            >
              {filteredShipments.map((shipment) => (
                <TableRow
                  key={shipment.id}
                  className="border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <TableCell>
                    <div>
                      <p className="text-slate-800 font-medium">
                        {shipment.name_or_plate}
                      </p>
                      <p className="text-sm text-slate-500 font-mono">
                        {shipment.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 text-sm">
                      {shipment.created_by}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 text-sm">
                      {formatDate(shipment.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-purple-100 text-purple-700 border-0">
                      {shipment.pallet_count} palet
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-700 border-0">
                      {shipment.box_count} koli
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/app/shipments/${shipment.code}`)
                        }
                        className="hover:bg-purple-50 text-purple-600"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Görüntüle
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          window.open(`/q/shipment/${shipment.code}`, "_blank")
                        }
                        className="hover:bg-slate-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </EntityTable>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
