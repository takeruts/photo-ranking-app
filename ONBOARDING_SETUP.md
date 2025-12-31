# オンボーディング＆日次評価機能セットアップ手順

このドキュメントは、以下の機能のセットアップ手順を説明します：
- **新規ユーザー**: 初回ログイン時に10枚の写真評価
- **既存ユーザー**: その日初めてのログイン時に5枚の写真評価
- **通常時**: いつでも写真評価が可能（SwipeScreen）

## 1. データベースの更新

Supabaseダッシュボードで以下のSQLファイルを実行してください：

### 1.1 swipesテーブルの更新
`supabase-update-swipes.sql` を実行して、swipesテーブルを2枚比較式から1枚評価式に変更します。

```sql
-- このファイルを実行: supabase-update-swipes.sql
```

### 1.2 profilesテーブルにフィールドを追加
`supabase-add-onboarding.sql` を実行して、オンボーディング完了状態と日次評価日を追跡するフィールドを追加します。

```sql
-- このファイルを実行: supabase-add-onboarding.sql
```

このSQLファイルは以下を追加します：
- `onboarding_completed`: 初回10枚評価が完了したかどうか
- `last_daily_swipe_date`: 最後に日次5枚評価を完了した日付

## 2. 実装された機能

### 2.1 OnboardingSwipeScreen（新規ユーザー用）
- **場所**: `screens/OnboardingSwipeScreen.tsx`
- **機能**:
  - 新規ユーザーの初回ログイン時に表示される画面
  - 異性の写真を10枚ランダムに表示
  - 各写真に対して「いいね！」または「よくない」を選択
  - プログレスバーで進捗を表示（X / 10）
  - 10枚の評価が完了したら自動的にホーム画面へ遷移
  - 評価完了時に`profiles.onboarding_completed`をtrueに更新

### 2.2 DailySwipeScreen（既存ユーザー用）
- **場所**: `screens/DailySwipeScreen.tsx`
- **機能**:
  - 既存ユーザーがその日初めてログインした時に表示される画面
  - 異性の写真を5枚ランダムに表示
  - 各写真に対して「いいね！」または「よくない」を選択
  - プログレスバーで進捗を表示（X / 5）
  - 5枚の評価が完了したら自動的にホーム画面へ遷移
  - 評価完了時に`profiles.last_daily_swipe_date`を今日の日付に更新

### 2.3 SwipeScreen（通常時）
- **場所**: `screens/SwipeScreen.tsx`
- **機能**:
  - ホーム画面から「写真を評価」ボタンでアクセス可能
  - いつでも好きなだけ写真を評価できる
  - 2枚の写真を比較する方式から、1枚の写真を評価する方式に変更
  - 評価方法:
    - 👍 いいね！: +10ポイント
    - 👎 よくない: -5ポイント
  - 既に見た写真を除外して表示

### 2.4 App.tsx の更新
- ログイン状態と評価状態に基づいた4つの状態管理:
  1. **未ログイン** → AuthScreen
  2. **新規ユーザー**（onboarding未完了） → OnboardingSwipeScreen（10枚）
  3. **既存ユーザー**（その日初めてのログイン） → DailySwipeScreen（5枚）
  4. **既存ユーザー**（日次評価完了済み） → HomeScreen

### 2.5 Database Types の更新
- `types/database.ts`に以下を追加:
  - `profiles.onboarding_completed`: オンボーディング完了フラグ
  - `profiles.last_daily_swipe_date`: 最後の日次評価日
  - `swipes`テーブルの構造変更（photo_id, liked）

## 3. テスト手順

### 3.1 新規ユーザーのテスト
1. Supabaseダッシュボードで上記のSQLファイルを実行
2. アプリを起動: `npm start` または `npx expo start`
3. 新規ユーザーでサインアップ
4. ログイン後、OnboardingSwipeScreenが表示されることを確認
5. 10枚の写真を評価
6. 評価完了後、ホーム画面に遷移することを確認
7. ホーム画面から「写真を評価」を選択してSwipeScreenにアクセスできることを確認

### 3.2 既存ユーザーのテスト
1. 既存ユーザーでログイン（または新規ユーザーで10枚評価完了後）
2. 一度ログアウト
3. 次の日（またはSupabaseで`last_daily_swipe_date`を過去の日付に変更）
4. 再度ログイン
5. DailySwipeScreenが表示されることを確認
6. 5枚の写真を評価
7. 評価完了後、ホーム画面に遷移することを確認
8. 再度ログアウトして同じ日にログインした場合、DailySwipeScreenをスキップしてホーム画面に直接遷移することを確認

## 4. 既存ユーザーへの影響

`supabase-add-onboarding.sql`では、既存のユーザーはすべて以下のように設定されます：
- `onboarding_completed = TRUE`: 10枚の初回評価は完了済みとする
- `last_daily_swipe_date = CURRENT_DATE`: 今日の日次評価は完了済みとする

これにより、既存ユーザーは即座にホーム画面にアクセスでき、次の日から日次5枚評価が始まります。

## 5. トラブルシューティング

### エラー: 写真が不足している（新規ユーザー）
- OnboardingSwipeScreenは最低10枚の異性の写真が必要です
- SampleDataScreenから十分な数の異性の写真を追加してください

### エラー: 写真が不足している（既存ユーザー）
- DailySwipeScreenは最低5枚の異性の写真が必要です
- SampleDataScreenから十分な数の異性の写真を追加してください

### エラー: onboarding_completedカラムが見つからない
- `supabase-add-onboarding.sql`が正しく実行されたか確認してください

### エラー: last_daily_swipe_dateカラムが見つからない
- `supabase-add-onboarding.sql`が正しく実行されたか確認してください

### エラー: swipesテーブルのカラムエラー
- `supabase-update-swipes.sql`が正しく実行されたか確認してください
- 古いswipesテーブルのデータは削除されますのでご注意ください

### 日次評価をリセットしたい場合
Supabaseダッシュボードで以下のSQLを実行：
```sql
UPDATE profiles
SET last_daily_swipe_date = NULL
WHERE id = 'ユーザーID';
```

または全ユーザーをリセット：
```sql
UPDATE profiles
SET last_daily_swipe_date = NULL;
```
