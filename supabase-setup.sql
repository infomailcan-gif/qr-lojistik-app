-- ============================================
-- QR LOJİSTİK - SUPABASE VERITABANI KURULUM
-- ============================================

-- 1. Departmanlar Tablosu
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Koliler Tablosu
CREATE TABLE IF NOT EXISTS boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  created_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sealed')),
  revision INTEGER DEFAULT 1,
  pallet_code TEXT,
  photo_url TEXT,
  needs_reprint BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Koli İçerikleri Tablosu
CREATE TABLE IF NOT EXISTS box_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  kind TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Paletler Tablosu
CREATE TABLE IF NOT EXISTS pallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  shipment_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sevkiyatlar Tablosu
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_or_plate TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- İNDEKSLER (Performans İçin)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_boxes_code ON boxes(code);
CREATE INDEX IF NOT EXISTS idx_boxes_department ON boxes(department_id);
CREATE INDEX IF NOT EXISTS idx_boxes_created_by ON boxes(created_by);
CREATE INDEX IF NOT EXISTS idx_boxes_pallet ON boxes(pallet_code);
CREATE INDEX IF NOT EXISTS idx_boxes_status ON boxes(status);

CREATE INDEX IF NOT EXISTS idx_box_lines_box ON box_lines(box_id);

CREATE INDEX IF NOT EXISTS idx_pallets_code ON pallets(code);
CREATE INDEX IF NOT EXISTS idx_pallets_created_by ON pallets(created_by);
CREATE INDEX IF NOT EXISTS idx_pallets_shipment ON pallets(shipment_code);

CREATE INDEX IF NOT EXISTS idx_shipments_code ON shipments(code);
CREATE INDEX IF NOT EXISTS idx_shipments_created_by ON shipments(created_by);

-- ============================================
-- ÖRNEK DEPARTMANLAR
-- ============================================

INSERT INTO departments (id, name, description) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Restoran', 'Restoran departmanı'),
  ('d2222222-2222-2222-2222-222222222222', 'Mutfak', 'Mutfak departmanı'),
  ('d3333333-3333-3333-3333-333333333333', 'IT', 'Bilgi teknolojileri'),
  ('d4444444-4444-4444-4444-444444444444', 'Depo', 'Ana depo'),
  ('d5555555-5555-5555-5555-555555555555', 'Oyun Alanı', 'Çocuk oyun alanı'),
  ('d6666666-6666-6666-6666-666666666666', 'Yemekhane', 'Personel yemekhanesi'),
  ('d7777777-7777-7777-7777-777777777777', 'Bilgi İşlem', 'IT departmanı'),
  ('d8888888-8888-8888-8888-888888888888', 'Server Odası', 'Sunucu odası')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) - GÜVENLİK
-- ============================================

-- RLS'i etkinleştir
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (anon key kullanıyoruz)
CREATE POLICY "Public read access" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON boxes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON box_lines FOR SELECT USING (true);
CREATE POLICY "Public read access" ON pallets FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shipments FOR SELECT USING (true);

-- Herkes yazabilir (uygulama kendi auth sistemini kullanıyor)
CREATE POLICY "Public insert access" ON boxes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON boxes FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON boxes FOR DELETE USING (true);

CREATE POLICY "Public insert access" ON box_lines FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON box_lines FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON box_lines FOR DELETE USING (true);

CREATE POLICY "Public insert access" ON pallets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON pallets FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON pallets FOR DELETE USING (true);

CREATE POLICY "Public insert access" ON shipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON shipments FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON shipments FOR DELETE USING (true);

-- ============================================
-- 6. Kullanıcılar Tablosu (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'manager', 'super_admin')),
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Örnek kullanıcılar
INSERT INTO users (id, username, password, name, role, department_id) VALUES
  ('u1111111-1111-1111-1111-111111111111', 'admin', 'admin123', 'Sistem Yöneticisi', 'super_admin', 'd3333333-3333-3333-3333-333333333333'),
  ('u2222222-2222-2222-2222-222222222222', 'mudur', 'mudur123', 'Ahmet Müdür', 'manager', 'd4444444-4444-4444-4444-444444444444'),
  ('u3333333-3333-3333-3333-333333333333', 'depo1', 'depo123', 'Mehmet Depocu', 'user', 'd4444444-4444-4444-4444-444444444444'),
  ('u4444444-4444-4444-4444-444444444444', 'restoran1', 'restoran123', 'Ali Restoran', 'user', 'd1111111-1111-1111-1111-111111111111')
ON CONFLICT (username) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON users FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON users FOR DELETE USING (true);

-- ============================================
-- 7. Giriş Logları Tablosu (Login Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  user_name TEXT NOT NULL,
  department_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'failed_login')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs(username);
