import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserProfile = {
  id: number;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  fiber_target: number;
  sodium_target: number;
  potassium_target: number;
  calcium_target: number;
  iron_target: number;
};

export type GlobalFoodCache = {
  id?: string;
  name: string;
  is_complex_dish: boolean;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  fiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  ingredients: any; // jsonb
};

export type UserFoodLog = {
  id?: string;
  log_date: string; // YYYY-MM-DD
  food_name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  fiber: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  oil_added_grams: number;
};
