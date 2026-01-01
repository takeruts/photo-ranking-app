# Photo Ranking App

写真ランキング評価アプリ - ユーザーが投稿した写真をスワイプで評価し、Eloレーティングシステムでランキングを作成します。

## 主要機能

### 認証・アカウント管理
- **ユーザー認証**: Supabase Authを使用したメール/パスワード認証
- **性別登録**: アカウント作成時に性別を登録
- **パスワード表示切替**: パスワード入力時に👁️/🙈アイコンで表示/非表示を切り替え
- **パスワード確認**: サインアップ時に2回入力して一致確認
- **利用規約同意**: アカウント作成時に利用規約とプライバシーポリシーに同意
- **スクロール可能なフォーム**: キーボード表示時でもフォーム全体にアクセス可能
- **アカウント削除**: ソフトデリートによる安全なアカウント削除と復元機能

### 写真管理
- **写真アップロード**: 最大5枚の写真をアップロード
- **画像検証**: Google Cloud Vision APIによる実写人物写真の自動検証
  - 不適切なコンテンツの検出
  - イラスト・アニメ・AI生成画像の除外
  - 人物・顔の検出
- **画像最適化**: スマホ写真サイズに最適化（最大1920px幅、JPEG圧縮80%）
- **写真削除**: アップロード済み写真の削除機能

### 評価・ランキング
- **オンボーディング評価**: 新規ユーザーは最初に10枚の写真を評価
- **日次評価**: 毎日最初のログイン時に5枚の写真を評価
- **スワイプ評価**: 2枚の写真を比較して好みを選択
- **Eloレーティング**: チェスのレーティングシステムを使用した公平な評価
- **性別別ランキング**: 男性/女性別のランキング表示

## 技術スタック

- **フロントエンド**: React Native + Expo SDK 54
- **言語**: TypeScript
- **バックエンド**: Supabase
  - 認証: Supabase Auth
  - データベース: PostgreSQL
  - ストレージ: Supabase Storage
  - Edge Functions: Deno (画像検証)
- **画像処理**:
  - expo-image-picker: 画像選択
  - expo-image-manipulator: 画像リサイズ・圧縮
- **AI/機械学習**: Google Cloud Vision API（画像検証）
- **ナビゲーション**: React Navigation
- **レーティングシステム**: Elo Rating System

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd photo-ranking-app
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてアカウント作成
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

### 3. 環境変数の設定

`.env`ファイルを作成し、以下を設定:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
```

### 4. Google Cloud Vision APIのセットアップ

詳細は[GOOGLE_CLOUD_SETUP.md](GOOGLE_CLOUD_SETUP.md)を参照

1. Google Cloud Consoleでプロジェクト作成
2. Vision APIを有効化
3. APIキーを作成
4. Supabase Edge Functionの環境変数に設定

### 5. データベースのセットアップ

Supabaseダッシュボードの「SQL Editor」で以下のSQLファイルを順番に実行:

1. `supabase-migration.sql` - 基本スキーマ作成
2. `supabase-update-trigger.sql` - プロフィール自動作成トリガー
3. `supabase-add-soft-delete.sql` - ソフトデリート機能追加

### 6. Edge Functionのデプロイ

```bash
# Supabase CLIのインストール（初回のみ）
npm install -g supabase

# Supabaseにログイン
npx supabase login

# Edge Functionをデプロイ
npx supabase functions deploy validate-image

