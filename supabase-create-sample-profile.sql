-- サンプルユーザー用のプロフィールを作成
-- 注意: これは開発環境でのみ使用してください

-- ステップ1: 既存の制約情報を確認
DO $$
DECLARE
    constraint_exists boolean;
BEGIN
    -- 制約の存在確認
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_id_fkey'
    ) INTO constraint_exists;

    -- 制約が存在する場合は削除
    IF constraint_exists THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
        RAISE NOTICE 'Constraint profiles_id_fkey dropped';
    END IF;
END $$;

-- ステップ2: サンプルユーザーのプロフィールを作成
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

-- ステップ3: 制約を再度追加（NOT VALIDで既存レコードをスキップ）
DO $$
BEGIN
    -- 制約を追加（既存のデータは検証しない）
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
    NOT VALID;

    RAISE NOTICE 'Constraint profiles_id_fkey added with NOT VALID';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists, skipping';
END $$;

-- 確認
SELECT id, username, gender, created_at
FROM profiles
WHERE id = '00000000-0000-0000-0000-000000000001';
