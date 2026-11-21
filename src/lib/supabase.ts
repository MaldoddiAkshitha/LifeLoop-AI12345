import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Report {
  id: string;
  description: string;
  category: Category;
  priority: Priority;
  status: 'pending' | 'in_progress' | 'resolved';
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  reporter_name: string;
  image_url: string | null;
  confidence: number | null;
  recommendation: string | null;
  confirm_count: number;
  created_at: string;
  updated_at: string;
}

export type Category =
  | 'garbage'
  | 'road'
  | 'water'
  | 'streetlight'
  | 'food_wastage'
  | 'other';

export type Priority = 'low' | 'medium' | 'high';

export const CATEGORY_LABELS: Record<Category, string> = {
  garbage: 'Garbage / Waste',
  road: 'Damaged Road',
  water: 'Water Leakage',
  streetlight: 'Broken Streetlight',
  food_wastage: 'Food Wastage',
  other: 'Other',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
