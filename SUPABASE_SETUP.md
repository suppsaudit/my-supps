# Supabase Setup Guide

## Current Status
✅ Application running in demo mode on localhost:3001  
✅ All TypeScript and ESLint errors resolved  
✅ PWA functionality enabled  
✅ Authentication middleware with demo fallback  

## Setup Real Supabase Instance

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down project URL and anon key

### 2. Database Schema
Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Users table
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  profile JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Nutrients table
CREATE TABLE nutrients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  unit TEXT NOT NULL,
  daily_value DECIMAL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Supplements table
CREATE TABLE supplements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  brand TEXT NOT NULL,
  iherb_id TEXT UNIQUE,
  iherb_url TEXT,
  amazon_url TEXT,
  price_usd DECIMAL,
  price_jpy DECIMAL,
  image_url TEXT,
  description TEXT,
  serving_size TEXT,
  servings_per_container INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Supplement nutrients junction table
CREATE TABLE supplement_nutrients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  nutrient_id UUID REFERENCES nutrients(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(supplement_id, nutrient_id)
);

-- User supplements table
CREATE TABLE user_supplements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  is_selected BOOLEAN DEFAULT false,
  daily_intake INTEGER DEFAULT 1,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, supplement_id)
);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_supplements ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- User supplements policies
CREATE POLICY "Users can view own supplements" ON user_supplements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own supplements" ON user_supplements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own supplements" ON user_supplements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own supplements" ON user_supplements FOR DELETE USING (auth.uid() = user_id);

-- Public read access for supplements and nutrients
CREATE POLICY "Supplements are publicly readable" ON supplements FOR SELECT USING (true);
CREATE POLICY "Nutrients are publicly readable" ON nutrients FOR SELECT USING (true);
CREATE POLICY "Supplement nutrients are publicly readable" ON supplement_nutrients FOR SELECT USING (true);
```

### 3. Update Environment Variables
Replace `.env.local` with real values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Site URL for redirects
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# iHerb API (if available)
IHERB_API_KEY=your_iherb_key

# Other APIs
AMAZON_API_KEY=your_amazon_key

# Rate limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

### 4. Sample Data (Optional)
Insert sample nutrients and supplements for testing.

### 5. Deploy to Vercel
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Current Demo Mode Features
- ✅ All pages accessible without authentication
- ✅ Mock data for testing UI components
- ✅ Error-free compilation and runtime
- ✅ PWA functionality enabled
- ✅ Revolutionary nutrient chart working
- ✅ Spotify-like theming system active

## Next Development Steps
1. Set up real Supabase instance
2. Import iHerb product data
3. Implement product scraping
4. Add real authentication flow
5. Deploy to production