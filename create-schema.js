#!/usr/bin/env node

// MY SUPPS - Automated Database Schema Creation
// Production Supabase database setup

const { createClient } = require('@supabase/supabase-js');

// Configuration from config.js
const SUPABASE_URL = 'https://xkcaxrvnvefstzvpldzf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY2F4cnZudmVmc3R6dnBsZHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc3ODYsImV4cCI6MjA2NTY0Mzc4Nn0.KPI-586rKSlcGTi9o2YWR1n1pxfaqoPaPouclCu6Q5I';

// Production SQL Schema
const PRODUCTION_SCHEMA = `
-- MY SUPPS Production Database Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Supplements table (NIH DSLD API data)
CREATE TABLE IF NOT EXISTS supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dsld_id TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ja TEXT,
    brand TEXT NOT NULL,
    serving_size TEXT,
    servings_per_container INTEGER,
    image_url TEXT,
    label_url TEXT,
    string_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Nutrients master
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

-- 3. Supplement-Nutrient relationships
CREATE TABLE IF NOT EXISTS supplement_nutrients (
    supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
    nutrient_id UUID REFERENCES nutrients(id) ON DELETE CASCADE,
    amount_per_serving DECIMAL NOT NULL,
    unit TEXT NOT NULL,
    daily_value_percent DECIMAL,
    PRIMARY KEY (supplement_id, nutrient_id)
);

-- 4. User supplements (MY SUPPS)
CREATE TABLE IF NOT EXISTS user_supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
    is_selected BOOLEAN DEFAULT false,
    is_my_supps BOOLEAN DEFAULT false,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, supplement_id)
);

-- 5. User intake schedules
CREATE TABLE IF NOT EXISTS user_intake_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
    time_of_day VARCHAR(20) NOT NULL,
    timing_type VARCHAR(20),
    frequency TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, supplement_id, time_of_day)
);

-- 6. Daily intake logs
CREATE TABLE IF NOT EXISTS daily_intake_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES user_intake_schedules(id) ON DELETE CASCADE,
    taken_date DATE NOT NULL,
    is_taken BOOLEAN DEFAULT false,
    taken_at TIMESTAMP,
    UNIQUE(user_id, schedule_id, taken_date)
);

-- 7. Nutrient RDA/UL reference data
CREATE TABLE IF NOT EXISTS nutrient_rda_ul (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nutrient_id VARCHAR(50) NOT NULL,
    nutrient_name VARCHAR(100) NOT NULL,
    category VARCHAR(20),
    unit VARCHAR(10),
    age_group VARCHAR(50),
    gender VARCHAR(10),
    rda_ai_value VARCHAR(20),
    rda_ai_type VARCHAR(5),
    upper_limit_ul VARCHAR(20),
    notes TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_supplements_dsld_id ON supplements(dsld_id);
CREATE INDEX IF NOT EXISTS idx_supplements_string_id ON supplements(string_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_user_id ON user_supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intake_schedules_user_id ON user_intake_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_intake_logs_user_id ON daily_intake_logs(user_id);

-- Row Level Security (RLS)
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_intake_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_intake_logs ENABLE ROW LEVEL SECURITY;

-- Comprehensive RLS policies
DROP POLICY IF EXISTS "Users own supplements policy" ON user_supplements;
CREATE POLICY "Users own supplements policy" ON user_supplements FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own schedules policy" ON user_intake_schedules;
CREATE POLICY "Users own schedules policy" ON user_intake_schedules FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own logs policy" ON daily_intake_logs;
CREATE POLICY "Users own logs policy" ON daily_intake_logs FOR ALL USING (auth.uid() = user_id);

-- Public access for reference data
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_nutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrient_rda_ul ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public supplements access" ON supplements;
CREATE POLICY "Public supplements access" ON supplements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public nutrients access" ON nutrients;
CREATE POLICY "Public nutrients access" ON nutrients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public supplement_nutrients access" ON supplement_nutrients;
CREATE POLICY "Public supplement_nutrients access" ON supplement_nutrients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public nutrient_rda_ul access" ON nutrient_rda_ul;
CREATE POLICY "Public nutrient_rda_ul access" ON nutrient_rda_ul FOR SELECT USING (true);

-- Success confirmation
SELECT 'MY SUPPS production database schema deployed successfully!' as confirmation;
`;

async function createDatabaseSchema() {
    console.log('🔧 MY SUPPS - Automated Database Setup');
    console.log('=====================================');
    
    try {
        // Initialize Supabase client
        console.log('🔗 Connecting to Supabase...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Test connection
        console.log('🧪 Testing database connection...');
        const { data: testData, error: testError } = await supabase
            .from('supplements')
            .select('count', { count: 'exact', head: true });
        
        if (testError && testError.code !== 'PGRST116') {
            throw new Error(`Connection failed: ${testError.message}`);
        }
        
        console.log('✅ Database connection successful');
        
        // Note: Direct SQL execution via RPC
        console.log('📊 Creating database schema...');
        console.log('⚠️  Note: This script provides the SQL - execute manually in Supabase SQL Editor');
        
        console.log('\n📋 COPY THE FOLLOWING SQL TO SUPABASE SQL EDITOR:');
        console.log('==================================================');
        console.log(PRODUCTION_SCHEMA);
        console.log('==================================================');
        
        // Test table existence after manual SQL execution
        console.log('\n🔍 After running SQL, verify tables exist...');
        const tables = ['supplements', 'nutrients', 'user_supplements', 'user_intake_schedules'];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase.from(table).select('*').limit(1);
                if (error) {
                    console.log(`❌ ${table}: ${error.message}`);
                } else {
                    console.log(`✅ ${table}: OK`);
                }
            } catch (err) {
                console.log(`❌ ${table}: ${err.message}`);
            }
        }
        
        console.log('\n🎉 Database setup verification complete!');
        console.log('📝 Manual step: Execute the SQL script in Supabase Dashboard > SQL Editor');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createDatabaseSchema();
}

module.exports = { createDatabaseSchema };