# MY SUPPS - Claude Code Development Guide

## Project Overview

MY SUPPS is a supplement management system providing comprehensive supplement analysis using official NIH DSLD (Dietary Supplement Label Database) data. The system consists of two parts:
1. **Web Application**: Full-featured supplement analysis and simulation (HTML/CSS/JavaScript only)
2. **Native Mobile App**: Minimal interface for MY SUPPS management and intake calendar

## Architecture

### Web Application (All Core Features)
- **Tech Stack**: HTML/CSS/JavaScript (No frameworks to avoid build errors)
- **Libraries**: Chart.js (CDN), Supabase JavaScript SDK (CDN)
- **Data Source**: 
  - NIH DSLD API (CC0 license, commercial use allowed) - **MANDATORY: ACTUAL API ONLY**
  - NIH Office of Dietary Supplements (ODS) API for RDA/UL values
- **Hosting**: GitHub Pages
- **Build Process**: None (static files only)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Development Server**: Python HTTP server on localhost:3000 for authentication support
- **Navigation**: Dynamic collapsing header that hides navigation when scrolling down and shows when scrolling up

### Native Mobile Application (Companion App - 5-7 days development)
- **Tech Stack**: Flutter or React Native
- **Features**: 
  - MY SUPPS list management (view/delete)
  - Intake calendar with logs
  - Deep links to web application
- **Database**: Shared Supabase instance

## User Journey (Web Application)

### 1. Authentication (認証)
- Email/Password authentication
- Google Single Sign-On (SSO)
- Secure user sessions with Supabase Auth
- Protected routes for My Supps functionality

### 2. Supps Note (栄養素説明画面)
- Individual pages for each nutrient (Vitamin C, Carnosine, etc.)
- Generated from NIH DSLD nutrient data
- "Most Popular" section showing supplements containing that nutrient
- SEO optimized for Google/AI search entry points

### 3. Supplement Detail (サプリのデフォルト成分内訳表画面)
- Single supplement nutrient radar chart using NIH DSLD data
- Product images, ingredients, and serving information from DSLD
- "My Supps" button for adding to collection (requires login)
- Related supplements section (pink when selected)
- Per serving / per unit toggle with official DSLD serving sizes

### 4. Supps Audit (合計結果表示画面)
- Combined nutrients from selected supplements
- Real-time chart updates
- Game-like UI with pink selected items
- Grayscale for unselected items

### 5. My Supps Management (手持ちサプリ管理)
- Login required feature
- Search and add supplements to personal collection
- Advanced search: product name, brand, ingredient
- View registered supplements
- Analyze combined nutrition with radar chart
- Delete supplements from collection

### 6. User Dashboard/My Page (ユーザーダッシュボード)
- **TODAY'S SCHEDULE** - Daily intake schedule display
  - Morning/Day/Night time-based view switching
  - Toggle buttons for intake tracking
  - Shows recommended timing (空腹時/食後)
  - "+" button to add supplements (links to my-supps.html)
- **CURRENT SCORE** - Real-time nutrient intake radar chart
  - Updates based on TODAY'S SCHEDULE toggles
  - Combined nutrient calculations
  - RDA/UL values from NIH ODS API
  - Blank chart shown when no intake recorded
- **Intake Schedule Generation**
  - Automatic schedule creation based on supplement instructions
  - Splits into Morning (空腹時・朝食後)/Day (空腹時・昼食後)/Night (空腹時・夕食後)/Before Sleep
  - Parses "朝晩２回" type instructions from DSLD data

## NIH DSLD API Integration

### API Configuration
- **Base URL**: https://dsldapi.od.nih.gov/
- **License**: CC0 (Public Domain, commercial use allowed)
- **Authentication**: None required
- **Rate Limiting**: Respectful usage recommended

### Key Endpoints
1. **Product Search**: `/products?search={query}`
2. **Product Details**: `/products/{id}`
3. **Ingredient Search**: `/ingredients?search={query}`
4. **Nutrient Information**: `/nutrients`

## NIH Office of Dietary Supplements (ODS) API Integration

### Data Source Information
- **Source**: NIH Office of Dietary Supplements (ODS)
- **Format**: CSV (UTF-8 encoded)
- **Total Records**: 414
- **Nutrients**: 32 types
- **Download URL**: https://cdn1.genspark.ai/user-upload-image/jupyter/toolu_01GD6z1fc7X1hXkndv7fk8TJ/output/NIH_Comprehensive_Supplement_Database_70_Nutrients.csv
- **Citation**: "U.S. Department of Health and Human Services, National Institutes of Health, Office of Dietary Supplements"

