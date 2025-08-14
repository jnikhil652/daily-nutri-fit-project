# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-15-custom-plans-advanced/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Schema Changes

### New Tables

**custom_plans**
- User-created delivery plans with complete customization
- Supports complex scheduling patterns and fruit combinations

**nutritional_intake**
- Daily fruit consumption tracking
- Links to actual consumption vs. planned deliveries

**delivery_modifications**
- Track changes to scheduled deliveries
- Audit trail for delivery customizations

**notification_preferences**
- User-specific notification settings and scheduling
- Tracks notification effectiveness and user responses

**seasonal_availability**
- Fruit availability and quality data by season and region
- Supports intelligent seasonal recommendations

**nutrition_goals**
- Detailed nutritional targets beyond basic health goals
- Supports custom macro and micronutrient targets

**achievement_milestones**
- Gamification system for tracking nutrition achievements
- Progress rewards and milestone recognition

### Schema Specifications

```sql
-- Custom plans table
CREATE TABLE custom_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name VARCHAR(100) NOT NULL,
  description TEXT,
  plan_configuration JSONB NOT NULL, -- Complex plan structure with fruits, quantities, schedule
  nutritional_summary JSONB, -- Calculated nutritional values for the plan
  estimated_weekly_cost DECIMAL(10,2),
  is_active BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false, -- Can be saved as template for future use
  schedule_pattern JSONB, -- Complex scheduling patterns (daily, weekly, custom)
  delivery_preferences JSONB, -- Time slots, special instructions, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activated_at TIMESTAMP WITH TIME ZONE
);

-- Nutritional intake tracking
CREATE TABLE nutritional_intake (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consumption_date DATE NOT NULL,
  fruit_consumed VARCHAR(100) NOT NULL,
  quantity_consumed DECIMAL(5,2) NOT NULL, -- In units (pieces, grams, etc.)
  consumption_method VARCHAR(20) DEFAULT 'manual', -- manual, scanned, auto
  calories_consumed INTEGER,
  nutrients_consumed JSONB, -- Detailed nutrient breakdown
  delivery_id UUID, -- Link to delivery if from a delivery
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Delivery modifications tracking
CREATE TABLE delivery_modifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_schedule_id UUID REFERENCES delivery_schedules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  modification_type VARCHAR(50) NOT NULL, -- skip, modify, reschedule, cancel
  original_data JSONB, -- Original delivery configuration
  modified_data JSONB, -- New delivery configuration
  modification_reason VARCHAR(200),
  modification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_at TIMESTAMP WITH TIME ZONE,
  is_applied BOOLEAN DEFAULT false
);

-- Notification preferences and tracking
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- delivery_reminder, health_tip, achievement, etc.
  is_enabled BOOLEAN DEFAULT true,
  delivery_time TIME DEFAULT '09:00:00', -- Preferred notification time
  frequency VARCHAR(20) DEFAULT 'as_needed', -- daily, weekly, as_needed
  custom_settings JSONB, -- Type-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification history for effectiveness tracking
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  message_content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  action_taken VARCHAR(100), -- What action user took after notification
  effectiveness_score DECIMAL(3,2) -- Calculated effectiveness rating
);

-- Seasonal availability data
CREATE TABLE seasonal_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fruit_name VARCHAR(100) REFERENCES nutritional_database(fruit_name),
  season VARCHAR(20) NOT NULL, -- spring, summer, fall, winter
  region VARCHAR(50) DEFAULT 'global',
  availability_score INTEGER DEFAULT 5, -- 1-10 scale
  quality_score INTEGER DEFAULT 5, -- 1-10 scale
  price_modifier DECIMAL(4,2) DEFAULT 1.00, -- Multiplier for seasonal pricing
  peak_months INTEGER[], -- Array of month numbers (1-12)
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed nutrition goals
CREATE TABLE nutrition_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
  nutrient_targets JSONB NOT NULL, -- Detailed macro and micronutrient targets
  calorie_target INTEGER,
  protein_target DECIMAL(5,2),
  carbs_target DECIMAL(5,2),
  fiber_target DECIMAL(5,2),
  vitamin_targets JSONB, -- Specific vitamin targets
  mineral_targets JSONB, -- Specific mineral targets
  custom_targets JSONB, -- User-defined custom nutritional targets
  goal_start_date DATE DEFAULT CURRENT_DATE,
  goal_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievement and milestone tracking
CREATE TABLE achievement_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL, -- consistency, goal_reached, variety, etc.
  achievement_name VARCHAR(100) NOT NULL,
  description TEXT,
  criteria_met JSONB, -- Specific criteria that triggered the achievement
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0,
  badge_awarded VARCHAR(50),
  is_milestone BOOLEAN DEFAULT false, -- Major milestones vs regular achievements
  celebration_shown BOOLEAN DEFAULT false
);

-- Plan templates for reuse
CREATE TABLE plan_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  template_category VARCHAR(50), -- personal, seasonal, goal_based
  plan_configuration JSONB NOT NULL,
  nutritional_summary JSONB,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false, -- Allow sharing with other users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_custom_plans_user_active ON custom_plans(user_id, is_active);
CREATE INDEX idx_nutritional_intake_user_date ON nutritional_intake(user_id, consumption_date);
CREATE INDEX idx_delivery_modifications_schedule ON delivery_modifications(delivery_schedule_id);
CREATE INDEX idx_notification_history_user_type ON notification_history(user_id, notification_type);
CREATE INDEX idx_seasonal_availability_fruit_season ON seasonal_availability(fruit_name, season);
CREATE INDEX idx_nutrition_goals_user_active ON nutrition_goals(user_id, is_active);
CREATE INDEX idx_achievements_user_type ON achievement_milestones(user_id, achievement_type);
CREATE INDEX idx_plan_templates_category ON plan_templates(template_category, is_public);
```

