-- MY SUPPS Sample Data
-- データベーススキーマ作成後に実行してください

-- =============================================================================
-- BASIC SUPPLEMENTS DATA
-- =============================================================================

-- サンプルサプリメントデータ
INSERT INTO supplements (id, dsld_id, name_en, name_ja, brand, manufacturer, serving_size, servings_per_container, product_form, target_age, category, dosage_instructions) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'DSLD-12345', 'Vitamin C 1000mg Tablets', 'ビタミンC 1000mg タブレット', 'Nature''s Way', 'Nature''s Way', '1 tablet', 100, 'Tablet', 'Adult', 'Vitamin C', '1日1回'),
('550e8400-e29b-41d4-a716-446655440002', 'DSLD-12346', 'Vitamin D3 5000 IU Softgels', 'ビタミンD3 5000IU ソフトジェル', 'NOW Foods', 'NOW Foods', '1 softgel', 120, 'Softgel', 'Adult', 'Vitamin D', '1日1回'),
('550e8400-e29b-41d4-a716-446655440003', 'DSLD-12347', 'Magnesium Glycinate 200mg', 'マグネシウム グリシネート 200mg', 'Doctor''s Best', 'Doctor''s Best', '2 tablets', 120, 'Tablet', 'Adult', 'Magnesium', '1日2回'),
('550e8400-e29b-41d4-a716-446655440004', 'DSLD-12348', 'Omega-3 Fish Oil 1000mg', 'オメガ3 フィッシュオイル 1000mg', 'Nordic Naturals', 'Nordic Naturals', '2 softgels', 60, 'Softgel', 'Adult', 'Omega-3', '1日2回'),
('550e8400-e29b-41d4-a716-446655440005', 'DSLD-12349', 'Zinc Picolinate 15mg', '亜鉛 ピコリネート 15mg', 'Thorne', 'Thorne Health', '1 capsule', 60, 'Capsule', 'Adult', 'Zinc', '1日1回'),
('550e8400-e29b-41d4-a716-446655440006', 'DSLD-12350', 'B-Complex 100', 'ビタミンB群コンプレックス', 'Country Life', 'Country Life', '1 capsule', 90, 'Capsule', 'Adult', 'B-Vitamins', '1日1回'),
('550e8400-e29b-41d4-a716-446655440007', 'DSLD-12351', 'Calcium Citrate 1000mg', 'カルシウム シトレート 1000mg', 'Solgar', 'Solgar', '2 tablets', 60, 'Tablet', 'Adult', 'Calcium', '1日2回'),
('550e8400-e29b-41d4-a716-446655440008', 'DSLD-12352', 'Iron Bisglycinate 18mg', '鉄 ビスグリシネート 18mg', 'Gentle Iron', 'Solgar', '1 capsule', 90, 'Capsule', 'Adult', 'Iron', '1日1回'),
('550e8400-e29b-41d4-a716-446655440009', 'DSLD-12353', 'Coenzyme Q10 100mg', 'コエンザイムQ10 100mg', 'Life Extension', 'Life Extension', '1 softgel', 60, 'Softgel', 'Adult', 'CoQ10', '1日1回'),
('550e8400-e29b-41d4-a716-446655440010', 'DSLD-12354', 'Probiotics 50 Billion CFU', 'プロバイオティクス 500億CFU', 'Garden of Life', 'Garden of Life', '1 capsule', 30, 'Capsule', 'Adult', 'Probiotics', '1日1回')
ON CONFLICT (dsld_id) DO NOTHING;

-- =============================================================================
-- NUTRIENTS DATA
-- =============================================================================

-- 基本栄養素データ
INSERT INTO nutrients (id, name_ja, name_en, category, rda_amount, unit, description_ja) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'ビタミンC', 'Vitamin C', 'Vitamin', 90, 'mg', '抗酸化作用があり、コラーゲンの合成に必要'),
('650e8400-e29b-41d4-a716-446655440002', 'ビタミンD3', 'Vitamin D3', 'Vitamin', 15, 'mcg', 'カルシウムの吸収を促進し、骨の健康を維持'),
('650e8400-e29b-41d4-a716-446655440003', 'マグネシウム', 'Magnesium', 'Mineral', 420, 'mg', '筋肉と神経の機能をサポート'),
('650e8400-e29b-41d4-a716-446655440004', 'EPA', 'EPA', 'Fatty Acid', 250, 'mg', '心血管系の健康をサポート'),
('650e8400-e29b-41d4-a716-446655440005', 'DHA', 'DHA', 'Fatty Acid', 250, 'mg', '脳と目の健康をサポート'),
('650e8400-e29b-41d4-a716-446655440006', '亜鉛', 'Zinc', 'Mineral', 11, 'mg', '免疫機能と創傷治癒をサポート'),
('650e8400-e29b-41d4-a716-446655440007', 'ビタミンB1', 'Thiamine', 'Vitamin', 1.2, 'mg', 'エネルギー代謝に必要'),
('650e8400-e29b-41d4-a716-446655440008', 'ビタミンB6', 'Vitamin B6', 'Vitamin', 1.7, 'mg', 'タンパク質代謝に必要'),
('650e8400-e29b-41d4-a716-446655440009', 'ビタミンB12', 'Vitamin B12', 'Vitamin', 2.4, 'mcg', '神経機能と赤血球形成に必要'),
('650e8400-e29b-41d4-a716-446655440010', '葉酸', 'Folate', 'Vitamin', 400, 'mcg', 'DNA合成と赤血球形成に必要'),
('650e8400-e29b-41d4-a716-446655440011', 'カルシウム', 'Calcium', 'Mineral', 1000, 'mg', '骨と歯の健康に必要'),
('650e8400-e29b-41d4-a716-446655440012', '鉄', 'Iron', 'Mineral', 8, 'mg', '酸素運搬と赤血球形成に必要'),
('650e8400-e29b-41d4-a716-446655440013', 'コエンザイムQ10', 'Coenzyme Q10', 'Other', 100, 'mg', '細胞のエネルギー産生をサポート')
ON CONFLICT (name_ja) DO NOTHING;

