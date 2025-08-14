# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-15-health-personalization/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Schema Changes

### New Tables

**health_profiles**
- Stores user health information and goals
- Links to users table via user_id
- Supports multiple health conditions and preferences

**health_conditions**
- Reference table for health conditions (diabetes, hypertension, etc.)
- Includes nutritional guidelines and restrictions

**subscription_plans**
- Pre-built health-focused subscription templates
- Includes nutritional targets and default configurations

**user_subscriptions**
- Active user subscriptions with customization
- Links users to subscription plans with modifications

**delivery_schedules**
- Recurring delivery configuration
- Handles pause/resume and skip functionality

**nutritional_database**
- Comprehensive fruit nutritional information
- Includes vitamins, minerals, calories, and health benefits

**recommendations**
- AI-generated fruit recommendations for users
- Includes reasoning and nutritional explanations

### Schema Specifications

```sql
-- Health profiles table
CREATE TABLE health_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  age INTEGER,
  gender VARCHAR(10),
  activity_level VARCHAR(20), -- sedentary, light, moderate, active, very_active
  health_goals TEXT[], -- weight_loss, muscle_gain, heart_health, energy, immunity
  health_conditions UUID[], -- References to health_conditions table
  dietary_restrictions TEXT[], -- vegetarian, vegan, gluten_free, etc.
  allergies TEXT[],
  preferred_fruits TEXT[],
  disliked_fruits TEXT[],
  daily_calorie_target INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health conditions reference table
CREATE TABLE health_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  nutritional_guidelines JSONB, -- Specific nutritional requirements
  recommended_nutrients TEXT[], -- potassium, fiber, vitamin_c, etc.
  restricted_nutrients TEXT[], -- sodium, sugar, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  health_focus VARCHAR(50), -- heart_health, weight_loss, athletic_performance
  nutritional_targets JSONB, -- Daily targets for various nutrients
  default_fruits JSONB, -- Default fruit selections and quantities
  price_per_week DECIMAL(10,2),
  delivery_frequency VARCHAR(20) DEFAULT 'daily', -- daily, every_other_day, weekly
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  customizations JSONB, -- User modifications to plan
  delivery_frequency VARCHAR(20),
  delivery_time_preference VARCHAR(20), -- morning, afternoon, evening
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  pause_start_date DATE,
  pause_end_date DATE,
  next_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery schedules
CREATE TABLE delivery_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  delivery_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, skipped, delivered, cancelled
  fruits_delivered JSONB, -- Actual fruits delivered
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutritional database
CREATE TABLE nutritional_database (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fruit_name VARCHAR(100) UNIQUE NOT NULL,
  calories_per_100g INTEGER,
  carbs_per_100g DECIMAL(5,2),
  fiber_per_100g DECIMAL(5,2),
  sugar_per_100g DECIMAL(5,2),
  protein_per_100g DECIMAL(5,2),
  fat_per_100g DECIMAL(5,2),
  vitamin_c_mg DECIMAL(8,2),
  potassium_mg DECIMAL(8,2),
  folate_mcg DECIMAL(8,2),
  antioxidant_score INTEGER,
  health_benefits TEXT[],
  season_available TEXT[], -- spring, summer, fall, winter
  storage_days INTEGER, -- Days fruit stays fresh
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_fruits JSONB, -- Array of fruits with quantities and reasons
  recommendation_date DATE DEFAULT CURRENT_DATE,
  algorithm_version VARCHAR(20),
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  reasoning TEXT, -- Explanation of recommendation
  user_feedback INTEGER, -- 1-5 rating from user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_health_profiles_user_id ON health_profiles(user_id);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(user_id, is_active);
CREATE INDEX idx_delivery_schedules_date ON delivery_schedules(scheduled_date);
CREATE INDEX idx_recommendations_user_date ON recommendations(user_id, recommendation_date);
CREATE INDEX idx_nutritional_database_name ON nutritional_database(fruit_name);
```

## Migrations

### Initial Data Population

**Health Conditions Reference Data**
```sql
INSERT INTO health_conditions (name, description, nutritional_guidelines, recommended_nutrients, restricted_nutrients) VALUES
('Diabetes Type 2', 'Blood sugar management', '{"max_sugar_per_day": 25, "fiber_target": 25}', ARRAY['fiber', 'chromium'], ARRAY['sugar', 'simple_carbs']),
('Hypertension', 'High blood pressure management', '{"max_sodium_per_day": 2300, "potassium_target": 3500}', ARRAY['potassium', 'magnesium'], ARRAY['sodium']),
('Heart Disease', 'Cardiovascular health support', '{"omega3_target": 1000, "fiber_target": 30}', ARRAY['omega3', 'fiber', 'antioxidants'], ARRAY['saturated_fat', 'trans_fat']);
```

**Subscription Plans Reference Data**
```sql
INSERT INTO subscription_plans (name, description, health_focus, nutritional_targets, default_fruits, price_per_week) VALUES
('Heart Healthy', 'Fruits rich in potassium and antioxidants', 'heart_health', 
  '{"potassium": 3500, "fiber": 25, "antioxidants": "high"}',
  '{"apples": 3, "bananas": 4, "berries": 2}', 29.99),
('Weight Management', 'Low calorie, high fiber fruits', 'weight_loss',
  '{"calories": 150, "fiber": 20, "sugar": 20}',
  '{"grapefruits": 2, "apples": 3, "berries": 3}', 24.99);
```

## Rationale

The schema design supports complex health personalization while maintaining performance and flexibility. Health profiles use arrays and JSONB for flexible data storage, while maintaining referential integrity. The nutritional database provides comprehensive fruit information for accurate recommendations. Subscription and delivery tables support flexible scheduling with pause/resume functionality essential for user retention.