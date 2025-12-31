-- Supabase データベース セットアップ用SQL
-- このファイルをSupabase SQL Editorで実行してください

-- プロフィールテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 写真テーブル
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  rating INTEGER DEFAULT 1500 NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- スワイプ評価テーブル
CREATE TABLE IF NOT EXISTS swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  photo_a_id UUID REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  photo_b_id UUID REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  selected_photo_id UUID REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_rating ON photos(rating DESC);
CREATE INDEX IF NOT EXISTS idx_swipes_voter_id ON swipes(voter_id);
CREATE INDEX IF NOT EXISTS idx_swipes_created_at ON swipes(created_at DESC);

-- Row Level Security (RLS) の設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- プロフィール: 誰でも読み取り可能、自分のプロフィールのみ更新可能
CREATE POLICY "プロフィールは誰でも閲覧可能" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "自分のプロフィールのみ更新可能" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "プロフィールの作成" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 写真: 誰でも読み取り可能、自分の写真のみ挿入・削除可能
CREATE POLICY "写真は誰でも閲覧可能" ON photos
  FOR SELECT USING (true);

CREATE POLICY "認証済みユーザーは写真を投稿可能" ON photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分の写真のみ削除可能" ON photos
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "写真のレーティング更新は誰でも可能" ON photos
  FOR UPDATE USING (true);

-- スワイプ: 自分のスワイプのみ閲覧可能、認証済みユーザーは作成可能
CREATE POLICY "自分のスワイプのみ閲覧可能" ON swipes
  FOR SELECT USING (auth.uid() = voter_id);

CREATE POLICY "認証済みユーザーはスワイプ可能" ON swipes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- ストレージバケットの作成（Supabase UI で手動で作成するか、以下のコマンドを実行）
-- バケット名: photos
-- 公開アクセス: true
-- 許可するファイルタイプ: image/jpeg, image/png, image/webp

-- ストレージポリシー（Supabase UI のStorage > Policies で設定）
-- 1. 認証済みユーザーは自分のフォルダにアップロード可能
-- 2. 誰でも写真を閲覧可能
