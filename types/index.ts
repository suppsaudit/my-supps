export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  themePreference: ThemeMode;
  createdAt: Date;
}

export interface UserProfile {
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  adhdTendency: boolean;
  conditions: string[];
  goals: HealthGoal[];
}

export type HealthGoal = 'sleep' | 'fatigue' | 'focus' | 'immunity' | 'skin' | 'muscle';

export type ThemeMode = 'light' | 'dark' | 'auto' | 'medium-dark';

export interface Supplement {
  id: string;
  iherbId?: string;
  barcode?: string;
  upc?: string;
  asin?: string;
  jan?: string;
  nameJa: string;
  nameEn?: string;
  brand: string;
  images: {
    main?: string;
    thumbnails?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Nutrient {
  id: string;
  nameJa: string;
  nameEn?: string;
  category: NutrientCategory;
  rdaLowerMg?: number;
  rdaUpperMg?: number;
  perKgLowerMg?: number;
  perKgUpperMg?: number;
  unit: string;
}

export type NutrientCategory = 'vitamin' | 'mineral' | 'adaptogen' | 'amino-acid' | 'fatty-acid' | 'other';

export interface SupplementNutrient {
  supplementId: string;
  nutrientId: string;
  amountPerServing: number;
  amountPerUnit: number;
  servingSize: number;
  unit: string;
  bioavailabilityFactor: number;
}

export interface UserSupplement {
  userId: string;
  supplementId: string;
  isOwned: boolean;
  isSelected: boolean;
  dailyIntake: number;
  notes?: string;
  addedAt: Date;
}

export interface NutrientData {
  nutrient: Nutrient;
  actualAmount: number;
  recommendedAmount: number;
  coverage: number;
  supplements: Array<{
    supplement: Supplement;
    amount: number;
    percentage: number;
  }>;
}

export interface SimulationResult {
  totalNutrients: NutrientData[];
  warnings: string[];
  coveragePercentage: number;
  supplements: Supplement[];
}