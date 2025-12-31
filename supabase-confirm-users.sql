-- 既存のユーザーを確認済みにするSQL

-- すべての未確認ユーザーを確認済みにする
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 確認: すべてのユーザーの確認状態を表示
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users;
