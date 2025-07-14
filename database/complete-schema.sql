-- Supplify Complete Database Schema
-- Supabase SQL Editor で実行してください

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Supplements (from NIH DSLD API)
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dsld_id TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ja TEXT,
  brand TEXT NOT NULL,
  manufacturer TEXT,
  serving_size TEXT,
  servings_per_container INTEGER,
  image_url TEXT,
  label_url TEXT,
  upc TEXT,
  product_form TEXT, -- 'Tablet', 'Capsule', 'Softgel', etc.
  target_age TEXT, -- 'Adult', 'Children', etc.
  category TEXT,
  dosage_instructions TEXT, -- '1日1回', '朝晩2回', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrients master
CREATE TABLE IF NOT EXISTS nutrients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ja TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  rda_amount DECIMAL,
  unit TEXT DEFAULT 'mg',
  description_ja TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplement-Nutrient relationships (many-to-many)
CREATE TABLE IF NOT EXISTS supplement_nutrients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  nutrient_id UUID NOT NULL REFERENCES nutrients(id) ON DELETE CASCADE,
  amount_per_serving DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  daily_value_percent DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(supplement_id, nutrient_id)
);

-- =============================================================================
-- USER-RELATED TABLES
-- =============================================================================

-- User supplement selections
CREATE TABLE IF NOT EXISTS user_supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  is_selected BOOLEAN DEFAULT false,
  is_my_supps BOOLEAN DEFAULT false,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, supplement_id)
);

-- User intake schedules
CREATE TABLE IF NOT EXISTS user_intake_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  time_of_day VARCHAR(20) NOT NULL CHECK (time_of_day IN ('morning', 'day', 'night', 'before_sleep')),
  timing_type VARCHAR(20), -- '空腹時', '朝食後', '昼食後', '夕食後', '食事中'
  frequency TEXT, -- Original instruction like '朝晩２回'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, supplement_id, time_of_day)
);

-- Daily intake tracking
CREATE TABLE IF NOT EXISTS daily_intake_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES user_intake_schedules(id) ON DELETE CASCADE,
  taken_date DATE NOT NULL,
  is_taken BOOLEAN DEFAULT false,
  taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, schedule_id, taken_date)
);

-- =============================================================================
-- NUTRIENT RDA/UL DATA
-- =============================================================================

