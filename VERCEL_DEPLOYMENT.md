# 🚀 VERCEL DEPLOYMENT - SIFIRDAN KURULUM

## ✅ ADIM 1: ESKİ PROJEYİ SİL (MUTLAKA!)

1. https://vercel.com/dashboard adresine git
2. Sol menüden **qr-lojistik-app** projesini bul
3. Projeye tıkla
4. **Settings** (en üst menü)
5. En alta kadar scroll et
6. **Delete Project** butonuna tıkla
7. Proje adını yaz ve **DELETE** et

---

## ✅ ADIM 2: YENİ PROJE OLUŞTUR

1. https://vercel.com/new adresine git
2. **Import Git Repository** seçeneğini seç
3. GitHub'dan **qr-lojistik-app** repo'sunu seç
   - Repo linki: `https://github.com/infomailcan-gif/qr-lojistik-app`
4. **Import** butonuna tıkla

---

## ✅ ADIM 3: PROJE AYARLARI

### Framework Preset:
- **Next.js** (otomatik algılanmalı)

### Build Command:
```
npm run build
```

### Output Directory:
```
.next
```

### Install Command:
```
npm install
```

---

## ✅ ADIM 4: ENVIRONMENT VARIABLES (ÇOK ÖNEMLİ!)

**Deploy butonuna BASILMA!** Önce Environment Variables ekle:

1. **Environment Variables** bölümünü aç
2. Şu 2 değişkeni ekle:

### Variable 1:
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://qwfxnnwychrlysjrztnp.supabase.co
```

### Variable 2:
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: sb_publishable_x4RXKlDMnxjXd3k_2Wx8-w_-TJOeOV8
```

**DİKKAT:** 
- Mutlaka **"Value"** seçeneğini kullan (Secret değil!)
- Copy-paste yap (typo olmasın!)
- Environment: **Production, Preview, Development** (hepsini işaretle)

---

## ✅ ADIM 5: DEPLOY!

1. **Deploy** butonuna tıkla
2. 2-3 dakika bekle
3. Build başarılı olursa **Visit** butonuna tıkla
4. URL'yi bana gönder! 🎉

---

## 🔧 SUPABASE BİLGİLERİ

- **Project URL:** https://qwfxnnwychrlysjrztnp.supabase.co
- **Project ID:** qwfxnnwychrlysjrztnp
- **Publishable Key:** sb_publishable_x4RXKlDMnxjXd3k_2Wx8-w_-TJOeOV8
- **Dashboard:** https://supabase.com/dashboard/project/qwfxnnwychrlysjrztnp

---

## ❌ SORUN OLURSA:

1. Build loglarının ekran görüntüsünü at
2. Ben düzelteyim 🔧

