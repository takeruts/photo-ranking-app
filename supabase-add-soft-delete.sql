-- 論理削除（ソフトデリート）機能を追加
-- このファイルをSupabase SQL Editorで実行してください

-- profilesテーブルにdeleted_atカラムを追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- deleted_atにインデックスを作成（削除済みユーザーのフィルタリングを高速化）
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);

-- RLSポリシーを更新：削除済みユーザーは表示しない
DROP POLICY IF EXISTS "プロフィールは誰でも閲覧可能" ON profiles;

CREATE POLICY "アクティブなプロフィールは誰でも閲覧可能" ON profiles
  FOR SELECT USING (deleted_at IS NULL);

-- 自分のプロフィールは削除済みでも閲覧可能（削除処理のため）
CREATE POLICY "自分のプロフィールは常に閲覧可能" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- photosテーブルのRLSポリシーも更新：削除済みユーザーの写真は表示しない
DROP POLICY IF EXISTS "写真は誰でも閲覧可能" ON photos;

CREATE POLICY "アクティブユーザーの写真は誰でも閲覧可能" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = photos.user_id
      AND profiles.deleted_at IS NULL
    )
  );

-- コメント
COMMENT ON COLUMN profiles.deleted_at IS 'アカウント削除日時（NULL=アクティブ、NOT NULL=削除済み）';
