import { createBrowserClient } from '@supabase/ssr';
import { Database } from './client';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo_anon_key';
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  );
}