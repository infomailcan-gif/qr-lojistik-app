"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Layers, Sparkles } from "lucide-react";
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
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-white/80 hover:bg-white border border-slate-200">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Layers className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent flex items-center gap-2">
              Yeni Palet Oluştur
              <motion.span
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-amber-500" />
              </motion.span>
            </h1>
            <p className="text-sm text-slate-500">
              Kolileri gruplamak için palet oluşturun
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Layers className="h-5 w-5 text-cyan-600" />
              Palet Bilgileri
            </CardTitle>
            <CardDescription className="text-slate-500">
              Palete tanımlayıcı bir isim verin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700">
                  Palet Adı *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Örn: Depo Palet-3, Restoran Taşıma-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`h-12 bg-white/50 border-slate-200 focus:border-cyan-400 ${error ? "border-red-500" : ""}`}
                  disabled={loading}
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
                <p className="text-xs text-slate-400">
                  Palet oluşturduktan sonra koli ekleyebilirsiniz
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 shadow-lg shadow-cyan-500/25"
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
              </motion.div>
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
        <Card className="border-slate-200/60 bg-gradient-to-br from-cyan-50 to-teal-50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-800">
              <span className="text-2xl">ℹ️</span>
              Palet Hakkında
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">•</span>
                <span>
                  Palet oluşturduktan sonra <strong className="text-slate-700">kapalı kolileri</strong>{" "}
                  palete ekleyebilirsiniz
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">•</span>
                <span>
                  Her koli <strong className="text-slate-700">sadece bir</strong> palete eklenebilir
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">•</span>
                <span>
                  Palet için benzersiz bir <strong className="text-slate-700">PAL kodu</strong>{" "}
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











