-- RLSポリシーを修正するSQL

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "プロフィールの作成" ON profiles;
DROP POLICY IF EXISTS "自分のプロフィールのみ更新可能" ON profiles;
DROP POLICY IF EXISTS "プロフィールは誰でも閲覧可能" ON profiles;

-- プロフィールテーブルのRLSを再設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 新しいポリシーを作成
-- 1. 誰でもプロフィールを閲覧可能
CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles
  FOR SELECT USING (true);

-- 2. 認証済みユーザーは自分のプロフィールを作成可能
CREATE POLICY "認証済みユーザーはプロフィールを作成可能" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. 自分のプロフィールのみ更新可能
CREATE POLICY "自分のプロフィールのみ更新可能" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. 自分のプロフィールのみ削除可能
CREATE POLICY "自分のプロフィールのみ削除可能" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- トリガー関数を作成: ユーザー登録時に自動でプロフィールを作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 既存のトリガーがあれば削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 新しいユーザー作成時にトリガーを実行
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
