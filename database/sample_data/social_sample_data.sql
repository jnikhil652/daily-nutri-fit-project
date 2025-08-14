-- Sample Data for Social Features Testing
-- Provides realistic test data for development and testing of social features

-- Sample family plans
INSERT INTO family_plans (
  family_name,
  primary_account_holder,
  max_members,
  plan_type,
  shared_wallet_balance,
  family_goals,
  coordination_preferences
) VALUES 
(
  'The Johnson Family',
  '550e8400-e29b-41d4-a716-446655440001',
  6,
  'premium',
  150.00,
  '{"primary_goal": "family_wellness", "target_servings_per_day": 5, "focus_areas": ["heart_health", "immunity"]}',
  '{"delivery_schedule": "weekly", "preferred_time": "morning", "coordination_method": "family_chat"}'
),
(
  'The Smith Household',
  '550e8400-e29b-41d4-a716-446655440002',
  4,
  'standard',
  75.50,
  '{"primary_goal": "weight_management", "target_servings_per_day": 4, "focus_areas": ["low_calorie", "high_fiber"]}',
  '{"delivery_schedule": "bi_weekly", "preferred_time": "afternoon", "coordination_method": "app_notifications"}'
)
ON CONFLICT DO NOTHING;

-- Sample family members (Note: These reference hypothetical user IDs)
-- In real implementation, these would reference actual auth.users IDs
INSERT INTO family_members (
  family_plan_id,
  user_id,
  role,
  display_name,
  relationship,
  permissions,
  privacy_settings
) 
SELECT 
  fp.id,
  '550e8400-e29b-41d4-a716-446655440001',
  'admin',
  'Dad',
  'parent',
  '{"can_manage_billing": true, "can_add_members": true, "can_modify_goals": true}',
  '{"share_progress": true, "visible_to_family": true, "share_achievements": true}'
FROM family_plans fp 
WHERE fp.family_name = 'The Johnson Family'
ON CONFLICT DO NOTHING;

-- Sample referral codes
INSERT INTO referrals (
  referrer_id,
  referral_code,
  referral_method,
  referral_source,
  reward_amount,
  bonus_tier,
  metadata
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'FRUIT2025A1',
  'link',
  'app_share',
  25.00,
  1,
  '{"campaign": "new_user_2025", "source_feature": "profile_share"}'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'HEALTHY2025B',
  'code',
  'sms',
  25.00,
  1,
  '{"campaign": "new_user_2025", "source_feature": "manual_share"}'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'FRUITLOVER25',
  'qr_code',
  'social',
  30.00,
  2,
  '{"campaign": "referral_bonus", "source_feature": "qr_generator", "tier_bonus": 5.00}'
)
ON CONFLICT (referral_code) DO NOTHING;

-- Sample community challenges (additional to migration ones)
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
  is_public,
  featured_priority
) VALUES 
(
  'Weekend Warrior',
  'Make healthy choices every weekend for a month. Perfect for busy weekday schedules.',
  'goal_based',
  2,
  30,
  250,
  '{"min_deliveries": 2, "weekend_focus": true}',
  '{"weekend_fruits": 8, "consistency_weekends": 4}',
  '{"completion_points": 150, "badges": ["weekend_warrior"], "credits": 12.00}',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '37 days',
  true,
  5
),
(
  'Berry Bonanza',
  'Focus on antioxidant-rich berries for 21 days to boost your immune system.',
  'seasonal',
  3,
  21,
  150,
  '{"min_deliveries": 3, "account_age_days": 30}',
  '{"berry_varieties": 10, "antioxidant_target": 500}',
  '{"completion_points": 400, "badges": ["berry_master"], "credits": 35.00, "bonus_items": ["organic_blueberries"]}',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '35 days',
  true,
  9
),
(
  'Tropical Adventure',
  'Explore exotic tropical fruits and expand your palate with international flavors.',
  'variety',
  4,
  45,
  100,
  '{"min_deliveries": 5, "account_age_days": 60, "premium_access": true}',
  '{"tropical_fruits": 25, "new_discoveries": 15, "cultural_exploration": 5}',
  '{"completion_points": 600, "badges": ["tropical_explorer", "culture_connector"], "credits": 50.00, "bonus_items": ["dragon_fruit", "passion_fruit"]}',
  CURRENT_DATE + INTERVAL '21 days',
  CURRENT_DATE + INTERVAL '66 days',
  true,
  12
)
ON CONFLICT DO NOTHING;

