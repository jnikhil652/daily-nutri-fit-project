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
  razorpay_payment_method_id: string;
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

// Basic Ordering Types

export interface ShoppingCart {
  id: string;
  user_id: string;
  fruit_id: string;
  quantity: number;
  price_per_unit: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  delivery_address_id: string;
  requested_delivery_date: string;
  delivery_time_slot: string;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  wallet_transaction_id: string | null;
  status: OrderStatus;
  delivery_instructions: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  fruit_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  fruit_name: string;
  fruit_description: string | null;
  fruit_image_url: string | null;
  created_at: string;
}

export interface DeliveryTimeSlot {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  max_orders_per_slot: number;
  created_at: string;
}

// Enhanced types with relationships
export interface ShoppingCartWithFruit extends ShoppingCart {
  fruit?: Fruit;
}

export interface OrderWithDetails extends Order {
  order_items?: OrderItem[];
  delivery_address?: DeliveryAddress;
}

export interface OrderItemWithFruit extends OrderItem {
  fruit?: Fruit;
}

//
// Social Features Types

export interface FamilyPlan {
  id: string;
  family_name: string;
  primary_account_holder: string;
  billing_account: string | null;
  max_members: number;
  plan_type: string;
  shared_wallet_balance: number;
  family_goals: Record<string, any> | null;
  coordination_preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface FamilyMember {
  id: string;
  family_plan_id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  relationship: string | null;
  permissions: Record<string, any> | null;
  privacy_settings: Record<string, any> | null;
  joined_at: string;
  is_active: boolean;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id: string | null;
  referral_code: string;
  referral_method: string | null;
  referral_source: string | null;
  invited_at: string;
  signed_up_at: string | null;
  first_purchase_at: string | null;
  reward_status: string;
  reward_amount: number | null;
  bonus_tier: number;
  metadata: Record<string, any> | null;
}

export interface CommunityChallenge {
  id: string;
  challenge_name: string;
  description: string;
  challenge_type: string | null;
  difficulty_level: number;
  duration_days: number;
  max_participants: number | null;
  entry_requirements: Record<string, any> | null;
  success_criteria: Record<string, any> | null;
  reward_structure: Record<string, any> | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  is_public: boolean;
  is_active: boolean;
  featured_priority: number;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  completion_status: string;
  completion_date: string | null;
  final_score: number;
  rank_position: number | null;
  rewards_earned: Record<string, any> | null;
  is_visible: boolean;
}

export interface ChallengeProgress {
  id: string;
  challenge_participant_id: string;
  progress_date: string;
  progress_data: Record<string, any>;
  daily_score: number;
  cumulative_score: number;
  notes: string | null;
  auto_generated: boolean;
  created_at: string;
}

export interface UserRecipe {
  id: string;
  user_id: string;
  recipe_name: string;
  description: string | null;
  ingredients: Record<string, any>;
  instructions: string;
  prep_time_minutes: number | null;
  servings: number;
  difficulty_level: number;
  nutritional_info: Record<string, any> | null;
  tags: string[] | null;
  image_url: string | null;
  is_public: boolean;
  featured_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeReview {
  id: string;
  recipe_id: string;
  reviewer_id: string;
  rating: number | null;
  review_text: string | null;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface HealthProfessional {
  id: string;
  user_id: string | null;
  professional_name: string;
  credentials: string[] | null;
  specializations: string[] | null;
  bio: string | null;
  years_experience: number | null;
  consultation_rate: number | null;
  available_time_slots: Record<string, any> | null;
  languages: string[] | null;
  profile_image_url: string | null;
  verification_status: string;
  verification_documents: Record<string, any> | null;
  rating_average: number;
  total_consultations: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsultationSession {
  id: string;
  user_id: string;
  professional_id: string;
  session_date: string;
  duration_minutes: number;
  session_type: string;
  session_status: string;
  session_notes: string | null;
  user_feedback_rating: number | null;
  user_feedback_text: string | null;
  session_cost: number | null;
  payment_status: string;
  recording_url: string | null;
  follow_up_scheduled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialAchievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  description: string | null;
  related_entity_id: string | null;
  related_entity_type: string | null;
  points_awarded: number;
  badge_awarded: string | null;
  special_reward: Record<string, any> | null;
  achieved_at: string;
  is_public: boolean;
  celebration_shown: boolean;
}

// Enhanced types with relationships
export interface ChallengeWithParticipants extends CommunityChallenge {
  participants?: ChallengeParticipant[];
  participant_count?: number;
  user_participation?: ChallengeParticipant;
}

export interface RecipeWithReviews extends UserRecipe {
  reviews?: RecipeReview[];
  average_rating?: number;
  review_count?: number;
  user_review?: RecipeReview;
}

export interface FamilyPlanWithMembers extends FamilyPlan {
  members?: FamilyMember[];
  member_count?: number;
}