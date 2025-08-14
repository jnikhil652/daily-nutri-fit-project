# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-15-custom-plans-advanced/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Endpoints

### POST /api/custom-plans

**Purpose:** Create a new custom delivery plan
**Parameters:** 
- `plan_name`: string
- `description`: string (optional)
- `plan_configuration`: object with fruits, quantities, and schedule
- `delivery_preferences`: object with time slots and instructions

**Response:** 
```json
{
  "id": "uuid",
  "plan_name": "My Custom Plan",
  "nutritional_summary": {
    "daily_calories": 350,
    "daily_fiber": 12.5,
    "vitamin_c": 85
  },
  "estimated_weekly_cost": 42.50,
  "created_at": "timestamp"
}
```
**Errors:** 400 (validation errors), 401 (unauthorized), 402 (insufficient balance), 500 (server error)

### GET /api/custom-plans

**Purpose:** Retrieve user's custom plans
**Parameters:** 
- `include_inactive`: boolean (default false)
- `include_templates`: boolean (default false)

**Response:** 
```json
{
  "plans": [
    {
      "id": "uuid",
      "plan_name": "Weekly Variety Plan",
      "description": "Diverse fruits for optimal nutrition",
      "nutritional_summary": {...},
      "estimated_weekly_cost": 35.00,
      "is_active": true,
      "last_activated_at": "timestamp"
    }
  ]
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### PUT /api/custom-plans/:id

**Purpose:** Update existing custom plan
**Parameters:** 
- `plan_configuration`: object (optional)
- `delivery_preferences`: object (optional)
- `is_active`: boolean (optional)

**Response:** 
```json
{
  "id": "uuid",
  "updated_at": "timestamp",
  "nutritional_summary": {...},
  "estimated_weekly_cost": 38.75
}
```
**Errors:** 400 (validation), 401 (unauthorized), 404 (not found), 500 (server error)

### POST /api/custom-plans/:id/activate

**Purpose:** Activate a custom plan for delivery
**Parameters:** 
- `start_date`: string (optional, defaults to tomorrow)
- `replace_existing`: boolean (default false)

**Response:** 
```json
{
  "id": "uuid",
  "activated_at": "timestamp",
  "next_delivery_date": "2025-08-16",
  "delivery_schedule_created": true
}
```
**Errors:** 400 (conflicts), 401 (unauthorized), 402 (insufficient balance), 404 (not found)

### POST /api/custom-plans/validate

**Purpose:** Validate plan configuration before saving
**Parameters:** 
- `plan_configuration`: object
- `health_profile_check`: boolean (default true)

**Response:** 
```json
{
  "is_valid": true,
  "validation_results": {
    "nutritional_adequacy": "good",
    "cost_estimate": 35.50,
    "health_alignment": "excellent",
    "seasonal_availability": "good"
  },
  "warnings": [],
  "suggestions": ["Consider adding berries for more antioxidants"]
}
```
**Errors:** 400 (invalid configuration), 401 (unauthorized)

### POST /api/nutritional-intake

**Purpose:** Log fruit consumption
**Parameters:** 
- `fruit_consumed`: string
- `quantity_consumed`: number
- `consumption_date`: string (optional, defaults to today)
- `consumption_method`: string (manual, scanned, auto)
- `notes`: string (optional)

**Response:** 
```json
{
  "id": "uuid",
  "calories_consumed": 95,
  "nutrients_consumed": {
    "fiber": 4.0,
    "vitamin_c": 58.8,
    "potassium": 422
  },
  "logged_at": "timestamp"
}
```
**Errors:** 400 (validation), 401 (unauthorized), 500 (server error)

### GET /api/nutritional-intake/dashboard

**Purpose:** Get comprehensive nutritional tracking dashboard
**Parameters:** 
- `period`: string (day, week, month) default "week"
- `start_date`: string (optional)
- `end_date`: string (optional)

**Response:** 
```json
{
  "period_summary": {
    "total_calories": 2450,
    "total_fiber": 95.5,
    "total_vitamin_c": 650,
    "fruit_variety": 8,
    "goal_achievement": {
      "calories": 0.85,
      "fiber": 1.12,
      "vitamin_c": 1.25
    }
  },
  "daily_breakdown": [
    {
      "date": "2025-08-15",
      "calories": 350,
      "fiber": 12.5,
      "fruits_consumed": ["apple", "banana", "berries"]
    }
  ],
  "trends": {
    "calorie_trend": "increasing",
    "variety_trend": "stable",
    "consistency_score": 0.78
  }
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### GET /api/nutritional-intake/progress

**Purpose:** Get detailed progress toward nutritional goals
**Parameters:** 
- `goal_period`: string (daily, weekly, monthly)
- `include_projections`: boolean (default true)

**Response:** 
```json
{
  "current_progress": {
    "calories": {"current": 1250, "target": 1800, "percentage": 0.69},
    "fiber": {"current": 25.5, "target": 25, "percentage": 1.02},
    "vitamin_c": {"current": 120, "target": 90, "percentage": 1.33}
  },
  "projections": {
    "likely_to_meet_goals": ["fiber", "vitamin_c"],
    "needs_attention": ["calories"],
    "recommendations": ["Add 1-2 more fruits to meet calorie goals"]
  },
  "achievements": [
    {
      "type": "fiber_goal_exceeded",
      "achieved_at": "2025-08-15",
      "points_awarded": 10
    }
  ]
}
```
**Errors:** 401 (unauthorized), 404 (no goals set), 500 (server error)

### GET /api/delivery-schedules/:id/modifications

**Purpose:** Get modification history for a delivery
**Parameters:** 
- `include_pending`: boolean (default true)

**Response:** 
```json
{
  "modifications": [
    {
      "id": "uuid",
      "modification_type": "skip",
      "modification_reason": "Traveling",
      "modification_date": "timestamp",
      "is_applied": true,
      "applied_at": "timestamp"
    }
  ]
}
```
**Errors:** 401 (unauthorized), 404 (delivery not found)

### POST /api/delivery-schedules/:id/modify

**Purpose:** Modify an upcoming delivery
**Parameters:** 
- `modification_type`: string (skip, modify, reschedule, cancel)
- `modified_data`: object (new delivery configuration)
- `modification_reason`: string (optional)

**Response:** 
```json
{
  "modification_id": "uuid",
  "original_delivery_date": "2025-08-16",
  "new_delivery_date": "2025-08-18",
  "cost_adjustment": -2.50,
  "applied_immediately": true
}
```
**Errors:** 400 (invalid modification), 401 (unauthorized), 404 (delivery not found), 409 (modification conflict)

### GET /api/seasonal-recommendations

**Purpose:** Get seasonal fruit recommendations and availability
**Parameters:** 
- `season`: string (optional, current season if not provided)
- `region`: string (optional, user's region if not provided)
- `health_profile_filter`: boolean (default true)

**Response:** 
```json
{
  "seasonal_highlights": [
    {
      "fruit_name": "pomegranate",
      "availability_score": 9,
      "quality_score": 10,
      "health_benefits": ["antioxidants", "heart_health"],
      "peak_months": [10, 11, 12],
      "recommendation_reason": "Peak season with excellent antioxidant content"
    }
  ],
  "variety_suggestions": [
    "Try winter citrus fruits for vitamin C boost",
    "Root vegetables complement your fiber goals"
  ],
  "current_season": "winter",
  "next_season_preview": "spring"
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### GET /api/notification-preferences

**Purpose:** Get user's notification preferences
**Parameters:** None

**Response:** 
```json
{
  "preferences": [
    {
      "notification_type": "delivery_reminder",
      "is_enabled": true,
      "delivery_time": "09:00",
      "frequency": "as_needed",
      "custom_settings": {
        "advance_notice_hours": 2,
        "include_weather": true
      }
    }
  ]
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### PUT /api/notification-preferences

**Purpose:** Update notification preferences
**Parameters:** 
- `preferences`: array of notification preference objects

**Response:** 
```json
{
  "updated_preferences": 5,
  "updated_at": "timestamp"
}
```
**Errors:** 400 (validation), 401 (unauthorized), 500 (server error)

### GET /api/achievements

**Purpose:** Get user's achievements and milestones
**Parameters:** 
- `achievement_type`: string (optional filter)
- `include_pending`: boolean (default false)
- `limit`: integer (default 50)

**Response:** 
```json
{
  "achievements": [
    {
      "id": "uuid",
      "achievement_type": "consistency",
      "achievement_name": "7-Day Streak",
      "description": "Maintained daily fruit intake for 7 consecutive days",
      "achieved_at": "timestamp",
      "points_awarded": 50,
      "badge_awarded": "consistency_bronze",
      "is_milestone": false
    }
  ],
  "total_points": 350,
  "current_streaks": {
    "daily_intake": 12,
    "goal_achievement": 5
  },
  "next_milestones": [
    {
      "name": "30-Day Consistency",
      "progress": 0.4,
      "estimated_completion": "2025-09-15"
    }
  ]
}
```
**Errors:** 401 (unauthorized), 500 (server error)

### POST /api/plan-templates

**Purpose:** Save a custom plan as a reusable template
**Parameters:** 
- `custom_plan_id`: UUID
- `template_name`: string
- `template_category`: string
- `is_public`: boolean (default false)

**Response:** 
```json
{
  "template_id": "uuid",
  "template_name": "Winter Wellness Plan",
  "created_at": "timestamp",
  "usage_count": 0
}
```
**Errors:** 400 (validation), 401 (unauthorized), 404 (plan not found), 500 (server error)

### GET /api/plan-templates

**Purpose:** Browse available plan templates
**Parameters:** 
- `category`: string (optional filter)
- `include_public`: boolean (default true)
- `include_personal`: boolean (default true)

**Response:** 
```json
{
  "templates": [
    {
      "id": "uuid",
      "template_name": "Heart Healthy Winter",
      "template_category": "seasonal",
      "nutritional_summary": {...},
      "usage_count": 12,
      "is_public": true,
      "created_by": "system"
    }
  ]
}
```
**Errors:** 401 (unauthorized), 500 (server error)

## Controllers

### CustomPlanController
- `create()` - Create new custom delivery plan
- `update()` - Modify existing plan configuration
- `activate()` - Activate plan for delivery scheduling
- `validate()` - Validate plan before saving
- `getUserPlans()` - Get user's custom plans

### NutritionalTrackingController  
- `logIntake()` - Record fruit consumption
- `getDashboard()` - Get comprehensive tracking dashboard
- `getProgress()` - Get progress toward goals
- `updateGoals()` - Modify nutritional targets

### DeliveryModificationController
- `modifyDelivery()` - Change upcoming delivery
- `getModificationHistory()` - Get delivery change history
- `cancelModification()` - Reverse pending modification

### SeasonalRecommendationController
- `getSeasonalFruits()` - Get seasonal availability and recommendations
- `getVarietySuggestions()` - Get fruit variety recommendations

### NotificationController
- `getPreferences()` - Get user notification settings
- `updatePreferences()` - Modify notification preferences
- `trackEffectiveness()` - Record notification engagement

### AchievementController
- `getUserAchievements()` - Get user's earned achievements
- `checkMilestones()` - Evaluate and award new achievements
- `getLeaderboard()` - Get achievement rankings (future)

### TemplateController
- `saveAsTemplate()` - Convert custom plan to template
- `getTemplates()` - Browse available templates
- `useTemplate()` - Create plan from template

## Purpose

The API design supports sophisticated customization and tracking capabilities while maintaining clean separation of concerns. Custom plan endpoints enable complex plan creation and management. Nutritional tracking provides comprehensive intake monitoring with goal tracking. Delivery modification supports flexible scheduling changes. Achievement and template systems enhance user engagement and plan reusability.