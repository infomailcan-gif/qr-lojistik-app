# 🚀 Vercel Production Deployment Rehberi

## ✅ Yapılan İşlemler

1. ✅ Kod GitHub'a push edildi
   - Repo: `infomailcan-gif/qr-lojistik-app`
   - Branch: `main`
   - Commit: "feat: Supabase entegrasyonu tamamlandı"

2. ⏳ Vercel'de Environment Variables Eklenmeli

## 📝 Yapılması Gerekenler

### Seçenek 1: Vercel Dashboard (Web) - Önerilen

1. **Vercel Dashboard'a Git**
   - https://vercel.com/dashboard adresine git
   - "infomailcan-9000's projects" team'ine gir

2. **Projeyi Bul**
   - `qr-lojistik-app` veya `qr-lojistik` projesini bul
   - Projeye tıkla

3. **Settings'e Git**
   - "Settings" sekmesine tıkla
   - Sol menüden "Environment Variables" seç

4. **Supabase Variables Ekle**
   
   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://qwfxnnwychrlysjrztnp.supabase.co`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - "Save" butonuna tıkla

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Znhubnd5Y2hybHlzanJ6dG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjI3NjAsImV4cCI6MjA4NDMzODc2MH0.awVBYyMTkkFHhDwm4DQcBC5yfsyGJngPluXv3S19-GQ`
   - Environment: ✅ Production, ✅ Preview, ✅ Development
   - "Save" butonuna tıkla

5. **Redeploy Et**
   - Üst menüden "Deployments" sekmesine git
   - En son deployment'ın yanındaki "..." menüsüne tıkla
   - "Redeploy" seç
   - Onay için "Redeploy" butonuna tıkla

### Seçenek 2: Vercel CLI (Terminal)

```bash
# Vercel'e giriş yap (tarayıcı açılacak)
vercel login

# Proje ile link et
vercel link

# Environment variables ekle
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Değer: https://qwfxnnwychrlysjrztnp.supabase.co
# Production? Y
# Preview? Y
# Development? Y

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Değer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Znhubnd5Y2hybHlzanJ6dG5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjI3NjAsImV4cCI6MjA4NDMzODc2MH0.awVBYyMTkkFHhDwm4DQcBC5yfsyGJngPluXv3S19-GQ
# Production? Y
# Preview? Y
# Development? Y

# Deploy et
vercel --prod
```

## 🔍 Kontrol Et

### 1. Build Başarılı mı?

Vercel Dashboard → Deployments → En son deployment

- ✅ **Building**: Kod derleniyor
- ✅ **Ready**: Deploy başarılı!
- ❌ **Error**: Hata var - loglara bak

### 2. Environment Variables Doğru mu?

Settings → Environment Variables

Her iki değişken de gösterilmeli:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Site Çalışıyor mu?

Production URL'nizi açın (örn: `https://qr-lojistik-app.vercel.app`)

1. Giriş sayfası açılıyor mu? ✅
2. Bir kullanıcı ile giriş yapın
3. Dashboard açılıyor mu? ✅
4. Koli oluştur
5. Supabase'de görünüyor mu? ✅

## 🎯 Production URL

Vercel'deki projenizin URL'si:
- https://[proje-adı].vercel.app
- veya kendi domain'iniz

## 📱 Mobil Test

Production URL'yi telefondan da test edin:
- WiFi gerekliliği YOK (artık production'da)
- Her yerden erişilebilir
- Tüm cihazlar senkronize

## ⚠️ Önemli Notlar

### Güvenlik

1. **Environment Variables Gizli**
   - `.env.local` dosyası Git'e push edilmedi (.gitignore'da)
   - Güvenli! ✅

2. **Supabase RLS Aktif**
   - Row Level Security politikaları çalışıyor
   - Public access tanımlı (istediğiniz gibi değiştirilebilir)

### Otomatik Deploy

GitHub'a her push yaptığınızda:
- ✅ Vercel otomatik deploy eder
- ✅ Preview URL oluşturur
- ✅ PR'lar için ayrı preview
- ✅ main branch → production

### Branch Strategy

```
main (production)
  ↓ auto-deploy
  Vercel Production

feature/* (geliştirme)
  ↓ PR → auto-deploy
  Vercel Preview URL
```

## 🔧 Sorun Giderme

### Build Hatası

1. Vercel Dashboard → Deployments → Hatalı deployment
2. "View Function Logs" tıkla
3. Hatayı oku
4. Düzelt → Git push → Otomatik redeploy

### Environment Variables Çalışmıyor

1. Variables'ı tekrar kontrol et
2. Redeploy et (values değişince redeploy gerekli)
3. Hard refresh yap (Ctrl+Shift+R)

### Supabase Bağlantı Hatası

1. `.env.local` değerleri ile Vercel değerlerini karşılaştır
2. Supabase URL ve Key doğru mu?
3. Supabase projesi aktif mi?

### DNS / Domain Sorunları

1. Vercel Dashboard → Settings → Domains
2. Domain'iniz tanımlı mı?
3. DNS ayarları doğru mu?

## 📊 Monitoring

### Vercel Analytics

Settings → Analytics'ten aktifleştir:
- ✅ Page view'lar
- ✅ Performance metrics
- ✅ User geolocation

### Supabase Monitoring

Supabase Dashboard:
- ✅ Database usage
- ✅ API requests
- ✅ Storage usage

## 🎉 Başarı Kriterleri

- ✅ Environment variables eklendi
- ✅ Build başarılı (yeşil check)
- ✅ Production URL'de site açılıyor
- ✅ Giriş çalışıyor
- ✅ Koli oluşturma/listeleme çalışıyor
- ✅ Supabase'e kayıt oluyor
- ✅ Mobilden erişilebiliyor

## 📞 Yardım

Sorun mu var?

1. **Vercel Logs**: Deployment loglarına bak
2. **Browser Console**: F12 → Console'a bak
3. **Supabase Logs**: Supabase Dashboard → Logs
4. **Network Tab**: F12 → Network → API çağrılarını izle

---

**Hazırlayan**: AI Assistant
**Tarih**: 19 Ocak 2026
**Durum**: Kod hazır, environment variables bekleniyor