-- Sample challenge participants
INSERT INTO challenge_participants (
  challenge_id,
  user_id,
  completion_status,
  final_score,
  rank_position,
  rewards_earned,
  is_visible
)
SELECT 
  cc.id,
  '550e8400-e29b-41d4-a716-446655440001',
  'active',
  85,
  0, -- Will be calculated
  '{}',
  true
FROM community_challenges cc 
WHERE cc.challenge_name = 'January Variety Challenge'
UNION ALL
SELECT 
  cc.id,
  '550e8400-e29b-41d4-a716-446655440002',
  'completed',
  200,
  1,
  '{"points": 200, "badges": ["consistency_champion"], "credits": 15.00}',
  true
FROM community_challenges cc 
WHERE cc.challenge_name = 'Consistency Champion'
ON CONFLICT DO NOTHING;

-- Sample challenge progress
INSERT INTO challenge_progress (
  challenge_participant_id,
  progress_date,
  progress_data,
  daily_score,
  cumulative_score,
  notes,
  auto_generated
)
SELECT 
  cp.id,
  CURRENT_DATE - INTERVAL '3 days',
  '{"fruits_consumed": ["apple", "banana", "orange"], "variety_count": 3, "new_fruit": "kiwi", "goals_met": true}',
  15,
  45,
  'Tried kiwi for the first time - loved it!',
  false
FROM challenge_participants cp
JOIN community_challenges cc ON cp.challenge_id = cc.id
WHERE cc.challenge_name = 'January Variety Challenge'
AND cp.user_id = '550e8400-e29b-41d4-a716-446655440001'
UNION ALL
SELECT 
  cp.id,
  CURRENT_DATE - INTERVAL '2 days',
  '{"fruits_consumed": ["strawberries", "blueberries"], "variety_count": 2, "antioxidants": "high", "goals_met": true}',
  12,
  57,
  'Great berry day!',
  false
FROM challenge_participants cp
JOIN community_challenges cc ON cp.challenge_id = cc.id
WHERE cc.challenge_name = 'January Variety Challenge'
AND cp.user_id = '550e8400-e29b-41d4-a716-446655440001'
ON CONFLICT DO NOTHING;

-- Sample user recipes
INSERT INTO user_recipes (
  user_id,
  recipe_name,
  description,
  ingredients,
  instructions,
  prep_time_minutes,
  servings,
  difficulty_level,
  nutritional_info,
  tags,
  image_url,
  is_public
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Morning Energy Smoothie Bowl',
  'A vibrant smoothie bowl packed with tropical fruits and superfoods to start your day right.',
  '[
    {"name": "mango", "quantity": "1 cup", "type": "fruit", "frozen": true},
    {"name": "pineapple", "quantity": "0.5 cup", "type": "fruit", "frozen": true},
    {"name": "banana", "quantity": "1 medium", "type": "fruit"},
    {"name": "coconut milk", "quantity": "0.25 cup", "type": "liquid"},
    {"name": "chia seeds", "quantity": "1 tbsp", "type": "superfood"},
    {"name": "honey", "quantity": "1 tsp", "type": "sweetener", "optional": true}
  ]',
  'Blend frozen mango, pineapple, and banana with coconut milk until smooth and thick. Pour into bowl. Top with chia seeds, fresh fruit slices, and a drizzle of honey if desired.',
  8,
  1,
  2,
  '{"calories": 285, "protein": 4, "carbs": 52, "fiber": 8, "vitamin_c": 120, "antioxidants": "high"}',
  ARRAY['tropical', 'breakfast', 'smoothie', 'healthy', 'energizing', 'vegan_friendly'],
  'https://example.com/smoothie-bowl.jpg',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Antioxidant Berry Parfait',
  'Layered parfait with mixed berries, Greek yogurt, and granola for a protein-rich snack.',
  '[
    {"name": "mixed_berries", "quantity": "1 cup", "type": "fruit", "varieties": ["blueberry", "raspberry", "strawberry"]},
    {"name": "greek_yogurt", "quantity": "0.75 cup", "type": "dairy", "protein": "high"},
    {"name": "granola", "quantity": "0.25 cup", "type": "cereal"},
    {"name": "maple_syrup", "quantity": "1 tsp", "type": "sweetener", "optional": true}
  ]',
  'Layer Greek yogurt, mixed berries, and granola in a glass or bowl. Repeat layers. Drizzle with maple syrup if desired. Serve immediately.',
  5,
  1,
  1,
  '{"calories": 320, "protein": 18, "carbs": 45, "fiber": 8, "vitamin_c": 85, "antioxidants": "very_high"}',
  ARRAY['berries', 'snack', 'protein', 'antioxidants', 'quick', 'healthy'],
  'https://example.com/berry-parfait.jpg',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Green Apple Detox Water',
  'Refreshing infused water with green apple, cucumber, and mint for hydration and gentle detox.',
  '[
    {"name": "green_apple", "quantity": "1 medium", "type": "fruit", "sliced": true},
    {"name": "cucumber", "quantity": "0.5 medium", "type": "vegetable", "sliced": true},
    {"name": "fresh_mint", "quantity": "6 leaves", "type": "herb"},
    {"name": "water", "quantity": "32 oz", "type": "liquid", "temperature": "cold"},
    {"name": "ice", "quantity": "1 cup", "type": "cooling", "optional": true}
  ]',
  'Slice apple and cucumber thinly. Add to large pitcher with mint leaves. Pour cold water over ingredients. Refrigerate for 2-4 hours for best flavor. Serve over ice.',
  5,
  4,
  1,
  '{"calories": 25, "carbs": 6, "fiber": 1, "vitamin_c": 15, "hydration": "excellent", "detox": "gentle"}',
  ARRAY['detox', 'hydration', 'refreshing', 'low_calorie', 'green', 'mint'],
  'https://example.com/detox-water.jpg',
  true
)
ON CONFLICT DO NOTHING;

