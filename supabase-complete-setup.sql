-- 完全なSupabaseセットアップスクリプト
-- このスクリプトをSupabaseダッシュボードのSQL Editorで実行してください

-- ========================================
-- 1. photosテーブルにgenderカラムを追加
-- ========================================
ALTER TABLE photos
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female'));

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_photos_gender ON photos(gender);
CREATE INDEX IF NOT EXISTS idx_photos_gender_rating ON photos(gender, rating DESC);

-- ========================================
-- 2. サンプルユーザーのプロフィールを作成
-- ========================================

-- ステップ2-1: 既存の制約を確認して削除
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_id_fkey'
    ) INTO constraint_exists;

    IF constraint_exists THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
        RAISE NOTICE 'Constraint profiles_id_fkey dropped';
    END IF;
END $$;

-- ステップ2-2: サンプルユーザーのプロフィールを作成
INSERT INTO profiles (id, username, gender, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'サンプルユーザー',
  'male',
  NOW()
)
ON CONFLICT (id)
DO UPDATE SET
  username = 'サンプルユーザー',
  gender = 'male';

-- ステップ2-3: 制約を再度追加（NOT VALIDで既存レコードをスキップ）
DO $$
BEGIN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;

    RAISE NOTICE 'Constraint profiles_id_fkey added with NOT VALID';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists, skipping';
END $$;

-- ========================================
-- 3. Row Level Security (RLS) ポリシーの設定
-- ========================================

-- 既存のポリシーを削除（エラーを無視）
DROP POLICY IF EXISTS "Allow sample user inserts" ON photos;
DROP POLICY IF EXISTS "Allow all to read photos" ON photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON photos;
DROP POLICY IF EXISTS "Users can update own photos" ON photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON photos;

-- photosテーブルへの読み取りを全員に許可
CREATE POLICY "Allow all to read photos" ON photos
FOR SELECT
USING (true);

-- サンプルユーザーの挿入を許可
CREATE POLICY "Allow sample user inserts" ON photos
FOR INSERT
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

-- 通常ユーザーが自分の写真を挿入できるようにする
CREATE POLICY "Users can insert own photos" ON photos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 通常ユーザーが自分の写真を更新できるようにする
CREATE POLICY "Users can update own photos" ON photos
FOR UPDATE
USING (auth.uid() = user_id);

-- 通常ユーザーが自分の写真を削除できるようにする
CREATE POLICY "Users can delete own photos" ON photos
FOR DELETE
USING (auth.uid() = user_id);

-- ========================================
-- 4. 確認クエリ
-- ========================================

-- サンプルユーザーのプロフィールを確認
SELECT id, username, gender, created_at
FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000001';

-- photosテーブルの構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'photos'
ORDER BY ordinal_position;

-- RLSポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'photos';
