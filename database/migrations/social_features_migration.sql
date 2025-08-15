-- Social Features Migration for DailyNutriFit
-- Adds family plans, referrals, community challenges, recipe sharing, and health professional features
-- Version: 1.0.0
-- Date: 2025-01-27

-- Begin transaction for atomic migration
BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Family plans management
CREATE TABLE IF NOT EXISTS family_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_name VARCHAR(100) NOT NULL,
  primary_account_holder UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_account UUID REFERENCES auth.users(id), -- May differ from primary holder
  max_members INTEGER DEFAULT 6,
  plan_type VARCHAR(20) DEFAULT 'standard', -- standard, premium, custom
  shared_wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  family_goals JSONB, -- Shared family health goals
  coordination_preferences JSONB, -- Delivery coordination settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Family member profiles and relationships
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_plan_id UUID REFERENCES family_plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- admin, member, child, guest
  display_name VARCHAR(50), -- Family-specific display name
  relationship VARCHAR(30), -- parent, child, spouse, sibling, etc.
  permissions JSONB, -- Role-based permission settings
  privacy_settings JSONB, -- What family members can see
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(family_plan_id, user_id)
);

-- Referral tracking system
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES auth.users(id), -- May be null until signup
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referral_method VARCHAR(30), -- code, link, qr_code, contact_share
  referral_source VARCHAR(50), -- app_share, sms, email, social
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signed_up_at TIMESTAMP WITH TIME ZONE,
  first_purchase_at TIMESTAMP WITH TIME ZONE,
  reward_status VARCHAR(20) DEFAULT 'pending', -- pending, earned, credited, expired
  reward_amount DECIMAL(10,2),
  bonus_tier INTEGER DEFAULT 1, -- Escalating rewards for multiple referrals
  metadata JSONB -- Campaign tracking, A/B test data, etc.
);

-- Community challenges system
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(30), -- consistency, variety, seasonal, goal_based
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  duration_days INTEGER NOT NULL,
  max_participants INTEGER, -- NULL for unlimited
  entry_requirements JSONB, -- Prerequisites to join
  success_criteria JSONB, -- How to complete the challenge
  reward_structure JSONB, -- Points, badges, prizes for completion
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id), -- NULL for system challenges
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  featured_priority INTEGER DEFAULT 0, -- Higher numbers get featured
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge participation tracking
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_status VARCHAR(20) DEFAULT 'active', -- active, completed, failed, withdrawn
  completion_date TIMESTAMP WITH TIME ZONE,
  final_score INTEGER DEFAULT 0,
  rank_position INTEGER, -- Final ranking in challenge
  rewards_earned JSONB, -- Points, badges, prizes received
  is_visible BOOLEAN DEFAULT true, -- Privacy control for leaderboard
  UNIQUE(challenge_id, user_id)
);

-- Daily progress tracking for challenges
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  progress_data JSONB NOT NULL, -- Challenge-specific progress metrics
  daily_score INTEGER DEFAULT 0,
  cumulative_score INTEGER DEFAULT 0,
  notes TEXT, -- User notes about their progress
  auto_generated BOOLEAN DEFAULT false, -- System vs manual entry
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_participant_id, progress_date)
);

-- User-generated recipe system
CREATE TABLE IF NOT EXISTS user_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_name VARCHAR(100) NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL, -- Fruit-focused ingredient list
  instructions TEXT NOT NULL,
  prep_time_minutes INTEGER,
  servings INTEGER DEFAULT 1,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  nutritional_info JSONB, -- Calculated or estimated nutrition
  tags TEXT[], -- dietary, occasion, season tags
  image_url TEXT, -- Recipe photo
  is_public BOOLEAN DEFAULT true,
  featured_at TIMESTAMP WITH TIME ZONE, -- When featured by moderators
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ratings and reviews
CREATE TABLE IF NOT EXISTS recipe_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES user_recipes(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, reviewer_id)
);