### RDA/UL Data Structure
- Nutrient ID and Name
- Category (Vitamin/Mineral/Other)
- Unit (mg, mcg, g, IU)
- Age Group and Gender specific values
- RDA (Recommended Dietary Allowance) or AI (Adequate Intake)
- UL (Upper Limit) for safety
- Notes for special conditions

### Search Functionality
1. **Product Name Search**: Full-text search across product names
2. **Brand Search**: Filter by manufacturer/brand
3. **Ingredient Search**: Find products containing specific nutrients
4. **Combined Search**: Multiple criteria support

### Data Structure
```javascript
// Product from DSLD API
{
  "id": "12345",
  "name": "Vitamin C 1000mg",
  "brand": "Nature's Way",
  "servingSize": "1 tablet",
  "servingsPerContainer": 100,
  "ingredients": [
    {
      "name": "Vitamin C (as Ascorbic Acid)",
      "amount": 1000,
      "unit": "mg",
      "dailyValue": "1111%"
    }
  ],
  "imageUrl": "https://dsld.od.nih.gov/images/12345.jpg",
  "labelUrl": "https://dsld.od.nih.gov/labels/12345.pdf"
}
```

## Database Schema

```sql
-- Supplements (from NIH DSLD API)
CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dsld_id TEXT UNIQUE NOT NULL, -- NIH DSLD Product ID
  name_en TEXT NOT NULL,
  name_ja TEXT, -- Japanese translation (optional)
  brand TEXT NOT NULL,
  serving_size TEXT, -- "1 tablet", "2 capsules", etc.
  servings_per_container INTEGER,
  image_url TEXT,
  label_url TEXT, -- PDF label from DSLD
  created_at TIMESTAMP DEFAULT NOW()
);

-- Nutrients master
CREATE TABLE nutrients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ja TEXT NOT NULL,
  name_en TEXT,
  category TEXT,
  rda_amount DECIMAL,
  unit TEXT DEFAULT 'mg',
  description_ja TEXT
);

-- Supplement-Nutrient relationships (many-to-many)
CREATE TABLE supplement_nutrients (
  supplement_id UUID REFERENCES supplements(id),
  nutrient_id UUID REFERENCES nutrients(id),
  amount_per_serving DECIMAL NOT NULL,
  unit TEXT NOT NULL, -- mg, IU, mcg, etc.
  daily_value_percent DECIMAL, -- % Daily Value
  PRIMARY KEY (supplement_id, nutrient_id)
);

-- User supplement selections
CREATE TABLE user_supplements (
  user_id UUID REFERENCES users(id),
  supplement_id UUID REFERENCES supplements(id),
  is_selected BOOLEAN DEFAULT false,
  is_my_supps BOOLEAN DEFAULT false,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, supplement_id)
);

-- Intake logs (for native app)
CREATE TABLE intake_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  supplement_id UUID REFERENCES supplements(id),
  taken_at TIMESTAMP NOT NULL,
  quantity INTEGER DEFAULT 1
);

-- User intake schedules
CREATE TABLE user_intake_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  supplement_id UUID REFERENCES supplements(id),
  time_of_day VARCHAR(20) NOT NULL, -- 'morning', 'day', 'night', 'before_sleep'
  timing_type VARCHAR(20), -- '空腹時', '朝食後', '昼食後', '夕食後'
  frequency TEXT, -- Original instruction like '朝晩２回'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, supplement_id, time_of_day)
);

-- Daily intake tracking
CREATE TABLE daily_intake_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  schedule_id UUID REFERENCES user_intake_schedules(id),
  taken_date DATE NOT NULL,
  is_taken BOOLEAN DEFAULT false,
  taken_at TIMESTAMP,
  PRIMARY KEY (user_id, schedule_id, taken_date)
);

-- Nutrient RDA/UL values from NIH ODS
CREATE TABLE nutrient_rda_ul (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nutrient_id VARCHAR(50) NOT NULL,
  nutrient_name VARCHAR(100) NOT NULL,
  category VARCHAR(20), -- 'Vitamin', 'Mineral', 'Other'
  unit VARCHAR(10), -- 'mg', 'mcg', 'g', 'IU'
  age_group VARCHAR(50),
  gender VARCHAR(10), -- 'Male', 'Female'
  rda_ai_value VARCHAR(20),
  rda_ai_type VARCHAR(5), -- 'RDA', 'AI'
  upper_limit_ul VARCHAR(20),
  notes TEXT
);
```

## Key Implementation Details

