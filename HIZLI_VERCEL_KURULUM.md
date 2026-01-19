# ⚡ 5 Dakikada Vercel'e Deploy

## 🎯 Özet

Kod GitHub'a push edildi. Şimdi sadece Vercel'de 2 environment variable eklemen gerekiyor.

## 📝 3 Adımda Kurulum

### 1️⃣ Vercel Dashboard'a Git

https://vercel.com/dashboard

### 2️⃣ Environment Variables Ekle

**Proje:** QR Lojistik (veya benzeri isim)
**Yol:** Settings → Environment Variables

**Ekle:**

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://qwfxnnwychrlysjrztnp.supabase.co
✅ Production ✅ Preview ✅ Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Znhubnd5Y2hybHlzanJ6dG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjI3NjAsImV4cCI6MjA4NDMzODc2MH0.awVBYyMTkkFHhDwm4DQcBC5yfsyGJngPluXv3S19-GQ
✅ Production ✅ Preview ✅ Development
```

### 3️⃣ Redeploy

**Yol:** Deployments → En son deployment → "..." → Redeploy

✅ **TAMAM!**

## 🌐 Production URL

Vercel'deki URL'iniz (örn: `qr-lojistik.vercel.app`) artık çalışıyor!

## ✅ Test

1. Production URL'yi aç
2. `superadmin` ile giriş yap
3. Koli oluştur
4. Mobilden aç - aynı koli görünmeli!

---

**Kod hazır, deploy bekliyor!** 🚀


