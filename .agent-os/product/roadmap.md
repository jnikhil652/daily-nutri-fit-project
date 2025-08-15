# Product Roadmap

> Last Updated: 2025-08-15
> Version: 1.1.0
> Status: Development

## Phase 0: Already Completed ✅

**Completed Features:**

- [x] **User Authentication** - Registration, login, and profile management with Supabase Auth
- [x] **Fruit Catalog** - Complete catalog with 8 sample fruits, categories, nutritional info, and health benefits
- [x] **Wallet System** - Full wallet implementation with balance management and transaction history
- [x] **Payment Integration** - Razorpay integration for wallet top-up with secure payment processing
- [x] **Database Schema** - Comprehensive PostgreSQL schema with RLS policies for security
- [x] **Social Infrastructure** - Database schemas for family plans, referrals, challenges, and user activities
- [x] **Testing Infrastructure** - Jest setup with comprehensive test coverage

### Completed Dependencies

- ✅ Supabase project setup and configuration
- ✅ Razorpay account setup and API keys  
- ✅ Initial fruit database with 8 sample fruits and nutritional data
- ✅ React Native project structure with TypeScript
- ✅ Navigation system with authentication flow

## Phase 1: Core MVP - Current Development (2-3 weeks)

**Goal:** Complete the ordering system and launch functional MVP
**Success Criteria:** Users can place and track orders end-to-end

### Must-Have Features

- [x] Shopping Cart - Add/remove items and persist cart state `M`
- [ ] Order Placement - Complete checkout flow with delivery scheduling `L` 
- [ ] Order Management - View order history and track delivery status `M`
- [ ] Basic Notifications - Order confirmations and delivery updates `S`

### Should-Have Features

- [ ] Delivery Time Slots - Choose preferred delivery windows `S`
- [ ] Order Modifications - Edit orders before processing `S`

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

## Phase 4: Social & Engagement Features - Partially Complete (1-2 weeks)

**Goal:** Complete UI for existing social features and add engagement mechanics
**Success Criteria:** Users can participate in challenges, use family plans, and refer friends

### Already Implemented (Backend + Some UI)

- [x] **Family Plans** - Database schema and family member management components `M`
- [x] **Referral System** - Complete referral tracking with analytics dashboard `M`
- [x] **Community Challenges** - Challenge system with leaderboards and progress tracking `M`

### Remaining Implementation

- [ ] Social Feed - Activity timeline and user interactions `M`
- [ ] Achievement System - Unlock badges and milestones `S`
- [ ] Push Notifications - Social engagement alerts `S`

### Should-Have Features

- [ ] Progress Sharing - Share nutrition achievements on social platforms `S`
- [ ] Recipe Suggestions - Simple fruit-based recipe recommendations `S`
- [ ] Health Professional Connect - Link with nutritionists (basic) `M`

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