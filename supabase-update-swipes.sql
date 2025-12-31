-- swipesテーブルを新しい構造に更新
-- 古い2枚比較式から、1枚評価式（いいね/よくない）に変更

-- 既存のテーブルを削除して再作成
DROP TABLE IF EXISTS swipes;

-- 新しいswipesテーブルを作成
CREATE TABLE swipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX idx_swipes_voter ON swipes(voter_id);
CREATE INDEX idx_swipes_photo ON swipes(photo_id);
CREATE INDEX idx_swipes_created_at ON swipes(created_at DESC);

-- RLSを有効化
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- RLSポリシーを作成
CREATE POLICY "Users can insert own swipes" ON swipes
FOR INSERT
WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can view own swipes" ON swipes
FOR SELECT
USING (auth.uid() = voter_id);

-- 確認
SELECT * FROM swipes LIMIT 5;
