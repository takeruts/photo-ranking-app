-- トリガー関数を更新してgenderカラムを含める
-- このファイルをSupabase SQL Editorで実行してください

-- トリガー関数を更新（genderカラムを追加）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, gender, onboarding_completed, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'gender',
    FALSE,
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- プロフィールが既に存在する場合は無視
    RETURN NEW;
  WHEN OTHERS THEN
    -- その他のエラーの場合もユーザー作成を続行
    RETURN NEW;
END;
$$;

-- コメント
COMMENT ON FUNCTION public.handle_new_user() IS '新規ユーザー作成時にプロフィールを自動作成するトリガー関数';
