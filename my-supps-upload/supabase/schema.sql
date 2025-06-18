-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with profile
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  profile JSONB DEFAULT '{
    "weight": null,
    "height": null,
    "age": null,
    "gender": null,
    "adhd_tendency": false,
    "conditions": [],
    "goals": []
  }'::jsonb,
  theme_preference TEXT DEFAULT 'auto' CHECK (theme_preference IN ('light', 'dark', 'auto', 'medium-dark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplements with multi-platform IDs
CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  iherb_id TEXT UNIQUE,
  barcode TEXT,
  upc TEXT,
  asin TEXT,
  jan TEXT,
  name_ja TEXT NOT NULL,
  name_en TEXT,
  brand TEXT NOT NULL,
  images JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for product IDs
CREATE INDEX idx_supplements_barcode ON supplements(barcode);
CREATE INDEX idx_supplements_upc ON supplements(upc);
CREATE INDEX idx_supplements_asin ON supplements(asin);
CREATE INDEX idx_supplements_jan ON supplements(jan);

-- Nutrients with RDA ranges
CREATE TABLE nutrients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ja TEXT NOT NULL,
  name_en TEXT,
  category TEXT CHECK (category IN ('vitamin', 'mineral', 'adaptogen', 'amino-acid', 'fatty-acid', 'other')),
  rda_lower_mg DECIMAL,
  rda_upper_mg DECIMAL,
  per_kg_lower_mg DECIMAL,
  per_kg_upper_mg DECIMAL,
  unit TEXT DEFAULT 'mg'
);

-- Supplement-nutrient relationships
CREATE TABLE supplement_nutrients (
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  nutrient_id UUID REFERENCES nutrients(id) ON DELETE CASCADE,
  amount_per_serving DECIMAL NOT NULL,
  amount_per_unit DECIMAL NOT NULL,
  serving_size INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'mg',
  bioavailability_factor DECIMAL DEFAULT 1.0 CHECK (bioavailability_factor > 0 AND bioavailability_factor <= 1),
  PRIMARY KEY (supplement_id, nutrient_id)
);

-- User's supplement library
CREATE TABLE user_supplements (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  is_owned BOOLEAN DEFAULT true,
  is_selected BOOLEAN DEFAULT false,
  daily_intake INTEGER DEFAULT 0 CHECK (daily_intake >= 0),
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, supplement_id)
);

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can only see and manage their own supplements
CREATE POLICY "Users can view own supplements" ON user_supplements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own supplements" ON user_supplements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplements" ON user_supplements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own supplements" ON user_supplements
  FOR DELETE USING (auth.uid() = user_id);

-- Public read access for supplements and nutrients
CREATE POLICY "Public read access for supplements" ON supplements
  FOR SELECT USING (true);

CREATE POLICY "Public read access for nutrients" ON nutrients
  FOR SELECT USING (true);

CREATE POLICY "Public read access for supplement_nutrients" ON supplement_nutrients
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for supplements table
CREATE TRIGGER update_supplements_updated_at BEFORE UPDATE
    ON supplements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();