## Modifications to Existing Tables

```sql
-- Add custom plan reference to delivery schedules
ALTER TABLE delivery_schedules 
ADD COLUMN custom_plan_id UUID REFERENCES custom_plans(id),
ADD COLUMN delivery_preferences JSONB, -- Time slots, special instructions
ADD COLUMN modification_count INTEGER DEFAULT 0;

-- Enhance user subscriptions for advanced features
ALTER TABLE user_subscriptions
ADD COLUMN notification_preferences JSONB,
ADD COLUMN delivery_time_slots TEXT[],
ADD COLUMN special_instructions TEXT,
ADD COLUMN modification_flexibility VARCHAR(20) DEFAULT 'standard'; -- standard, flexible, locked

-- Add tracking fields to recommendations
ALTER TABLE recommendations
ADD COLUMN seasonal_factor DECIMAL(3,2) DEFAULT 1.00,
ADD COLUMN variety_score INTEGER,
ADD COLUMN user_consumption_history JSONB;
```

## Views for Complex Queries

```sql
-- Comprehensive nutritional dashboard view
CREATE VIEW nutritional_dashboard AS
SELECT 
  u.id as user_id,
  ni.consumption_date,
  SUM(ni.calories_consumed) as daily_calories,
  SUM((ni.nutrients_consumed->>'fiber')::decimal) as daily_fiber,
  SUM((ni.nutrients_consumed->>'vitamin_c')::decimal) as daily_vitamin_c,
  COUNT(DISTINCT ni.fruit_consumed) as fruit_variety,
  ng.calorie_target,
  ng.fiber_target,
  (ng.nutrient_targets->>'vitamin_c')::decimal as vitamin_c_target
FROM auth.users u
LEFT JOIN nutritional_intake ni ON u.id = ni.user_id
LEFT JOIN nutrition_goals ng ON u.id = ng.user_id AND ng.is_active = true
WHERE ni.consumption_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, ni.consumption_date, ng.calorie_target, ng.fiber_target, ng.nutrient_targets;

-- Plan performance analytics
CREATE VIEW plan_performance AS
SELECT 
  cp.id as custom_plan_id,
  cp.plan_name,
  cp.user_id,
  COUNT(ds.id) as total_deliveries,
  COUNT(CASE WHEN ds.delivery_status = 'delivered' THEN 1 END) as successful_deliveries,
  COUNT(dm.id) as total_modifications,
  AVG(cp.estimated_weekly_cost) as avg_weekly_cost,
  cp.created_at,
  cp.last_activated_at
FROM custom_plans cp
LEFT JOIN delivery_schedules ds ON cp.id = ds.custom_plan_id
LEFT JOIN delivery_modifications dm ON ds.id = dm.delivery_schedule_id
GROUP BY cp.id, cp.plan_name, cp.user_id, cp.estimated_weekly_cost, cp.created_at, cp.last_activated_at;
```

## Rationale

The schema extension supports advanced customization while maintaining performance through strategic indexing. The custom_plans table uses JSONB for flexible plan configurations while maintaining relational integrity. Nutritional tracking provides granular consumption data for comprehensive analytics. The notification system includes effectiveness tracking for optimization. Achievement systems gamify the experience to improve user engagement and retention.