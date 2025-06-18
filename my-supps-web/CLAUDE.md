# MY SUPPS - Claude Code Development Guide

## Project Overview

MY SUPPS is a Spotify-like PWA application for supplement management, targeting Japanese iHerb power users. It features a revolutionary UI where supplements form the outer frame of nutrient charts, enabling visual and enjoyable supplement collection management.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React 18
- **Styling**: Tailwind CSS, shadcn/ui (Spotify-themed customization)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **PWA**: next-pwa
- **Data Fetching**: SWR for caching
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel

## Project Structure
my-supps/
├── app/                    # Next.js 14 App Router
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Landing page
│   ├── supplements/       # Supplement pages
│   │   └── [id]/         # Dynamic supplement detail
│   ├── my-supps/         # User library
│   ├── simulation/       # Purchase simulation
│   ├── nutrients/        # Nutrient information
│   └── scan/            # Barcode scanner
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── charts/          # Nutrient visualization
│   └── supplements/     # Supplement-specific components
├── lib/
│   ├── supabase/       # Supabase client and queries
│   ├── utils/          # Helper functions
│   └── mock-data/      # Development data
├── public/
│   └── images/         # Static assets
├── styles/
│   └── globals.css     # Global styles with Spotify theme
└── types/              # TypeScript definitions

## Core Features to Implement

### 1. Purchase Simulation (MVP Core)
- Accept iHerb/Amazon URLs
- Calculate nutrient coverage percentage
- Visual representation of nutrient fulfillment
- Stack multiple supplements for combined analysis
- Warning for excessive intake

### 2. Revolutionary Nutrient Chart UI
- Circular/diamond chart with supplements as outer frame
- Recommended Daily Allowance (RDA) zones with upper/lower limits
- Visual progress indicators for each supplement
- Animated transitions when adding/removing supplements
- Per serving vs per unit toggle

### 3. Supplement Management (MY SUPPS)
- Drag-and-drop library organization
- Selected items: Pink overlay effect
- Unselected items: Grayscale effect
- Quick add/remove functionality
- Intake tracking

### 4. User Profile System
- Basic info: Weight (kg), Height (cm), Age, Gender
- Health conditions: ADHD tendency, existing conditions, allergies
- Goals: Sleep improvement, fatigue recovery, focus enhancement
- Calculate personalized RDA based on body weight

### 5. Product Identification System
- Priority: iHerb ID → Barcode → UPC → ASIN → JAN
- Handle product name variations across EC sites
- Automatic product matching algorithm

## Database Schema

```sql
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
  theme_preference TEXT DEFAULT 'auto',
  created_at TIMESTAMP DEFAULT NOW()
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
  images JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Nutrients with RDA ranges
CREATE TABLE nutrients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ja TEXT NOT NULL,
  name_en TEXT,
  category TEXT, -- vitamin, mineral, adaptogen, etc.
  rda_lower_mg DECIMAL,
  rda_upper_mg DECIMAL,
  per_kg_lower_mg DECIMAL,
  per_kg_upper_mg DECIMAL,
  unit TEXT DEFAULT 'mg'
);

-- Supplement-nutrient relationships
CREATE TABLE supplement_nutrients (
  supplement_id UUID REFERENCES supplements(id),
  nutrient_id UUID REFERENCES nutrients(id),
  amount_per_serving DECIMAL NOT NULL,
  amount_per_unit DECIMAL NOT NULL,
  serving_size INTEGER DEFAULT 1,
  unit TEXT DEFAULT 'mg',
  bioavailability_factor DECIMAL DEFAULT 1.0,
  PRIMARY KEY (supplement_id, nutrient_id)
);

-- User's supplement library
CREATE TABLE user_supplements (
  user_id UUID REFERENCES users(id),
  supplement_id UUID REFERENCES supplements(id),
  is_owned BOOLEAN DEFAULT true,
  is_selected BOOLEAN DEFAULT false,
  daily_intake INTEGER DEFAULT 0,
  notes TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, supplement_id)
);
Design System
Visual Style

Spotify-like modern design with dark theme options
Gradient-heavy UI with smooth animations
Card-based layouts with hover effects
Pink accent for selected items
Grayscale for unselected items
4 theme modes: Light (default white background), Dark, Auto, Medium-dark

Component Patterns
tsx// Example: SupplementCard component structure
interface SupplementCardProps {
  supplement: Supplement;
  isSelected: boolean;
  isOwned: boolean;
  onToggle: (id: string) => void;
}

// Example: NutrientChart component structure
interface NutrientChartProps {
  nutrients: NutrientData[];
  userWeight: number;
  mode: 'perServing' | 'perUnit';
  showRDAZones: boolean;
}
Key Implementation Details
1. iHerb Product Scraping

Implement rate limiting (1 request/second)
Cache product data for 24 hours
Handle both per-serving and per-unit amounts
Extract Japanese and English names

2. Nutrient Calculations
typescript// RDA calculation based on body weight
const calculatePersonalRDA = (
  nutrient: Nutrient,
  userWeight: number
) => {
  const lowerBound = nutrient.per_kg_lower_mg * userWeight;
  const upperBound = nutrient.per_kg_upper_mg * userWeight;
  return { lowerBound, upperBound };
};

// Coverage percentage calculation
const calculateCoverage = (
  actualAmount: number,
  recommendedAmount: number
) => {
  return Math.min((actualAmount / recommendedAmount) * 100, 100);
};
3. Theme System

4 modes: Light (default), Dark, Auto, Medium-dark
Persist user preference in localStorage and Supabase
System preference detection for Auto mode

4. PWA Requirements

Offline functionality (Priority: 5/5)
Service worker for caching
App manifest for installation
Push notifications for intake reminders

5. Japanese Market Optimization

All text in Japanese by default
Consider Japanese body composition for RDA
Support for Japanese supplement brands
Compliance with Japanese regulations (avoid medical claims)

Performance Targets

Initial load: < 3 seconds
Page transitions: < 300ms
Search results: < 500ms
Offline mode: Full functionality except EC site data
Target scale: 65.74 million users (3 years)

Development Workflow Commands
bash# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check

# Database migrations
npm run db:migrate

# Generate types from Supabase
npm run db:types
Error Handling

User-friendly Japanese error messages
Graceful fallbacks for failed API calls
Offline queue for data sync
Comprehensive error logging to Supabase

Security Considerations

Row Level Security (RLS) on all Supabase tables
API rate limiting
Input validation for URLs and user data
CORS configuration for EC site integrations

Testing Strategy

Unit tests for calculation functions
Integration tests for Supabase operations
E2E tests for critical user flows
Visual regression tests for UI components

Deployment Checklist

 Environment variables configured
 Supabase migrations applied
 PWA manifest updated
 Performance budget verified
 SEO meta tags configured
 Analytics integration
 Error tracking setup

Future Enhancements

AI-powered supplement recommendations
Integration with health tracking devices
Community features for sharing stacks
B2B API for supplement manufacturers
Multi-language support (English priority)

Important Notes

Start with purchase simulation as MVP core
Prioritize visual appeal (Spotify-like experience)
Ensure smooth animations and transitions
Mobile-first responsive design
Accessibility compliance (WCAG 2.1 AA)

Common Tasks for Claude Code

"Create the purchase simulation feature with iHerb URL parsing"
"Implement the revolutionary nutrient chart with supplements as outer frame"
"Build the MY SUPPS library with drag-and-drop functionality"
"Set up Supabase integration with proper TypeScript types"
"Create the theme system with 4 modes and persistence"
"Implement offline-first PWA functionality"
"Build the user profile system with weight-based RDA calculations"
"Create the supplement identification system with priority handling"