-- Health professionals directory
CREATE TABLE IF NOT EXISTS health_professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id), -- May link to user account
  professional_name VARCHAR(100) NOT NULL,
  credentials TEXT[], -- RD, PhD, MD, etc.
  specializations TEXT[], -- diabetes, heart_health, sports_nutrition
  bio TEXT,
  years_experience INTEGER,
  consultation_rate DECIMAL(8,2), -- Per session rate
  available_time_slots JSONB, -- Available consultation times
  languages TEXT[] DEFAULT ARRAY['English'],
  profile_image_url TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, suspended
  verification_documents JSONB, -- Stored credential verification
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  total_consultations INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultation session management
CREATE TABLE IF NOT EXISTS consultation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES health_professionals(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  session_type VARCHAR(20) DEFAULT 'video', -- video, phone, chat
  session_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  session_notes TEXT, -- Professional's notes
  user_feedback_rating INTEGER CHECK (user_feedback_rating >= 1 AND user_feedback_rating <= 5),
  user_feedback_text TEXT,
  session_cost DECIMAL(8,2),
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded
  recording_url TEXT, -- Optional session recording
  follow_up_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social achievements and rewards
CREATE TABLE IF NOT EXISTS social_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL, -- referral_milestone, challenge_winner, recipe_featured
  achievement_name VARCHAR(100) NOT NULL,
  description TEXT,
  related_entity_id UUID, -- ID of challenge, referral, recipe, etc.
  related_entity_type VARCHAR(30), -- challenge, referral, recipe
  points_awarded INTEGER DEFAULT 0,
  badge_awarded VARCHAR(50),
  special_reward JSONB, -- Credits, discounts, special access
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true, -- Can others see this achievement
  celebration_shown BOOLEAN DEFAULT false
);

-- Enhanced indexes for social features
CREATE INDEX IF NOT EXISTS idx_family_plans_primary_holder ON family_plans(primary_account_holder);
CREATE INDEX IF NOT EXISTS idx_family_members_plan_user ON family_members(family_plan_id, user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON referrals(referrer_id, reward_status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_user ON challenge_participants(challenge_id, user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_participant_date ON challenge_progress(challenge_participant_id, progress_date);
CREATE INDEX IF NOT EXISTS idx_community_challenges_active ON community_challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_user_recipes_public_featured ON user_recipes(is_public, featured_at);
CREATE INDEX IF NOT EXISTS idx_health_professionals_specialization ON health_professionals USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_user_date ON consultation_sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_social_achievements_user_type ON social_achievements(user_id, achievement_type);
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe_rating ON recipe_reviews(recipe_id, rating);

-- Enhance user profiles for social features
-- Check if columns already exist before adding them
DO $$ 
BEGIN
    -- Add display_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN display_name VARCHAR(50);
    END IF;

    -- Add privacy_level if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'privacy_level'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN privacy_level VARCHAR(20) DEFAULT 'friends_only';
    END IF;

    -- Add social_sharing_enabled if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'social_sharing_enabled'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN social_sharing_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Add referral_credits_earned if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'referral_credits_earned'
    ) THEN
        ALTER TABLE auth.users ADD COLUMN referral_credits_earned DECIMAL(10,2) DEFAULT 0.00;
    END IF;
END $$;

-- Create views for social analytics
-- Family dashboard aggregated view
CREATE OR REPLACE VIEW family_dashboard AS
SELECT 
  fp.id as family_plan_id,
  fp.family_name,
  COUNT(fm.user_id) as total_members,
  COUNT(CASE WHEN fm.is_active = true THEN 1 END) as active_members,
  fp.shared_wallet_balance as wallet_balance,
  COUNT(DISTINCT cp.challenge_id) as active_challenges,
  fp.created_at,
  fp.plan_type
FROM family_plans fp
LEFT JOIN family_members fm ON fp.id = fm.family_plan_id
LEFT JOIN challenge_participants cp ON fm.user_id = cp.user_id 
  AND cp.completion_status = 'active'
WHERE fp.is_active = true
GROUP BY fp.id, fp.family_name, fp.shared_wallet_balance, fp.created_at, fp.plan_type;

-- Challenge leaderboard view
CREATE OR REPLACE VIEW challenge_leaderboards AS
SELECT 
  cc.id as challenge_id,
  cc.challenge_name,
  cp.user_id,
  cp.final_score,
  cp.rank_position,
  cp.completion_status,
  ROW_NUMBER() OVER (PARTITION BY cc.id ORDER BY cp.final_score DESC) as current_rank,
  cc.is_active as challenge_active,
  cp.joined_at,
  cp.completion_date
FROM community_challenges cc
JOIN challenge_participants cp ON cc.id = cp.challenge_id
WHERE cp.is_visible = true
  AND cc.is_active = true;

-- Referral performance analytics
CREATE OR REPLACE VIEW referral_analytics AS
SELECT 
  r.referrer_id,
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN r.signed_up_at IS NOT NULL THEN 1 END) as successful_signups,
  COUNT(CASE WHEN r.first_purchase_at IS NOT NULL THEN 1 END) as converted_purchases,
  SUM(r.reward_amount) as total_rewards_earned,
  AVG(EXTRACT(days FROM (r.first_purchase_at - r.signed_up_at))) as avg_conversion_days,
  r.reward_status
FROM referrals r
WHERE r.invited_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY r.referrer_id, r.reward_status;

-- Add Row Level Security to social tables
ALTER TABLE family_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for family plans
CREATE POLICY "Family plans viewable by members and holders" ON family_plans
  FOR SELECT USING (
    auth.uid() = primary_account_holder 
    OR auth.uid() = billing_account
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_plan_id = family_plans.id 
      AND fm.user_id = auth.uid() 
      AND fm.is_active = true
    )
  );