### 1. Supplement Selection UI
```javascript
// Pink pop selection effect
function toggleSupplementSelection(supplementId) {
  const element = document.getElementById(`supp-${supplementId}`);
  const isSelected = element.classList.toggle('selected');
  
  if (isSelected) {
    element.style.background = 'linear-gradient(45deg, #ff6b9d, #ff8fab)';
    element.style.transform = 'scale(1.05)';
    element.innerHTML += '<span class="my-supps-badge">My Supps</span>';
  } else {
    element.style.filter = 'grayscale(100%)';
    element.style.transform = 'scale(1.0)';
    element.querySelector('.my-supps-badge').remove();
  }
  
  updateSuppsAudit(); // Real-time update
}
```

### 2. Combined Nutrient Calculation
```javascript
async function calculateCombinedNutrients(selectedSupplementIds) {
  const nutrients = {};
  
  for (const suppId of selectedSupplementIds) {
    const response = await supabase
      .from('supplement_nutrients')
      .select(`
        nutrient_id,
        amount_per_serving,
        nutrients (name_ja, unit)
      `)
      .eq('supplement_id', suppId);
    
    response.data.forEach(item => {
      const name = item.nutrients.name_ja;
      nutrients[name] = (nutrients[name] || 0) + item.amount_per_serving;
    });
  }
  
  return nutrients;
}
```

### 3. Radar Chart Configuration with RDA/UL Values
```javascript
const chartConfig = {
  type: 'radar',
  data: {
    labels: Object.keys(nutrients), // ビタミンC, ビタミンD, etc.
    datasets: [{
      label: 'Current Intake',
      data: Object.values(nutrients).map(n => (n.amount / n.rda) * 100),
      backgroundColor: 'rgba(255, 107, 157, 0.2)',
      borderColor: 'rgba(255, 107, 157, 1)',
      pointBackgroundColor: 'rgba(255, 107, 157, 1)'
    }, {
      label: 'RDA (100%)',
      data: Object.keys(nutrients).map(() => 100),
      backgroundColor: 'rgba(0, 255, 0, 0.1)',
      borderColor: 'rgba(0, 255, 0, 0.3)',
      borderDash: [5, 5]
    }, {
      label: 'Upper Limit',
      data: Object.values(nutrients).map(n => (n.ul / n.rda) * 100),
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      borderColor: 'rgba(255, 0, 0, 0.3)',
      borderDash: [10, 5]
    }]
  },
  options: {
    scales: {
      r: {
        beginAtZero: true,
        max: 200 // Show up to 200% to display upper limits
      }
    }
  }
};
```

### 4. Intake Schedule Generation
```javascript
function generateIntakeSchedule(supplementId, instructions) {
  const schedule = [];
  
  // Parse instructions like "朝晩２回"
  if (instructions.includes('朝晩')) {
    schedule.push({
      supplement_id: supplementId,
      time_of_day: 'morning',
      timing_type: '朝食後'
    });
    schedule.push({
      supplement_id: supplementId,
      time_of_day: 'night',
      timing_type: '夕食後'
    });
  }
  // Add more parsing logic for different instruction patterns
  
  return schedule;
}
```

### 5. Today's Schedule Display
```javascript
function getTodaysSchedule(userId) {
  const currentHour = new Date().getHours();
  let timeOfDay = 'morning';
  
  if (currentHour >= 11 && currentHour < 15) {
    timeOfDay = 'day';
  } else if (currentHour >= 17) {
    timeOfDay = 'night';
  }
  
  // Fetch schedule for current time
  return supabase
    .from('user_intake_schedules')
    .select(`
      *,
      supplements (name, brand, serving_size)
    `)
    .eq('user_id', userId)
    .eq('time_of_day', timeOfDay);
}
```

## Critical Implementation Requirements (Updated 2025-06-17)

### **MANDATORY: NIH DSLD API Integration**
**絶対要件:**
- **モックデータの使用は完全に禁止**
- **NIH DSLD APIからの実際のデータ取得のみ許可**
- CORS制限がある場合はプロキシサーバーまたはサーバーサイド実装必須
- テストデータでの開発は一切認めない

### Product Data Quality Standards
**商品名表示の要件:**
- 商品名は実際のサプリメント商品名形式で表示する
- 例: "California Gold Nutrition, Gold C™, USP Grade Vitamin C, 1,000 mg, 60 Veggie Capsules"
- ブランド名 + 詳細な商品名 + 用量 + 内容量 + 形状
- 単純な成分名（例：「Vitamin C」）のみの表示は禁止

