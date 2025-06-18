-- Schema Update for Dashboard Features
-- Run this script in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User intake schedules table
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

-- Daily intake tracking table
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

-- Nutrient RDA/UL values from NIH ODS
CREATE TABLE IF NOT EXISTS nutrient_rda_ul (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutrient_id VARCHAR(50) NOT NULL,
  nutrient_name VARCHAR(100) NOT NULL,
  category VARCHAR(20) CHECK (category IN ('Vitamin', 'Mineral', 'Other')),
  unit VARCHAR(10) NOT NULL, -- 'mg', 'mcg', 'g', 'IU'
  age_group VARCHAR(50),
  gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Both')),
  rda_ai_value VARCHAR(20),
  rda_ai_type VARCHAR(5) CHECK (rda_ai_type IN ('RDA', 'AI')),
  upper_limit_ul VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add dosage_instructions column to supplements table if not exists
ALTER TABLE supplements 
ADD COLUMN IF NOT EXISTS dosage_instructions TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_intake_schedules_user_id ON user_intake_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intake_schedules_supplement_id ON user_intake_schedules(supplement_id);
CREATE INDEX IF NOT EXISTS idx_user_intake_schedules_time_of_day ON user_intake_schedules(time_of_day);

CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_user_id ON daily_intake_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_schedule_id ON daily_intake_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_taken_date ON daily_intake_logs(taken_date);
CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_composite ON daily_intake_logs(user_id, taken_date, is_taken);

CREATE INDEX IF NOT EXISTS idx_nutrient_rda_ul_nutrient_name ON nutrient_rda_ul(nutrient_name);
CREATE INDEX IF NOT EXISTS idx_nutrient_rda_ul_composite ON nutrient_rda_ul(nutrient_name, age_group, gender);

-- Row Level Security (RLS) Policies

-- Enable RLS on new tables
ALTER TABLE user_intake_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_intake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_rda_ul ENABLE ROW LEVEL SECURITY;

-- Policies for user_intake_schedules
CREATE POLICY "Users can view their own schedules" ON user_intake_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules" ON user_intake_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" ON user_intake_schedules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" ON user_intake_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for daily_intake_logs
CREATE POLICY "Users can view their own intake logs" ON daily_intake_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intake logs" ON daily_intake_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intake logs" ON daily_intake_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intake logs" ON daily_intake_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for nutrient_rda_ul (public read access)
CREATE POLICY "Anyone can view RDA/UL data" ON nutrient_rda_ul
  FOR SELECT USING (true);

-- Only allow inserts/updates through admin or service role
CREATE POLICY "Only service role can modify RDA/UL data" ON nutrient_rda_ul
  FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_intake_schedules_updated_at BEFORE UPDATE ON user_intake_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_intake_logs_updated_at BEFORE UPDATE ON daily_intake_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample RDA data for testing (adult values)
INSERT INTO nutrient_rda_ul (nutrient_id, nutrient_name, category, unit, age_group, gender, rda_ai_value, rda_ai_type, upper_limit_ul) VALUES
  ('vit_c', 'ビタミンC', 'Vitamin', 'mg', '19-50 years', 'Male', '90', 'RDA', '2000'),
  ('vit_c', 'ビタミンC', 'Vitamin', 'mg', '19-50 years', 'Female', '75', 'RDA', '2000'),
  ('vit_d', 'ビタミンD', 'Vitamin', 'mcg', '19-50 years', 'Both', '15', 'RDA', '100'),
  ('vit_e', 'ビタミンE', 'Vitamin', 'mg', '19-50 years', 'Both', '15', 'RDA', '1000'),
  ('calcium', 'カルシウム', 'Mineral', 'mg', '19-50 years', 'Both', '1000', 'RDA', '2500'),
  ('iron', '鉄', 'Mineral', 'mg', '19-50 years', 'Male', '8', 'RDA', '45'),
  ('iron', '鉄', 'Mineral', 'mg', '19-50 years', 'Female', '18', 'RDA', '45'),
  ('zinc', '亜鉛', 'Mineral', 'mg', '19-50 years', 'Male', '11', 'RDA', '40'),
  ('zinc', '亜鉛', 'Mineral', 'mg', '19-50 years', 'Female', '8', 'RDA', '40')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON user_intake_schedules TO authenticated;
GRANT ALL ON daily_intake_logs TO authenticated;
GRANT SELECT ON nutrient_rda_ul TO authenticated;
GRANT ALL ON nutrient_rda_ul TO service_role;