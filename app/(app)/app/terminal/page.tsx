"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
    Truck,
    Plus,
    Package,
    Layers,
    ScanLine,
    ArrowLeft,
    Check,
    X,
    AlertCircle,
    Volume2,
    VolumeX,
    Zap,
    ChevronDown,
    RotateCcw,
    Sparkles,
    Camera,
    Box,
} from "lucide-react";
import { shipmentRepository } from "@/lib/repositories/shipment";
import { palletRepository } from "@/lib/repositories/pallet";
import { boxRepository } from "@/lib/repositories/box";
import { auth } from "@/lib/auth";
import type { ShipmentWithCounts } from "@/lib/types/shipment";

// Beep sound for success/error
function playBeep(success: boolean) {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = success ? 1200 : 300;
        osc.type = success ? "sine" : "square";
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + (success ? 0.15 : 0.3));
    } catch { }
}

interface ScannedItem {
    code: string;
    type: "pallet" | "box";
    name: string;
    timestamp: Date;
    success: boolean;
    message: string;
}

export default function TerminalModePage() {
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [userRole, setUserRole] = useState("user");
    const [loading, setLoading] = useState(true);

    // Phase: "select" | "scanning"
    const [phase, setPhase] = useState<"select" | "scanning">("select");

    // Shipment selection
    const [shipments, setShipments] = useState<ShipmentWithCounts[]>([]);
    const [selectedShipment, setSelectedShipment] = useState<ShipmentWithCounts | null>(null);

    // Create new shipment
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newShipmentName, setNewShipmentName] = useState("");
    const [creating, setCreating] = useState(false);

    // Scanning
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [flashColor, setFlashColor] = useState<"green" | "red" | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanCount, setScanCount] = useState({ pallets: 0, boxes: 0 });
    const scannerRef = useRef<any>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const processedCodesRef = useRef<Set<string>>(new Set());

    // Refs to avoid stale closure in scanner callback
    const selectedShipmentRef = useRef<ShipmentWithCounts | null>(null);
    const soundEnabledRef = useRef(true);
    const isProcessingRef = useRef(false);
    const userNameRef = useRef("");

    // Keep refs in sync with state
    useEffect(() => { selectedShipmentRef.current = selectedShipment; }, [selectedShipment]);
    useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
    useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
    useEffect(() => { userNameRef.current = userName; }, [userName]);

    // Confirmation dialog for non-direct boxes
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        code: string;
        boxName: string;
        shipment: ShipmentWithCounts | null;
        soundOn: boolean;
    }>({ open: false, code: "", boxName: "", shipment: null, soundOn: true });

    // Success notification dialog
    const [successDialog, setSuccessDialog] = useState<{
        open: boolean;
        type: "pallet" | "box";
        itemName: string;
        shipmentName: string;
    }>({ open: false, type: "box", itemName: "", shipmentName: "" });

    useEffect(() => {
        loadData();
        return () => {
            stopScanner();
        };
    }, []);

    const loadData = async () => {
        try {
            const session = await auth.getSession();
            if (!session) {
                router.push("/login");
                return;
            }
            setUserName(session.user.name);
            setUserRole(session.user.role);

            const allShipments = await shipmentRepository.getAll();
            // Filter for user's shipments if role is user
            const filtered =
                session.user.role === "user"
                    ? allShipments.filter((s) => s.created_by === session.user.name)
                    : allShipments;
            setShipments(filtered);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShipment = async () => {
        if (!newShipmentName.trim()) return;
        setCreating(true);
        try {
            const shipment = await shipmentRepository.create(
                { name_or_plate: newShipmentName.trim() },
                userName
            );
            toast({
                title: "Sevkiyat Oluşturuldu",
                description: `${shipment.name_or_plate} başarıyla oluşturuldu`,
            });
            setCreateDialogOpen(false);
            setNewShipmentName("");
            await loadData();
            // Auto-select the new shipment
            const allShipments = await shipmentRepository.getAll();
            const newOne = allShipments.find((s) => s.code === shipment.code);
            if (newOne) {
                handleSelectShipment(newOne);
            }
        } catch (error) {
            toast({
                title: "Hata",
                description: "Sevkiyat oluşturulamadı",
                variant: "destructive",
            });
        } finally {
            setCreating(false);
        }
    };

    const handleSelectShipment = (shipment: ShipmentWithCounts) => {
        setSelectedShipment(shipment);
        setPhase("scanning");
        setScannedItems([]);
        setScanCount({ pallets: 0, boxes: 0 });
        processedCodesRef.current = new Set();
        // Start scanner after a short delay to let DOM render
        setTimeout(() => {
            startScanner();
        }, 500);
    };

    const startScanner = async () => {
        try {
            const { Html5Qrcode } = await import("html5-qrcode");

            if (scannerRef.current) {
                try { await scannerRef.current.stop(); } catch { }
            }

            const scanner = new Html5Qrcode("terminal-qr-reader");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText: string) => {
                    handleQrResult(decodedText);
                },
                () => {
                    // QR not found - do nothing (continuous scanning)
                }
            );
        } catch (error) {
            console.error("Scanner error:", error);
            toast({
                title: "Kamera Hatası",
                description: "Kamera açılamadı. Lütfen kamera izni verin.",
                variant: "destructive",
            });
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch { }
        }
    };

    const showSuccessNotification = (type: "pallet" | "box", itemName: string, shipmentName: string) => {
        setSuccessDialog({ open: true, type, itemName, shipmentName });
        setTimeout(() => {
            setSuccessDialog(prev => ({ ...prev, open: false }));
        }, 2000);
    };

    const handleQrResult = useCallback(
        async (decodedText: string) => {
            // Prevent duplicate processing - use ref for guard
            if (processedCodesRef.current.has(decodedText) || isProcessingRef.current) return;

            isProcessingRef.current = true;
            setIsProcessing(true);
            processedCodesRef.current.add(decodedText);

            const currentShipment = selectedShipmentRef.current;
            const currentSoundEnabled = soundEnabledRef.current;

            try {
                // Parse the QR URL: could be full URL or just code
                let itemCode = "";
                let itemType: "pallet" | "box" | null = null;

                // Try to extract from URL pattern: /q/box/CODE or /q/pallet/CODE
                const boxMatch = decodedText.match(/\/q\/box\/([A-Z0-9-]+)/i);
                const palletMatch = decodedText.match(/\/q\/pallet\/([A-Z0-9-]+)/i);

                if (boxMatch) {
                    itemCode = boxMatch[1];
                    itemType = "box";
                } else if (palletMatch) {
                    itemCode = palletMatch[1];
                    itemType = "pallet";
                } else {
                    // Try direct code matching
                    const code = decodedText.trim();
                    if (code.startsWith("BOX-") || code.startsWith("KOL-")) {
                        itemCode = code;
                        itemType = "box";
                    } else if (code.startsWith("PLT-") || code.startsWith("PAL-")) {
                        itemCode = code;
                        itemType = "pallet";
                    } else {
                        // Try to find as box or pallet
                        const box = await boxRepository.getByCode(code);
                        if (box) {
                            itemCode = code;
                            itemType = "box";
                        } else {
                            const pallet = await palletRepository.getByCode(code);
                            if (pallet) {
                                itemCode = code;
                                itemType = "pallet";
                            }
                        }
                    }
                }

                if (!itemCode || !itemType) {
                    showFlash("red");
                    if (currentSoundEnabled) playBeep(false);
                    addScannedItem({
                        code: decodedText.substring(0, 30),
                        type: "box",
                        name: "Bilinmeyen",
                        timestamp: new Date(),
                        success: false,
                        message: "Tanınmayan QR kod",
                    });
                    setTimeout(() => {
                        processedCodesRef.current.delete(decodedText);
                    }, 3000);
                    isProcessingRef.current = false;
                    setIsProcessing(false);
                    return;
                }

                if (!currentShipment) {
                    isProcessingRef.current = false;
                    setIsProcessing(false);
                    return;
                }

                const currentUserName = userNameRef.current;

                if (itemType === "pallet") {
                    await addPalletToShipment(itemCode, currentShipment, currentSoundEnabled, currentUserName);
                } else {
                    await addBoxToShipment(itemCode, currentShipment, currentSoundEnabled, currentUserName);
                }
            } catch (error) {
                console.error("QR processing error:", error);
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code: decodedText.substring(0, 30),
                    type: "box",
                    name: "Hata",
                    timestamp: new Date(),
                    success: false,
                    message: "İşlem hatası",
                });
                setTimeout(() => {
                    processedCodesRef.current.delete(decodedText);
                }, 3000);
            }

            isProcessingRef.current = false;
            setIsProcessing(false);
        },
        [] // No deps needed - uses refs
    );

    const addPalletToShipment = async (code: string, currentShipment: ShipmentWithCounts, currentSoundEnabled: boolean, currentUserName: string) => {
        try {
            const pallet = await palletRepository.getByCode(code);
            if (!pallet) {
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "pallet",
                    name: "Bulunamadı",
                    timestamp: new Date(),
                    success: false,
                    message: `${code} kodlu palet bulunamadı`,
                });
                return;
            }

            // Department check - different user's pallet
            if (pallet.created_by && pallet.created_by !== currentUserName) {
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "pallet",
                    name: pallet.name,
                    timestamp: new Date(),
                    success: false,
                    message: `⚠️ Bu başka departmanın paletidir (${pallet.created_by})`,
                });
                return;
            }

            if (pallet.shipment_code && pallet.shipment_code !== currentShipment.code) {
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "pallet",
                    name: pallet.name,
                    timestamp: new Date(),
                    success: false,
                    message: `Başka sevkiyatta: ${pallet.shipment_code}`,
                });
                return;
            }

            if (pallet.shipment_code === currentShipment.code) {
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "pallet",
                    name: pallet.name,
                    timestamp: new Date(),
                    success: false,
                    message: "Zaten bu sevkiyatta",
                });
                return;
            }

            // Add pallet directly
            await palletRepository.setShipment(code, currentShipment.code);
            showFlash("green");
            if (currentSoundEnabled) playBeep(true);
            setScanCount((prev) => ({ ...prev, pallets: prev.pallets + 1 }));
            addScannedItem({
                code,
                type: "pallet",
                name: pallet.name,
                timestamp: new Date(),
                success: true,
                message: "Sevkiyata eklendi ✓",
            });
            // Show success notification
            showSuccessNotification("pallet", pallet.name, currentShipment.name_or_plate);
        } catch (error) {
            showFlash("red");
            if (currentSoundEnabled) playBeep(false);
            addScannedItem({
                code,
                type: "pallet",
                name: code,
                timestamp: new Date(),
                success: false,
                message: "Ekleme hatası",
            });
        }
    };

    const addBoxToShipment = async (code: string, currentShipment: ShipmentWithCounts, currentSoundEnabled: boolean, currentUserName: string) => {
        try {
            const box = await boxRepository.getByCode(code);
            if (!box) {
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "box",
                    name: "Bulunamadı",
                    timestamp: new Date(),
                    success: false,
                    message: `${code} kodlu koli bulunamadı`,
                });
                return;
            }

            // Department check - different user's box
            if (box.created_by && box.created_by !== currentUserName) {
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "box",
                    name: box.name,
                    timestamp: new Date(),
                    success: false,
                    message: `⚠️ Bu başka departmanın kolisidir (${box.created_by})`,
                });
                return;
            }

            // Already in this shipment check (any mode)
            if (box.shipment_code === currentShipment.code) {
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "box",
                    name: box.name,
                    timestamp: new Date(),
                    success: false,
                    message: "Zaten bu sevkiyatta",
                });
                return;
            }

            // Already in another shipment check
            if (box.shipment_code && box.shipment_code !== currentShipment.code) {
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "box",
                    name: box.name,
                    timestamp: new Date(),
                    success: false,
                    message: `Başka sevkiyatta: ${box.shipment_code}`,
                });
                return;
            }

            // Check if it's a direct shipment box
            if (box.is_direct_shipment) {
                // Direct shipment box - add directly
                await boxRepository.update(code, { shipment_code: currentShipment.code });
                showFlash("green");
                if (currentSoundEnabled) playBeep(true);
                setScanCount((prev) => ({ ...prev, boxes: prev.boxes + 1 }));
                addScannedItem({
                    code,
                    type: "box",
                    name: box.name,
                    timestamp: new Date(),
                    success: true,
                    message: "Direk sevkiyata eklendi ✓",
                });
                showSuccessNotification("box", box.name, currentShipment.name_or_plate);
            } else if (box.pallet_code) {
                // Regular box with pallet - add the pallet to shipment
                const palletCode = box.pallet_code;
                const pallet = await palletRepository.getByCode(palletCode);

                if (!pallet) {
                    showFlash("red");
                    if (currentSoundEnabled) playBeep(false);
                    addScannedItem({
                        code,
                        type: "box",
                        name: box.name,
                        timestamp: new Date(),
                        success: false,
                        message: `Palet (${palletCode}) bulunamadı`,
                    });
                    return;
                }

                if (pallet.shipment_code === currentShipment.code) {
                    showFlash("green");
                    if (currentSoundEnabled) playBeep(true);
                    addScannedItem({
                        code,
                        type: "box",
                        name: box.name,
                        timestamp: new Date(),
                        success: true,
                        message: `Paleti (${palletCode}) zaten bu sevkiyatta`,
                    });
                } else if (pallet.shipment_code && pallet.shipment_code !== currentShipment.code) {
                    showFlash("red");
                    if (currentSoundEnabled) playBeep(false);
                    addScannedItem({
                        code,
                        type: "box",
                        name: box.name,
                        timestamp: new Date(),
                        success: false,
                        message: `Paleti (${palletCode}) başka sevkiyatta`,
                    });
                } else {
                    // Pallet has no shipment - add it
                    await palletRepository.setShipment(palletCode, currentShipment.code);
                    showFlash("green");
                    if (currentSoundEnabled) playBeep(true);
                    setScanCount((prev) => ({ ...prev, pallets: prev.pallets + 1 }));
                    addScannedItem({
                        code,
                        type: "box",
                        name: box.name,
                        timestamp: new Date(),
                        success: true,
                        message: `Paleti (${palletCode}) sevkiyata eklendi ✓`,
                    });
                    showSuccessNotification("pallet", `${pallet.name} (${box.name} kolisinden)`, currentShipment.name_or_plate);
                }
            } else {
                // Not direct shipment, no pallet - ask user for confirmation
                showFlash("red");
                if (currentSoundEnabled) playBeep(false);
                addScannedItem({
                    code,
                    type: "box",
                    name: box.name,
                    timestamp: new Date(),
                    success: false,
                    message: "⚠️ Direk sevkiyata eklenmemiş - Onay bekleniyor",
                });
                // Show confirmation dialog
                setConfirmDialog({
                    open: true,
                    code: code,
                    boxName: box.name,
                    shipment: currentShipment,
                    soundOn: currentSoundEnabled,
                });
            }
        } catch (error) {
            showFlash("red");
            if (currentSoundEnabled) playBeep(false);
            addScannedItem({
                code,
                type: "box",
                name: code,
                timestamp: new Date(),
                success: false,
                message: "Ekleme hatası",
            });
        }
    };

    // Handle confirmation: add non-direct box to shipment
    const handleConfirmAddBox = async () => {
        const { code, boxName, shipment, soundOn } = confirmDialog;
        setConfirmDialog(prev => ({ ...prev, open: false }));
        if (!shipment) return;

        try {
            // Mark as direct shipment and add to shipment
            await boxRepository.update(code, { is_direct_shipment: true, shipment_code: shipment.code });
            showFlash("green");
            if (soundOn) playBeep(true);
            setScanCount((prev) => ({ ...prev, boxes: prev.boxes + 1 }));
            // Update the scanned item to success
            setScannedItems(prev => prev.map(item =>
                item.code === code && !item.success
                    ? { ...item, success: true, message: "Onaylandı - Sevkiyata eklendi ✓" }
                    : item
            ));
            showSuccessNotification("box", boxName, shipment.name_or_plate);
        } catch (error) {
            showFlash("red");
            if (soundOn) playBeep(false);
            toast({
                title: "Hata",
                description: "Koli eklenemedi",
                variant: "destructive",
            });
        }
    };

    const handleCancelAddBox = () => {
        const { code } = confirmDialog;
        setConfirmDialog(prev => ({ ...prev, open: false }));
        // Allow re-scanning this code
        setTimeout(() => {
            processedCodesRef.current.delete(code);
        }, 1000);
    };

    const addScannedItem = (item: ScannedItem) => {
        setScannedItems((prev) => [item, ...prev].slice(0, 50));
    };

    const showFlash = (color: "green" | "red") => {
        setFlashColor(color);
        setTimeout(() => setFlashColor(null), 400);
    };

    const handleBackToSelect = async () => {
        await stopScanner();
        setPhase("select");
        setSelectedShipment(null);
        setScannedItems([]);
        processedCodesRef.current = new Set();
        await loadData();
    };

    const handleResetScans = () => {
        processedCodesRef.current = new Set();
        toast({
            title: "Sıfırlandı",
            description: "Aynı QR kodları tekrar okunabilir",
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="relative mx-auto w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-emerald-200" />
                        <div
                            className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"
                            style={{ animationDuration: "0.8s" }}
                        />
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                            <ScanLine className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <p className="mt-4 text-slate-600 font-medium animate-pulse">
                        Terminal Modu yükleniyor...
                    </p>
                </div>
            </div>
        );
    }

    // ==================== PHASE 1: SHIPMENT SELECTION ====================
    if (phase === "select") {
        return (
            <div className="space-y-4 sm:space-y-6 px-0 sm:px-1">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4"
                >
                    <div className="flex items-center gap-3 sm:gap-4">
                        <motion.div
                            className="relative"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl sm:rounded-2xl blur-lg opacity-40"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.5, 0.3],
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                            <div className="relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/30">
                                <ScanLine className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                        </motion.div>

                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                                Terminal Modu
                                <motion.span
                                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                                </motion.span>
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
                                Sevkiyat seçin → Kamera ile seri QR tarama
                            </p>
                        </div>
                    </div>

                    {/* Create New Shipment Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            onClick={() => setCreateDialogOpen(true)}
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 h-12 sm:h-10 text-base sm:text-sm active:scale-95 transition-transform"
                        >
                            <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                            Yeni Sevkiyat Oluştur
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Shipment List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {shipments.length === 0 ? (
                        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0],
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200 mb-6"
                                >
                                    <Truck className="h-16 w-16 text-emerald-500" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                    Henüz sevkiyat yok
                                </h3>
                                <p className="text-slate-500 text-center max-w-sm mb-6">
                                    QR taramaya başlamak için önce bir sevkiyat oluşturun
                                </p>
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    İlk Sevkiyatı Oluştur
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-slate-500 px-1">
                                Tarama için bir sevkiyat seçin:
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                {shipments.map((shipment, index) => (
                                    <motion.div
                                        key={shipment.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card
                                            className="relative overflow-hidden border-slate-200 bg-white/80 backdrop-blur-sm hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all cursor-pointer group active:scale-[0.98]"
                                            onClick={() => handleSelectShipment(shipment)}
                                        >
                                            <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 group-hover:from-emerald-200 group-hover:to-teal-200 transition-colors">
                                                    <Truck className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-800 truncate group-hover:text-emerald-600 transition-colors text-lg">
                                                        {shipment.name_or_plate}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-mono">
                                                        {shipment.code}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="text-center">
                                                        <p className="font-bold text-indigo-600">{shipment.pallet_count}</p>
                                                        <p className="text-[10px] text-slate-400">Palet</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-pink-600">{shipment.box_count}</p>
                                                        <p className="text-[10px] text-slate-400">Koli</p>
                                                    </div>
                                                </div>
                                                <motion.div
                                                    className="p-2 rounded-lg bg-emerald-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    whileHover={{ scale: 1.1 }}
                                                >
                                                    <Camera className="w-5 h-5" />
                                                </motion.div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Create Shipment Dialog */}
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogContent className="sm:max-w-md border-emerald-200">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-emerald-600">
                                <Truck className="h-5 w-5" />
                                Yeni Sevkiyat Oluştur
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="Sevkiyat adı veya plaka..."
                                value={newShipmentName}
                                onChange={(e) => setNewShipmentName(e.target.value)}
                                className="h-12 text-lg"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateShipment();
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                                İptal
                            </Button>
                            <Button
                                onClick={handleCreateShipment}
                                disabled={creating || !newShipmentName.trim()}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500"
                            >
                                {creating ? "Oluşturuluyor..." : "Oluştur ve Taramaya Başla"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ==================== PHASE 2: SCANNING ====================
    return (
        <div className="relative min-h-[calc(100vh-8rem)]">
            {/* Flash overlay */}
            <AnimatePresence>
                {flashColor && (
                    <motion.div
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`fixed inset-0 z-50 pointer-events-none ${flashColor === "green"
                            ? "bg-emerald-500/30"
                            : "bg-red-500/30"
                            }`}
                    />
                )}
            </AnimatePresence>

            {/* Top Bar - Selected Shipment Info */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-30 mb-4"
            >
                <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/95 to-teal-50/95 backdrop-blur-xl shadow-lg">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBackToSelect}
                                className="shrink-0 hover:bg-emerald-100"
                            >
                                <ArrowLeft className="h-5 w-5 text-emerald-700" />
                            </Button>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <h2 className="font-bold text-emerald-800 truncate text-sm sm:text-base">
                                        {selectedShipment?.name_or_plate}
                                    </h2>
                                </div>
                                <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                                    {selectedShipment?.code}
                                </p>
                            </div>

                            {/* Scan counters */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="text-center px-2 py-1 rounded-lg bg-indigo-100 border border-indigo-200">
                                    <p className="font-bold text-indigo-700 text-sm sm:text-lg">{scanCount.pallets}</p>
                                    <p className="text-[8px] sm:text-[10px] text-indigo-500">Palet</p>
                                </div>
                                <div className="text-center px-2 py-1 rounded-lg bg-pink-100 border border-pink-200">
                                    <p className="font-bold text-pink-700 text-sm sm:text-lg">{scanCount.boxes}</p>
                                    <p className="text-[8px] sm:text-[10px] text-pink-500">Koli</p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className="shrink-0 h-8 w-8"
                                >
                                    {soundEnabled ? (
                                        <Volume2 className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                        <VolumeX className="h-4 w-4 text-slate-400" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleResetScans}
                                    className="shrink-0 h-8 w-8"
                                    title="Taranan kodları sıfırla"
                                >
                                    <RotateCcw className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Camera / QR Scanner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
            >
                <Card className="border-emerald-200 overflow-hidden bg-black/5">
                    <div className="relative">
                        <div
                            id="terminal-qr-reader"
                            ref={videoContainerRef}
                            className="w-full"
                            style={{ minHeight: "300px" }}
                        />
                        {/* Scanning indicator overlay */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                            <motion.div
                                className="w-2 h-2 rounded-full bg-emerald-400"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <span className="text-xs text-white font-medium">
                                {isProcessing ? "İşleniyor..." : "Taranıyor..."}
                            </span>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Scanned Items List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ScanLine className="h-4 w-4 text-emerald-600" />
                        <h3 className="font-semibold text-slate-700 text-sm">
                            Taranan Öğeler ({scannedItems.length})
                        </h3>
                    </div>
                    {scannedItems.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1 text-emerald-600">
                                <Check className="h-3 w-3" />
                                {scannedItems.filter((i) => i.success).length} başarılı
                            </span>
                            {scannedItems.filter((i) => !i.success).length > 0 && (
                                <span className="flex items-center gap-1 text-red-500">
                                    <X className="h-3 w-3" />
                                    {scannedItems.filter((i) => !i.success).length} hatalı
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {scannedItems.length === 0 ? (
                    <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/50">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <ScanLine className="h-10 w-10 text-emerald-400 mb-3" />
                            </motion.div>
                            <p className="text-sm text-slate-500 text-center">
                                QR kodlarını kameraya gösterin
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Koli veya palet QR kodları okutulabilir
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                        <AnimatePresence initial={false}>
                            {scannedItems.map((item, index) => (
                                <motion.div
                                    key={`${item.code}-${item.timestamp.getTime()}`}
                                    initial={{ opacity: 0, x: -20, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: "auto" }}
                                    exit={{ opacity: 0, x: 20, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card
                                        className={`border ${item.success
                                            ? "border-emerald-200 bg-emerald-50/80"
                                            : "border-red-200 bg-red-50/80"
                                            }`}
                                    >
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <div
                                                className={`p-1.5 rounded-lg ${item.success
                                                    ? "bg-emerald-100 text-emerald-600"
                                                    : "bg-red-100 text-red-600"
                                                    }`}
                                            >
                                                {item.type === "pallet" ? (
                                                    <Layers className="h-4 w-4" />
                                                ) : (
                                                    <Package className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm text-slate-800 truncate">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                                        {item.code}
                                                    </span>
                                                </div>
                                                <p
                                                    className={`text-xs ${item.success ? "text-emerald-600" : "text-red-500"
                                                        }`}
                                                >
                                                    {item.message}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 shrink-0">
                                                {formatTime(item.timestamp)}
                                            </span>
                                            {item.success ? (
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Confirmation Dialog - Non-direct box */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => { if (!open) handleCancelAddBox(); }}>
                <DialogContent className="sm:max-w-md border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-700">
                            <AlertCircle className="h-5 w-5" />
                            Koli Direk Sevkiyata Eklenmemiş
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3">
                        <p className="text-sm text-slate-700">
                            <strong>{confirmDialog.boxName}</strong> ({confirmDialog.code}) kolisi direk sevkiyat olarak işaretlenmemiştir.
                        </p>
                        <p className="text-sm text-slate-600">
                            Bu koliyi <strong>{confirmDialog.shipment?.name_or_plate}</strong> sevkiyatına direk olarak eklemek istiyor musunuz?
                        </p>
                        <div className="bg-amber-100/60 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs text-amber-700">
                                ⚠️ Onaylarsanız koli &quot;Direk Sevkiyat&quot; olarak işaretlenip sevkiyata eklenecektir.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={handleCancelAddBox}>
                            İptal
                        </Button>
                        <Button
                            onClick={handleConfirmAddBox}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Evet, Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Notification Dialog */}
            <AnimatePresence>
                {successDialog.open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm"
                    >
                        <Card className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-2xl shadow-emerald-500/20">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-emerald-500 text-white shrink-0">
                                    <Check className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-emerald-800 text-sm">
                                        {successDialog.type === "pallet" ? "Palet" : "Koli"} Eklendi ✓
                                    </p>
                                    <p className="text-xs text-emerald-600 truncate">
                                        <strong>{successDialog.itemName}</strong> → {successDialog.shipmentName}
                                    </p>
                                </div>
                                <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse shrink-0" />
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