# 環境変数を設定
npx supabase secrets set GOOGLE_CLOUD_API_KEY=your-api-key
```

### 7. ストレージバケットの作成

1. Supabaseダッシュボードの「Storage」を開く
2. 新しいバケット「photos」を作成
3. バケットを公開に設定
4. ストレージポリシーを設定:
   - 認証済みユーザーは自分のフォルダにアップロード可能
   - 誰でも写真を閲覧可能

### 8. アプリの起動

```bash
npm start
```

または

```bash
npx expo start
```

## 使い方

### 1. アカウント作成
1. メールアドレス、パスワード、ユーザー名、性別を入力
2. パスワード確認のため2回入力
3. 利用規約とプライバシーポリシーに同意
4. 「アカウント作成」をタップ

### 2. オンボーディング
1. 初回ログイン時に10枚の写真評価を完了
2. 2枚の写真から好みを選択してスワイプ

### 3. 写真アップロード
1. 「写真をアップロード」画面を開く
2. 「📸 写真を追加」をタップ
3. 実写の人物写真を選択（最大5枚）
4. 自動検証後、承認されればアップロード完了

### 4. 日次評価
1. 毎日最初のログイン時に5枚の写真を評価
2. スワイプして好みの写真を選択

### 5. ランキング確認
1. 「ランキング」画面で全体のランキングを確認
2. 男性/女性タブでフィルタリング可能

### 6. アカウント削除
1. プロフィール画面の「危険な操作」セクション
2. 「アカウントを削除」をタップ
3. 確認ダイアログで「削除する」を選択
4. すべてのデータが削除され、ログアウト

## Eloレーティングシステムについて

このアプリは、チェスで使用されるEloレーティングシステムを採用しています:

- **初期レーティング**: 1500
- **K-factor**: 32
- **計算方法**: 勝利した写真はレーティングが上昇し、敗北した写真は下降
- **期待勝率**: レーティング差に基づいて計算
- **公平性**: 強い写真に勝つと大きく上昇、弱い写真に負けると大きく下降

## プロジェクト構造

```
photo-ranking-app/
├── App.tsx                          # メインアプリケーション
├── screens/                         # 画面コンポーネント
│   ├── AuthScreen.tsx              # 認証画面
│   ├── UploadScreen.tsx            # 写真アップロード画面
│   ├── SwipeScreen.tsx             # スワイプ評価画面
│   ├── RankingScreen.tsx           # ランキング表示画面
│   ├── ProfileScreen.tsx           # プロフィール編集画面
│   ├── TermsScreen.tsx             # 利用規約・プライバシーポリシー画面
│   ├── OnboardingSwipeScreen.tsx   # オンボーディング評価画面
│   └── DailySwipeScreen.tsx        # 日次評価画面
├── lib/                            # ユーティリティ
│   ├── supabase.ts                 # Supabaseクライアント
│   ├── elo.ts                      # Eloレーティング計算
│   └── imageValidator.ts           # 画像検証クライアント
├── types/                          # TypeScript型定義
│   └── database.ts                 # データベース型定義
├── supabase/                       # Supabase設定
│   ├── functions/                  # Edge Functions
│   │   └── validate-image/         # 画像検証Function
│   └── config.toml                 # Supabase CLI設定
└── components/                     # 再利用可能なコンポーネント
```

## データベーススキーマ

### profiles
- `id`: UUID (auth.users参照)
- `username`: TEXT
- `gender`: TEXT ('male' | 'female')
- `onboarding_completed`: BOOLEAN
- `last_daily_swipe_date`: DATE
- `deleted_at`: TIMESTAMP (ソフトデリート用)
- `created_at`: TIMESTAMP

### photos
- `id`: UUID
- `user_id`: UUID (profiles参照)
- `image_url`: TEXT
- `rating`: INTEGER (初期値: 1500)
- `gender`: TEXT ('male' | 'female')
- `upload_date`: TIMESTAMP

### swipes
- `id`: UUID
- `voter_id`: UUID (profiles参照)
- `photo_a_id`: UUID (photos参照)
- `photo_b_id`: UUID (photos参照)
- `selected_photo_id`: UUID (photos参照)
- `created_at`: TIMESTAMP

## セキュリティとプライバシー

### 画像検証
- **不適切コンテンツ**: 成人向け、暴力的なコンテンツを自動検出して拒否
- **人物検出**: 実写の人物写真のみ受け入れ
- **AI生成画像除外**: CGI、AI生成画像を検出して拒否
- **イラスト除外**: アニメ、漫画、イラストを検出して拒否

### データ保護
- **ソフトデリート**: アカウント削除時にデータを論理削除（復元可能）
- **RLSポリシー**: Row Level Securityで削除済みユーザーのデータを非表示
- **認証**: Supabase Authによる安全な認証
- **ストレージ**: 認証済みユーザーのみアップロード可能

### プライバシー
- 利用規約とプライバシーポリシーを明示
- アカウント作成時に同意が必要
- 削除されたアカウントのデータは表示されない

## 開発ガイド

### デバッグログ
認証とonboarding遷移のデバッグログが有効化されています:
- `Auth state change event:` - 認証イベント
- `Profile fetch result:` - プロフィール取得結果
- `Setting onboarding_completed to:` - onboarding状態の変更

### トラブルシューティング

**Q: onboarding画面に遷移しない**
A: コンソールログを確認し、以下を確認:
- プロフィールが正しく作成されているか
- `onboarding_completed`がfalseになっているか
- 再サインイン処理が成功しているか

**Q: 画像アップロードが失敗する**
A: 以下を確認:
- Google Cloud Vision APIのAPIキーが正しく設定されているか
- Edge Functionが正しくデプロイされているか
- 画像が実写の人物写真か

**Q: アカウント削除後も再作成できない**
A: 削除済みアカウントは自動的に復元されます。同じメールアドレスで再サインアップすると、プロフィールが復元されます。

## 今後の拡張案

- [x] カテゴリ別ランキング（男性/女性）
- [x] 写真の削除機能
- [x] アカウント削除機能
- [x] 画像検証機能
- [x] 利用規約・プライバシーポリシー
- [ ] ユーザーごとのマイページ
- [ ] ソーシャルシェア機能
- [ ] プッシュ通知
- [ ] リアルタイムランキング更新
- [ ] コメント・いいね機能
- [ ] フィルター・検索機能
- [ ] パスワードリセット機能
- [ ] メール確認機能

## ライセンス

MIT

## お問い合わせ

プライバシーポリシーや利用規約に関するご質問は、以下までご連絡ください:

📧 admin@tarotai.jp
