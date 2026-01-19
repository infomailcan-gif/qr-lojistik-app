# 🚀 QR Lojistik - Modern Logistics Management System

[![Supabase](https://img.shields.io/badge/Supabase-Active-green)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://typescriptlang.org)

Modern, mobil uyumlu lojistik yönetim sistemi. Koli, palet ve sevkiyat takibi için tam entegre çözüm.

## ✅ Kurulum Tamamlandı!

**Supabase entegrasyonu başarıyla yapıldı!** Artık:
- ✅ Tüm cihazlar aynı veritabanını kullanıyor
- ✅ Masaüstü ve mobil tam senkronize
- ✅ Gerçek veritabanı ile çalışıyor (Supabase)
- ✅ Production'a hazır

## 🎯 Hızlı Başlangıç

### 1. Dev Server'ı Başlat

```bash
npm run dev
```

### 2. Tarayıcıda Aç

```
http://localhost:3000
```

### 3. Giriş Yap

- **Süper Admin**: `superadmin` 
- **Manager**: `admin`
- **Kullanıcılar**: `ali`, `ayse`, `mehmet`, vb.

*(Şifreler Supabase'de kayıtlı - GİRİŞ_BİLGİLERİ.md dosyasına bakın)*

## 📱 Mobil Erişim

Aynı WiFi ağındaki telefondan erişim:

```bash
# Windows - IP adresini öğren
ipconfig

# Telefonda aç
http://192.168.1.XXX:3000
```

## 🔥 Özellikler

### Koli Yönetimi
- ✅ QR kodlu koli oluşturma
- ✅ Ürün listesi ekleme
- ✅ Fotoğraf yükleme
- ✅ Departman bazlı filtreleme
- ✅ Koli mühürleme (seal)

### Palet Yönetimi
- ✅ Palet oluşturma
- ✅ Kolileri palete ekleme
- ✅ QR kod ile takip
- ✅ Palet raporları

### Sevkiyat Takibi
- ✅ Sevkiyat oluşturma
- ✅ Paletleri sevkiyata ekleme
- ✅ Araç plakası kaydetme
- ✅ Toplam koli/palet sayısı

### Kullanıcı Yönetimi
- ✅ 3 rol: User, Manager, Super Admin
- ✅ Departman bazlı organizasyon
- ✅ Kullanıcı ekleme/düzenleme/silme
- ✅ Rol bazlı yetkilendirme

### Raporlama
- ✅ Genel istatistikler
- ✅ Departman bazlı raporlar
- ✅ Kullanıcı aktiviteleri
- ✅ Detaylı filtreleme

## 🗄️ Veritabanı

### Supabase Tabloları

- **departments**: 8 departman tanımlı
- **users**: 9 kullanıcı kayıtlı
- **boxes**: Koli bilgileri
- **box_lines**: Koli içeriği (ürünler)
- **pallets**: Palet bilgileri
- **shipments**: Sevkiyat bilgileri

### Veritabanı Yönetimi

Supabase Dashboard:
1. https://supabase.com/dashboard
2. "QR Lojistik App 2026" projesini aç
3. "Table Editor" menüsünden tabloları görüntüle

## 📦 Teknoloji Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **Database**: Supabase (PostgreSQL)
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **QR Codes**: qrcode library
- **PDF**: jsPDF

## 📂 Proje Yapısı

```
qr-lojistik/
├── app/
│   ├── (auth)/login/           # Giriş sayfası
│   ├── (app)/app/              # Korumalı sayfalar
│   │   ├── page.tsx            # Dashboard
│   │   ├── boxes/              # Koli yönetimi
│   │   ├── pallets/            # Palet yönetimi
│   │   ├── shipments/          # Sevkiyat yönetimi
│   │   ├── admin/              # Raporlar (Manager)
│   │   └── super-admin/        # Kullanıcı yönetimi
│   └── (public)/q/             # Public QR sayfaları
├── lib/
│   ├── auth.ts                 # Giriş sistemi
│   ├── repositories/           # Veritabanı işlemleri
│   │   ├── user.ts
│   │   ├── department.ts
│   │   ├── box.ts
│   │   ├── pallet.ts
│   │   └── shipment.ts
│   ├── types/                  # TypeScript tipleri
│   └── supabase/              # Supabase client
└── components/
    ├── app/                    # Uygulama komponentleri
    └── ui/                     # UI komponentleri
```

## 🎨 Tasarım

- **Tema**: Modern koyu tema
- **Mobil**: Bottom navigation
- **Masaüstü**: Sidebar navigation
- **Animasyonlar**: Smooth geçişler
- **Responsive**: Tüm ekran boyutları

## 🔐 Güvenlik

- ✅ Role-based access control (RBAC)
- ✅ Row Level Security (RLS) - Supabase
- ✅ Client-side route protection
- ✅ Session management (localStorage)
- ⚠️ **Not**: Production için şifrelerin hash'lenmesi önerilir

## 📖 Dokümantasyon

- **KURULUM_TAMAMLANDI.md**: Kurulum detayları ve yapılan işlemler
- **GİRİŞ_BİLGİLERİ.md**: Kullanıcı hesapları ve şifre yönetimi
- **SUPABASE_SETUP.md**: Supabase yapılandırma rehberi (detaylı)
- **DEVELOPMENT.md**: Geliştirme kılavuzu
- **FILE_STRUCTURE.md**: Dosya yapısı açıklamaları

## 🚀 Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Production sunucu
npm start

# Type kontrolü
npm run type-check

# Linter
npm run lint
```

## 🌐 Environment Variables

`.env.local` dosyası zaten oluşturuldu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://qwfxnnwychrlysjrztnp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 🔧 Sorun Giderme

### Veritabanına Bağlanamıyor

1. `.env.local` dosyasının olduğundan emin olun
2. Dev server'ı yeniden başlatın: `Ctrl+C` → `npm run dev`
3. Tarayıcıyı hard-refresh yapın: `Ctrl+Shift+R`

### LocalStorage Temizleme

Eski verileri temizlemek için:

```javascript
// Tarayıcı console'da (F12)
localStorage.clear()
location.reload()
```

### Supabase Dashboard

Veritabanını görüntüle/düzenle:
- https://supabase.com/dashboard
- "QR Lojistik App 2026" projesi
- "Table Editor" veya "SQL Editor"

## 📊 Durum

| Özellik | Durum | Notlar |
|---------|-------|--------|
| Supabase Entegrasyonu | ✅ Aktif | Tüm cihazlar senkronize |
| Kullanıcı Yönetimi | ✅ Çalışıyor | 9 kullanıcı kayıtlı |
| Koli Yönetimi | ✅ Çalışıyor | CRUD + QR kod |
| Palet Yönetimi | ✅ Çalışıyor | Koli ekleme/çıkarma |
| Sevkiyat Yönetimi | ✅ Çalışıyor | Palet ekleme/çıkarma |
| Raporlama | ✅ Çalışıyor | Filtreleme + İstatistikler |
| Mobil Uyumluluk | ✅ Optimize | Bottom nav + responsive |
| Production | ✅ Hazır | Deploy edilebilir |

## 🎯 Sonraki Adımlar (Opsiyonel)

1. **Şifre Hash'leme**: bcrypt entegrasyonu
2. **Supabase Auth**: Email/password login
3. **Real-time**: Supabase subscriptions ile canlı güncellemeler
4. **Dosya Yükleme**: Storage bucket ile fotoğraf yönetimi
5. **PDF Export**: Raporları PDF olarak indirme
6. **Email Bildirimleri**: Sevkiyat onayları için

## 👨‍💻 Geliştirici

**Canberk Şıklı**

## 📄 Lisans

Private project - 2026

---

**Son Güncelleme**: 19 Ocak 2026  
**Versiyon**: 2.0 (Supabase Entegre)  
**Durum**: ✅ Production Ready
