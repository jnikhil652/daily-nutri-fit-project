# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-15-health-personalization/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Endpoints

### POST /api/health-profile

**Purpose:** Create or update user health profile
**Parameters:** 
- `age`: integer
- `gender`: string
- `activity_level`: string
- `health_goals`: array of strings
- `health_conditions`: array of UUIDs
- `dietary_restrictions`: array of strings
- `allergies`: array of strings
- `preferred_fruits`: array of strings
- `disliked_fruits`: array of strings
- `daily_calorie_target`: integer

**Response:** 
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```
**Errors:** 400 (validation errors), 401 (unauthorized), 500 (server error)

### GET /api/health-profile

**Purpose:** Retrieve user's current health profile
**Parameters:** None (user ID from auth token)
**Response:** 
```json
{
  "id": "uuid",
  "age": 32,
  "gender": "female",
  "activity_level": "moderate",
  "health_goals": ["weight_loss", "energy"],
  "health_conditions": [{"id": "uuid", "name": "diabetes_type_2"}],
  "dietary_restrictions": ["vegetarian"],
  "allergies": [],
  "preferred_fruits": ["apples", "berries"],
  "disliked_fruits": ["grapefruit"],
  "daily_calorie_target": 1800
}
```
**Errors:** 401 (unauthorized), 404 (no profile found)

### GET /api/health-conditions

**Purpose:** Get list of available health conditions for profile setup
**Parameters:** None
**Response:** 
```json
{
  "conditions": [
    {
      "id": "uuid",
      "name": "diabetes_type_2",
      "description": "Blood sugar management",
      "recommended_nutrients": ["fiber", "chromium"],
      "restricted_nutrients": ["sugar"]
    }
  ]
}
```
**Errors:** 500 (server error)

### POST /api/recommendations/generate

**Purpose:** Generate personalized fruit recommendations for user
**Parameters:** 
- `date`: string (optional, defaults to today)
- `delivery_type`: string (daily, weekly, custom)

**Response:** 
```json
{
  "id": "uuid",
  "recommended_fruits": [
    {
      "fruit_name": "apple",
      "quantity": 2,
      "reason": "High fiber content supports your weight loss goal",
      "nutritional_highlights": ["fiber", "vitamin_c"],
      "calories_total": 160
    }
  ],
  "total_calories": 320,
  "confidence_score": 0.85,
  "reasoning": "Based on your weight loss goals and moderate activity level...",
  "recommendation_date": "2025-08-15"
}
```
**Errors:** 400 (missing health profile), 401 (unauthorized), 500 (server error)

### GET /api/recommendations/history

**Purpose:** Retrieve user's recommendation history
**Parameters:** 
- `limit`: integer (default 30)
- `offset`: integer (default 0)
- `start_date`: string (optional)
- `end_date`: string (optional)

**Response:** 
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "recommendation_date": "2025-08-15",
      "recommended_fruits": [...],
      "user_feedback": 4,
      "confidence_score": 0.85
    }
  ],
  "total_count": 45,
  "has_more": true
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### GET /api/subscription-plans

**Purpose:** Get available subscription plans
**Parameters:** 
- `health_focus`: string (optional filter)

**Response:** 
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Heart Healthy",
      "description": "Fruits rich in potassium and antioxidants",
      "health_focus": "heart_health",
      "price_per_week": 29.99,
      "delivery_frequency": "daily",
      "nutritional_targets": {
        "potassium": 3500,
        "fiber": 25
      },
      "sample_fruits": ["apples", "bananas", "berries"]
    }
  ]
}
```
**Errors:** 500 (server error)

### POST /api/user-subscriptions

**Purpose:** Subscribe user to a plan with customizations
**Parameters:** 
- `subscription_plan_id`: UUID
- `customizations`: object (optional)
- `delivery_frequency`: string (optional)
- `delivery_time_preference`: string
- `start_date`: string (optional, defaults to tomorrow)

**Response:** 
```json
{
  "id": "uuid",
  "subscription_plan_id": "uuid",
  "delivery_frequency": "daily",
  "next_delivery_date": "2025-08-16",
  "is_active": true
}
```
**Errors:** 400 (invalid plan), 401 (unauthorized), 402 (insufficient wallet balance), 500 (server error)

### PUT /api/user-subscriptions/:id

**Purpose:** Update existing subscription
**Parameters:** 
- `customizations`: object (optional)
- `delivery_frequency`: string (optional)
- `delivery_time_preference`: string (optional)
- `is_paused`: boolean (optional)
- `pause_start_date`: string (optional)
- `pause_end_date`: string (optional)

**Response:** 
```json
{
  "id": "uuid",
  "updated_at": "timestamp",
  "next_delivery_date": "2025-08-20"
}
```
**Errors:** 400 (validation errors), 401 (unauthorized), 404 (subscription not found)

### GET /api/user-subscriptions

**Purpose:** Get user's active subscriptions
**Parameters:** 
- `include_inactive`: boolean (default false)

**Response:** 
```json
{
  "subscriptions": [
    {
      "id": "uuid",
      "plan_name": "Heart Healthy",
      "delivery_frequency": "daily",
      "is_active": true,
      "is_paused": false,
      "next_delivery_date": "2025-08-16",
      "customizations": {...}
    }
  ]
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### GET /api/nutritional-database

**Purpose:** Get nutritional information for fruits
**Parameters:** 
- `fruits`: array of fruit names (optional, returns all if empty)
- `include_seasonal`: boolean (default false)

**Response:** 
```json
{
  "fruits": [
    {
      "fruit_name": "apple",
      "calories_per_100g": 52,
      "fiber_per_100g": 2.4,
      "vitamin_c_mg": 4.6,
      "health_benefits": ["supports heart health", "aids digestion"],
      "season_available": ["fall", "winter"],
      "storage_days": 30
    }
  ]
}
```
**Errors:** 500 (server error)

### POST /api/recommendations/:id/feedback

**Purpose:** Submit user feedback on recommendations
**Parameters:** 
- `rating`: integer (1-5)
- `feedback_notes`: string (optional)

**Response:** 
```json
{
  "id": "uuid",
  "user_feedback": 4,
  "updated_at": "timestamp"
}
```
**Errors:** 400 (invalid rating), 401 (unauthorized), 404 (recommendation not found)

## Controllers

### HealthProfileController
- `create()` - Create new health profile
- `update()` - Update existing health profile  
- `show()` - Get current user's profile
- `getHealthConditions()` - List available conditions

### RecommendationController
- `generate()` - Generate personalized recommendations
- `history()` - Get recommendation history
- `submitFeedback()` - Process user feedback

### SubscriptionController
- `listPlans()` - Get available subscription plans
- `subscribe()` - Create new subscription
- `updateSubscription()` - Modify existing subscription
- `getUserSubscriptions()` - Get user's subscriptions

### NutritionalController
- `getFruitData()` - Get nutritional database information

## Purpose

The API design supports comprehensive health personalization with clear separation of concerns. Health profiling endpoints enable detailed user assessment, while recommendation endpoints provide AI-powered suggestions. Subscription management allows flexible plan customization and scheduling. All endpoints include proper error handling and authentication checks for security.