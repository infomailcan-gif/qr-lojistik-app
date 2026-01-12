# 🚀 DEPLOYMENT BİLGİLERİ

## 📌 Supabase Bağlantı Bilgileri

### Proje Detayları
- **Proje Adı**: infomailcan@gmail.com's Project
- **Proje ID**: vrjzrveomregcfvusekz
- **Region**: eu-north-1 (Europe - North EU)
- **Durum**: Aktif hale geliyor...

### API Bilgileri
```
NEXT_PUBLIC_SUPABASE_URL=https://vrjzrveomregcfvusekz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_h9xfB46sbhYBEseBKUkTsA_gpzR2D-B
```

## 📝 Local Development İçin

1. Proje dizininizde `.env.local` dosyası oluşturun
2. Yukarıdaki API bilgilerini kopyalayın:

```bash
# Windows PowerShell
echo "NEXT_PUBLIC_SUPABASE_URL=https://vrjzrveomregcfvusekz.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_h9xfB46sbhYBEseBKUkTsA_gpzR2D-B" >> .env.local

# veya manuel olarak .env.local dosyası oluşturup içine yapıştırın
```

3. Development server'ı başlatın:
```bash
npm install
npm run dev
```

## 🚀 Vercel Deployment İçin

### Adım 1: Environment Variables
Vercel Dashboard'da şu environment variables'ları ekleyin:

| Variable Name | Value |
|--------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vrjzrveomregcfvusekz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_h9xfB46sbhYBEseBKUkTsA_gpzR2D-B` |

### Adım 2: Deploy
```bash
# GitHub'a push yapın
git add .
git commit -m "Production ready - Supabase connected"
git push

# Vercel otomatik deploy edecektir
```

## ⚠️ ÖNEMLİ NOTLAR

1. **`.env.local` dosyasını asla Git'e eklemeyin!** (zaten .gitignore'da)
2. Bu bilgiler sadece sizin projeniz için geçerlidir
3. Publishable key kullanılıyor (güvenli, public kullanım için)
4. Supabase projesi 1 hafta boyunca kullanılmazsa otomatik pause olabilir

## 📊 Sonraki Adımlar

✅ 1. Supabase projesinin aktif olmasını bekleyin (1-2 dakika)
✅ 2. Veritabanı tablolarını oluşturun (supabase-setup.sql)
✅ 3. Storage bucket oluşturun (box-photos)
✅ 4. Local'de test edin
✅ 5. Vercel'e deploy edin

## 🆘 Yardım

Sorularınız için:
- 📖 SUPABASE_SETUP_GUIDE.md dosyasına bakın
- 🌐 https://supabase.com/dashboard
- 🚀 https://vercel.com/dashboard

---
**Oluşturulma Tarihi**: ${new Date().toLocaleString('tr-TR')}

