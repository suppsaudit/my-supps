-- Supabase Database Schema for MY SUPPS (Simple Version)
-- Execute these SQL commands in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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