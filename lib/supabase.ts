import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  id: string;
  user_id: string;
  title: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface FruitCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Fruit {
  id: string;
  name: string;
  description: string;
  short_description: string | null;
  price: number;
  unit: string;
  image_url: string;
  is_available: boolean;
  is_seasonal: boolean;
  seasonal_months: string[] | null;
  storage_tips: string | null;
  origin_country: string | null;
  created_at: string;
  updated_at: string;
}

export interface FruitNutritionalInfo {
  id: string;
  fruit_id: string;
  calories_per_100g: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  fat_g: number | null;
  vitamin_c_mg: number | null;
  vitamin_a_iu: number | null;
  potassium_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  created_at: string;
}

export interface HealthBenefit {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  fruit_id: string;
  created_at: string;
}

export interface FruitWithDetails extends Fruit {
  nutritional_info?: FruitNutritionalInfo;
  categories?: FruitCategory[];
  health_benefits?: HealthBenefit[];
  is_favorite?: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'top_up' | 'payment' | 'refund' | 'adjustment';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: TransactionStatus;
  description: string;
  reference_id: string | null;
  stripe_payment_intent_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  processed_at: string | null;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}