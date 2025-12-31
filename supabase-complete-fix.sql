-- 完全な修正SQL - Supabase SQL Editorで実行してください

-- 1. 既存のトリガーとポリシーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP POLICY IF EXISTS "プロフィールの作成" ON profiles;
DROP POLICY IF EXISTS "認証済みユーザーはプロフィールを作成可能" ON profiles;
DROP POLICY IF EXISTS "自分のプロフィールのみ更新可能" ON profiles;
DROP POLICY IF EXISTS "プロフィールは誰でも閲覧可能" ON profiles;
DROP POLICY IF EXISTS "自分のプロフィールのみ削除可能" ON profiles;

-- 2. RLSを一時的に無効化してテーブルをクリーン
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. RLSを再度有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. 新しいポリシーを作成
-- 誰でもプロフィールを閲覧可能
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

-- 認証済みユーザーは自分のプロフィールを挿入可能
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (true);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 自分のプロフィールのみ削除可能
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- 5. トリガー関数を作成（SECURITY DEFINERで実行）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- プロフィールが既に存在する場合は無視
    RETURN NEW;
  WHEN OTHERS THEN
    -- その他のエラーの場合もユーザー作成を続行
    RETURN NEW;
END;
$$;

-- 6. トリガーを作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. 確認用クエリ（実行結果を確認）
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';
