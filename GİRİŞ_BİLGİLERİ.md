# 🔐 Giriş Bilgileri

## Kullanıcı Hesapları

Aşağıdaki kullanıcılar Supabase veritabanınızda kayıtlıdır:

### Süper Admin (Tüm Yetkiler)
- **Kullanıcı Adı**: `superadmin`
- **Şifre**: *(Supabase'de kayıtlı)*
- **Yetkiler**: Kullanıcı ekleme/silme, tüm raporlar, departman yönetimi

### Manager (Yönetici)
- **Kullanıcı Adı**: `admin`
- **Şifre**: *(Supabase'de kayıtlı)*
- **Yetkiler**: Raporları görüntüleme, koli/palet yönetimi

### Normal Kullanıcılar
- `ali` - Ali Yılmaz
- `ayse` - Ayşe Demir
- `mehmet` - Mehmet Kaya
- `fatma` - Fatma Şahin
- `can` - Can Özkan
- `zeynep` - Zeynep Arslan
- `burak` - Burak Çelik

**Not**: Şifreler güvenlik nedeniyle bu dosyada gösterilmemiştir. Supabase'den kontrol edebilirsiniz:

1. https://supabase.com/dashboard adresine gidin
2. "QR Lojistik App 2026" projesini açın
3. SQL Editor'de şu komutu çalıştırın:
   ```sql
   SELECT username, password, name, role FROM users;
   ```

## 🔄 Yeni Kullanıcı Ekleme

### Yöntem 1: Super Admin Paneli (Önerilen)

1. `superadmin` hesabı ile giriş yapın
2. "Süper Admin Paneli" menüsüne gidin
3. "Yeni Kullanıcı" butonuna tıklayın
4. Formu doldurun ve kaydedin

### Yöntem 2: Supabase SQL Editor

```sql
INSERT INTO users (username, password, name, role, department_id)
VALUES (
  'yenikullanici',
  'sifre123',
  'Yeni Kullanıcı',
  'user',
  'd1111111-1111-1111-1111-111111111111'
);
```

## 📱 İlk Giriş

1. Tarayıcıda `http://localhost:3000` adresini açın
2. Yukarıdaki kullanıcı adlarından birini yazın
3. Şifreyi girin (Supabase'de kayıtlı olan)
4. "Giriş Yap" butonuna tıklayın

## 🔧 Şifre Sıfırlama

Bir kullanıcının şifresini sıfırlamak için Supabase SQL Editor:

```sql
UPDATE users 
SET password = 'yenisifre123', updated_at = NOW()
WHERE username = 'kullaniciadi';
```

## ⚠️ Güvenlik Notları

**Önemli**: Bu prototip uygulama basit şifreleme kullanıyor. Production için:

1. Şifreleri hash'leyin (bcrypt kullanın)
2. Supabase Auth entegrasyonu yapın
3. Email doğrulama ekleyin
4. 2FA (İki faktörlü doğrulama) ekleyin

## 🎯 Roller ve Yetkiler

| Rol | Koli Ekleme | Palet Ekleme | Raporlar | Kullanıcı Yönetimi |
|-----|-------------|--------------|----------|-------------------|
| **user** | ✅ | ✅ | ❌ | ❌ |
| **manager** | ✅ | ✅ | ✅ | ❌ |
| **super_admin** | ✅ | ✅ | ✅ | ✅ |

---

**Son Güncelleme**: 19 Ocak 2026
**Proje**: QR Lojistik App 2026


