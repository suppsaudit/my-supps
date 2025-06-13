import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          profile: Record<string, unknown>;
          theme_preference: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          profile?: Record<string, unknown>;
          theme_preference?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          profile?: Record<string, unknown>;
          theme_preference?: string;
          created_at?: string;
        };
      };
      supplements: {
        Row: {
          id: string;
          iherb_id: string | null;
          barcode: string | null;
          upc: string | null;
          asin: string | null;
          jan: string | null;
          name_ja: string;
          name_en: string | null;
          brand: string;
          images: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          iherb_id?: string | null;
          barcode?: string | null;
          upc?: string | null;
          asin?: string | null;
          jan?: string | null;
          name_ja: string;
          name_en?: string | null;
          brand: string;
          images?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          iherb_id?: string | null;
          barcode?: string | null;
          upc?: string | null;
          asin?: string | null;
          jan?: string | null;
          name_ja?: string;
          name_en?: string | null;
          brand?: string;
          images?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      nutrients: {
        Row: {
          id: string;
          name_ja: string;
          name_en: string | null;
          category: string | null;
          rda_lower_mg: number | null;
          rda_upper_mg: number | null;
          per_kg_lower_mg: number | null;
          per_kg_upper_mg: number | null;
          unit: string;
        };
        Insert: {
          id?: string;
          name_ja: string;
          name_en?: string | null;
          category?: string | null;
          rda_lower_mg?: number | null;
          rda_upper_mg?: number | null;
          per_kg_lower_mg?: number | null;
          per_kg_upper_mg?: number | null;
          unit?: string;
        };
        Update: {
          id?: string;
          name_ja?: string;
          name_en?: string | null;
          category?: string | null;
          rda_lower_mg?: number | null;
          rda_upper_mg?: number | null;
          per_kg_lower_mg?: number | null;
          per_kg_upper_mg?: number | null;
          unit?: string;
        };
      };
      supplement_nutrients: {
        Row: {
          supplement_id: string;
          nutrient_id: string;
          amount_per_serving: number;
          amount_per_unit: number;
          serving_size: number;
          unit: string;
          bioavailability_factor: number;
        };
        Insert: {
          supplement_id: string;
          nutrient_id: string;
          amount_per_serving: number;
          amount_per_unit: number;
          serving_size?: number;
          unit?: string;
          bioavailability_factor?: number;
        };
        Update: {
          supplement_id?: string;
          nutrient_id?: string;
          amount_per_serving?: number;
          amount_per_unit?: number;
          serving_size?: number;
          unit?: string;
          bioavailability_factor?: number;
        };
      };
      user_supplements: {
        Row: {
          user_id: string;
          supplement_id: string;
          is_owned: boolean;
          is_selected: boolean;
          daily_intake: number;
          notes: string | null;
          added_at: string;
        };
        Insert: {
          user_id: string;
          supplement_id: string;
          is_owned?: boolean;
          is_selected?: boolean;
          daily_intake?: number;
          notes?: string | null;
          added_at?: string;
        };
        Update: {
          user_id?: string;
          supplement_id?: string;
          is_owned?: boolean;
          is_selected?: boolean;
          daily_intake?: number;
          notes?: string | null;
          added_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};