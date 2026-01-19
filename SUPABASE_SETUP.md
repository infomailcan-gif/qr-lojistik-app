# Supabase Kurulum Rehberi

## Neden Supabase?

**Şu anda uygulama localStorage kullanıyor** - bu, her tarayıcı/cihazın kendi verilerini tutması demek. **Masaüstünde eklediğiniz kullanıcılar mobilde görünmüyor** çünkü localStorage tarayıcıya özeldir.

**Supabase ile:**
- ✅ Tüm cihazlar aynı veritabanını kullanır
- ✅ Masaüstü ve mobil senkronize olur
- ✅ Veriler gerçek bir veritabanında saklanır
- ✅ Ücretsiz plan yeterlidir (500 MB veritabanı)

## Adım 1: Supabase Hesabı Oluştur

1. https://supabase.com adresine git
2. "Start your project" butonuna tıkla
3. GitHub ile giriş yap (ücretsiz)
4. Yeni bir organizasyon oluştur

## Adım 2: Yeni Proje Oluştur

1. "New Project" butonuna tıkla
2. Proje adı gir: `qr-lojistik` veya istediğin bir isim
3. Güçlü bir veritabanı şifresi belirle (kaydet, sonra lazım olacak)
4. Bölge seç: En yakın bölgeyi seç (örn: Frankfurt)
5. Free plan seçili olduğundan emin ol
6. "Create new project" butonuna tıkla
7. **Bekle** - Proje oluşturma 2-3 dakika sürer ☕

## Adım 3: Veritabanı Tablolarını Oluştur

1. Soldaki menüden **"SQL Editor"** seç
2. "New query" butonuna tıkla
3. `supabase-setup.sql` dosyasının içeriğini kopyala
4. SQL editöre yapıştır
5. **"Run"** (Çalıştır) butonuna bas
6. ✅ Başarılı mesajı göreceksin

## Adım 4: Storage Bucket Oluştur

Koli fotoğrafları için storage gerekli:

1. Soldaki menüden **"Storage"** seç
2. "Create a new bucket" butonuna tıkla
3. Bucket adı: `box-photos`
4. "Public bucket" seçeneğini **AÇIK** bırak (fotoğraflar görülebilsin)
5. "Create bucket" butonuna tıkla

### Storage Policies

Bucket oluşturduktan sonra:

1. `box-photos` bucket'ına tıkla
2. "Policies" sekmesine geç
3. "New Policy" butonuna tıkla
4. Şu 2 policy'yi ekle:

**Policy 1: Public Read**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'box-photos');
```

**Policy 2: Public Upload**
```sql
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'box-photos');
```

## Adım 5: API Keys'i Al

1. Soldaki menüden **"Settings"** (Ayarlar) seç
2. **"API"** sekmesine git
3. Şu bilgileri kopyala:
   - **Project URL** (örn: `https://xxxxx.supabase.co`)
   - **anon public** key (uzun bir string)

## Adım 6: Uygulamayı Yapılandır

1. Proje klasöründe `.env.local.example` dosyasını kopyala
2. Yeni dosyayı `.env.local` olarak kaydet
3. İçeriği düzenle:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. **Kaydet ve kapat**

## Adım 7: Uygulamayı Yeniden Başlat

1. Terminalde `Ctrl+C` ile sunucuyu durdur
2. `npm run dev` ile yeniden başlat
3. Tarayıcıda sayfayı yenile

## ✅ Test Et

1. **Masaüstünde** giriş yap ve bir koli oluştur
2. **Telefonda** aynı URL'yi aç (örn: `http://192.168.1.100:3000`)
3. Aynı koliyi görmelisin! 🎉

### Yerel Ağdan Erişim

Telefon ve bilgisayar aynı WiFi'ye bağlı olmalı:

**Windows'ta IP adresini öğren:**
```bash
ipconfig
# IPv4 Address'i not al (örn: 192.168.1.100)
```

**Mac/Linux'ta IP adresini öğren:**
```bash
ifconfig | grep "inet "
# Yerel IP'yi not al (örn: 192.168.1.100)
```

**Telefonda aç:**
```
http://[IP-ADRESİN]:3000
# Örnek: http://192.168.1.100:3000
```

## 🔧 Sorun Giderme

### Supabase'e Bağlanamıyor

1. `.env.local` dosyasının doğru yerde olduğundan emin ol (proje kök dizininde)
2. URL ve Key'lerin doğru kopyalandığından emin ol (başında/sonunda boşluk olmasın)
3. Sunucuyu yeniden başlat: `Ctrl+C` → `npm run dev`

### SQL Hatası

1. `supabase-setup.sql` dosyasının tamamını kopyaladığından emin ol
2. SQL Editor'de tüm sorguyu seç ve çalıştır
3. Hata mesajını oku - hangi satırda olduğunu gösterir

### Telefon Bağlanamıyor

1. Aynı WiFi ağına bağlı olduğundan emin ol
2. Firewall'u kontrol et - 3000 portunu aç
3. `http://` kullan (https değil)

## 📊 Veritabanı Yönetimi

### Verileri Görüntüle

1. Supabase Dashboard → "Table Editor"
2. İstediğin tabloyu seç (boxes, pallets, vb.)
3. Verileri görebilir, düzenleyebilir, silebilirsin

### Verileri Sıfırla

SQL Editor'de çalıştır:

```sql
-- TÜM VERİLERİ SİL (DİKKAT!)
TRUNCATE TABLE box_lines CASCADE;
TRUNCATE TABLE boxes CASCADE;
TRUNCATE TABLE pallets CASCADE;
TRUNCATE TABLE shipments CASCADE;
```

### Yedekleme

1. Supabase Dashboard → "Database" → "Backups"
2. Otomatik günlük yedekleme var (Free plan: 7 gün)
3. Manuel yedek için "Create backup" butonuna tıkla

## 💰 Ücretsiz Limitler

Supabase Free Plan:
- ✅ 500 MB veritabanı
- ✅ 1 GB dosya depolama
- ✅ 50,000 MAU (Aylık aktif kullanıcı)
- ✅ Sosyal OAuth
- ✅ 7 gün yedekleme

Bu uygulama için **fazlasıyla yeterli**!

## 🚀 Production'a Alma

Uygulamayı yayınlamak için (Vercel, Netlify, vb.):

1. Platform'da environment variables ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Deploy et
3. Hazır! ✅

## 📞 Destek

- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Bu dosya: Adım adım takip et

---

**Özet:** Supabase ile artık tüm cihazlar senkronize olacak. localStorage yerine gerçek veritabanı kullanacaksın. Kurulum 15-20 dakika sürer. 🎉


