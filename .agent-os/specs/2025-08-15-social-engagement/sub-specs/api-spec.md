# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-15-social-engagement/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Endpoints

### POST /api/family-plans

**Purpose:** Create a new family plan with multiple members
**Parameters:** 
- `family_name`: string
- `plan_type`: string (optional, defaults to "standard")
- `max_members`: integer (optional, defaults to 6)
- `family_goals`: object (optional)
- `initial_members`: array of objects with email/role pairs

**Response:** 
```json
{
  "family_plan_id": "uuid",
  "family_name": "The Smith Family",
  "primary_account_holder": "uuid",
  "invitation_codes": [
    {"email": "mom@example.com", "code": "FMLY123", "role": "admin"},
    {"email": "dad@example.com", "code": "FMLY124", "role": "member"}
  ],
  "shared_wallet_balance": 0.00,
  "created_at": "timestamp"
}
```
**Errors:** 400 (validation), 401 (unauthorized), 402 (payment required), 500 (server error)

### POST /api/family-plans/:id/invite

**Purpose:** Invite new member to family plan
**Parameters:** 
- `email`: string
- `role`: string (member, child, guest)
- `relationship`: string (optional)
- `display_name`: string (optional)

**Response:** 
```json
{
  "invitation_id": "uuid",
  "invitation_code": "FMLY789",
  "invited_email": "child@example.com",
  "expires_at": "timestamp",
  "invitation_link": "https://app.dailynutrifit.com/join/FMLY789"
}
```
**Errors:** 400 (invalid email/role), 401 (unauthorized), 403 (not family admin), 409 (already member)

### GET /api/family-plans/:id/dashboard

**Purpose:** Get family plan overview and member progress
**Parameters:** 
- `include_private`: boolean (default false, admin only)
- `period`: string (week, month) default "week"

**Response:** 
```json
{
  "family_info": {
    "family_name": "The Smith Family",
    "total_members": 4,
    "active_members": 3,
    "shared_wallet_balance": 125.50
  },
  "family_progress": {
    "total_deliveries_this_week": 12,
    "avg_nutritional_score": 8.2,
    "active_challenges": 2,
    "recent_achievements": [...]
  },
  "member_summaries": [
    {
      "member_id": "uuid",
      "display_name": "Sarah",
      "relationship": "daughter",
      "weekly_score": 85,
      "current_streak": 5,
      "privacy_visible": true
    }
  ]
}
```
**Errors:** 401 (unauthorized), 403 (not family member), 404 (family not found)

### POST /api/referrals/generate

**Purpose:** Generate referral code for user
**Parameters:** 
- `referral_method`: string (code, link, qr_code)
- `custom_message`: string (optional)
- `campaign_source`: string (optional)

