# Product Roadmap

> Last Updated: 2025-08-14
> Version: 1.0.0
> Status: Planning

## Phase 1: Core MVP (3-4 weeks)

**Goal:** Launch a functional fruit delivery app with basic ordering and payment capabilities
**Success Criteria:** Users can register, browse fruits, place orders, and make payments

### Must-Have Features

- [ ] User Authentication - Registration, login, and profile management `M`
- [ ] Fruit Catalog - Browse available fruits with images and descriptions `M`
- [ ] Basic Ordering - Add fruits to cart and place orders `L`
- [x] Wallet System - Top-up wallet and manage balance `M`
- [x] Payment Integration - Razorpay integration for wallet top-up `L`

### Should-Have Features

- [ ] Order History - View past orders and delivery status `S`
- [ ] Basic Notifications - Order confirmations and delivery updates `S`

### Dependencies

- ✅ Supabase project setup and configuration
- ✅ Razorpay account setup and API keys
- [ ] Initial fruit database with product information

## Phase 2: Health Personalization (2-3 weeks)

**Goal:** Implement health-based fruit recommendations and subscription plans
**Success Criteria:** Users can complete health assessments and receive personalized fruit suggestions

### Must-Have Features

- [ ] Health Profile Setup - User health questionnaire and goals `M`
- [ ] Health-Based Recommendations - AI-powered fruit suggestions `L`
- [ ] Subscription Plans - Pre-built health-focused subscription options `M`
- [ ] Daily Delivery Scheduling - Schedule recurring deliveries `M`

### Should-Have Features

- [ ] Nutritional Information - Display nutritional facts for each fruit `S`
- [ ] Health Tips - Daily health and nutrition tips `XS`

### Dependencies

- Health assessment questionnaire design
- Recommendation algorithm implementation
- Nutritional database integration

## Phase 3: Custom Plans & Advanced Features (2-3 weeks)

**Goal:** Enable users to create custom delivery plans and track their nutrition
**Success Criteria:** Users can build personalized plans and monitor their nutritional intake

### Must-Have Features

- [ ] Custom Plan Builder - Create personalized fruit delivery schedules `L`
- [ ] Delivery Management - Modify, pause, or cancel deliveries `M`
- [ ] Nutritional Tracking - Track daily fruit intake and nutrition goals `L`
- [ ] Advanced Notifications - Smart reminders and health insights `S`

### Should-Have Features

- [ ] Delivery Preferences - Time slots and special delivery instructions `S`
- [ ] Seasonal Recommendations - Suggest seasonal fruits and variety `S`

### Dependencies

- Custom plan creation UI/UX design
- Nutrition tracking algorithms
- Advanced notification system

## Phase 4: Social & Engagement Features (2 weeks)

**Goal:** Build community features and increase user engagement
**Success Criteria:** Users can share progress, participate in challenges, and refer friends

### Must-Have Features

- [ ] Family Plans - Shared subscriptions with multiple profiles `M`
- [ ] Referral System - Invite friends and earn rewards `M`
- [ ] Community Challenges - Participate in healthy eating challenges `M`

### Should-Have Features

- [ ] Progress Sharing - Share nutrition achievements `S`
- [ ] Recipe Suggestions - Simple fruit-based recipe recommendations `S`
- [ ] Health Professional Connect - Link with nutritionists (basic) `M`

### Dependencies

- Multi-user account system
- Referral tracking system
- Challenge mechanics design

## Phase 5: Enterprise & Scale Features (3-4 weeks)

**Goal:** Expand to business customers and implement advanced features
**Success Criteria:** Support corporate wellness programs and scale to larger user base

### Must-Have Features

- [ ] Corporate Wellness Plans - Bulk subscriptions for companies `L`
- [ ] Advanced Analytics - Detailed nutrition and delivery insights `M`
- [ ] API for Third-Party Integration - Health app integrations `L`

### Should-Have Features

- [ ] Gift Subscriptions - Send fruit subscriptions as gifts `M`
- [ ] Loyalty Program - Points and rewards for regular customers `M`
- [ ] Advanced Health Professional Tools - Detailed nutritionist features `L`

### Dependencies

- Enterprise billing system
- Advanced analytics infrastructure
- Third-party API documentation