# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-15-health-personalization/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Test Coverage

### Unit Tests

**HealthProfileService**
- Test health profile creation with valid data
- Test validation of health conditions and goals
- Test profile update functionality
- Test error handling for invalid health data
- Test dietary restriction and allergy processing

**RecommendationEngine**
- Test basic recommendation algorithm with different health profiles
- Test nutritional scoring system accuracy
- Test health condition filtering logic
- Test seasonal availability filtering
- Test preference and allergy exclusions
- Test confidence score calculation

**SubscriptionPlanService**
- Test plan creation and modification
- Test customization validation and processing
- Test delivery frequency calculations
- Test pause/resume functionality
- Test pricing calculations with customizations

**NutritionalCalculator**
- Test nutritional value calculations per fruit
- Test daily nutritional target calculations
- Test health benefit matching algorithms
- Test calorie and nutrient aggregation

### Integration Tests

**Health Profile Flow**
- Test complete health assessment questionnaire submission
- Test profile creation and recommendation generation integration
- Test profile updates triggering new recommendations
- Test health condition changes affecting subscription plans

**Recommendation System**
- Test end-to-end recommendation generation from health profile
- Test recommendation storage and retrieval
- Test user feedback integration affecting future recommendations
- Test recommendation expiration and refresh logic

**Subscription Management**
- Test subscription creation with payment processing
- Test delivery schedule generation based on subscription
- Test subscription modifications and their effects on deliveries
- Test pause/resume functionality with proper date calculations

**API Integration**
- Test all health profile API endpoints with various data combinations
- Test recommendation API with different user profiles
- Test subscription API with edge cases and error scenarios
- Test nutritional database API queries and filtering

### Feature Tests

**Health Assessment Onboarding**
- User completes health questionnaire and receives personalized profile
- User with diabetes receives appropriate fruit recommendations with explanations
- User with multiple health conditions gets properly filtered recommendations
- User can modify health profile and see updated recommendations immediately

**AI Recommendation Experience**
- User receives daily recommendations that align with their health goals
- User with heart health focus gets potassium-rich fruit suggestions
- User with weight loss goal receives low-calorie, high-fiber recommendations
- User can provide feedback and see improved recommendations over time

**Subscription Plan Management**
- User browses health-focused subscription plans with clear benefits
- User subscribes to plan and receives appropriate delivery schedule
- User customizes subscription (excludes fruits, changes frequency) successfully
- User pauses subscription for vacation and resumes seamlessly

**Nutritional Information Display**
- User views detailed nutritional information for recommended fruits
- User sees health benefits explanation for each fruit recommendation
- User understands why specific fruits were recommended for their goals
- User accesses seasonal fruit information and availability

### Mocking Requirements

**External Services**
- Mock Supabase API calls for database operations
- Mock Razorpay payment processing for subscription testing
- Mock Expo Notifications for push notification testing

**Time-Based Tests**
- Mock date/time functions for delivery scheduling tests
- Mock seasonal availability for fruit recommendation testing
- Mock subscription renewal dates for billing cycle testing

**Recommendation Algorithm**
- Mock nutritional database queries for consistent test data
- Mock health condition lookup for isolated algorithm testing
- Mock user preference data for recommendation scoring tests

## Test Data Requirements

### Health Profile Test Data
```javascript
const testHealthProfiles = {
  diabetic_user: {
    age: 45,
    health_conditions: ['diabetes_type_2'],
    health_goals: ['blood_sugar_control'],
    activity_level: 'light'
  },
  athletic_user: {
    age: 28,
    health_goals: ['athletic_performance', 'muscle_recovery'],
    activity_level: 'very_active',
    preferred_fruits: ['bananas', 'berries']
  },
  heart_health_user: {
    age: 58,
    health_conditions: ['hypertension'],
    health_goals: ['heart_health'],
    dietary_restrictions: ['low_sodium']
  }
};
```

### Nutritional Database Test Data
```javascript
const testNutritionalData = {
  apple: {
    calories_per_100g: 52,
    fiber_per_100g: 2.4,
    potassium_mg: 107,
    health_benefits: ['heart_health', 'digestive_health']
  },
  banana: {
    calories_per_100g: 89,
    potassium_mg: 358,
    carbs_per_100g: 22.8,
    health_benefits: ['athletic_performance', 'heart_health']
  }
};
```

### Subscription Plan Test Data
```javascript
const testSubscriptionPlans = {
  heart_healthy: {
    name: 'Heart Healthy',
    health_focus: 'heart_health',
    nutritional_targets: { potassium: 3500, fiber: 25 },
    price_per_week: 29.99
  },
  weight_management: {
    name: 'Weight Management',
    health_focus: 'weight_loss',
    nutritional_targets: { calories: 150, fiber: 20 },
    price_per_week: 24.99
  }
};
```

## Test Environment Setup

### Database Setup
- Create test database with sample health conditions
- Populate nutritional database with test fruit data
- Setup test users with various health profiles
- Create sample subscription plans for testing

### Mock Services
- Setup Supabase test client with mock responses
- Configure test payment processing with Razorpay test mode
- Mock push notification service for delivery reminders
- Setup test data for seasonal availability

### Performance Testing
- Test recommendation algorithm performance with large user base
- Test database query performance for complex health profile matching
- Test subscription management scalability with multiple concurrent users
- Test API response times under various load conditions