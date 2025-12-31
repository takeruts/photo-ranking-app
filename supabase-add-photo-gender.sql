-- 写真テーブルに性別カラムを追加

-- 性別カラムを追加
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- インデックスを追加（性別でのフィルタリングを高速化）
CREATE INDEX IF NOT EXISTS idx_photos_gender ON photos(gender);
CREATE INDEX IF NOT EXISTS idx_photos_gender_rating ON photos(gender, rating DESC);

-- 確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'photos'
ORDER BY ordinal_position;
