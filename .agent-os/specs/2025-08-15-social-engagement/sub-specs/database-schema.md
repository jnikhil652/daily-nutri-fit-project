# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-15-social-engagement/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Schema Changes

### New Tables

**family_plans**
- Multi-user family account management
- Links multiple users under shared billing and coordination

**family_members**
- Individual family member profiles within family plans
- Role-based access control and profile relationships

**referrals**
- Referral tracking system for user acquisition
- Links referrers to referees with reward tracking

**community_challenges**
- Challenge definitions and management
- Community-driven healthy eating competitions

**challenge_participants**
- User participation in challenges
- Progress tracking and completion status

**challenge_progress**
- Daily/weekly progress entries for challenges
- Real-time tracking of user achievements

**user_recipes**
- User-generated fruit-based recipe sharing
- Community content with ratings and reviews

**health_professionals**
- Directory of verified nutritionists and health experts
- Professional credentials and specialties

**consultation_sessions**
- Scheduled sessions between users and professionals
- Session management and follow-up tracking

**social_achievements**
- Social-specific achievements and milestones
- Referral rewards and challenge completions

### Schema Specifications

```sql
-- Family plans management
CREATE TABLE family_plans (
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
CREATE TABLE family_members (
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
CREATE TABLE referrals (
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
CREATE TABLE community_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  challenge_type VARCHAR(30), -- consistency, variety, seasonal, goal_based
  difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
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
CREATE TABLE challenge_participants (
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
CREATE TABLE challenge_progress (
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
CREATE TABLE user_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_name VARCHAR(100) NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL, -- Fruit-focused ingredient list
  instructions TEXT NOT NULL,
  prep_time_minutes INTEGER,
  servings INTEGER DEFAULT 1,
  difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
  nutritional_info JSONB, -- Calculated or estimated nutrition
  tags TEXT[], -- dietary, occasion, season tags
  image_url TEXT, -- Recipe photo
  is_public BOOLEAN DEFAULT true,
  featured_at TIMESTAMP WITH TIME ZONE, -- When featured by moderators
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe ratings and reviews
CREATE TABLE recipe_reviews (
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
CREATE TABLE health_professionals (
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
CREATE TABLE consultation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES health_professionals(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  session_type VARCHAR(20) DEFAULT 'video', -- video, phone, chat
  session_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  session_notes TEXT, -- Professional's notes
  user_feedback_rating INTEGER, -- 1-5 rating from user
  user_feedback_text TEXT,
  session_cost DECIMAL(8,2),
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, refunded
  recording_url TEXT, -- Optional session recording
  follow_up_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social achievements and rewards
CREATE TABLE social_achievements (
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
CREATE INDEX idx_family_plans_primary_holder ON family_plans(primary_account_holder);
CREATE INDEX idx_family_members_plan_user ON family_members(family_plan_id, user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referrer_status ON referrals(referrer_id, reward_status);
CREATE INDEX idx_challenge_participants_challenge_user ON challenge_participants(challenge_id, user_id);
CREATE INDEX idx_challenge_progress_participant_date ON challenge_progress(challenge_participant_id, progress_date);
CREATE INDEX idx_community_challenges_active ON community_challenges(is_active, start_date, end_date);
CREATE INDEX idx_user_recipes_public_featured ON user_recipes(is_public, featured_at);
CREATE INDEX idx_health_professionals_specialization ON health_professionals USING GIN(specializations);
CREATE INDEX idx_consultation_sessions_user_date ON consultation_sessions(user_id, session_date);
CREATE INDEX idx_social_achievements_user_type ON social_achievements(user_id, achievement_type);
```

## Modifications to Existing Tables

```sql
-- Enhance user profiles for social features
ALTER TABLE auth.users 
ADD COLUMN display_name VARCHAR(50),
ADD COLUMN privacy_level VARCHAR(20) DEFAULT 'friends_only', -- public, friends_only, private
ADD COLUMN social_sharing_enabled BOOLEAN DEFAULT true,
ADD COLUMN referral_credits_earned DECIMAL(10,2) DEFAULT 0.00;

-- Add social context to achievements
ALTER TABLE achievement_milestones
ADD COLUMN is_social_achievement BOOLEAN DEFAULT false,
ADD COLUMN shared_publicly BOOLEAN DEFAULT false,
ADD COLUMN social_context JSONB; -- Challenge info, referral info, etc.

-- Enhance notifications for social features
ALTER TABLE notification_preferences
ADD COLUMN social_notifications JSONB DEFAULT '{"challenges": true, "referrals": true, "family": true}';
```

## Views for Social Analytics

```sql
-- Family dashboard aggregated view
CREATE VIEW family_dashboard AS
SELECT 
  fp.id as family_plan_id,
  fp.family_name,
  COUNT(fm.user_id) as total_members,
  COUNT(CASE WHEN fm.is_active = true THEN 1 END) as active_members,
  AVG(CASE WHEN ni.consumption_date >= CURRENT_DATE - INTERVAL '7 days' 
           THEN ni.calories_consumed END) as avg_weekly_calories,
  SUM(fp.shared_wallet_balance) as wallet_balance,
  COUNT(DISTINCT cp.challenge_id) as active_challenges
FROM family_plans fp
LEFT JOIN family_members fm ON fp.id = fm.family_plan_id
LEFT JOIN nutritional_intake ni ON fm.user_id = ni.user_id
LEFT JOIN challenge_participants cp ON fm.user_id = cp.user_id 
  AND cp.completion_status = 'active'
WHERE fp.is_active = true
GROUP BY fp.id, fp.family_name, fp.shared_wallet_balance;

-- Challenge leaderboard view
CREATE VIEW challenge_leaderboards AS
SELECT 
  cc.id as challenge_id,
  cc.challenge_name,
  cp.user_id,
  u.display_name,
  cp.final_score,
  cp.rank_position,
  cp.completion_status,
  ROW_NUMBER() OVER (PARTITION BY cc.id ORDER BY cp.final_score DESC) as current_rank
FROM community_challenges cc
JOIN challenge_participants cp ON cc.id = cp.challenge_id
LEFT JOIN auth.users u ON cp.user_id = u.id
WHERE cp.is_visible = true
  AND cc.is_active = true;

-- Referral performance analytics
CREATE VIEW referral_analytics AS
SELECT 
  r.referrer_id,
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN r.signed_up_at IS NOT NULL THEN 1 END) as successful_signups,
  COUNT(CASE WHEN r.first_purchase_at IS NOT NULL THEN 1 END) as converted_purchases,
  SUM(r.reward_amount) as total_rewards_earned,
  AVG(EXTRACT(days FROM (r.first_purchase_at - r.signed_up_at))) as avg_conversion_days
FROM referrals r
WHERE r.invited_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY r.referrer_id;
```

## Rationale

The social schema design balances community engagement with privacy controls and family coordination needs. Family plans support multi-generational health management while maintaining individual privacy. The referral system includes fraud prevention and tiered rewards. Challenge architecture supports both system-generated and user-created competitions. Recipe sharing encourages community content creation. Health professional integration provides basic consultation capabilities without complex medical record management.