-- Nutrient RDA/UL values from NIH ODS
CREATE TABLE IF NOT EXISTS nutrient_rda_ul (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutrient_id VARCHAR(50) NOT NULL,
  nutrient_name VARCHAR(100) NOT NULL,
  category VARCHAR(20) CHECK (category IN ('Vitamin', 'Mineral', 'Other')),
  unit VARCHAR(10) NOT NULL,
  age_group VARCHAR(50),
  gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Both')),
  rda_ai_value VARCHAR(20),
  rda_ai_type VARCHAR(5) CHECK (rda_ai_type IN ('RDA', 'AI')),
  upper_limit_ul VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Supplements indexes
CREATE INDEX IF NOT EXISTS idx_supplements_dsld_id ON supplements(dsld_id);
CREATE INDEX IF NOT EXISTS idx_supplements_brand ON supplements(brand);
CREATE INDEX IF NOT EXISTS idx_supplements_category ON supplements(category);

-- User supplements indexes
CREATE INDEX IF NOT EXISTS idx_user_supplements_user_id ON user_supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_supplement_id ON user_supplements(supplement_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_my_supps ON user_supplements(user_id, is_my_supps);

-- User intake schedules indexes
CREATE INDEX IF NOT EXISTS idx_user_intake_schedules_user_id ON user_intake_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intake_schedules_supplement_id ON user_intake_schedules(supplement_id);
CREATE INDEX IF NOT EXISTS idx_user_intake_schedules_time_of_day ON user_intake_schedules(time_of_day);

-- Daily intake logs indexes
CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_user_id ON daily_intake_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_schedule_id ON daily_intake_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_taken_date ON daily_intake_logs(taken_date);
CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_composite ON daily_intake_logs(user_id, taken_date, is_taken);

-- Nutrient RDA/UL indexes
CREATE INDEX IF NOT EXISTS idx_nutrient_rda_ul_nutrient_name ON nutrient_rda_ul(nutrient_name);
CREATE INDEX IF NOT EXISTS idx_nutrient_rda_ul_composite ON nutrient_rda_ul(nutrient_name, age_group, gender);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on user-specific tables
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_intake_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_intake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_rda_ul ENABLE ROW LEVEL SECURITY;

-- Policies for user_supplements
DROP POLICY IF EXISTS "Users can view their own supplements" ON user_supplements;
CREATE POLICY "Users can view their own supplements" ON user_supplements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own supplements" ON user_supplements;
CREATE POLICY "Users can insert their own supplements" ON user_supplements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own supplements" ON user_supplements;
CREATE POLICY "Users can update their own supplements" ON user_supplements
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own supplements" ON user_supplements;
CREATE POLICY "Users can delete their own supplements" ON user_supplements
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_intake_schedules
DROP POLICY IF EXISTS "Users can view their own schedules" ON user_intake_schedules;
CREATE POLICY "Users can view their own schedules" ON user_intake_schedules
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own schedules" ON user_intake_schedules;
CREATE POLICY "Users can insert their own schedules" ON user_intake_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own schedules" ON user_intake_schedules;
CREATE POLICY "Users can update their own schedules" ON user_intake_schedules
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own schedules" ON user_intake_schedules;
CREATE POLICY "Users can delete their own schedules" ON user_intake_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for daily_intake_logs
DROP POLICY IF EXISTS "Users can view their own intake logs" ON daily_intake_logs;
CREATE POLICY "Users can view their own intake logs" ON daily_intake_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own intake logs" ON daily_intake_logs;
CREATE POLICY "Users can insert their own intake logs" ON daily_intake_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own intake logs" ON daily_intake_logs;
CREATE POLICY "Users can update their own intake logs" ON daily_intake_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own intake logs" ON daily_intake_logs;
CREATE POLICY "Users can delete their own intake logs" ON daily_intake_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for nutrient_rda_ul (public read access)
DROP POLICY IF EXISTS "Anyone can view RDA/UL data" ON nutrient_rda_ul;
CREATE POLICY "Anyone can view RDA/UL data" ON nutrient_rda_ul
  FOR SELECT USING (true);

-- Only allow inserts/updates through admin or service role
DROP POLICY IF EXISTS "Only service role can modify RDA/UL data" ON nutrient_rda_ul;
CREATE POLICY "Only service role can modify RDA/UL data" ON nutrient_rda_ul
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_supplements_updated_at ON supplements;
CREATE TRIGGER update_supplements_updated_at 
  BEFORE UPDATE ON supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_supplements_updated_at ON user_supplements;
CREATE TRIGGER update_user_supplements_updated_at 
  BEFORE UPDATE ON user_supplements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_intake_schedules_updated_at ON user_intake_schedules;
CREATE TRIGGER update_user_intake_schedules_updated_at 
  BEFORE UPDATE ON user_intake_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_intake_logs_updated_at ON daily_intake_logs;
CREATE TRIGGER update_daily_intake_logs_updated_at 
  BEFORE UPDATE ON daily_intake_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON supplements TO authenticated;
GRANT SELECT ON nutrients TO authenticated;
GRANT SELECT ON supplement_nutrients TO authenticated;
GRANT ALL ON user_supplements TO authenticated;
GRANT ALL ON user_intake_schedules TO authenticated;
GRANT ALL ON daily_intake_logs TO authenticated;
GRANT SELECT ON nutrient_rda_ul TO authenticated;

-- Grant permissions for public (read-only for reference data)
GRANT SELECT ON supplements TO anon;
GRANT SELECT ON nutrients TO anon;
GRANT SELECT ON supplement_nutrients TO anon;
GRANT SELECT ON nutrient_rda_ul TO anon;

-- =============================================================================
-- CONFIRMATION
-- =============================================================================

-- Check that all tables were created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'supplements', 'nutrients', 'supplement_nutrients', 
    'user_supplements', 'user_intake_schedules', 
    'daily_intake_logs', 'nutrient_rda_ul'
  );
  
  IF table_count = 7 THEN
    RAISE NOTICE '✅ All 7 tables created successfully!';
  ELSE
    RAISE NOTICE '❌ Only % out of 7 tables created', table_count;
  END IF;
END
$$;

-- Display created tables
SELECT 
  table_name,
  CASE 
    WHEN table_name LIKE 'user_%' THEN 'User Data'
    WHEN table_name = 'nutrient_rda_ul' THEN 'Reference Data'
    ELSE 'Core Data'
  END as category
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'supplements', 'nutrients', 'supplement_nutrients', 
    'user_supplements', 'user_intake_schedules', 
    'daily_intake_logs', 'nutrient_rda_ul'
  )
ORDER BY category, table_name;