CREATE POLICY "Family plans manageable by holders and admins" ON family_plans
  FOR ALL USING (
    auth.uid() = primary_account_holder 
    OR auth.uid() = billing_account
    OR EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_plan_id = family_plans.id 
      AND fm.user_id = auth.uid() 
      AND fm.role = 'admin'
    )
  );

-- Create RLS policies for family members
CREATE POLICY "Family members viewable by family" ON family_members
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM family_plans fp 
      WHERE fp.id = family_members.family_plan_id 
      AND (fp.primary_account_holder = auth.uid() OR fp.billing_account = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM family_members fm2 
      WHERE fm2.family_plan_id = family_members.family_plan_id 
      AND fm2.user_id = auth.uid() 
      AND fm2.is_active = true
    )
  );

-- Create RLS policies for referrals
CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create their own referrals" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Create RLS policies for challenges
CREATE POLICY "Public challenges viewable by all" ON community_challenges
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Challenge participants viewable by participants" ON challenge_participants
  FOR SELECT USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM community_challenges cc 
      WHERE cc.id = challenge_participants.challenge_id 
      AND (cc.is_public = true OR cc.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can join public challenges" ON challenge_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM community_challenges cc 
      WHERE cc.id = challenge_participants.challenge_id 
      AND cc.is_public = true 
      AND cc.is_active = true
    )
  );

-- Create RLS policies for challenge progress
CREATE POLICY "Users can view their own progress" ON challenge_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp 
      WHERE cp.id = challenge_progress.challenge_participant_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own progress" ON challenge_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants cp 
      WHERE cp.id = challenge_progress.challenge_participant_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Create RLS policies for recipes
CREATE POLICY "Public recipes viewable by all" ON user_recipes
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own recipes" ON user_recipes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recipes" ON user_recipes
  FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for recipe reviews
CREATE POLICY "Recipe reviews viewable with recipes" ON recipe_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_recipes ur 
      WHERE ur.id = recipe_reviews.recipe_id 
      AND (ur.is_public = true OR ur.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can review public recipes" ON recipe_reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM user_recipes ur 
      WHERE ur.id = recipe_reviews.recipe_id 
      AND ur.is_public = true
    )
  );

-- Create RLS policies for health professionals (public directory)
CREATE POLICY "Verified professionals viewable by all" ON health_professionals
  FOR SELECT USING (verification_status = 'verified' AND is_available = true);

-- Create RLS policies for consultation sessions
CREATE POLICY "Users can view their own sessions" ON consultation_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Professionals can view their sessions" ON consultation_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM health_professionals hp 
      WHERE hp.id = consultation_sessions.professional_id 
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can book their own sessions" ON consultation_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for social achievements
CREATE POLICY "Users can view public achievements and their own" ON social_achievements
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_family_plans_updated_at 
  BEFORE UPDATE ON family_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_recipes_updated_at 
  BEFORE UPDATE ON user_recipes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_reviews_updated_at 
  BEFORE UPDATE ON recipe_reviews 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_professionals_updated_at 
  BEFORE UPDATE ON health_professionals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_sessions_updated_at 
  BEFORE UPDATE ON consultation_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample health professionals
