# 🚀 DEPLOYMENT BİLGİLERİ

## 📌 Supabase Bağlantı Bilgileri

### Proje Detayları
- **Proje Adı**: QR Lojistik (YENİ TEMİZ PROJE!)
- **Proje ID**: wmitteaxogmjnpzxdsce
- **Region**: eu-central-1 (Frankfurt - Germany)
- **Durum**: ✅ Aktif ve Hazır!

### API Bilgileri
```
NEXT_PUBLIC_SUPABASE_URL=https://wmitteaxogmjnpzxdsce.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_VKnw-acnE_qh8gmEs0zB5Q_Ybthv8O-
```

## 📝 Local Development İçin

1. Proje dizininizde `.env.local` dosyası oluşturun
2. Yukarıdaki API bilgilerini kopyalayın:

```bash
# Windows PowerShell
echo "NEXT_PUBLIC_SUPABASE_URL=https://wmitteaxogmjnpzxdsce.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_VKnw-acnE_qh8gmEs0zB5Q_Ybthv8O-" >> .env.local

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
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wmitteaxogmjnpzxdsce.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_VKnw-acnE_qh8gmEs0zB5Q_Ybthv8O-` |

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

