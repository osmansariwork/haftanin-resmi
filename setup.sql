-- ─── 1. Tablo ────────────────────────────────────────────────────────────────
CREATE TABLE photos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start  DATE        NOT NULL,
  user_name   TEXT        NOT NULL CHECK (user_name IN ('Osman', 'Fatya')),
  image_url   TEXT        NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (week_start, user_name)   -- haftada kişi başı 1 resim
);

-- ─── 2. Row Level Security ───────────────────────────────────────────────────
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes okuyabilir"
  ON photos FOR SELECT
  USING (true);

CREATE POLICY "Herkes ekleyebilir"
  ON photos FOR INSERT
  WITH CHECK (true);

-- ─── 3. Storage bucket ───────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public okuma"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Herkes yükleyebilir"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');
