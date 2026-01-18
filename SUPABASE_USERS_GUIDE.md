# 🔐 SUPABASE AUTHENTICATION KURULUMU

## ✅ ADIM 1: SUPABASE DASHBOARD'A GİT

https://supabase.com/dashboard/project/qwfxnnwychrlysjrztnp

---

## ✅ ADIM 2: AUTHENTICATION AYARLARI

1. Sol menüden **Authentication** → **Users** tıkla
2. **Add User** butonuna tıkla
3. Şu kullanıcıları oluştur:

---

## 👥 OLUŞTURULACAK KULLANICILAR:

### 1️⃣ ADMIN (Manager)
```
Email: admin@qrlojistik.com
Password: admin123
Auto Confirm: ✅ (işaretle)

User Metadata (JSON):
{
  "name": "Sistem Yöneticisi",
  "username": "admin",
  "role": "manager",
  "department_id": "dept-7",
  "department_name": "Bilgi İşlem"
}
```

### 2️⃣ SUPER ADMIN
```
Email: superadmin@qrlojistik.com
Password: super123
Auto Confirm: ✅

User Metadata (JSON):
{
  "name": "Süper Yönetici",
  "username": "superadmin",
  "role": "super_admin",
  "department_id": "dept-7",
  "department_name": "Bilgi İşlem"
}
```

### 3️⃣ ALİ (IT User)
```
Email: ali@qrlojistik.com
Password: 123456
Auto Confirm: ✅

User Metadata (JSON):
{
  "name": "Ali Yılmaz",
  "username": "ali",
  "role": "user",
  "department_id": "dept-3",
  "department_name": "IT"
}
```

### 4️⃣ AYŞE (Restoran User)
```
Email: ayse@qrlojistik.com
Password: 123456
Auto Confirm: ✅

User Metadata (JSON):
{
  "name": "Ayşe Demir",
  "username": "ayse",
  "role": "user",
  "department_id": "dept-1",
  "department_name": "Restoran"
}
```

### 5️⃣ MEHMET (Mutfak User)
```
Email: mehmet@qrlojistik.com
Password: 123456
Auto Confirm: ✅

User Metadata (JSON):
{
  "name": "Mehmet Kaya",
  "username": "mehmet",
  "role": "user",
  "department_id": "dept-2",
  "department_name": "Mutfak"
}
```

---

## ✅ ADIM 3: LOGIN SAYFASINI GÜNCELLE

Login sayfası şu anda **username** ile çalışıyor ama Supabase **email** kullanıyor!

İki seçenek:
1. **EMAIL İLE GİRİŞ:** Login'de "Email" yaz
2. **USERNAME İLE GİRİŞ:** Backend'de username→email mapping yap

---

## 🚀 ADIM 4: KODU DEPLOY ET

auth.ts değişikliğini deploy edeceğiz:

```bash
git add lib/auth.ts
git commit -m "Fix: Supabase Auth aktifleştirildi"
git push
```

---

## 📊 GİRİŞ BİLGİLERİ:

### YÖNTEM 1: EMAIL İLE
```
Email: admin@qrlojistik.com
Şifre: admin123
```

### YÖNTEM 2: USERNAME (Şu an çalışmıyor!)
```
Kullanıcı Adı: admin
Şifre: admin123
```

**NOT:** Login sayfasını email'e göre güncellemeliyiz!

---

## 🔧 DEPARTMENTS IDs:

Supabase'deki department ID'leri kontrol et:

```sql
SELECT id, name FROM departments ORDER BY name;
```

Yukarıdaki `dept-1`, `dept-2` gibi ID'leri **gerçek UUID'lerle** değiştir!

