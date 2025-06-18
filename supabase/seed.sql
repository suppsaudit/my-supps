-- Insert sample nutrients
INSERT INTO nutrients (name_ja, name_en, category, rda_lower_mg, rda_upper_mg, per_kg_lower_mg, per_kg_upper_mg, unit) VALUES
('ビタミンD', 'Vitamin D', 'vitamin', 0.015, 0.1, 0.0002, 0.0015, 'μg'),
('マグネシウム', 'Magnesium', 'mineral', 300, 400, 4.5, 6, 'mg'),
('ビタミンC', 'Vitamin C', 'vitamin', 100, 2000, 1.5, 30, 'mg'),
('亜鉛', 'Zinc', 'mineral', 8, 40, 0.12, 0.6, 'mg'),
('ビタミンB12', 'Vitamin B12', 'vitamin', 0.0024, 0.1, 0.00004, 0.0015, 'μg'),
('オメガ3脂肪酸', 'Omega-3 Fatty Acids', 'fatty-acid', 1000, 3000, 15, 45, 'mg'),
('アシュワガンダ', 'Ashwagandha', 'adaptogen', 300, 600, 4.5, 9, 'mg'),
('ビタミンE', 'Vitamin E', 'vitamin', 15, 1000, 0.225, 15, 'mg'),
('鉄', 'Iron', 'mineral', 8, 45, 0.12, 0.675, 'mg'),
('カルシウム', 'Calcium', 'mineral', 1000, 2500, 15, 37.5, 'mg');

-- Insert sample supplements
INSERT INTO supplements (iherb_id, name_ja, name_en, brand, images) VALUES
('NOW-00733', 'ビタミンD-3 5000IU', 'Vitamin D-3 5000 IU', 'NOW Foods', '{"main": "/images/vitamin-d3.jpg"}'::jsonb),
('NOW-00490', 'マグネシウム 400mg', 'Magnesium 400mg', 'NOW Foods', '{"main": "/images/magnesium.jpg"}'::jsonb),
('THN-01051', 'アシュワガンダ KSM-66', 'Ashwagandha KSM-66', 'Thorne', '{"main": "/images/ashwagandha.jpg"}'::jsonb),
('LFE-01520', 'ビタミンC 1000mg', 'Vitamin C 1000mg', 'Life Extension', '{"main": "/images/vitamin-c.jpg"}'::jsonb),
('GAR-01234', '亜鉛 15mg', 'Zinc 15mg', 'Garden of Life', '{"main": "/images/zinc.jpg"}'::jsonb),
('CAL-05678', 'オメガ3 フィッシュオイル', 'Omega-3 Fish Oil', 'California Gold Nutrition', '{"main": "/images/omega3.jpg"}'::jsonb);

-- Link supplements to nutrients
INSERT INTO supplement_nutrients (supplement_id, nutrient_id, amount_per_serving, amount_per_unit, serving_size, unit, bioavailability_factor)
SELECT 
  s.id, n.id, 
  CASE 
    WHEN s.name_en = 'Vitamin D-3 5000 IU' AND n.name_en = 'Vitamin D' THEN 125
    WHEN s.name_en = 'Magnesium 400mg' AND n.name_en = 'Magnesium' THEN 400
    WHEN s.name_en = 'Ashwagandha KSM-66' AND n.name_en = 'Ashwagandha' THEN 600
    WHEN s.name_en = 'Vitamin C 1000mg' AND n.name_en = 'Vitamin C' THEN 1000
    WHEN s.name_en = 'Zinc 15mg' AND n.name_en = 'Zinc' THEN 15
    WHEN s.name_en = 'Omega-3 Fish Oil' AND n.name_en = 'Omega-3 Fatty Acids' THEN 1200
  END as amount_per_serving,
  CASE 
    WHEN s.name_en = 'Vitamin D-3 5000 IU' AND n.name_en = 'Vitamin D' THEN 125
    WHEN s.name_en = 'Magnesium 400mg' AND n.name_en = 'Magnesium' THEN 400
    WHEN s.name_en = 'Ashwagandha KSM-66' AND n.name_en = 'Ashwagandha' THEN 600
    WHEN s.name_en = 'Vitamin C 1000mg' AND n.name_en = 'Vitamin C' THEN 1000
    WHEN s.name_en = 'Zinc 15mg' AND n.name_en = 'Zinc' THEN 15
    WHEN s.name_en = 'Omega-3 Fish Oil' AND n.name_en = 'Omega-3 Fatty Acids' THEN 1200
  END as amount_per_unit,
  1,
  CASE 
    WHEN n.name_en = 'Vitamin D' THEN 'μg'
    ELSE 'mg'
  END as unit,
  CASE 
    WHEN n.name_en = 'Vitamin D' THEN 0.8
    WHEN n.name_en = 'Magnesium' THEN 0.4
    WHEN n.name_en = 'Vitamin C' THEN 0.9
    WHEN n.name_en = 'Zinc' THEN 0.3
    WHEN n.name_en = 'Omega-3 Fatty Acids' THEN 0.85
    WHEN n.name_en = 'Ashwagandha' THEN 0.7
    ELSE 1.0
  END as bioavailability_factor
FROM supplements s, nutrients n
WHERE 
  (s.name_en = 'Vitamin D-3 5000 IU' AND n.name_en = 'Vitamin D') OR
  (s.name_en = 'Magnesium 400mg' AND n.name_en = 'Magnesium') OR
  (s.name_en = 'Ashwagandha KSM-66' AND n.name_en = 'Ashwagandha') OR
  (s.name_en = 'Vitamin C 1000mg' AND n.name_en = 'Vitamin C') OR
  (s.name_en = 'Zinc 15mg' AND n.name_en = 'Zinc') OR
  (s.name_en = 'Omega-3 Fish Oil' AND n.name_en = 'Omega-3 Fatty Acids');