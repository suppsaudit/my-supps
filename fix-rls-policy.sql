-- Row Level Security (RLS) ポリシーを修正
-- これをSupabaseのSQL Editorで実行してください

-- 1. supplementsテーブルのRLSを一時的に無効化
ALTER TABLE supplements DISABLE ROW LEVEL SECURITY;

-- 2. nutrientsテーブルのRLSを一時的に無効化
ALTER TABLE nutrients DISABLE ROW LEVEL SECURITY;

-- 3. supplement_nutrientsテーブルのRLSを一時的に無効化
ALTER TABLE supplement_nutrients DISABLE ROW LEVEL SECURITY;

-- 4. user_supplementsテーブルは認証が必要なのでRLSは保持

-- 5. 確認用クエリ
SELECT table_name, row_security 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('supplements', 'nutrients', 'supplement_nutrients');

-- このSQLを実行した後、もう一度データ投入を試してください