**商品データ構造:**
```javascript
{
  id: "1",
  dsld_id: "DSLD_1", 
  name_en: "Gold C™, USP Grade Vitamin C, 1,000 mg, 60 Veggie Capsules",
  name_ja: "ゴールドC™ USPグレード ビタミンC 1,000mg 60ベジカプセル",
  brand: "California Gold Nutrition",
  category: "vitamins",
  serving_size: "1 capsule",
  nutrients: [...],
  image_url: "...",
  popularity_score: 85.2
}
```

### Database Schema Updates
**Supabase テーブル構造 (必須):**
```sql
-- supplements テーブルに string_id カラム追加 (UUID形式エラー回避)
ALTER TABLE supplements ADD COLUMN IF NOT EXISTS string_id TEXT;
CREATE INDEX IF NOT EXISTS idx_supplements_string_id ON supplements(string_id);

-- 既存テーブル
CREATE TABLE supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dsld_id TEXT UNIQUE,
  name_en TEXT NOT NULL,
  name_ja TEXT,
  brand TEXT NOT NULL,
  string_id TEXT, -- 文字列ID管理用
  -- ...
);

CREATE TABLE user_supplements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  supplement_id UUID REFERENCES supplements(id), -- UUID使用
  is_my_supps BOOLEAN DEFAULT false,
  -- ...
);
```

### Authentication & Data Persistence
**重要な実装要件:**
1. **HTTP Server Required**: `file://` プロトコルではSupabase認証が動作しない
   - 開発時は `python3 -m http.server 3000` 必須
   - 本番環境では静的ホスティングで問題なし

2. **localStorage Data Sync**: デモモードでMy Supps表示問題を回避
   ```javascript
   // 商品データをlocalStorageに保存 (demo mode用)
   localStorage.setItem('mockSupplements', JSON.stringify(allProducts));
   
   // My Supps追加時に商品データも保存
   const mockSupplements = JSON.parse(localStorage.getItem('mockSupplements') || '[]');
   if (existingSuppIndex === -1) {
     mockSupplements.push(product);
     localStorage.setItem('mockSupplements', JSON.stringify(mockSupplements));
   }
   ```

3. **Supabase Configuration**: 本番環境用
   ```javascript
   const config = {
     URL: 'https://xkcaxrvnvefstzvpldzf.supabase.co',
     ANON_KEY: '[PROVIDED_KEY]',
     FEATURES: {
       GOOGLE_OAUTH: false, // Pro plan required
       EMAIL_CONFIRMATION: false // 開発時は無効
     }
   };
   ```

### Error Handling Standards
**主要エラーパターンと対策:**
1. **UUID形式エラー**: `invalid input syntax for type uuid: "1"`
   - 対策: string_id カラム使用、UUID変換処理実装

2. **Unknown表示エラー**: My Suppsで商品名が「Unknown」
   - 対策: localStorage同期、商品データ永続化

3. **CORS Error**: DSLD API直接アクセス制限
   - 対策: **ACTUAL DSLD API REQUIRED** - プロキシ実装またはサーバーサイド統合必須

## Design System

