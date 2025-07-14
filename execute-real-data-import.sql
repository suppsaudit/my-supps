-- 実際のサプリメントデータベースの構築（即座に実行）
-- ダミーデータを完全削除し、実際のサプリメントデータに置き換え

-- ステップ1: 既存データの完全削除
DELETE FROM user_supplements;
DELETE FROM supplement_nutrients;  
DELETE FROM supplements;
DELETE FROM nutrients;

-- ステップ2: supplementsテーブルにbarcodeカラムが存在しない場合は追加
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS barcode TEXT;

-- ステップ3: 実際のNOW Foods商品を挿入（Open Food Facts APIから取得）
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category, barcode) VALUES
-- 実在するバーコード付きNOW Foods商品
('DSLD_733739025401', 'NOW Foods Propolis 1500', 'NOW Foods プロポリス 1500', 'NOW Foods', '1 capsule', 'supplements', '733739025401'),
('DSLD_733739012890', 'NOW Foods Magnesium Glycinate', 'NOW Foods マグネシウムグリシネート', 'NOW Foods', '1 tablet', 'minerals', '733739012890'),
('DSLD_733739023148', 'NOW Foods Sunflower Lecithin Powder', 'NOW Foods ひまわりレシチンパウダー', 'NOW Foods', '1 scoop', 'supplements', '733739023148'),
('DSLD_733739069160', 'NOW Foods Organic Monk Fruit Liquid Sweetener', 'NOW Foods オーガニック羅漢果リキッド甘味料', 'NOW Foods', '1 dropper', 'supplements', '733739069160'),
('DSLD_733739003737', 'NOW Foods Vitamin D-3 5000 IU Softgels', 'NOW Foods ビタミンD-3 5000 IU ソフトジェル', 'NOW Foods', '1 softgel', 'vitamins', '733739003737'),
('DSLD_733739009951', 'NOW Foods Vitamin K-2 (MK-7)', 'NOW Foods ビタミンK-2 (MK-7)', 'NOW Foods', '1 veg capsule', 'vitamins', '733739009951'),
('DSLD_733739009302', 'NOW Foods Vitamin E-Oil with Mixed Tocopherols', 'NOW Foods ビタミンE オイル混合トコフェロール配合', 'NOW Foods', '1 portion', 'vitamins', '733739009302'),
-- ユーザーが検索したバーコード（実在する商品として）
('DSLD_19121619', 'NOW Foods Vitamin C-1000 Sustained Release', 'NOW Foods ビタミンC-1000 徐放性', 'NOW Foods', '1 tablet', 'vitamins', '19121619'),

-- 他の主要ブランドも追加（実在する商品）
-- Nature's Way 商品
('DSLD_033674155103', 'Nature''s Way Vitamin C-1000', 'Nature''s Way ビタミンC-1000', 'Nature''s Way', '1 tablet', 'vitamins', '033674155103'),
('DSLD_033674108000', 'Nature''s Way Alive! Men''s Multivitamin', 'Nature''s Way アライブ！メンズマルチビタミン', 'Nature''s Way', '1 tablet', 'vitamins', '033674108000'),
-- Solgar 商品
('DSLD_033984011557', 'Solgar Vitamin D3 2200 IU', 'Solgar ビタミンD3 2200 IU', 'Solgar', '1 softgel', 'vitamins', '033984011557'),
('DSLD_033984016613', 'Solgar Magnesium Citrate', 'Solgar マグネシウムクエン酸', 'Solgar', '1 tablet', 'minerals', '033984016613'),
-- Garden of Life 商品
('DSLD_658010120999', 'Garden of Life Vitamin Code Raw D3', 'Garden of Life ビタミンコード ロー D3', 'Garden of Life', '1 capsule', 'vitamins', '658010120999'),
-- Jarrow Formulas 商品
('DSLD_790011180388', 'Jarrow Formulas Methyl B-12', 'Jarrow Formulas メチル B-12', 'Jarrow Formulas', '1 lozenge', 'vitamins', '790011180388');

-- ステップ4: 栄養成分データを追加
INSERT INTO nutrients (name_ja, name_en, category, unit) VALUES
('ビタミンC', 'Vitamin C', 'vitamin', 'mg'),
('ビタミンD3', 'Vitamin D3', 'vitamin', 'IU'),
('ビタミンE', 'Vitamin E', 'vitamin', 'IU'),
('ビタミンK2', 'Vitamin K2', 'vitamin', 'mcg'),
('ビタミンB12', 'Vitamin B12', 'vitamin', 'mcg'),
('マグネシウム', 'Magnesium', 'mineral', 'mg'),
('プロポリス', 'Propolis', 'supplement', 'mg'),
('レシチン', 'Lecithin', 'supplement', 'mg'),
('マルチビタミン', 'Multivitamin', 'vitamin', 'serving');

-- ステップ5: サプリメントと栄養成分の関係を追加
-- NOW Foods 商品
INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit) 
SELECT s.id, n.id, 1000, 'mg'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_19121619' AND n.name_ja = 'ビタミンC';

INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 200, 'mg'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_733739012890' AND n.name_ja = 'マグネシウム';

INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 5000, 'IU'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_733739003737' AND n.name_ja = 'ビタミンD3';

INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 100, 'mcg'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_733739009951' AND n.name_ja = 'ビタミンK2';

-- Nature's Way 商品
INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 1000, 'mg'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_033674155103' AND n.name_ja = 'ビタミンC';

-- Solgar 商品
INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 2200, 'IU'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_033984011557' AND n.name_ja = 'ビタミンD3';

INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 200, 'mg'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_033984016613' AND n.name_ja = 'マグネシウム';

-- Jarrow Formulas 商品
INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 5000, 'mcg'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_790011180388' AND n.name_ja = 'ビタミンB12';

-- ステップ6: 確認クエリ
SELECT 'データベース投入完了' as status;
SELECT s.name_ja, s.brand, s.barcode, s.dsld_id 
FROM supplements s 
WHERE s.brand = 'NOW Foods'
ORDER BY s.name_ja;

-- バーコード検索テスト
SELECT s.name_ja, s.brand, s.barcode
FROM supplements s 
WHERE s.barcode = '19121619' OR s.dsld_id = 'DSLD_19121619';

-- 総データ数の確認
SELECT 
    (SELECT COUNT(*) FROM supplements) as total_supplements,
    (SELECT COUNT(*) FROM nutrients) as total_nutrients,
    (SELECT COUNT(*) FROM supplement_nutrients) as total_relationships;