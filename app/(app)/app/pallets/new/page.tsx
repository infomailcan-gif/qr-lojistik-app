"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { palletRepository } from "@/lib/repositories/pallet";
import { auth } from "@/lib/auth";

export default function NewPalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Palet adı gerekli");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const pallet = await palletRepository.create(
        { name: name.trim() },
        session.user.name
      );

      toast({
        title: "Palet oluşturuldu",
        description: `${pallet.code} başarıyla oluşturuldu`,
      });

      router.push(`/app/pallets/${pallet.code}`);
    } catch (err) {
      toast({
        title: "Hata",
        description: "Palet oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Palet Oluştur</h1>
          <p className="text-muted-foreground">
            Kolileri gruplamak için palet oluşturun
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-6 w-6 text-cyan-500" />
              Palet Bilgileri
            </CardTitle>
            <CardDescription>
              Palete tanımlayıcı bir isim verin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Palet Adı *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Örn: Depo Palet-3, Restoran Taşıma-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`h-12 ${error ? "border-destructive" : ""}`}
                  disabled={loading}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Palet oluşturduktan sonra koli ekleyebilirsiniz
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-cyan-600 hover:bg-cyan-700"
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Save className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Palet Oluştur
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">ℹ️</span>
              Palet Hakkında
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">•</span>
                <span>
                  Palet oluşturduktan sonra <strong>kapalı kolileri</strong>{" "}
                  palete ekleyebilirsiniz
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">•</span>
                <span>
                  Her koli <strong>sadece bir</strong> palete eklenebilir
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">•</span>
                <span>
                  Palet için benzersiz bir <strong>PAL kodu</strong>{" "}
                  otomatik oluşturulur
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}