-- Sample recipe reviews
INSERT INTO recipe_reviews (
  recipe_id,
  reviewer_id,
  rating,
  review_text,
  helpful_votes
)
SELECT 
  ur.id,
  '550e8400-e29b-41d4-a716-446655440002',
  5,
  'This smoothie bowl is absolutely delicious! The mango and pineapple combination is perfect, and it keeps me full until lunch. Definitely adding this to my morning routine.',
  8
FROM user_recipes ur 
WHERE ur.recipe_name = 'Morning Energy Smoothie Bowl'
UNION ALL
SELECT 
  ur.id,
  '550e8400-e29b-41d4-a716-446655440001',
  4,
  'Love this parfait! The berries are so fresh and the Greek yogurt adds great protein. Sometimes I add a drizzle of honey for extra sweetness.',
  5
FROM user_recipes ur 
WHERE ur.recipe_name = 'Antioxidant Berry Parfait'
UNION ALL
SELECT 
  ur.id,
  '550e8400-e29b-41d4-a716-446655440002',
  5,
  'Such a refreshing drink! I make a big pitcher on Sunday and sip it throughout the week. The mint makes it so refreshing.',
  12
FROM user_recipes ur 
WHERE ur.recipe_name = 'Green Apple Detox Water'
ON CONFLICT DO NOTHING;

-- Sample social achievements
INSERT INTO social_achievements (
  user_id,
  achievement_type,
  achievement_name,
  description,
  related_entity_type,
  points_awarded,
  badge_awarded,
  special_reward,
  is_public
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'recipe_featured',
  'Community Recipe Star',
  'Your Morning Energy Smoothie Bowl recipe was featured in the community spotlight!',
  'recipe',
  100,
  'recipe_star',
  '{"credits": 15.00, "featured_duration": "7_days", "social_boost": true}',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'challenge_winner',
  'Consistency Champion',
  'Completed the 14-day Consistency Champion challenge with perfect attendance!',
  'challenge',
  200,
  'consistency_master',
  '{"credits": 15.00, "next_challenge_discount": 0.20}',
  true
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'referral_milestone',
  'Friend Connector',
  'Successfully referred 3 friends who each completed their first month!',
  'referral',
  150,
  'friend_connector',
  '{"credits": 25.00, "referral_bonus_multiplier": 1.2}',
  true
)
ON CONFLICT DO NOTHING;

-- Add some sample consultation sessions (future-dated)
INSERT INTO consultation_sessions (
  user_id,
  professional_id,
  session_date,
  duration_minutes,
  session_type,
  session_status,
  session_cost,
  payment_status
)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  hp.id,
  CURRENT_TIMESTAMP + INTERVAL '5 days' + INTERVAL '10 hours',
  30,
  'video',
  'scheduled',
  75.00,
  'pending'
FROM health_professionals hp 
WHERE hp.professional_name = 'Dr. Sarah Johnson, RD'
UNION ALL
SELECT 
  '550e8400-e29b-41d4-a716-446655440002',
  hp.id,
  CURRENT_TIMESTAMP + INTERVAL '10 days' + INTERVAL '14 hours',
  45,
  'video',
  'scheduled',
  85.00,
  'pending'
FROM health_professionals hp 
WHERE hp.professional_name = 'Marcus Chen, MS, RD'
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sample social data inserted successfully!';
  RAISE NOTICE 'Added: Family plans, challenges, recipes, reviews, achievements, and consultations';
  RAISE NOTICE 'Ready for social features testing and development';
END $$;