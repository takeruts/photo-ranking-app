# Supabase Storage セットアップ手順

写真アップロード機能を使用するために、Supabase Storageの設定が必要です。

## 1. Storageバケットの作成

1. Supabaseダッシュボードにログイン
2. 左サイドバーから **Storage** を選択
3. **New Bucket** ボタンをクリック
4. 以下の設定でバケットを作成:
   - **Name**: `photos`
   - **Public bucket**: ✅ チェックを入れる（公開バケット）
   - **File size limit**: デフォルトのまま（または必要に応じて調整）
   - **Allowed MIME types**: `image/*` （画像ファイルのみ許可）

## 2. RLSポリシーの設定

Supabase SQL Editorで `supabase-storage-policies.sql` を実行してください。

このSQLファイルは以下のポリシーを設定します:

1. **Users can upload to own folder**: 認証済みユーザーが自分のフォルダ（user_id/）にファイルをアップロード可能
2. **Users can update own files**: 認証済みユーザーが自分のファイルを更新可能
3. **Users can delete own files**: 認証済みユーザーが自分のファイルを削除可能
4. **Public can view all photos**: 全員（未認証含む）がphotosバケット内のファイルを閲覧可能

## 3. 動作確認

1. アプリを起動
2. ログイン
3. プロフィール編集で性別を設定
4. 写真アップロード画面で写真を選択
5. アップロードボタンをクリック
6. 成功メッセージが表示されることを確認

## トラブルシューティング

### エラー: "new row violated row-level security policy"

RLSポリシーが正しく設定されていない可能性があります。

**解決方法:**
1. Supabase SQL Editorで `supabase-storage-policies.sql` を実行
2. または、Supabase Storage UIで以下を確認:
   - Storage > Configuration > Policies
   - 上記4つのポリシーが存在することを確認

### エラー: "Bucket not found"

`photos`バケットが作成されていません。

**解決方法:**
1. Supabase Storage UIで `photos` バケットを作成
2. Public bucketをONにする

### エラー: "Network request failed"

モバイルアプリでファイル読み込みに失敗しています。

**解決方法:**
- `expo-file-system/legacy` パッケージがインストールされていることを確認
- `npm install` を実行してパッケージを再インストール

### 既存のポリシーとの競合

既に同名のポリシーが存在する場合、エラーが発生します。

**解決方法:**
Supabase SQL Editorで既存のポリシーを削除してから再作成:

```sql
-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all photos" ON storage.objects;
```

その後、`supabase-storage-policies.sql` を実行してください。

## セキュリティに関する注意

- **Public bucket**: photosバケットは公開設定です。URLを知っていれば誰でもアクセスできます。
- **ファイルサイズ制限**: 必要に応じてバケット設定でファイルサイズ制限を設定してください。
- **MIME type制限**: 画像ファイル以外のアップロードを防ぐため、`image/*` のみを許可しています。

## ファイル構成

アップロードされたファイルは以下の構造で保存されます:

```
photos/
  ├── {user_id}/
  │   ├── {timestamp1}.jpg
  │   ├── {timestamp2}.jpg
  │   └── ...
  └── {user_id}/
      └── ...
```

各ユーザーは自分のフォルダ（user_id）にのみアップロード可能です。
