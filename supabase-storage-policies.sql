-- Supabase Storageのphotosバケット用のRLSポリシー設定

-- 1. photosバケットが存在することを確認
-- Supabase UIで Storage > Buckets から "photos" という名前のバケットを作成してください
-- バケット設定: Public bucket = true (公開バケット)

-- 2. 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all photos" ON storage.objects;

-- 3. ストレージオブジェクトのRLSポリシーを設定

-- 認証済みユーザーが自分のフォルダにアップロードできるようにする
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 認証済みユーザーが自分のファイルを更新できるようにする
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 認証済みユーザーが自分のファイルを削除できるようにする
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 全員がphotosバケットのファイルを閲覧できるようにする（公開バケット）
CREATE POLICY "Public can view all photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'photos');

-- 確認
SELECT * FROM storage.objects WHERE bucket_id = 'photos' LIMIT 5;
