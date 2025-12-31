# Photo Ranking App

写真ランキング評価アプリ - ユーザーが投稿した写真をスワイプで評価し、Eloレーティングシステムでランキングを作成します。

## 機能

- **ユーザー認証**: Supabase Authを使用したメール/パスワード認証
- **写真アップロード**: 最大5枚の写真をアップロード
- **スワイプ評価**: 2枚の写真を比較して好みを選択
- **Eloレーティング**: チェスのレーティングシステムを使用した公平な評価
- **ランキング表示**: レーティング順にランキングを表示

## 技術スタック

- **フロントエンド**: React Native + Expo
- **言語**: TypeScript
- **バックエンド**: Supabase
  - 認証: Supabase Auth
  - データベース: PostgreSQL
  - ストレージ: Supabase Storage
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
```

### 4. データベースのセットアップ

1. Supabaseダッシュボードの「SQL Editor」を開く
2. `supabase-setup.sql`の内容をコピー＆ペーストして実行

### 5. ストレージバケットの作成

1. Supabaseダッシュボードの「Storage」を開く
2. 新しいバケット「photos」を作成
3. バケットを公開に設定
4. ストレージポリシーを設定:
   - 認証済みユーザーは自分のフォルダにアップロード可能
   - 誰でも写真を閲覧可能

### 6. アプリの起動

```bash
npm start
```

または

```bash
npx expo start
```

## 使い方

1. **サインアップ/ログイン**: メールアドレスとパスワードでアカウント作成
2. **写真をアップロード**: 自分の写真を最大5枚までアップロード
3. **写真を評価**: ランダムに表示される2枚の写真から好みを選択
4. **ランキング確認**: 全体のランキングを確認

## Eloレーティングシステムについて

このアプリは、チェスで使用されるEloレーティングシステムを採用しています:

- **初期レーティング**: 1500
- **K-factor**: 32
- **計算方法**: 勝利した写真はレーティングが上昇し、敗北した写真は下降
- **期待勝率**: レーティング差に基づいて計算

## プロジェクト構造

```
photo-ranking-app/
├── App.tsx                 # メインアプリケーション
├── screens/               # 画面コンポーネント
│   ├── AuthScreen.tsx     # 認証画面
│   ├── UploadScreen.tsx   # 写真アップロード画面
│   ├── SwipeScreen.tsx    # スワイプ評価画面
│   └── RankingScreen.tsx  # ランキング表示画面
├── lib/                   # ユーティリティ
│   ├── supabase.ts        # Supabaseクライアント
│   └── elo.ts             # Eloレーティング計算
├── types/                 # TypeScript型定義
│   └── database.ts        # データベース型定義
└── components/            # 再利用可能なコンポーネント
```

## データベーススキーマ

### profiles
- `id`: UUID (auth.users参照)
- `username`: TEXT
- `created_at`: TIMESTAMP

### photos
- `id`: UUID
- `user_id`: UUID (profiles参照)
- `image_url`: TEXT
- `rating`: INTEGER (初期値: 1500)
- `upload_date`: TIMESTAMP

### swipes
- `id`: UUID
- `voter_id`: UUID (profiles参照)
- `photo_a_id`: UUID (photos参照)
- `photo_b_id`: UUID (photos参照)
- `selected_photo_id`: UUID (photos参照)
- `created_at`: TIMESTAMP

## 今後の拡張案

- [ ] カテゴリ別ランキング（男性/女性）
- [ ] ユーザーごとのマイページ
- [ ] 写真の削除・編集機能
- [ ] ソーシャルシェア機能
- [ ] プッシュ通知
- [ ] リアルタイムランキング更新
- [ ] コメント・いいね機能
- [ ] フィルター・検索機能

## ライセンス

MIT
