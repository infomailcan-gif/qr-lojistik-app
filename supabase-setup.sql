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
-- BAŞARILI! 🎉
-- ============================================
-- Veritabanı hazır. Şimdi Storage bucket'ı oluşturun.

