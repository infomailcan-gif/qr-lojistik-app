# 🎯 ADIM ADIM DEVAM REHBERİ

## 📍 ŞU ANDA NEREDEYIZ?

Backend hazır! Şimdi sadece:
1. Local'de test etmek
2. Vercel'e deploy etmek kaldı

---

## 1️⃣ SUPABASE'İ KONTROL EDİN

### Adım 1: Supabase Dashboard'a Girin
1. 🌐 https://supabase.com/dashboard adresine gidin
2. Giriş yapın (infomailcan@gmail.com)

### Adım 2: Projenizi Açın
- **Proje Adı**: infomailcan@gmail.com's Project
- **Region**: Europe North (Stockholm)
- **Durum**: 🟢 Active

### Adım 3: Tabloları Kontrol Edin
Sol menüden **Table Editor** tıklayın ve şu tabloları göreceksiniz:
- ✅ `departments` (9 departman var)
- ✅ `boxes` (koli tablosu)
- ✅ `box_lines` (koli içerikleri)
- ✅ `pallets` (palet tablosu)
- ✅ `shipments` (sevkiyat tablosu)

### Adım 4: Storage'ı Kontrol Edin
Sol menüden **Storage** tıklayın:
- ✅ `box-photos` bucket'ını göreceksiniz (fotoğraflar için)

---

## 2️⃣ LOCAL'DE TEST EDİN

### Adım 1: .env.local Dosyası Oluşturun

**Windows PowerShell'de** (proje klasöründe):

```powershell
# .env.local dosyası oluştur
@"
NEXT_PUBLIC_SUPABASE_URL=https://vrjzrveomregcfvusekz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_h9xfB46sbhYBEseBKUkTsA_gpzR2D-B
"@ | Out-File -FilePath .env.local -Encoding utf8
```

### Adım 2: Paketleri Yükleyin (eğer henüz yapmadıysanız)

```powershell
npm install
```

### Adım 3: Development Server'ı Başlatın

```powershell
npm run dev
```

### Adım 4: Test Edin
1. Tarayıcıda: http://localhost:3000
2. Login: `admin` / `admin123`
3. Yeni bir koli oluşturun
4. **Supabase Table Editor'de** boxes tablosuna bakın - kaydı göreceksiniz!

---

## 3️⃣ VERCEL'E DEPLOY EDİN

### YÖNTEMİ SEÇİN:

#### 🚀 YÖNTEM A: Vercel CLI (Hızlı - 5 dakika)

```powershell
# 1. Vercel'e giriş yapın
vercel login

# 2. Deploy başlatın
vercel

# Sorular gelecek:
# ? Set up and deploy "~\Desktop\LOJİSTİK"? [Y/n] → Y yazın
# ? Which scope? → Kendi hesabınızı seçin
# ? Link to existing project? [y/N] → N yazın
# ? What's your project's name? → qr-lojistik
# ? In which directory is your code located? → ./ (Enter)

# 3. Environment variables ekleyin:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Değer: https://vrjzrveomregcfvusekz.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Değer: sb_publishable_h9xfB46sbhYBEseBKUkTsA_gpzR2D-B

# 4. Production deploy
vercel --prod
```

#### 🐙 YÖNTEM B: GitHub + Vercel (Önerilen - 10 dakika)

```powershell
# 1. GitHub'da yeni repository oluşturun:
#    - https://github.com/new
#    - Repo adı: qr-lojistik
#    - Private veya Public seçin
#    - Create repository

# 2. Git remote ekleyin (KULLANICI_ADINIZ yerine kendi kullanıcı adınızı yazın):
git remote add origin https://github.com/KULLANICI_ADINIZ/qr-lojistik.git

# 3. Push yapın:
git branch -M main
git push -u origin main

# 4. Vercel Dashboard'a gidin:
#    - https://vercel.com/new
#    - "Import Git Repository" seçin
#    - qr-lojistik repo'nuzu seçin
#    - "Import" tıklayın

# 5. Environment Variables ekleyin (Vercel'de):
#    NEXT_PUBLIC_SUPABASE_URL = https://vrjzrveomregcfvusekz.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_h9xfB46sbhYBEseBKUkTsA_gpzR2D-B

# 6. "Deploy" tıklayın!
```

---

## ✅ DEPLOYMENT SONRASI

Deploy tamamlandığında:
1. ✅ Vercel size bir URL verecek: `https://qr-lojistik.vercel.app`
2. ✅ Siteyi açın ve test edin
3. ✅ Mobil telefondan QR kodları test edin

---

## 🆘 SORUN ÇIKARSA

### Supabase'de veri görünmüyor?
```powershell
# Tabloları kontrol edin:
# Supabase Dashboard → SQL Editor → New query:
SELECT * FROM departments;
SELECT * FROM boxes;
```

### Local'de bağlantı hatası?
- `.env.local` dosyasının doğru oluşturulduğunu kontrol edin
- Development server'ı yeniden başlatın: `npm run dev`

### Vercel'de hata?
- Environment variables'ların doğru eklendiğini kontrol edin
- Vercel Dashboard → Settings → Environment Variables
- Değişiklik yaptıysanız "Redeploy" yapın

---

## 📞 YARDIM İÇİN

Ben buradayım! Hangi adımda sorun yaşarsanız söyleyin, birlikte çözelim.

**ŞU ANDA HANGİ ADIMI YAPMAK İSTERSİNİZ?**
1. Local'de test etmek
2. Vercel'e deploy etmek
3. Supabase'i kontrol etmek



