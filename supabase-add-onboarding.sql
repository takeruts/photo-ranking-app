-- profilesテーブルにonboarding_completedとlast_daily_swipe_dateフィールドを追加
-- 新規ユーザー: 初回ログイン時に10枚評価
-- 既存ユーザー: その日初めてのログイン時に5枚評価

-- onboarding_completedカラムを追加（デフォルトはfalse）
-- 新規ユーザーは10枚の初回評価が必要
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- last_daily_swipe_dateカラムを追加
-- その日の日次評価（5枚）を完了した日付を記録
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_daily_swipe_date DATE;

-- 既存のユーザーはすべてonboarding完了済みとしてマーク（後方互換性のため）
-- そして今日の日次評価も完了済みとする
UPDATE profiles
SET onboarding_completed = TRUE,
    last_daily_swipe_date = CURRENT_DATE
WHERE onboarding_completed IS NULL OR onboarding_completed = FALSE;

-- 確認
SELECT id, username, gender, onboarding_completed, last_daily_swipe_date FROM profiles LIMIT 10;