CREATE INDEX IF NOT EXISTS idx_login_logs_action ON login_logs(action);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip_address ON login_logs(ip_address);

ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON login_logs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON login_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- 8. Aktif Oturumlar Tablosu (Active Sessions) - Anlık online takibi için
-- ============================================
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_name TEXT NOT NULL,
  department_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity DESC);

ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON active_sessions FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON active_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON active_sessions FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON active_sessions FOR DELETE USING (true);

-- ============================================
-- 9. Sayfa Ziyaretleri Tablosu (Page Visits) - Kullanıcı aktivite takibi
-- ============================================
CREATE TABLE IF NOT EXISTS page_visits (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_name TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_page_visits_user_id ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_entered_at ON page_visits(entered_at DESC);

ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON page_visits FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON page_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON page_visits FOR UPDATE USING (true);

-- ============================================
-- 10. EK SÜTUNLAR - Kullanıcı Aktivite Takibi
-- ============================================
-- active_sessions tablosuna sayfa takibi için sütunlar ekle
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS current_page TEXT;
ALTER TABLE active_sessions ADD COLUMN IF NOT EXISTS current_action TEXT;

-- ============================================
-- 11. EK SÜTUNLAR - photo_url_2 desteği
-- ============================================
-- boxes tablosuna photo_url_2 ekle
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS photo_url_2 TEXT;

-- pallets tablosuna photo_url ve photo_url_2 ekle
ALTER TABLE pallets ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE pallets ADD COLUMN IF NOT EXISTS photo_url_2 TEXT;

-- shipments tablosuna photo_url ve photo_url_2 ekle
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS photo_url_2 TEXT;

-- ============================================
-- 12. EK SÜTUNLAR - Direk Sevkiyat desteği
-- ============================================
-- boxes tablosuna is_direct_shipment ve shipment_code ekle
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS is_direct_shipment BOOLEAN DEFAULT false;
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS shipment_code TEXT;

-- Index for shipment_code
CREATE INDEX IF NOT EXISTS idx_boxes_shipment ON boxes(shipment_code);

-- ============================================
-- 13. YASAKLI KULLANICILAR - Ban Sistemi
-- ============================================
-- users tablosuna is_banned sütunu ekle
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by TEXT;

CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);

-- Ban Ayarları Tablosu (Global ayarlar için)
CREATE TABLE IF NOT EXISTS ban_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_active BOOLEAN DEFAULT true,
  ban_message TEXT DEFAULT 'Hesabınıza erişim yasaklanmıştır.',
  ban_subtitle TEXT DEFAULT 'Sistem yöneticisi ile iletişime geçiniz.',
  redirect_url TEXT,
  show_redirect_button BOOLEAN DEFAULT false,
  redirect_button_text TEXT DEFAULT 'Ana Sayfaya Git',
  video_url TEXT DEFAULT 'https://cdn.pixabay.com/video/2020/05/25/40130-424930923_large.mp4',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Default ayarları ekle
INSERT INTO ban_settings (id, is_active, ban_message, ban_subtitle) 
VALUES ('default', true, 'Hesabınıza erişim yasaklanmıştır.', 'Sistem yöneticisi ile iletişime geçiniz.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE ban_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON ban_settings FOR SELECT USING (true);
CREATE POLICY "Public update access" ON ban_settings FOR UPDATE USING (true);
CREATE POLICY "Public insert access" ON ban_settings FOR INSERT WITH CHECK (true);

-- ============================================
-- 14. SİTE LOCKDOWN - Tüm Site Erişim Engelleme
-- ============================================
-- Site lockdown ayarları tablosu
CREATE TABLE IF NOT EXISTS site_lockdown (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_active BOOLEAN DEFAULT false,
  lockdown_message TEXT DEFAULT 'ERİŞİMİNİZ SİSTEM YÖNETİCİSİ TARAFINDAN KISITLANMIŞTIR',
  lockdown_subtitle TEXT DEFAULT 'Güvenlik protokolleri devreye alındı.',
  activated_at TIMESTAMPTZ,
  activated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default ayarları ekle
INSERT INTO site_lockdown (id, is_active, lockdown_message, lockdown_subtitle) 
VALUES ('default', false, 'ERİŞİMİNİZ SİSTEM YÖNETİCİSİ TARAFINDAN KISITLANMIŞTIR', 'Güvenlik protokolleri devreye alındı.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_lockdown ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON site_lockdown FOR SELECT USING (true);
CREATE POLICY "Public update access" ON site_lockdown FOR UPDATE USING (true);
CREATE POLICY "Public insert access" ON site_lockdown FOR INSERT WITH CHECK (true);

-- ============================================
-- BAŞARILI! 🎉
-- ============================================
-- Veritabanı hazır. Şimdi Storage bucket'ı oluşturun.

