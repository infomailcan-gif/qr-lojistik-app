"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { shipmentRepository } from "@/lib/repositories/shipment";
import { auth } from "@/lib/auth";

export default function NewShipmentPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [nameOrPlate, setNameOrPlate] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const session = await auth.getSession();
    if (session) {
      setUserName(session.user.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameOrPlate.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen plaka veya sevkiyat adı girin",
        variant: "destructive",
      });
      return;
    }

    if (!userName) {
      toast({
        title: "Hata",
        description: "Oturum bilgisi bulunamadı",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const shipment = await shipmentRepository.create(
        { name_or_plate: nameOrPlate.trim() },
        userName
      );

      toast({
        title: "Sevkiyat Oluşturuldu",
        description: `${shipment.code} kodu ile sevkiyat oluşturuldu`,
      });

      router.push(`/app/shipments/${shipment.code}`);
    } catch (error) {
      console.error("Error creating shipment:", error);
      toast({
        title: "Hata",
        description: "Sevkiyat oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-background/50 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Yeni Sevkiyat</h1>
              <p className="text-sm text-muted-foreground">Tır/sevkiyat oluştur</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-500" />
                Sevkiyat Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name or Plate */}
                <div className="space-y-2">
                  <Label htmlFor="nameOrPlate">
                    Plaka veya Sevkiyat Adı *
                  </Label>
                  <Input
                    id="nameOrPlate"
                    placeholder="Örn: 16 ABC 123 veya Tır-1"
                    value={nameOrPlate}
                    onChange={(e) => setNameOrPlate(e.target.value)}
                    className="h-12 text-lg"
                    disabled={loading}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Tırın plakasını veya sevkiyata özel bir ad girin
                  </p>
                </div>

                {/* Info Card */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Package className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Sonraki Adım
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sevkiyat oluşturduktan sonra paletleri ekleyebilirsiniz.
                        Her palet sadece bir sevkiyata eklenebilir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="flex-1 h-12"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !nameOrPlate.trim()}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                  >
                    {loading ? "Oluşturuluyor..." : "Sevkiyat Oluştur"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
