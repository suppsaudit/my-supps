-- Supabase Database Schema for MY SUPPS
-- Execute these SQL commands in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (already exists via Supabase Auth)

-- Supplements table (from NIH DSLD API)
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dsld_id TEXT UNIQUE,
  name_en TEXT NOT NULL,
  name_ja TEXT,
  brand TEXT NOT NULL,
  category TEXT,
  serving_size TEXT,
  servings_per_container INTEGER,
  image_url TEXT,
  label_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Nutrients master table
CREATE TABLE IF NOT EXISTS nutrients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ja TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  rda_amount DECIMAL,
  unit TEXT DEFAULT 'mg',
  description_ja TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Supplement-Nutrient relationships (many-to-many)
CREATE TABLE IF NOT EXISTS supplement_nutrients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  nutrient_id UUID REFERENCES nutrients(id) ON DELETE CASCADE,
  amount_per_serving DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  daily_value_percent DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(supplement_id, nutrient_id)
);

-- User supplement selections and MY SUPPS
CREATE TABLE IF NOT EXISTS user_supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  is_selected BOOLEAN DEFAULT false,
  is_my_supps BOOLEAN DEFAULT false,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, supplement_id)
);

-- Intake logs (for native app)
CREATE TABLE IF NOT EXISTS intake_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  taken_at TIMESTAMP NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_supplements_dsld_id ON supplements(dsld_id);
CREATE INDEX IF NOT EXISTS idx_supplements_brand ON supplements(brand);
CREATE INDEX IF NOT EXISTS idx_supplements_name_en ON supplements(name_en);
CREATE INDEX IF NOT EXISTS idx_supplements_name_ja ON supplements(name_ja);
CREATE INDEX IF NOT EXISTS idx_user_supplements_user_id ON user_supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_supplement_id ON user_supplements(supplement_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_is_my_supps ON user_supplements(is_my_supps);
CREATE INDEX IF NOT EXISTS idx_supplement_nutrients_supplement_id ON supplement_nutrients(supplement_id);
CREATE INDEX IF NOT EXISTS idx_supplement_nutrients_nutrient_id ON supplement_nutrients(nutrient_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_user_id ON intake_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_logs_taken_at ON intake_logs(taken_at);

-- Row Level Security (RLS) policies
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for supplements (readable by all, insertable by authenticated users)
CREATE POLICY "supplements_read_all" ON supplements FOR SELECT USING (true);
CREATE POLICY "supplements_insert_auth" ON supplements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "supplements_update_auth" ON supplements FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies for nutrients (readable by all)
CREATE POLICY "nutrients_read_all" ON nutrients FOR SELECT USING (true);
CREATE POLICY "nutrients_insert_auth" ON nutrients FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for supplement_nutrients (readable by all)
CREATE POLICY "supplement_nutrients_read_all" ON supplement_nutrients FOR SELECT USING (true);
CREATE POLICY "supplement_nutrients_insert_auth" ON supplement_nutrients FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for user_supplements (users can only access their own data)
CREATE POLICY "user_supplements_own_data" ON user_supplements FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for intake_logs (users can only access their own data)
CREATE POLICY "intake_logs_own_data" ON intake_logs FOR ALL USING (auth.uid() = user_id);

-- Add unique constraints for ON CONFLICT
ALTER TABLE nutrients ADD CONSTRAINT unique_nutrient_name_ja UNIQUE (name_ja);

-- Insert sample nutrients data
INSERT INTO nutrients (name_ja, name_en, category, rda_amount, unit, description_ja) VALUES
('ビタミンC', 'Vitamin C', 'vitamin', 90, 'mg', '抗酸化作用があり、コラーゲンの合成に必要'),
('ビタミンD3', 'Vitamin D3', 'vitamin', 20, 'μg', 'カルシウムの吸収を促進し、骨の健康に重要'),
('マグネシウム', 'Magnesium', 'mineral', 320, 'mg', '筋肉や神経の働きに必要な重要なミネラル'),
('亜鉛', 'Zinc', 'mineral', 8, 'mg', '免疫機能や創傷治癒に重要な役割'),
('オメガ3', 'Omega-3', 'fatty_acid', 1600, 'mg', '心血管の健康をサポートする必須脂肪酸'),
('EPA', 'EPA', 'fatty_acid', 250, 'mg', 'エイコサペンタエン酸、心血管保護効果'),
('DHA', 'DHA', 'fatty_acid', 250, 'mg', 'ドコサヘキサエン酸、脳の健康に重要'),
('カルシウム', 'Calcium', 'mineral', 700, 'mg', '骨や歯の健康に必要なミネラル'),
('鉄', 'Iron', 'mineral', 6.8, 'mg', '酸素運搬に必要なヘモグロビンの構成要素'),
('ビタミンB12', 'Vitamin B12', 'vitamin', 2.4, 'μg', '神経機能と赤血球の形成に必要'),
('葉酸', 'Folate', 'vitamin', 240, 'μg', 'DNA合成と細胞分裂に重要'),
('ビタミンE', 'Vitamin E', 'vitamin', 6.5, 'mg', '強力な抗酸化作用を持つ脂溶性ビタミン')
ON CONFLICT (name_ja) DO NOTHING;

-- Insert sample supplement data
INSERT INTO supplements (id, dsld_id, name_en, name_ja, brand, category, serving_size) VALUES
('1', 'DSLD_1', 'Vitamin C 1000mg', 'ビタミンC 1000mg', 'Nature''s Way', 'vitamin', '1 tablet'),
('2', 'DSLD_2', 'Vitamin D3 5000 IU', 'ビタミンD3 5000 IU', 'NOW Foods', 'vitamin', '1 softgel'),
('3', 'DSLD_3', 'Magnesium Glycinate 200mg', 'マグネシウム グリシネート 200mg', 'Doctor''s Best', 'mineral', '2 tablets'),
('4', 'DSLD_4', 'Omega-3 Fish Oil', 'オメガ3 フィッシュオイル', 'Nordic Naturals', 'fatty_acid', '2 softgels'),
('5', 'DSLD_5', 'Zinc Picolinate 50mg', '亜鉛 ピコリネート 50mg', 'Thorne', 'mineral', '1 capsule')
ON CONFLICT (id) DO NOTHING;