-- =============================================================================
-- SUPPLEMENT-NUTRIENT RELATIONSHIPS
-- =============================================================================

-- サプリメントと栄養素の関係
INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, unit, daily_value_percent) VALUES
-- Vitamin C 1000mg
('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 1000, 'mg', 1111),

-- Vitamin D3 5000 IU
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 125, 'mcg', 625),

-- Magnesium Glycinate 200mg (per 2 tablets)
('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 200, 'mg', 48),

-- Omega-3 Fish Oil (per 2 softgels)
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', 325, 'mg', NULL),
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440005', 225, 'mg', NULL),

-- Zinc Picolinate 15mg
('550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440006', 15, 'mg', 136),

-- B-Complex
('550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440007', 100, 'mg', 8333),
('550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440008', 100, 'mg', 5882),
('550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440009', 100, 'mcg', 4167),
('550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440010', 400, 'mcg', 100),

-- Calcium Citrate 1000mg (per 2 tablets)
('550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440011', 1000, 'mg', 100),

-- Iron Bisglycinate 18mg
('550e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440012', 18, 'mg', 100),

-- CoQ10 100mg
('550e8400-e29b-41d4-a716-446655440009', '650e8400-e29b-41d4-a716-446655440013', 100, 'mg', NULL)

ON CONFLICT (supplement_id, nutrient_id) DO NOTHING;

-- =============================================================================
-- NUTRIENT RDA/UL DATA (SAMPLE)
-- =============================================================================

-- サンプルRDA/ULデータ（成人男性・女性）
INSERT INTO nutrient_rda_ul (nutrient_id, nutrient_name, category, unit, age_group, gender, rda_ai_value, rda_ai_type, upper_limit_ul, notes) VALUES
('vit_c', 'ビタミンC', 'Vitamin', 'mg', '19-50 years', 'Male', '90', 'RDA', '2000', '喫煙者は+35mg'),
('vit_c', 'ビタミンC', 'Vitamin', 'mg', '19-50 years', 'Female', '75', 'RDA', '2000', '妊娠中は85mg、授乳中は120mg'),
('vit_d', 'ビタミンD', 'Vitamin', 'mcg', '19-50 years', 'Both', '15', 'RDA', '100', '51-70歳は15mcg、70歳以上は20mcg'),
('vit_e', 'ビタミンE', 'Vitamin', 'mg', '19-50 years', 'Both', '15', 'RDA', '1000', 'α-トコフェロール当量'),
('calcium', 'カルシウム', 'Mineral', 'mg', '19-50 years', 'Both', '1000', 'RDA', '2500', '51歳以上は1200mg'),
('iron', '鉄', 'Mineral', 'mg', '19-50 years', 'Male', '8', 'RDA', '45', ''),
('iron', '鉄', 'Mineral', 'mg', '19-50 years', 'Female', '18', 'RDA', '45', '閉経後は8mg'),
('zinc', '亜鉛', 'Mineral', 'mg', '19-50 years', 'Male', '11', 'RDA', '40', ''),
('zinc', '亜鉛', 'Mineral', 'mg', '19-50 years', 'Female', '8', 'RDA', '40', '妊娠中は11mg、授乳中は12mg'),
('magnesium', 'マグネシウム', 'Mineral', 'mg', '19-30 years', 'Male', '400', 'RDA', '350', 'サプリメントからの摂取上限'),
('magnesium', 'マグネシウム', 'Mineral', 'mg', '31-50 years', 'Male', '420', 'RDA', '350', 'サプリメントからの摂取上限'),
('magnesium', 'マグネシウム', 'Mineral', 'mg', '19-30 years', 'Female', '310', 'RDA', '350', 'サプリメントからの摂取上限'),
('magnesium', 'マグネシウム', 'Mineral', 'mg', '31-50 years', 'Female', '320', 'RDA', '350', 'サプリメントからの摂取上限')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- データ投入結果の確認
DO $$
DECLARE
  supp_count INTEGER;
  nutrient_count INTEGER;
  relation_count INTEGER;
  rda_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO supp_count FROM supplements;
  SELECT COUNT(*) INTO nutrient_count FROM nutrients;
  SELECT COUNT(*) INTO relation_count FROM supplement_nutrients;
  SELECT COUNT(*) INTO rda_count FROM nutrient_rda_ul;
  
  RAISE NOTICE '📊 Sample Data Summary:';
  RAISE NOTICE '   Supplements: %', supp_count;
  RAISE NOTICE '   Nutrients: %', nutrient_count;
  RAISE NOTICE '   Supplement-Nutrient Relations: %', relation_count;
  RAISE NOTICE '   RDA/UL Records: %', rda_count;
  RAISE NOTICE '✅ Sample data inserted successfully!';
END
$$;

-- サンプルサプリメント一覧表示
SELECT 
  name_ja as "サプリメント名",
  brand as "ブランド",
  serving_size as "摂取量",
  dosage_instructions as "摂取指示"
FROM supplements 
ORDER BY category, name_ja;