**Response:** 
```json
{
  "referral_code": "FRIEND2024",
  "referral_link": "https://app.dailynutrifit.com/ref/FRIEND2024",
  "qr_code_url": "https://api.qr-server.com/...",
  "share_message": "Join me on DailyNutriFit and get $10 off your first order!",
  "current_reward_tier": 2,
  "potential_reward": 15.00,
  "expires_at": "timestamp"
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### GET /api/referrals/status

**Purpose:** Get user's referral performance and rewards
**Parameters:** 
- `period`: string (month, quarter, all_time) default "all_time"

**Response:** 
```json
{
  "referral_stats": {
    "total_sent": 25,
    "total_signups": 8,
    "total_purchases": 5,
    "conversion_rate": 0.32,
    "total_rewards_earned": 75.00,
    "pending_rewards": 25.00
  },
  "recent_referrals": [
    {
      "referee_name": "Jane D.",
      "invited_at": "timestamp",
      "status": "purchased",
      "reward_earned": 15.00
    }
  ],
  "next_tier_milestone": {
    "referrals_needed": 2,
    "bonus_reward": 50.00,
    "tier_name": "Ambassador"
  }
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### POST /api/referrals/redeem/:code

**Purpose:** Redeem referral code during signup
**Parameters:** None (code in URL path)

**Response:** 
```json
{
  "referral_valid": true,
  "referrer_info": {
    "display_name": "Sarah K.",
    "success_story": "Lost 10 pounds with DailyNutriFit!"
  },
  "signup_bonus": {
    "discount_amount": 10.00,
    "bonus_credits": 5.00,
    "special_offer": "Free delivery for first week"
  },
  "referral_id": "uuid"
}
```
**Errors:** 400 (invalid code), 404 (code not found), 410 (code expired)

### GET /api/community-challenges

**Purpose:** Browse available community challenges
**Parameters:** 
- `challenge_type`: string (optional filter)
- `difficulty_level`: integer (optional filter)
- `status`: string (upcoming, active, completed) default "active"
- `featured_only`: boolean (default false)

**Response:** 
```json
{
  "challenges": [
    {
      "id": "uuid",
      "challenge_name": "7-Day Variety Challenge",
      "description": "Eat a different fruit each day for 7 days",
      "challenge_type": "variety",
      "difficulty_level": 2,
      "duration_days": 7,
      "current_participants": 156,
      "max_participants": 500,
      "start_date": "2025-08-20",
      "end_date": "2025-08-27",
      "reward_structure": {
        "completion_points": 100,
        "badges": ["variety_explorer"],
        "special_rewards": ["Free seasonal fruit box"]
      },
      "is_joined": false
    }
  ],
  "user_active_challenges": 2,
  "recommended_challenges": [...]
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### POST /api/community-challenges/:id/join

**Purpose:** Join a community challenge
**Parameters:** 
- `visibility`: string (public, friends_only, private) default "friends_only"
- `personal_goal`: string (optional personal motivation)

**Response:** 
```json
{
  "participant_id": "uuid",
  "challenge_name": "7-Day Variety Challenge",
  "joined_at": "timestamp",
  "personal_goal": "Want to try new fruits I've never had!",
  "starting_rank": 157,
  "initial_progress": {
    "days_completed": 0,
    "current_score": 0,
    "next_milestone": "Complete day 1"
  }
}
```
**Errors:** 400 (already joined), 401 (unauthorized), 403 (doesn't meet requirements), 409 (challenge full)

### POST /api/community-challenges/:id/progress

**Purpose:** Log progress for a challenge
**Parameters:** 
- `progress_data`: object (challenge-specific progress metrics)
- `notes`: string (optional user notes)
- `photo_url`: string (optional progress photo)

**Response:** 
```json
{
  "progress_entry_id": "uuid",
  "daily_score": 25,
  "cumulative_score": 175,
  "current_rank": 23,
  "rank_change": "+5",
  "milestone_achieved": {
    "name": "Halfway Hero",
    "points_bonus": 20,
    "badge_earned": "persistence_bronze"
  },
  "encouragement_message": "Great job! You're in the top 15%!"
}
```
**Errors:** 400 (invalid progress), 401 (unauthorized), 403 (not participant), 404 (challenge not found)

### GET /api/community-challenges/:id/leaderboard

**Purpose:** Get challenge leaderboard and rankings
**Parameters:** 
- `scope`: string (all, friends, family) default "all"
- `limit`: integer (default 50)
- `around_user`: boolean (default false, shows ranks around current user)

**Response:** 
```json
{
  "challenge_info": {
    "challenge_name": "7-Day Variety Challenge",
    "total_participants": 234,
    "days_remaining": 3
  },
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid",
      "display_name": "HealthyEater123",
      "score": 285,
      "days_completed": 6,
      "streak": 6,
      "badges_earned": ["variety_master", "consistency_pro"]
    }
  ],
  "user_position": {
    "rank": 23,
    "score": 175,
    "points_behind_leader": 110,
    "points_to_next_rank": 15
  }
}
```
**Errors:** 401 (unauthorized), 403 (private challenge), 404 (challenge not found)

### POST /api/user-recipes

**Purpose:** Submit new user-generated recipe
**Parameters:** 
- `recipe_name`: string
- `description`: string
- `ingredients`: array of objects with fruit names and quantities
- `instructions`: string
- `prep_time_minutes`: integer
- `servings`: integer
- `difficulty_level`: integer (1-5)
- `tags`: array of strings
- `image_file`: file upload (optional)

**Response:** 
```json
{
  "recipe_id": "uuid",
  "recipe_name": "Tropical Smoothie Bowl",
  "status": "pending_review",
  "estimated_review_time": "24 hours",
  "nutritional_info": {
    "calories": 285,
    "fiber": 8.5,
    "vitamin_c": 120
  },
  "image_url": "https://storage.supabase.co/...",
  "created_at": "timestamp"
}
```
**Errors:** 400 (validation errors), 401 (unauthorized), 413 (file too large), 500 (server error)

### GET /api/user-recipes

**Purpose:** Browse user-generated recipes
**Parameters:** 
- `category`: string (breakfast, snack, dessert) optional
- `difficulty`: integer (1-5) optional
- `ingredients`: array of fruit names (optional filter)
- `sort_by`: string (rating, recent, popular) default "rating"
- `featured_only`: boolean (default false)

**Response:** 
```json
{
  "recipes": [
    {
      "id": "uuid",
      "recipe_name": "Berry Parfait Supreme",
      "author_name": "HealthyChef23",
      "description": "Layered parfait with mixed berries and yogurt",
      "prep_time_minutes": 10,
      "difficulty_level": 2,
      "rating_average": 4.8,
      "total_reviews": 23,
      "image_url": "https://storage.supabase.co/...",
      "featured_at": "timestamp",
      "primary_fruits": ["strawberries", "blueberries", "raspberries"]
    }
  ],
  "total_count": 156,
  "featured_recipe": {...}
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### POST /api/user-recipes/:id/review

**Purpose:** Rate and review a recipe
**Parameters:** 
- `rating`: integer (1-5)
- `review_text`: string (optional)

**Response:** 
```json
{
  "review_id": "uuid",
  "recipe_id": "uuid",
  "rating": 5,
  "review_text": "Amazing recipe! My kids loved it.",
  "helpful_votes": 0,
  "created_at": "timestamp"
}
```
**Errors:** 400 (invalid rating), 401 (unauthorized), 409 (already reviewed), 500 (server error)

### GET /api/health-professionals

**Purpose:** Browse verified health professionals
**Parameters:** 
- `specialization`: string (optional filter)
- `available_now`: boolean (default false)
- `max_rate`: number (optional price filter)
- `languages`: array of strings (optional)
- `rating_min`: number (optional, 1-5)

**Response:** 
```json
{
  "professionals": [
    {
      "id": "uuid",
      "professional_name": "Dr. Sarah Johnson, RD",
      "credentials": ["RD", "PhD"],
      "specializations": ["diabetes", "heart_health"],
      "bio": "20 years experience in clinical nutrition...",
      "consultation_rate": 75.00,
      "rating_average": 4.9,
      "total_consultations": 247,
      "next_available": "2025-08-16T10:00:00Z",
      "languages": ["English", "Spanish"],
      "profile_image_url": "https://storage.supabase.co/..."
    }
  ],
  "total_count": 12,
  "average_rate": 68.50
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### POST /api/consultation-sessions

**Purpose:** Schedule consultation with health professional
**Parameters:** 
- `professional_id`: UUID
- `session_date`: ISO timestamp
- `duration_minutes`: integer (default 30)
- `session_type`: string (video, phone)
- `consultation_notes`: string (user's questions/goals)

**Response:** 
```json
{
  "session_id": "uuid",
  "professional_name": "Dr. Sarah Johnson, RD",
  "session_date": "2025-08-16T10:00:00Z",
  "duration_minutes": 30,
  "session_type": "video",
  "session_cost": 75.00,
  "payment_required": true,
  "calendar_link": "https://calendar.google.com/...",
  "preparation_instructions": "Please prepare your recent health goals and current diet questions."
}
```
**Errors:** 400 (invalid date/professional), 401 (unauthorized), 402 (insufficient funds), 409 (time conflict)

### GET /api/social-achievements

**Purpose:** Get user's social achievements and public celebrations
**Parameters:** 
- `achievement_type`: string (optional filter)
- `include_family`: boolean (default false)
- `public_only`: boolean (default false)

**Response:** 
```json
{
  "achievements": [
    {
      "id": "uuid",
      "achievement_type": "referral_milestone",
      "achievement_name": "Social Butterfly",
      "description": "Successfully referred 5 friends",
      "points_awarded": 250,
      "badge_awarded": "referral_bronze",
      "special_reward": {
        "credits": 25.00,
        "free_premium_month": true
      },
      "achieved_at": "timestamp",
      "is_public": true,
      "celebration_data": {
        "confetti_color": "gold",
        "message": "You're spreading the healthy love!"
      }
    }
  ],
  "total_social_points": 1250,
  "social_level": "Community Champion",
  "next_milestone": {
    "name": "Health Ambassador",
    "points_needed": 750,
    "estimated_completion": "2025-09-15"
  }
}
```
**Errors:** 401 (unauthorized), 500 (server error)

## Controllers

### FamilyPlanController
- `create()` - Create new family plan with member invitations
- `invite()` - Send family member invitations
- `getDashboard()` - Get family overview and member progress
- `updateSettings()` - Modify family plan settings and permissions

### ReferralController
- `generateCode()` - Create referral codes and links
- `getStatus()` - Get referral performance and rewards
- `redeemCode()` - Process referral code during signup
- `trackConversion()` - Record referral success and distribute rewards

### ChallengeController
- `listChallenges()` - Browse available challenges
- `joinChallenge()` - Join community challenge
- `logProgress()` - Record daily challenge progress
- `getLeaderboard()` - Get challenge rankings and standings

### RecipeController
- `submitRecipe()` - Add new user-generated recipe
- `browseRecipes()` - Search and filter community recipes
- `reviewRecipe()` - Rate and review recipes
- `moderateRecipe()` - Admin recipe approval and featuring

### HealthProfessionalController
- `listProfessionals()` - Browse verified health professionals
- `scheduleConsultation()` - Book consultation sessions
- `manageSession()` - Handle session logistics and follow-up
- `submitReview()` - Rate professional consultations

### SocialAchievementController
- `getUserAchievements()` - Get social achievements and milestones
- `celebrateAchievement()` - Trigger achievement celebrations
- `shareAchievement()` - Handle social sharing of accomplishments

## Purpose

The API design supports comprehensive social engagement while maintaining privacy controls and user safety. Family plan endpoints enable multi-generational health management. Referral systems drive user acquisition through incentivized sharing. Challenge participation creates community engagement and healthy competition. Recipe sharing builds user-generated content. Health professional integration provides expert guidance. Achievement systems gamify social interactions and drive continued engagement.