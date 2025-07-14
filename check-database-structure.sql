-- Supabaseデータベース構造の確認
-- supplementsテーブルの構造を確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'supplements' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- supplementsテーブルの現在のデータ数を確認
SELECT COUNT(*) as total_supplements FROM supplements;

-- NOW Foodsブランドの商品数を確認
SELECT COUNT(*) as now_foods_count FROM supplements WHERE brand = 'NOW Foods';

-- 全ブランドの一覧を確認
SELECT brand, COUNT(*) as product_count 
FROM supplements 
GROUP BY brand 
ORDER BY product_count DESC;

-- barcodeカラムが存在するかを確認
SELECT COUNT(*) as barcode_count 
FROM supplements 
WHERE barcode IS NOT NULL;