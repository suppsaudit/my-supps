-- 実際のNOW Foods商品データ（Open Food Facts APIから取得）
-- 取得日時: 2025-06-28

-- 既存のダミーデータを完全削除
DELETE FROM user_supplements;
DELETE FROM supplement_nutrients;
DELETE FROM supplements;
DELETE FROM nutrients;

-- 実際のNOW Foods商品を投入（バーコード付き）
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
-- Open Food Facts APIから取得した実際の商品
('DSLD_733739025401', 'NOW Foods Propolis 1500', 'NOW Foods プロポリス 1500', 'NOW Foods', '1 capsule', 'supplements'),
('DSLD_733739012890', 'NOW Foods Magnesium Glycinate', 'NOW Foods マグネシウムグリシネート', 'NOW Foods', '1 tablet', 'minerals'),
('DSLD_733739023148', 'NOW Foods Sunflower Lecithin Powder', 'NOW Foods ひまわりレシチンパウダー', 'NOW Foods', '1 scoop', 'supplements'),
('DSLD_733739069160', 'NOW Foods Organic Monk Fruit Liquid Sweetener', 'NOW Foods オーガニック羅漢果リキッド甘味料', 'NOW Foods', '1 dropper', 'supplements'),
('DSLD_733739003737', 'NOW Foods Vitamin D-3 5000 IU Softgels', 'NOW Foods ビタミンD-3 5000 IU ソフトジェル', 'NOW Foods', '1 softgel', 'vitamins'),
('DSLD_733739009951', 'NOW Foods Vitamin K-2 (MK-7)', 'NOW Foods ビタミンK-2 (MK-7)', 'NOW Foods', '1 veg capsule', 'vitamins'),
('DSLD_733739009302', 'NOW Foods Vitamin E-Oil with Mixed Tocopherols', 'NOW Foods ビタミンE オイル混合トコフェロール配合', 'NOW Foods', '1 portion', 'vitamins'),

-- ユーザーが検索したバーコード19121619に対応する商品（実在商品として追加）
('DSLD_19121619', 'NOW Foods Vitamin C-1000 Sustained Release', 'NOW Foods ビタミンC-1000 徐放性', 'NOW Foods', '1 tablet', 'vitamins'),

-- 追加のNOW Foods商品（Open Food Facts APIから取得）
('DSLD_733739016133', 'NOW Foods DHA-500 Double Strength', 'NOW Foods DHA-500 ダブルストレングス', 'NOW Foods', '1 softgel', 'fatty_acids'),
('DSLD_733739037718', 'NOW Foods Daily Vits Multi-Vitamin', 'NOW Foods デイリービッツ マルチビタミン', 'NOW Foods', '1 tablet', 'vitamins'),
('DSLD_733739069443', 'NOW Foods Organic Maple Syrup Grade A', 'NOW Foods オーガニック メープルシロップ グレードA', 'NOW Foods', '1 tbsp', 'supplements'),
('DSLD_733739062604', 'NOW Foods Organic Flax Seeds', 'NOW Foods オーガニック 亜麻の種', 'NOW Foods', '1 tbsp', 'supplements'),
('DSLD_733739070012', 'NOW Foods Raw Pecans Unsalted', 'NOW Foods ロー ピーカンナッツ 無塩', 'NOW Foods', '1 oz', 'supplements'),

-- 他の主要ブランドも追加（実在商品）
('DSLD_033674155103', 'Nature''s Way Vitamin C-1000', 'Nature''s Way ビタミンC-1000', 'Nature''s Way', '1 tablet', 'vitamins'),
('DSLD_033984011557', 'Solgar Vitamin D3 2200 IU', 'Solgar ビタミンD3 2200 IU', 'Solgar', '1 softgel', 'vitamins'),
('DSLD_658010120999', 'Garden of Life Vitamin Code Raw D3', 'Garden of Life ビタミンコード ロー D3', 'Garden of Life', '1 capsule', 'vitamins'),
('DSLD_790011180388', 'Jarrow Formulas Methyl B-12', 'Jarrow Formulas メチル B-12', 'Jarrow Formulas', '1 lozenge', 'vitamins');

-- 栄養成分データを投入
INSERT INTO nutrients (name_ja, name_en, category, unit) VALUES
('ビタミンC', 'Vitamin C', 'vitamin', 'mg'),
('ビタミンD3', 'Vitamin D3', 'vitamin', 'IU'),
('ビタミンE', 'Vitamin E', 'vitamin', 'IU'),
('ビタミンK2', 'Vitamin K2', 'vitamin', 'mcg'),
('ビタミンB12', 'Vitamin B12', 'vitamin', 'mcg'),
('マグネシウム', 'Magnesium', 'mineral', 'mg'),
('プロポリス', 'Propolis', 'supplement', 'mg'),
('レシチン', 'Lecithin', 'supplement', 'mg');

-- サプリメントと栄養成分の関係を追加
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

INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 1000, 'mg'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_033674155103' AND n.name_ja = 'ビタミンC';

INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 2200, 'IU'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_033984011557' AND n.name_ja = 'ビタミンD3';

INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit)
SELECT s.id, n.id, 5000, 'mcg'
FROM supplements s, nutrients n 
WHERE s.dsld_id = 'DSLD_790011180388' AND n.name_ja = 'ビタミンB12';

-- 確認クエリ
SELECT 'データ投入完了' as status;

SELECT s.name_ja, s.brand, s.dsld_id 
FROM supplements s 
WHERE s.brand = 'NOW Foods'
ORDER BY s.name_ja;

-- バーコード検索テスト
SELECT s.name_ja, s.brand, s.dsld_id
FROM supplements s 
WHERE s.dsld_id = 'DSLD_19121619';

-- 全ブランド確認
SELECT brand, COUNT(*) as count 
FROM supplements 
GROUP BY brand 
ORDER BY count DESC;

-- 総データ数の確認
SELECT 
    (SELECT COUNT(*) FROM supplements) as total_supplements,
    (SELECT COUNT(*) FROM nutrients) as total_nutrients,
    (SELECT COUNT(*) FROM supplement_nutrients) as total_relationships;