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
  Truck,
  Download,
  FileText,
  X,
} from "lucide-react";
import { jsPDF } from "jspdf";
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
import { palletRepository } from "@/lib/repositories/pallet";
import { shipmentRepository } from "@/lib/repositories/shipment";
import { activityTracker, activityLabels, type Activity as ActivityType } from "@/lib/activity-tracker";
import type { BoxWithDepartment, BoxWithDetails } from "@/lib/types/box";
import type { Department } from "@/lib/types/box";
import type { PalletWithBoxCount } from "@/lib/types/pallet";
import type { ShipmentWithCounts } from "@/lib/types/shipment";

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
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  
  // Personel detay modal
  const [personnelModalOpen, setPersonnelModalOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string | null>(null);
  const [personnelViewType, setPersonnelViewType] = useState<"boxes" | "pallets" | "shipments" | null>(null);
  
  // Departman detay modal
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [selectedDepartmentModal, setSelectedDepartmentModal] = useState<Department | null>(null);
  const [departmentViewType, setDepartmentViewType] = useState<"boxes" | "pallets" | "shipments" | null>(null);
  
  // Extra data for personnel modal
  const [pallets, setPallets] = useState<PalletWithBoxCount[]>([]);
  const [shipments, setShipments] = useState<ShipmentWithCounts[]>([]);
  
  // KPI Modal states
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalType, setKpiModalType] = useState<"total" | "sealed" | "draft" | "last24h" | "pallets" | "shipments" | null>(null);
  
  // PDF loading states
  const [pdfLoading, setPdfLoading] = useState<"boxes" | "pallets" | "shipments" | null>(null);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [pdfProgressTotal, setPdfProgressTotal] = useState<number>(0);
  
  // PDF Department Selection Modal
  const [pdfDeptModalOpen, setPdfDeptModalOpen] = useState(false);
  const [pdfType, setPdfType] = useState<"boxes" | "pallets" | "shipments" | null>(null);

  // Load activities - async version for Supabase
  const loadActivities = useCallback(async () => {
    try {
      const recentActivities = await activityTracker.getRecent(15);
      setActivities(recentActivities);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading activities:", error);
    }
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

  // Supabase Realtime subscription for live activities
  useEffect(() => {
    const unsubscribe = activityTracker.subscribeToActivities((newActivity) => {
      setActivities((prev) => {
        const updated = [newActivity, ...prev.filter(a => a.id !== newActivity.id)];
        return updated.slice(0, 15);
      });
      setLastUpdate(new Date());
    });

    // Local event listener as fallback
    const handleNewActivity = () => {
      loadActivities();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("activity-logged", handleNewActivity);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("activity-logged", handleNewActivity);
      }
    };
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
    await loadActivities();
    setLoading(false);
  };

  const loadData = async () => {
    try {
      const [boxesData, depsData, palletsData, shipmentsData] = await Promise.all([
        boxRepository.getAll(),
        departmentRepository.getAll(),
        palletRepository.getAll(),
        shipmentRepository.getAll(),
      ]);

      setBoxes(boxesData);
      setDepartments(depsData);
      setPallets(palletsData);
      setShipments(shipmentsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadActivities();
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
    // Departman filtresi uygulanmış koliler
    const filteredBoxes = selectedDepartmentId 
      ? boxes.filter((b) => b.department.id === selectedDepartmentId)
      : boxes;

    const totalBoxes = filteredBoxes.length;
    const sealedBoxes = filteredBoxes.filter((b) => b.status === "sealed").length;
    const draftBoxes = filteredBoxes.filter((b) => b.status === "draft").length;

    // Last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24h = filteredBoxes.filter((b) => new Date(b.created_at) >= yesterday).length;

    // Department stats (her zaman tüm departmanları göster)
    const deptStats = departments.map((dept) => {
      const deptBoxes = boxes.filter((b) => b.department.id === dept.id);
      return {
        ...dept,
        totalBoxes: deptBoxes.length,
        sealed: deptBoxes.filter((b) => b.status === "sealed").length,
        draft: deptBoxes.filter((b) => b.status === "draft").length,
      };
    }).sort((a, b) => b.totalBoxes - a.totalBoxes);

    // Top users (filtrelenmiş kolilerden)
    const userCounts = new Map<string, { count: number; department: string }>();
    filteredBoxes.forEach((box) => {
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
      selectedDepartmentName: selectedDepartmentId 
        ? departments.find(d => d.id === selectedDepartmentId)?.name 
        : null,
    };
  }, [boxes, departments, selectedDepartmentId]);

  // Personel tıklama handler
  const handlePersonnelClick = (personnelName: string) => {
    setSelectedPersonnel(personnelName);
    setPersonnelViewType(null);
    setPersonnelModalOpen(true);
  };

  // Personelin verileri
  const getPersonnelData = () => {
    if (!selectedPersonnel) return { boxes: [], pallets: [], shipments: [] };
    return {
      boxes: boxes.filter(b => b.created_by === selectedPersonnel),
      pallets: pallets.filter(p => p.created_by === selectedPersonnel),
      shipments: shipments.filter(s => s.created_by === selectedPersonnel),
    };
  };

  // Departman tıklama handler - modal ile seçenek sunma
  const handleDepartmentModalClick = (dept: Department) => {
    setSelectedDepartmentModal(dept);
    setDepartmentViewType(null);
    setDepartmentModalOpen(true);
  };

  // Departmanın verileri
  const getDepartmentData = () => {
    if (!selectedDepartmentModal) return { boxes: [], pallets: [], shipments: [] };
    
    // Departmana ait koliler
    const deptBoxes = boxes.filter(b => b.department.id === selectedDepartmentModal.id);
    
    // Bu kolileri içeren paletler (pallet_code üzerinden)
    const deptPalletCodes = new Set(deptBoxes.map(b => b.pallet_code).filter(Boolean));
    const deptPallets = pallets.filter(p => deptPalletCodes.has(p.code));
    
    // Bu kolileri içeren sevkiyatlar (shipment_code üzerinden)
    const deptShipmentCodes = new Set(deptPallets.map(p => p.shipment_code).filter(Boolean));
    const deptShipments = shipments.filter(s => deptShipmentCodes.has(s.code));
    
    return {
      boxes: deptBoxes,
      pallets: deptPallets,
      shipments: deptShipments,
    };
  };

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

  // Turkish character replacement for PDF
  const turkishToAscii = (text: string): string => {
    const map: { [key: string]: string } = {
      'ş': 's', 'Ş': 'S',
      'ğ': 'g', 'Ğ': 'G',
      'ü': 'u', 'Ü': 'U',
      'ö': 'o', 'Ö': 'O',
      'ç': 'c', 'Ç': 'C',
      'ı': 'i', 'İ': 'I',
    };
    return text.replace(/[şŞğĞüÜöÖçÇıİ]/g, (char) => map[char] || char);
  };

  // KPI Modal handler
  const handleKpiClick = (type: "total" | "sealed" | "draft" | "last24h" | "pallets" | "shipments") => {
    setKpiModalType(type);
    setKpiModalOpen(true);
  };

  // Get KPI modal data
  const getKpiModalData = () => {
    if (!kpiModalType) return { title: "", items: [] as any[] };
    
    const filteredBoxes = selectedDepartmentId 
      ? boxes.filter((b) => b.department.id === selectedDepartmentId)
      : boxes;
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    switch (kpiModalType) {
      case "total":
        return { 
          title: "Tüm Koliler", 
          items: filteredBoxes,
          type: "boxes" as const
        };
      case "sealed":
        return { 
          title: "Kapalı Koliler", 
          items: filteredBoxes.filter(b => b.status === "sealed"),
          type: "boxes" as const
        };
      case "draft":
        return { 
          title: "Açık Koliler", 
          items: filteredBoxes.filter(b => b.status === "draft"),
          type: "boxes" as const
        };
      case "last24h":
        return { 
          title: "Son 24 Saat", 
          items: filteredBoxes.filter(b => new Date(b.created_at) >= yesterday),
          type: "boxes" as const
        };
      case "pallets":
        return { 
          title: "Tüm Paletler", 
          items: pallets,
          type: "pallets" as const
        };
      case "shipments":
        return { 
          title: "Tüm Sevkiyatlar", 
          items: shipments,
          type: "shipments" as const
        };
      default:
        return { title: "", items: [], type: "boxes" as const };
    }
  };

  // Helper function to load image as base64
  const loadImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Open PDF department selection modal
  const openPdfDeptModal = (type: "boxes" | "pallets" | "shipments") => {
    setPdfType(type);
    setPdfDeptModalOpen(true);
  };

  // Get filtered data for PDF based on department
  const getFilteredBoxesForPdf = (deptId: string | null) => {
    if (!deptId) return boxes;
    return boxes.filter(b => b.department.id === deptId);
  };

  const getFilteredPalletsForPdf = (deptId: string | null) => {
    if (!deptId) return pallets;
    // Paletin içindeki kolilerin departmanına göre filtrele
    const deptBoxCodes = boxes.filter(b => b.department.id === deptId).map(b => b.pallet_code).filter(Boolean);
    return pallets.filter(p => deptBoxCodes.includes(p.code) || boxes.some(b => b.pallet_code === p.code && b.department.id === deptId));
  };

  const getFilteredShipmentsForPdf = (deptId: string | null) => {
    if (!deptId) return shipments;
    // Sevkiyatın içindeki paletlerin içindeki kolilerin departmanına göre filtrele
    const deptBoxes = boxes.filter(b => b.department.id === deptId);
    const deptPalletCodes = new Set(deptBoxes.map(b => b.pallet_code).filter(Boolean));
    const deptShipmentCodes = new Set(
      pallets.filter(p => deptPalletCodes.has(p.code)).map(p => p.shipment_code).filter(Boolean)
    );
    return shipments.filter(s => deptShipmentCodes.has(s.code));
  };

  // PDF Generation Functions with Turkish support and images
  const generateBoxesPDF = async (deptId: string | null = null) => {
    setPdfLoading("boxes");
    setPdfDeptModalOpen(false);
    setPdfProgress(0);
    try {
      const filteredBoxes = getFilteredBoxesForPdf(deptId);
      const deptName = deptId ? departments.find(d => d.id === deptId)?.name : "Tum Departmanlar";
      setPdfProgressTotal(filteredBoxes.length);
      
      // Her koli için detaylı bilgi çek (cins ve adet için)
      const boxesWithDetails: any[] = [];
      for (let i = 0; i < filteredBoxes.length; i++) {
        const box = filteredBoxes[i];
        try {
          const detail = await boxRepository.getByCode(box.code);
          boxesWithDetails.push({ ...box, lines: detail?.lines || [] });
        } catch {
          boxesWithDetails.push({ ...box, lines: [] });
        }
        setPdfProgress(i + 1);
      }
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const rowHeight = 24; // Cins/adet için artırıldı
      const imageSize = 14;
      let yPosition = margin;
      
      // Compact Header - only on first page
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(turkishToAscii(`KOLILER - ${deptName}`), margin, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date().toLocaleDateString("tr-TR")} | ${filteredBoxes.length} Koli | ${filteredBoxes.filter(b => b.status === "sealed").length} Kapali | ${filteredBoxes.filter(b => b.status === "draft").length} Acik`, pageWidth - margin, 12, { align: "right" });
      yPosition = 25;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("FOTO", margin + 2, yPosition + 5.5);
      doc.text("KOD", margin + 18, yPosition + 5.5);
      doc.text("AD / ICERIK", margin + 50, yPosition + 5.5);
      doc.text("DEPARTMAN", margin + 115, yPosition + 5.5);
      doc.text("DURUM", margin + 155, yPosition + 5.5);
      doc.text("OLUSTURAN", margin + 175, yPosition + 5.5);
      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      // Table rows with images
      for (let i = 0; i < boxesWithDetails.length; i++) {
        const box = boxesWithDetails[i];
        
        // Calculate dynamic row height based on content lines
        const contentLines = box.lines.length;
        const dynamicRowHeight = Math.max(rowHeight, 14 + (contentLines > 0 ? Math.min(contentLines, 3) * 4 : 0));
        
        if (yPosition > pageHeight - dynamicRowHeight - 10) {
          // Compact footer
          doc.setFontSize(6);
          doc.setTextColor(150, 150, 150);
          doc.text(`Sayfa ${doc.internal.pages.length - 1}`, pageWidth - margin, pageHeight - 5, { align: "right" });
          
          doc.addPage();
          yPosition = 8;
          
          // Mini header on subsequent pages
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, "F");
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(6);
          doc.text("FOTO | KOD | AD / ICERIK | DEPARTMAN | DURUM | OLUSTURAN", margin + 2, yPosition + 4);
          yPosition += 8;
        }

        // Alternating row colors
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, dynamicRowHeight, "F");
        }

        // Draw image placeholder or actual image
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin + 2, yPosition, imageSize, imageSize);
        
        if (box.photo_url) {
          try {
            const imgData = await loadImageAsBase64(box.photo_url);
            if (imgData) {
              doc.addImage(imgData, "JPEG", margin + 2, yPosition, imageSize, imageSize);
            } else {
              doc.setFontSize(5);
              doc.setTextColor(150, 150, 150);
              doc.text("Foto", margin + 5, yPosition + 8);
            }
          } catch {
            doc.setFontSize(5);
            doc.setTextColor(150, 150, 150);
            doc.text("Foto", margin + 5, yPosition + 8);
          }
        } else {
          doc.setFontSize(5);
          doc.setTextColor(180, 180, 180);
          doc.text("Yok", margin + 5, yPosition + 8);
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.text(box.code.substring(0, 14), margin + 18, yPosition + 5);
        
        // Koli adı
        doc.setFont("helvetica", "bold");
        doc.text(turkishToAscii(box.name.substring(0, 25)), margin + 50, yPosition + 5);
        doc.setFont("helvetica", "normal");
        
        // İçerik bilgisi (cins ve adet)
        if (box.lines && box.lines.length > 0) {
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100);
          const maxLinesToShow = 3;
          for (let j = 0; j < Math.min(box.lines.length, maxLinesToShow); j++) {
            const line = box.lines[j];
            const lineText = `${turkishToAscii(line.product_name.substring(0, 20))} x${line.qty}${line.kind ? ` (${turkishToAscii(line.kind.substring(0, 8))})` : ""}`;
            doc.text(lineText, margin + 50, yPosition + 9 + (j * 4));
          }
          if (box.lines.length > maxLinesToShow) {
            doc.text(`+${box.lines.length - maxLinesToShow} daha...`, margin + 50, yPosition + 9 + (maxLinesToShow * 4));
          }
          doc.setFontSize(7);
        } else {
          doc.setFontSize(6);
          doc.setTextColor(180, 180, 180);
          doc.text("Icerik yok", margin + 50, yPosition + 10);
          doc.setFontSize(7);
        }
        
        doc.setTextColor(0, 0, 0);
        doc.text(turkishToAscii(box.department.name.substring(0, 12)), margin + 115, yPosition + 8);
        
        // Status with color
        if (box.status === "sealed") {
          doc.setTextColor(16, 185, 129);
          doc.text("Kapali", margin + 155, yPosition + 8);
        } else {
          doc.setTextColor(245, 158, 11);
          doc.text("Acik", margin + 155, yPosition + 8);
        }
        
        doc.setTextColor(0, 0, 0);
        doc.text(turkishToAscii(box.created_by.substring(0, 10)), margin + 175, yPosition + 8);
        yPosition += dynamicRowHeight;
      }

      // Final page footer
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      const totalPages = doc.internal.pages.length - 1;
      doc.text(`Sayfa ${totalPages} / ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });

      const fileName = deptId 
        ? `koliler-${turkishToAscii(deptName || "").toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
        : `koliler-tum-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setPdfLoading(null);
    }
  };

  const generatePalletsPDF = async (deptId: string | null = null) => {
    setPdfLoading("pallets");
    setPdfDeptModalOpen(false);
    setPdfProgress(0);
    try {
      const filteredPallets = getFilteredPalletsForPdf(deptId);
      const deptName = deptId ? departments.find(d => d.id === deptId)?.name : "Tum Departmanlar";
      setPdfProgressTotal(filteredPallets.length);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const rowHeight = 18;
      const imageSize = 14;
      let yPosition = margin;

      const totalBoxesInPallets = filteredPallets.reduce((sum, p) => sum + p.box_count, 0);

      // Compact Header - only on first page
      doc.setFillColor(20, 184, 166);
      doc.rect(0, 0, pageWidth, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(turkishToAscii(`PALETLER - ${deptName}`), margin, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date().toLocaleDateString("tr-TR")} | ${filteredPallets.length} Palet | ${totalBoxesInPallets} Koli`, pageWidth - margin, 12, { align: "right" });
      yPosition = 25;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("FOTO", margin + 2, yPosition + 5.5);
      doc.text("KOD", margin + 18, yPosition + 5.5);
      doc.text("PALET ADI", margin + 55, yPosition + 5.5);
      doc.text("OLUSTURAN", margin + 115, yPosition + 5.5);
      doc.text("KOLI", margin + 170, yPosition + 5.5);
      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      // Table rows with images
      for (let i = 0; i < filteredPallets.length; i++) {
        const pallet = filteredPallets[i];
        setPdfProgress(i + 1);
        
        if (yPosition > pageHeight - 15) {
          doc.setFontSize(6);
          doc.setTextColor(150, 150, 150);
          doc.text(`Sayfa ${doc.internal.pages.length - 1}`, pageWidth - margin, pageHeight - 5, { align: "right" });
          
          doc.addPage();
          yPosition = 8;
          
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, "F");
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(6);
          doc.text("FOTO | KOD | PALET ADI | OLUSTURAN | KOLI", margin + 2, yPosition + 4);
          yPosition += 8;
        }

        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, rowHeight, "F");
        }

        // Image
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin + 2, yPosition, imageSize, imageSize);
        
        if (pallet.photo_url) {
          try {
            const imgData = await loadImageAsBase64(pallet.photo_url);
            if (imgData) {
              doc.addImage(imgData, "JPEG", margin + 2, yPosition, imageSize, imageSize);
            } else {
              doc.setFontSize(5);
              doc.setTextColor(150, 150, 150);
              doc.text("Foto", margin + 5, yPosition + 8);
            }
          } catch {
            doc.setFontSize(5);
            doc.setTextColor(150, 150, 150);
            doc.text("Foto", margin + 5, yPosition + 8);
          }
        } else {
          doc.setFontSize(5);
          doc.setTextColor(180, 180, 180);
          doc.text("Yok", margin + 5, yPosition + 8);
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.text(pallet.code, margin + 18, yPosition + 8);
        doc.text(turkishToAscii(pallet.name.substring(0, 25)), margin + 55, yPosition + 8);
        doc.text(turkishToAscii(pallet.created_by.substring(0, 20)), margin + 115, yPosition + 8);
        
        doc.setTextColor(20, 184, 166);
        doc.setFont("helvetica", "bold");
        doc.text(String(pallet.box_count), margin + 172, yPosition + 8);
        doc.setFont("helvetica", "normal");
        
        yPosition += rowHeight;
      }

      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      const totalPages = doc.internal.pages.length - 1;
      doc.text(`Sayfa ${totalPages} / ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });

      const fileName = deptId 
        ? `paletler-${turkishToAscii(deptName || "").toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
        : `paletler-tum-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setPdfLoading(null);
    }
  };

  const generateShipmentsPDF = async (deptId: string | null = null) => {
    setPdfLoading("shipments");
    setPdfDeptModalOpen(false);
    setPdfProgress(0);
    try {
      const filteredShipments = getFilteredShipmentsForPdf(deptId);
      const deptName = deptId ? departments.find(d => d.id === deptId)?.name : "Tum Departmanlar";
      setPdfProgressTotal(filteredShipments.length);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const rowHeight = 18;
      const imageSize = 14;
      let yPosition = margin;

      const totalPalletsInShipments = filteredShipments.reduce((sum, s) => sum + s.pallet_count, 0);
      const totalBoxesInShipments = filteredShipments.reduce((sum, s) => sum + s.box_count, 0);

      // Compact Header
      doc.setFillColor(168, 85, 247);
      doc.rect(0, 0, pageWidth, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(turkishToAscii(`SEVKIYATLAR - ${deptName}`), margin, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`${new Date().toLocaleDateString("tr-TR")} | ${filteredShipments.length} Sevkiyat | ${totalPalletsInShipments} Palet | ${totalBoxesInShipments} Koli`, pageWidth - margin, 12, { align: "right" });
      yPosition = 25;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("FOTO", margin + 2, yPosition + 5.5);
      doc.text("KOD", margin + 18, yPosition + 5.5);
      doc.text("PLAKA/AD", margin + 55, yPosition + 5.5);
      doc.text("OLUSTURAN", margin + 105, yPosition + 5.5);
      doc.text("PALET", margin + 155, yPosition + 5.5);
      doc.text("KOLI", margin + 175, yPosition + 5.5);
      yPosition += 10;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      // Table rows with images
      for (let i = 0; i < filteredShipments.length; i++) {
        const shipment = filteredShipments[i];
        setPdfProgress(i + 1);
        
        if (yPosition > pageHeight - 15) {
          doc.setFontSize(6);
          doc.setTextColor(150, 150, 150);
          doc.text(`Sayfa ${doc.internal.pages.length - 1}`, pageWidth - margin, pageHeight - 5, { align: "right" });
          
          doc.addPage();
          yPosition = 8;
          
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, "F");
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(6);
          doc.text("FOTO | KOD | PLAKA/AD | OLUSTURAN | PALET | KOLI", margin + 2, yPosition + 4);
          yPosition += 8;
        }

        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, rowHeight, "F");
        }

        // Image
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin + 2, yPosition, imageSize, imageSize);
        
        if (shipment.photo_url) {
          try {
            const imgData = await loadImageAsBase64(shipment.photo_url);
            if (imgData) {
              doc.addImage(imgData, "JPEG", margin + 2, yPosition, imageSize, imageSize);
            } else {
              doc.setFontSize(5);
              doc.setTextColor(150, 150, 150);
              doc.text("Foto", margin + 5, yPosition + 8);
            }
          } catch {
            doc.setFontSize(5);
            doc.setTextColor(150, 150, 150);
            doc.text("Foto", margin + 5, yPosition + 8);
          }
        } else {
          doc.setFontSize(5);
          doc.setTextColor(180, 180, 180);
          doc.text("Yok", margin + 5, yPosition + 8);
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);
        doc.text(shipment.code, margin + 18, yPosition + 8);
        doc.text(turkishToAscii(shipment.name_or_plate.substring(0, 20)), margin + 55, yPosition + 8);
        doc.text(turkishToAscii(shipment.created_by.substring(0, 18)), margin + 105, yPosition + 8);
        
        doc.setTextColor(168, 85, 247);
        doc.setFont("helvetica", "bold");
        doc.text(String(shipment.pallet_count), margin + 158, yPosition + 8);
        doc.setTextColor(59, 130, 246);
        doc.text(String(shipment.box_count), margin + 178, yPosition + 8);
        doc.setFont("helvetica", "normal");
        
        yPosition += rowHeight;
      }

      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      const totalPages = doc.internal.pages.length - 1;
      doc.text(`Sayfa ${totalPages} / ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });

      const fileName = deptId 
        ? `sevkiyatlar-${turkishToAscii(deptName || "").toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`
        : `sevkiyatlar-tum-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setPdfLoading(null);
    }
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

      {/* Selected Department Filter Badge */}
      {stats.selectedDepartmentName && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2"
        >
          <Badge className="bg-cyan-100 text-cyan-700 border-cyan-300 px-4 py-2 text-sm">
            Filtre: {stats.selectedDepartmentName}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDepartmentId(null)}
            className="text-slate-500 hover:text-slate-700"
          >
            Filtreyi Kaldır
          </Button>
        </motion.div>
      )}

      {/* KPI Cards Row - İlk 4 (Koli bazlı) */}
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
            clickType: "total" as const,
          },
          {
            title: "Kapalı Koliler",
            value: stats.sealedBoxes,
            icon: CheckCircle2,
            gradient: "from-emerald-500 to-teal-600",
            bgGradient: "from-emerald-50 to-teal-50",
            glow: "shadow-emerald-500/20",
            clickType: "sealed" as const,
          },
          {
            title: "Açık Koliler",
            value: stats.draftBoxes,
            icon: AlertCircle,
            gradient: "from-amber-500 to-orange-600",
            bgGradient: "from-amber-50 to-orange-50",
            glow: "shadow-amber-500/20",
            clickType: "draft" as const,
          },
          {
            title: "Son 24 Saat",
            value: stats.last24h,
            icon: TrendingUp,
            gradient: "from-purple-500 to-pink-600",
            bgGradient: "from-purple-50 to-pink-50",
            glow: "shadow-purple-500/20",
            clickType: "last24h" as const,
          },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="cursor-pointer"
            onClick={() => handleKpiClick(kpi.clickType)}
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${kpi.bgGradient} shadow-lg ${kpi.glow} hover:shadow-xl transition-shadow`}>
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
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Listeyi görüntüle
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* KPI Cards Row - Palet ve Sevkiyat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: "Toplam Palet",
            value: pallets.length,
            subValue: `${pallets.reduce((sum, p) => sum + p.box_count, 0)} koli`,
            icon: Layers,
            gradient: "from-cyan-500 to-teal-600",
            bgGradient: "from-cyan-50 to-teal-50",
            glow: "shadow-cyan-500/20",
            clickType: "pallets" as const,
          },
          {
            title: "Toplam Sevkiyat",
            value: shipments.length,
            subValue: `${shipments.reduce((sum, s) => sum + s.pallet_count, 0)} palet`,
            icon: Truck,
            gradient: "from-violet-500 to-purple-600",
            bgGradient: "from-violet-50 to-purple-50",
            glow: "shadow-violet-500/20",
            clickType: "shipments" as const,
          },
        ].map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="cursor-pointer"
            onClick={() => handleKpiClick(kpi.clickType)}
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${kpi.bgGradient} shadow-lg ${kpi.glow} hover:shadow-xl transition-shadow`}>
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
                    <p className="text-xs text-slate-500 mt-1">{kpi.subValue}</p>
                  </div>
                  <motion.div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                  >
                    <kpi.icon className="h-5 w-5 text-white" />
                  </motion.div>
                </div>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Listeyi görüntüle
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* PDF Download Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
              <FileText className="h-5 w-5 text-rose-600" />
              Toplu PDF Rapor İndirme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Tüm departmanların oluşturduğu kayıtları PDF olarak indirin. Raporlar yazdırmaya uygun formattadır.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => openPdfDeptModal("boxes")}
                  disabled={pdfLoading !== null}
                  className="w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                >
                  {pdfLoading === "boxes" ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5 mr-2" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold">Tüm Koliler</p>
                    <p className="text-xs opacity-80">{boxes.length} koli</p>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => openPdfDeptModal("pallets")}
                  disabled={pdfLoading !== null}
                  className="w-full h-16 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white shadow-lg shadow-cyan-500/25"
                >
                  {pdfLoading === "pallets" ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5 mr-2" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold">Tüm Paletler</p>
                    <p className="text-xs opacity-80">{pallets.length} palet</p>
                  </div>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => openPdfDeptModal("shipments")}
                  disabled={pdfLoading !== null}
                  className="w-full h-16 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                >
                  {pdfLoading === "shipments" ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5 mr-2" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold">Tüm Sevkiyatlar</p>
                    <p className="text-xs opacity-80">{shipments.length} sevkiyat</p>
                  </div>
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
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
          <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative flex flex-col" style={{ height: "600px" }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="activityGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="currentColor" className="text-cyan-400" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#activityGrid)" />
              </svg>
            </div>
            
            <CardHeader className="relative border-b border-slate-700/50 flex-shrink-0">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Tüm aktivite geçmişini silmek istediğinize emin misiniz?")) {
                        activityTracker.clear();
                        loadActivities();
                      }
                    }}
                    disabled={activities.length === 0}
                    className="h-8 px-3 text-xs bg-rose-500/20 text-rose-300 hover:text-rose-200 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Temizle
                  </Button>
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300 border-0 flex items-center gap-1">
                    <Radio className="h-3 w-3" />
                    5sn
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative p-4 space-y-3 flex-1 overflow-y-auto" style={{ maxHeight: "500px" }}>
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
                      onClick={() => activity.entity_code && openBoxDetail(activity.entity_code)}
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
                              {activity.user_name}
                            </span>
                            <span className="text-cyan-400 text-sm">
                              {activityLabels[activity.action] || activity.action}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                              {activity.user_department}
                            </Badge>
                            {activity.entity_code && (
                              <Badge variant="outline" className="text-xs border-cyan-600/50 text-cyan-300 font-mono">
                                {activity.entity_code}
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(activity.created_at)}
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
                    className={`p-4 rounded-xl bg-gradient-to-br border transition-all cursor-pointer group ${
                      selectedDepartmentId === dept.id 
                        ? "from-cyan-50 to-blue-50 border-cyan-400 ring-2 ring-cyan-200" 
                        : "from-slate-50 to-slate-100 border-slate-200 hover:border-cyan-300"
                    }`}
                    onClick={() => handleDepartmentModalClick(dept)}
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
                    className="relative p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-purple-300 transition-all group cursor-pointer"
                    onClick={() => handlePersonnelClick(userData.name)}
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
                      <h4 className="font-semibold text-slate-800 text-lg hover:text-purple-600 transition-colors">{userData.name}</h4>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                openBoxDetail(box.code);
                              }}
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
                <div 
                  className="rounded-xl overflow-hidden border border-slate-200 relative cursor-pointer group"
                  onClick={() => setFullscreenPhoto(selectedBox.photo_url)}
                >
                  <img
                    src={selectedBox.photo_url}
                    alt="Koli fotoğrafı"
                    className="w-full max-h-64 object-contain bg-slate-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
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

      {/* Fullscreen Photo Modal */}
      <Dialog open={!!fullscreenPhoto} onOpenChange={() => setFullscreenPhoto(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full p-0 bg-black/95 border-0 rounded-xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Fotoğraf</DialogTitle>
          </DialogHeader>
          {fullscreenPhoto && (
            <div className="relative flex items-center justify-center min-h-[50vh] sm:min-h-[60vh]">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-50 h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20"
                onClick={() => setFullscreenPhoto(null)}
              >
                <X className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={fullscreenPhoto}
                alt="Fotoğraf"
                className="max-w-full max-h-[85vh] sm:max-h-[80vh] object-contain p-2"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Personnel Detail Modal */}
      <Dialog open={personnelModalOpen} onOpenChange={setPersonnelModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                <Users className="h-5 w-5 text-white" />
              </div>
              {selectedPersonnel}
            </DialogTitle>
          </DialogHeader>

          {personnelViewType === null ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-slate-500 mb-4">Hangi kayıtları görüntülemek istiyorsunuz?</p>
              
              {(() => {
                const data = getPersonnelData();
                return (
                  <>
                    <Button
                      variant="outline"
                      className="w-full h-16 justify-start gap-4 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => setPersonnelViewType("boxes")}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-700">Koliler</p>
                        <p className="text-xs text-slate-400">{data.boxes.length} koli oluşturmuş</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full h-16 justify-start gap-4 hover:bg-cyan-50 hover:border-cyan-300"
                      onClick={() => setPersonnelViewType("pallets")}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-700">Paletler</p>
                        <p className="text-xs text-slate-400">{data.pallets.length} palet oluşturmuş</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full h-16 justify-start gap-4 hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => setPersonnelViewType("shipments")}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-700">Sevkiyatlar</p>
                        <p className="text-xs text-slate-400">{data.shipments.length} sevkiyat oluşturmuş</p>
                      </div>
                    </Button>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPersonnelViewType(null)}
                className="text-slate-500"
              >
                ← Geri
              </Button>

              {personnelViewType === "boxes" && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Koliler ({getPersonnelData().boxes.length})
                  </h4>
                  {getPersonnelData().boxes.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Koli bulunamadı</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {getPersonnelData().boxes.map((box) => (
                        <motion.div
                          key={box.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all"
                          onClick={() => {
                            setPersonnelModalOpen(false);
                            openBoxDetail(box.code);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-800">{box.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{box.code}</p>
                            </div>
                            <Badge className={box.status === "sealed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                              {box.status === "sealed" ? "Kapalı" : "Açık"}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {personnelViewType === "pallets" && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-600" />
                    Paletler ({getPersonnelData().pallets.length})
                  </h4>
                  {getPersonnelData().pallets.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Palet bulunamadı</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {getPersonnelData().pallets.map((pallet) => (
                        <motion.div
                          key={pallet.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-cyan-300 cursor-pointer transition-all"
                          onClick={() => {
                            setPersonnelModalOpen(false);
                            router.push(`/app/pallets/${pallet.code}`);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-800">{pallet.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{pallet.code}</p>
                            </div>
                            <Badge className="bg-cyan-100 text-cyan-700">{pallet.box_count} koli</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {personnelViewType === "shipments" && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-600" />
                    Sevkiyatlar ({getPersonnelData().shipments.length})
                  </h4>
                  {getPersonnelData().shipments.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Sevkiyat bulunamadı</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {getPersonnelData().shipments.map((shipment) => (
                        <motion.div
                          key={shipment.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 cursor-pointer transition-all"
                          onClick={() => {
                            setPersonnelModalOpen(false);
                            router.push(`/app/shipments/${shipment.code}`);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-800">{shipment.name_or_plate}</p>
                              <p className="text-xs text-slate-500 font-mono">{shipment.code}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className="bg-purple-100 text-purple-700">{shipment.pallet_count} palet</Badge>
                              <Badge className="bg-blue-100 text-blue-700">{shipment.box_count} koli</Badge>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Department Detail Modal */}
      <Dialog open={departmentModalOpen} onOpenChange={setDepartmentModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              {selectedDepartmentModal?.name}
            </DialogTitle>
          </DialogHeader>

          {departmentViewType === null ? (
            <div className="space-y-3 py-4">
              <p className="text-sm text-slate-500 mb-4">Bu departman için hangi kayıtları görüntülemek istiyorsunuz?</p>
              
              {(() => {
                const data = getDepartmentData();
                return (
                  <>
                    <Button
                      variant="outline"
                      className="w-full h-16 justify-start gap-4 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => setDepartmentViewType("boxes")}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-700">Tüm Kolileri Gör</p>
                        <p className="text-xs text-slate-400">{data.boxes.length} koli mevcut</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full h-16 justify-start gap-4 hover:bg-cyan-50 hover:border-cyan-300"
                      onClick={() => setDepartmentViewType("pallets")}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-700">Tüm Paletleri Gör</p>
                        <p className="text-xs text-slate-400">{data.pallets.length} palet mevcut</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full h-16 justify-start gap-4 hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => setDepartmentViewType("shipments")}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-700">Tüm Sevkiyatları Gör</p>
                        <p className="text-xs text-slate-400">{data.shipments.length} sevkiyat mevcut</p>
                      </div>
                    </Button>

                    <div className="border-t pt-3 mt-3">
                      <Button
                        variant="ghost"
                        className="w-full justify-center text-cyan-600 hover:bg-cyan-50"
                        onClick={() => {
                          setDepartmentModalOpen(false);
                          setSelectedDepartmentId(selectedDepartmentModal?.id || null);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Dashboard&apos;da Filtrele
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDepartmentViewType(null)}
                className="text-slate-500"
              >
                ← Geri
              </Button>

              {departmentViewType === "boxes" && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    Koliler ({getDepartmentData().boxes.length})
                  </h4>
                  {getDepartmentData().boxes.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Koli bulunamadı</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {getDepartmentData().boxes.map((box) => (
                        <motion.div
                          key={box.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all"
                          onClick={() => {
                            setDepartmentModalOpen(false);
                            openBoxDetail(box.code);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-800">{box.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{box.code}</p>
                            </div>
                            <Badge className={box.status === "sealed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                              {box.status === "sealed" ? "Kapalı" : "Açık"}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {departmentViewType === "pallets" && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-600" />
                    Paletler ({getDepartmentData().pallets.length})
                  </h4>
                  {getDepartmentData().pallets.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Palet bulunamadı</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {getDepartmentData().pallets.map((pallet) => (
                        <motion.div
                          key={pallet.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-cyan-300 cursor-pointer transition-all"
                          onClick={() => {
                            setDepartmentModalOpen(false);
                            router.push(`/app/pallets/${pallet.code}`);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-800">{pallet.name}</p>
                              <p className="text-xs text-slate-500 font-mono">{pallet.code}</p>
                            </div>
                            <Badge className="bg-cyan-100 text-cyan-700">{pallet.box_count} koli</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {departmentViewType === "shipments" && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-600" />
                    Sevkiyatlar ({getDepartmentData().shipments.length})
                  </h4>
                  {getDepartmentData().shipments.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Sevkiyat bulunamadı</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {getDepartmentData().shipments.map((shipment) => (
                        <motion.div
                          key={shipment.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-purple-300 cursor-pointer transition-all"
                          onClick={() => {
                            setDepartmentModalOpen(false);
                            router.push(`/app/shipments/${shipment.code}`);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-800">{shipment.name_or_plate}</p>
                              <p className="text-xs text-slate-500 font-mono">{shipment.code}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className="bg-purple-100 text-purple-700">{shipment.pallet_count} palet</Badge>
                              <Badge className="bg-blue-100 text-blue-700">{shipment.box_count} koli</Badge>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Progress Modal */}
      <Dialog open={pdfLoading !== null} onOpenChange={() => {}}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${
                pdfLoading === "boxes" 
                  ? "from-blue-500 to-indigo-600" 
                  : pdfLoading === "pallets" 
                    ? "from-cyan-500 to-teal-600" 
                    : "from-violet-500 to-purple-600"
              }`}>
                <FileText className="h-5 w-5 text-white" />
              </div>
              PDF Oluşturuluyor
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">İşleniyor...</span>
              <span className="font-semibold text-slate-800">
                {pdfProgress} / {pdfProgressTotal}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pdfLoading === "boxes" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600" 
                    : pdfLoading === "pallets" 
                      ? "bg-gradient-to-r from-cyan-500 to-teal-600" 
                      : "bg-gradient-to-r from-violet-500 to-purple-600"
                }`}
                initial={{ width: 0 }}
                animate={{ width: pdfProgressTotal > 0 ? `${(pdfProgress / pdfProgressTotal) * 100}%` : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500 text-center">
              {pdfProgressTotal > 0 && Math.round((pdfProgress / pdfProgressTotal) * 100)}% tamamlandı
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Department Selection Modal */}
      <Dialog open={pdfDeptModalOpen} onOpenChange={setPdfDeptModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${
                pdfType === "boxes" 
                  ? "from-blue-500 to-indigo-600" 
                  : pdfType === "pallets" 
                    ? "from-cyan-500 to-teal-600" 
                    : "from-violet-500 to-purple-600"
              }`}>
                {pdfType === "boxes" && <Package className="h-5 w-5 text-white" />}
                {pdfType === "pallets" && <Layers className="h-5 w-5 text-white" />}
                {pdfType === "shipments" && <Truck className="h-5 w-5 text-white" />}
              </div>
              {pdfType === "boxes" && "Kolileri PDF Olarak İndir"}
              {pdfType === "pallets" && "Paletleri PDF Olarak İndir"}
              {pdfType === "shipments" && "Sevkiyatları PDF Olarak İndir"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <p className="text-sm text-slate-500 mb-4">Hangi departmanın kayıtlarını indirmek istiyorsunuz?</p>
            
            {/* Hepsini Birden İndir Butonu */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-4 border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50"
                onClick={() => {
                  if (pdfType === "boxes") generateBoxesPDF(null);
                  else if (pdfType === "pallets") generatePalletsPDF(null);
                  else if (pdfType === "shipments") generateShipmentsPDF(null);
                }}
                disabled={pdfLoading !== null}
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                  <Download className="h-5 w-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-slate-700">Hepsini Birden İndir</p>
                  <p className="text-xs text-slate-400">
                    Tüm departmanların {pdfType === "boxes" ? `${boxes.length} kolisi` : pdfType === "pallets" ? `${pallets.length} paleti` : `${shipments.length} sevkiyatı`}
                  </p>
                </div>
              </Button>
            </motion.div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">veya departman seçin</span>
              </div>
            </div>

            {/* Departman Listesi */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {departments.map((dept) => {
                const deptBoxCount = boxes.filter(b => b.department.id === dept.id).length;
                const deptPalletCount = getFilteredPalletsForPdf(dept.id).length;
                const deptShipmentCount = getFilteredShipmentsForPdf(dept.id).length;
                const count = pdfType === "boxes" ? deptBoxCount : pdfType === "pallets" ? deptPalletCount : deptShipmentCount;
                
                return (
                  <motion.div key={dept.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      variant="outline"
                      className="w-full h-14 justify-start gap-4 hover:bg-slate-50 hover:border-slate-300"
                      onClick={() => {
                        if (pdfType === "boxes") generateBoxesPDF(dept.id);
                        else if (pdfType === "pallets") generatePalletsPDF(dept.id);
                        else if (pdfType === "shipments") generateShipmentsPDF(dept.id);
                      }}
                      disabled={pdfLoading !== null || count === 0}
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-slate-700">{dept.name}</p>
                        <p className="text-xs text-slate-400">
                          {count} {pdfType === "boxes" ? "koli" : pdfType === "pallets" ? "palet" : "sevkiyat"}
                        </p>
                      </div>
                      {count === 0 && (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-400">Boş</Badge>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {/* İptal Butonu */}
            <Button
              variant="ghost"
              className="w-full mt-4 text-slate-500"
              onClick={() => setPdfDeptModalOpen(false)}
            >
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KPI List Modal */}
      <Dialog open={kpiModalOpen} onOpenChange={setKpiModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${
                kpiModalType === "total" || kpiModalType === "sealed" || kpiModalType === "draft" || kpiModalType === "last24h" 
                  ? "from-blue-500 to-indigo-600" 
                  : kpiModalType === "pallets" 
                    ? "from-cyan-500 to-teal-600" 
                    : "from-violet-500 to-purple-600"
              }`}>
                {(kpiModalType === "total" || kpiModalType === "sealed" || kpiModalType === "draft" || kpiModalType === "last24h") && <Package className="h-5 w-5 text-white" />}
                {kpiModalType === "pallets" && <Layers className="h-5 w-5 text-white" />}
                {kpiModalType === "shipments" && <Truck className="h-5 w-5 text-white" />}
              </div>
              {getKpiModalData().title}
              <Badge variant="outline" className="ml-2">
                {getKpiModalData().items.length} kayıt
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {getKpiModalData().items.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Kayıt bulunamadı</p>
              </div>
            ) : (
              <>
                {/* Boxes List */}
                {(kpiModalType === "total" || kpiModalType === "sealed" || kpiModalType === "draft" || kpiModalType === "last24h") && 
                  getKpiModalData().items.map((box: any, index: number) => (
                    <motion.div
                      key={box.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all group"
                      onClick={() => {
                        setKpiModalOpen(false);
                        openBoxDetail(box.code);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{box.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500 font-mono">{box.code}</p>
                              <span className="text-slate-300">•</span>
                              <p className="text-xs text-slate-500">{box.department.name}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={box.status === "sealed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                            {box.status === "sealed" ? "Kapalı" : "Açık"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                }

                {/* Pallets List */}
                {kpiModalType === "pallets" && 
                  getKpiModalData().items.map((pallet: any, index: number) => (
                    <motion.div
                      key={pallet.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-cyan-300 cursor-pointer transition-all group"
                      onClick={() => {
                        setKpiModalOpen(false);
                        router.push(`/app/pallets/${pallet.code}`);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-cyan-600 transition-colors">{pallet.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500 font-mono">{pallet.code}</p>
                              <span className="text-slate-300">•</span>
                              <p className="text-xs text-slate-500">{pallet.created_by}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-cyan-100 text-cyan-700">{pallet.box_count} koli</Badge>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                }

                {/* Shipments List */}
                {kpiModalType === "shipments" && 
                  getKpiModalData().items.map((shipment: any, index: number) => (
                    <motion.div
                      key={shipment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-violet-300 cursor-pointer transition-all group"
                      onClick={() => {
                        setKpiModalOpen(false);
                        router.push(`/app/shipments/${shipment.code}`);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-violet-600 transition-colors">{shipment.name_or_plate}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500 font-mono">{shipment.code}</p>
                              <span className="text-slate-300">•</span>
                              <p className="text-xs text-slate-500">{shipment.created_by}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-violet-100 text-violet-700">{shipment.pallet_count} palet</Badge>
                          <Badge className="bg-blue-100 text-blue-700">{shipment.box_count} koli</Badge>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                }
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