### Visual Style
- Spotify-inspired dark theme
- Pink (#ff6b9d) for selected/active states
- Grayscale for unselected items
- Smooth animations and transitions
- Card-based layouts

### Core Pages Structure
```
/index.html                    - Landing page
/products.html                 - Product catalog with search
/nutrients/[name].html         - Supps Note pages
/supplements/[id].html         - Supplement detail pages
/supps-audit.html             - Combined results page
/my-supps.html                - User's collection
/dashboard.html               - User dashboard/My Page
/auth.html                    - Authentication page
/setup-database.html          - Database setup utility
```

## Development Workflow

### Phase 1: Core Web Application (1-2 weeks)
1. Set up GitHub repository with static HTML structure
2. Create Supabase database with schema
3. Implement supplement detail pages with radar charts
4. Build Supps Audit combined view
5. Add selection UI with pink/grayscale effects
6. Create Supps Note nutrient pages

### Phase 2: Native Mobile App (5-7 days)
1. Flutter/React Native project setup
2. Supabase authentication integration
3. MY SUPPS list management screen
4. Calendar view with intake logging
5. Deep linking to web application
6. Testing and deployment

## Performance Targets
- Page load: < 2 seconds (static HTML advantage)
- Chart rendering: < 500ms
- No build process = No build errors
- Mobile-first responsive design

## Dynamic Navigation System

### Navigation Behavior
The header implements a dynamic collapsing system that adapts to user scroll behavior:

**Scroll Down (Collapse):**
- Navigation menu and tagline fade out and slide up
- Logo reduces from 2rem to 1.5rem font size 
- Header height shrinks from full height to 60px (50px on mobile)
- Only "MY SUPPS" logo remains visible
- Smooth 0.3s transition animations

**Scroll Up (Expand):**
- Full navigation menu and tagline fade back in
- Logo returns to full 2rem size
- Header expands to original height
- All navigation links become accessible
- Smooth 0.3s transition animations

**Top of Page:**
- Always shows full expanded header
- Scroll threshold: 100px minimum before collapsing

### Implementation Details

**HTML Structure:**
```html
<header id="main-header">
    <div class="header-content">
        <div class="logo">
            <h1>MY SUPPS</h1>
            <p class="tagline">サプリガチヲタのための管理ツール。</p>
        </div>
        <nav class="navigation">
            <!-- Navigation links -->
        </nav>
    </div>
</header>
```

**CSS Classes:**
- `.collapsed` - Applied to header when scrolling down
- Transitions on opacity, transform, font-size, height, padding
- Mobile-specific collapsed heights and font sizes

**JavaScript:**
- `js/navigation.js` - DynamicNavigation class
- Scroll event listener with requestAnimationFrame throttling
- Minimum 5px scroll difference to prevent jitter
- State management for collapsed/expanded modes

**Cross-Browser Support:**
- Uses `requestAnimationFrame` for smooth performance
- CSS transitions with fallback support
- Touch-friendly on mobile devices

## Important Notes

1. **No Framework Dependencies**: Pure HTML/CSS/JavaScript to avoid build errors
2. **CDN Libraries Only**: Chart.js and Supabase via CDN links
3. **Static Hosting**: GitHub Pages for free, reliable hosting
4. **Shared Database**: Both web and native apps use same Supabase
5. **Progressive Enhancement**: Core features work without JavaScript

## Authentication Setup

### Supabase Auth Configuration
1. Enable Email/Password authentication in Supabase Dashboard
2. Enable Google OAuth provider:
   - Set up Google Cloud Console OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Configure OAuth consent screen
3. Update `js/supabase-client.js` with project URL and anon key

### Google SSO Requirements
- OAuth 2.0 Client ID from Google Cloud Console
- Proper redirect URI configuration
- User consent for email and profile access

## Resolved Issues & Solutions (2025-06-17)

### 1. MY SUPPS追加機能の完全修復
**問題:** 「MY SUPPSへの追加に失敗しました。詳細: undefined」エラー
**根本原因:** 
- Supabaseデータベースにテーブルが存在しない
- UUID形式エラー (`invalid input syntax for type uuid: "1"`)
- localStorage同期不備

**解決策:**
1. Supabaseテーブル作成 (`create-tables-simple.sql`)
2. string_id カラム追加でUUID問題回避
3. デモモード用localStorage同期実装
4. 詳細なエラーハンドリング追加

### 2. 商品名表示の品質向上
**問題:** 商品名が「Vitamin C」等の成分名のみ表示
**要求仕様:** 実際のサプリメント商品名形式
**解決策:** 商品テンプレートを以下形式に変更
- Before: "Vitamin C"
- After: "Gold C™, USP Grade Vitamin C, 1,000 mg, 60 Veggie Capsules"

### 3. My Supps表示の「Unknown」問題解決
**問題:** My Suppsページで登録済み商品が「Unknown」表示
**原因:** 商品データがlocalStorageに保存されていない
**解決策:** 商品データの永続化とMy Supps追加時の同期実装

### 4. 認証状態管理の安定化
**問題:** ページ遷移時の認証状態喪失
**解決策:** 
- 単一Supabaseクライアント管理
- config.js の全ページ読み込み
- HTTP server必須（file://プロトコル制限回避）

## Common Tasks for Claude Code

1. "Create the static HTML structure for supplement detail pages"
2. "Implement the radar chart with Chart.js CDN"
3. "Build the supplement selection UI with pink/grayscale effects"
4. "Create Supabase integration for supplement data"
5. "Implement the Supps Audit combined calculation"
6. "Set up GitHub Pages deployment"
7. "Create the native app MY SUPPS management screen"
8. "Build the intake calendar for the native app"
9. "Configure Google SSO authentication"
10. "Implement user session management"
11. "Fix MY SUPPS addition functionality with proper database setup"
12. "Implement realistic supplement product name formats"
13. "Resolve localStorage synchronization for demo mode"
11. "Create user dashboard with TODAY'S SCHEDULE"
12. "Implement CURRENT SCORE radar chart with RDA/UL values"
13. "Build intake schedule generation from supplement instructions"
14. "Integrate NIH ODS data for nutrient RDA/UL values"
15. "Apply shadcn UI components for consistent design"