INSERT INTO health_professionals (
  professional_name,
  credentials,
  specializations,
  bio,
  years_experience,
  consultation_rate,
  available_time_slots,
  languages,
  verification_status,
  verification_documents,
  rating_average,
  total_consultations,
  is_available
) VALUES 
(
  'Dr. Sarah Johnson, RD',
  ARRAY['RD', 'PhD', 'CDE'],
  ARRAY['diabetes', 'heart_health', 'weight_management'],
  'Registered dietitian with 15 years experience in clinical nutrition and diabetes management. Specializes in personalized meal planning and lifestyle modification.',
  15,
  75.00,
  '{"monday": ["09:00", "11:00", "14:00", "16:00"], "wednesday": ["10:00", "12:00", "15:00"], "friday": ["08:00", "10:00", "13:00", "16:00"]}',
  ARRAY['English', 'Spanish'],
  'verified',
  '{"license": "RD12345", "verified_date": "2025-01-01", "state": "CA"}',
  4.8,
  150,
  true
),
(
  'Marcus Chen, MS, RD',
  ARRAY['MS', 'RD', 'CSSD'],
  ARRAY['sports_nutrition', 'performance', 'recovery'],
  'Sports nutritionist working with athletes and active individuals. Expert in optimizing nutrition for performance and recovery.',
  8,
  85.00,
  '{"tuesday": ["08:00", "10:00", "14:00"], "thursday": ["09:00", "11:00", "15:00"], "saturday": ["09:00", "11:00"]}',
  ARRAY['English', 'Mandarin'],
  'verified',
  '{"license": "RD67890", "verified_date": "2025-01-01", "state": "NY"}',
  4.9,
  95,
  true
),
(
  'Dr. Emily Rodriguez, RD',
  ARRAY['RD', 'MS', 'CDN'],
  ARRAY['pediatric_nutrition', 'family_health', 'allergies'],
  'Pediatric nutritionist specializing in family nutrition and food allergies. Helps families establish healthy eating patterns for children.',
  12,
  70.00,
  '{"monday": ["10:00", "14:00"], "wednesday": ["09:00", "13:00", "15:00"], "friday": ["10:00", "14:00"]}',
  ARRAY['English', 'Spanish'],
  'verified',
  '{"license": "RD11111", "verified_date": "2025-01-01", "state": "TX"}',
  4.7,
  200,
  true
);

-- Insert sample community challenges
INSERT INTO community_challenges (
  challenge_name,
  description,
  challenge_type,
  difficulty_level,
  duration_days,
  max_participants,
  entry_requirements,
  success_criteria,
  reward_structure,
  start_date,
  end_date,
  created_by,
  is_public,
  featured_priority
) VALUES 
(
  'January Variety Challenge',
  'Try 20 different fruits throughout the month of January. Perfect for exploring new flavors and expanding your nutritional intake.',
  'variety',
  2,
  31,
  500,
  '{"min_deliveries": 3, "account_age_days": 7}',
  '{"unique_fruits": 20, "min_days_active": 25}',
  '{"completion_points": 300, "badges": ["variety_explorer"], "credits": 25.00}',
  '2025-01-01',
  '2025-01-31',
  NULL,
  true,
  10
),
(
  'Consistency Champion',
  'Maintain daily fruit consumption for 14 consecutive days. Build the habit of consistent healthy eating.',
  'consistency',
  1,
  14,
  1000,
  '{"min_deliveries": 1}',
  '{"consecutive_days": 14, "min_fruits_per_day": 1}',
  '{"completion_points": 200, "badges": ["consistency_champion"], "credits": 15.00}',
  '2025-01-15',
  '2025-01-28',
  NULL,
  true,
  8
),
(
  'Citrus Power Month',
  'Focus on citrus fruits throughout February to boost your vitamin C intake during winter months.',
  'seasonal',
  2,
  28,
  300,
  '{"min_deliveries": 2, "account_age_days": 14}',
  '{"citrus_fruits": 15, "min_vitamin_c": 1000}',
  '{"completion_points": 250, "badges": ["citrus_power"], "credits": 20.00, "bonus_items": ["premium_oranges"]}',
  '2025-02-01',
  '2025-02-28',
  NULL,
  true,
  7
);

COMMIT;

-- Final verification message
DO $$
BEGIN
  RAISE NOTICE 'Social features migration completed successfully!';
  RAISE NOTICE 'Created: 11 new tables, 12 indexes, 3 views, enhanced user profiles';
  RAISE NOTICE 'Added: Sample health professionals and community challenges';
  RAISE NOTICE 'Configured: Row Level Security policies for all social features';
END $$;