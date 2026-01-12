# 🚀 SUPABASE VE VERCEL KURULUM REHBERİ

Bu rehber, projeyi Supabase'e bağlamak ve Vercel'e deploy etmek için gereken tüm adımları içerir.

---

## 📝 ADIM 1: SUPABASE PROJESİ OLUŞTURMA

### 1.1 Supabase Hesabı Oluşturun
1. [https://supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın (veya email ile kayıt olun)

### 1.2 Yeni Proje Oluşturun
1. Supabase dashboard'da "New Project" butonuna tıklayın
2. Proje bilgilerini doldurun:
   - **Name**: qr-lojistik (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre belirleyin (NOT: Bu şifreyi kaydedin!)
   - **Region**: Europe (Central EU - Frankfurt) - Size en yakın bölgeyi seçin
   - **Pricing Plan**: Free tier yeterli olacaktır
3. "Create new project" butonuna tıklayın
4. Proje oluşturulurken 1-2 dakika bekleyin

---

## 🔑 ADIM 2: SUPABASE API ANAHTARLARINI ALMA

### 2.1 API Anahtarlarını Bulun
1. Supabase dashboard'da sol menüden "Project Settings" (dişli ikonu) tıklayın
2. "API" sekmesine tıklayın
3. Şu bilgileri kopyalayın:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (çok uzun bir string)

### 2.2 .env.local Dosyası Oluşturun
1. Proje ana dizininde `.env.local` adında yeni bir dosya oluşturun
2. Aşağıdaki içeriği yapıştırın ve değerleri doldurun:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**ÖNEMLİ**: 
- `xxxxxxxxxxxxx.supabase.co` yerine kendi Project URL'inizi yazın
- `eyJhbGciOi...` yerine kendi anon key'inizi yapıştırın

---

## 🗄️ ADIM 3: VERİTABANI TABLOLARINI OLUŞTURMA

### 3.1 SQL Editor'ü Açın
1. Supabase dashboard'da sol menüden "SQL Editor" tıklayın
2. "New query" butonuna tıklayın

### 3.2 SQL Scriptini Çalıştırın
1. Proje dizinindeki `supabase-setup.sql` dosyasının içeriğini kopyalayın
2. SQL Editor'e yapıştırın
3. Sağ üstteki "Run" butonuna tıklayın (veya Ctrl+Enter)
4. "Success. No rows returned" mesajını görmelisiniz

### 3.3 Tabloları Kontrol Edin
1. Sol menüden "Table Editor" tıklayın
2. Şu tabloların oluştuğunu doğrulayın:
   - ✅ departments (8 örnek departman ile)
   - ✅ boxes
   - ✅ box_lines
   - ✅ pallets
   - ✅ shipments

---

## 🪣 ADIM 4: STORAGE BUCKET OLUŞTURMA (Fotoğraflar İçin)

### 4.1 Storage Oluşturun
1. Sol menüden "Storage" tıklayın
2. "Create a new bucket" butonuna tıklayın
3. Bucket bilgilerini doldurun:
   - **Name**: `box-photos`
   - **Public bucket**: ✅ İşaretleyin (fotoğrafların public erişilebilir olması için)
4. "Create bucket" butonuna tıklayın

### 4.2 Storage Policy'lerini Ayarlayın
1. `box-photos` bucket'ına tıklayın
2. Üstteki "Policies" sekmesine geçin
3. "New Policy" butonuna tıklayın
4. "For full customization" seçin
5. Aşağıdaki policy'leri ekleyin:

**INSERT Policy** (Fotoğraf yükleme):
```sql
CREATE POLICY "Anyone can upload box photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'box-photos');
```

**SELECT Policy** (Fotoğraf görüntüleme):
```sql
CREATE POLICY "Anyone can view box photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'box-photos');
```

---

## 🧪 ADIM 5: YEREL OLARAK TEST ETME

### 5.1 Bağımlılıkları Yükleyin
```bash
npm install
```

### 5.2 Development Server'ı Başlatın
```bash
npm run dev
```

### 5.3 Tarayıcıda Test Edin
1. Tarayıcıda `http://localhost:3000` adresine gidin
2. Login sayfasında test kullanıcısı ile giriş yapın:
   - Username: `admin`
   - Password: `admin123`
3. Yeni bir koli oluşturmayı deneyin
4. Fotoğraf yüklemeyi test edin
5. QR kod oluşturma işlemini kontrol edin

---

## 🚀 ADIM 6: VERCEL'E DEPLOYMENT

### 6.1 Vercel Hesabı Oluşturun
1. [https://vercel.com](https://vercel.com) adresine gidin
2. "Sign Up" butonuna tıklayın
3. GitHub hesabınızla giriş yapın

### 6.2 Git Repository Oluşturun
Eğer henüz GitHub'a yüklemediyseniz:

```bash
# Git repository başlatın
git init

# Dosyaları ekleyin
git add .

# İlk commit'i yapın
git commit -m "Initial commit - QR Lojistik Uygulaması"

# GitHub'da yeni repository oluşturun ve bağlayın
git remote add origin https://github.com/KULLANICI_ADINIZ/qr-lojistik.git

# Kodu GitHub'a gönderin
git branch -M main
git push -u origin main
```

### 6.3 Vercel'e Import Edin
1. Vercel dashboard'da "Add New" → "Project" tıklayın
2. GitHub repository'nizi seçin
3. "Import" butonuna tıklayın

### 6.4 Environment Variables Ekleyin
1. "Configure Project" ekranında "Environment Variables" bölümüne gidin
2. Şu değişkenleri ekleyin:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**NOT**: Bu değerleri `.env.local` dosyanızdakilerle aynı yapın!

### 6.5 Deploy Edin
1. "Deploy" butonuna tıklayın
2. Deploy işlemi 2-3 dakika sürecektir
3. Deploy tamamlandığında "Visit" butonuna tıklayarak sitenizi görün

### 6.6 Domain Adresinizi Alın
Deploy tamamlandığında şu şekilde bir adres alacaksınız:
- `https://qr-lojistik.vercel.app` (veya benzeri)

---

## ✅ ADIM 7: DEPLOYMENT'I DOĞRULAMA

### 7.1 Canlı Siteyi Test Edin
1. Vercel'in verdiği URL'i açın
2. Login sayfasında giriş yapın
3. Tüm özellikleri test edin:
   - ✅ Koli oluşturma
   - ✅ Fotoğraf yükleme
   - ✅ QR kod oluşturma
   - ✅ Palet oluşturma
   - ✅ Sevkiyat oluşturma
   - ✅ QR kod okutma (telefon kamerasıyla test edin)

### 7.2 Supabase Dashboard'da Veriyi Kontrol Edin
1. Supabase'de "Table Editor" açın
2. Oluşturduğunuz kolilerin veritabanında göründüğünü kontrol edin
3. Storage'da yüklenen fotoğrafları kontrol edin

---

## 🔄 GÜNCELLEMELERİ YAYINLAMA

Kod değişikliği yaptığınızda otomatik deploy olması için:

```bash
# Değişiklikleri commit edin
git add .
git commit -m "Yeni özellik eklendi"

# GitHub'a gönderin
git push

# Vercel otomatik olarak yeni versiyonu deploy edecektir!
```

---

## 🛠️ SORUN GİDERME

### Problem: "Invalid API Key" hatası alıyorum
**Çözüm**: 
- `.env.local` dosyasındaki `NEXT_PUBLIC_SUPABASE_ANON_KEY` değerini kontrol edin
- Supabase dashboard'dan doğru anon key'i kopyaladığınızdan emin olun
- Development server'ı yeniden başlatın (`npm run dev`)

### Problem: Fotoğraflar yüklenmiyor
**Çözüm**:
- Supabase Storage'da `box-photos` bucket'ının oluşturulduğunu kontrol edin
- Bucket'ın public olduğunu doğrulayın
- Storage policy'lerinin doğru ayarlandığını kontrol edin

### Problem: Vercel'de environment variables hatası
**Çözüm**:
- Vercel dashboard → Project Settings → Environment Variables
- Tüm değişkenlerin doğru eklendiğini kontrol edin
- Değişiklik yaptıysanız "Redeploy" butonuna tıklayın

### Problem: Database connection hatası
**Çözüm**:
- Supabase projesinin aktif olduğunu kontrol edin (paused olabilir)
- Project URL'in doğru olduğunu kontrol edin
- SQL scriptinin başarıyla çalıştırıldığını doğrulayın

---

## 📱 BONUS: MOBIL TEST İÇİN

Mobil cihazlardan test etmek için:
1. Vercel URL'inizi mobil tarayıcıda açın
2. Home ekranına ekleyin (PWA desteği)
3. QR kodları kamera ile tarayın ve test edin

---

## 🎉 TAMAMLANDI!

Artık QR Lojistik uygulamanız:
- ✅ Supabase veritabanına bağlı
- ✅ Fotoğraf storage'ı aktif
- ✅ Vercel'de canlıda
- ✅ Otomatik deployment aktif
- ✅ HTTPS ile güvenli
- ✅ Mobil uyumlu

Her şey hazır! 🚀

---

## 📞 YARDIM

Herhangi bir sorun yaşarsanız:
1. Bu rehberdeki sorun giderme bölümüne bakın
2. Supabase logs'ları kontrol edin (Dashboard → Logs)
3. Vercel deployment logs'larını inceleyin
4. Browser console'da hata mesajlarına bakın

İyi kullanımlar! 🎊

