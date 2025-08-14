# DailyNutriFit Database Schema

This directory contains the database schema, migrations, and related files for DailyNutriFit.

## Structure

```
database/
├── README.md                           # This file
├── schema.sql                          # Complete current schema
├── complete_schema_with_data.sql       # Schema with sample data
├── migrations/
│   └── social_features_migration.sql   # Social features migration
├── tests/
│   └── social_schema.test.sql         # Database tests
├── sample_data/
│   └── social_sample_data.sql         # Social features sample data
└── apply_social_migration.js          # Migration application script
```

## Core Features

### Current Schema (v1.0)
- **User Management**: Profiles, delivery addresses, authentication
- **Fruit Catalog**: Fruits, categories, nutritional info, health benefits
- **Wallet System**: Wallet management, transactions, payment methods

### Social Features (v2.0)
- **Family Plans**: Multi-user family account management
- **Referral System**: Friend invitation with reward tracking
- **Community Challenges**: Gamified healthy eating competitions
- **Recipe Sharing**: User-generated fruit-based recipes
- **Health Professionals**: Consultation booking and management
- **Social Achievements**: Milestone tracking and celebration

## Database Migration

### Prerequisites
1. Supabase project with admin access
2. Service role key (for admin operations)
3. Node.js environment with dependencies

### Applying Social Features Migration

1. **Set Environment Variables**:
   ```bash
   # Add to your .env file
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Install Dependencies**:
   ```bash
   npm install dotenv @supabase/supabase-js
   ```

3. **Run Migration**:
   ```bash
   node database/apply_social_migration.js
   ```

### Manual Migration (Supabase Dashboard)

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste `migrations/social_features_migration.sql`
3. Execute the migration
4. Optionally apply sample data from `sample_data/social_sample_data.sql`

## New Tables

### Family Management
- `family_plans` - Multi-user family accounts
- `family_members` - Individual family member profiles

### Social Engagement
- `referrals` - Friend invitation and reward tracking
- `community_challenges` - Challenge definitions
- `challenge_participants` - User participation tracking
- `challenge_progress` - Daily progress entries

### Content Sharing
- `user_recipes` - Community recipe sharing
- `recipe_reviews` - Recipe ratings and reviews

### Professional Services
- `health_professionals` - Verified nutritionist directory
- `consultation_sessions` - Professional consultation management

### Achievement System
- `social_achievements` - Social milestone tracking

## Database Views

### Analytics Views
- `family_dashboard` - Aggregated family plan statistics
- `challenge_leaderboards` - Real-time challenge rankings
- `referral_analytics` - Referral performance metrics

## Row Level Security (RLS)

All social tables implement comprehensive RLS policies:

- **Family Plans**: Viewable by family members, manageable by admins
- **Challenges**: Public challenges visible to all, private to creators
- **Recipes**: Public recipes visible to all, private to authors
- **Consultations**: Users see their own sessions, professionals see theirs
- **Achievements**: Public achievements visible, private to users

## Performance Optimizations

### Indexes
- Family plan member lookups
- Challenge participant queries
- Recipe search and filtering
- Professional specialization searches
- Achievement type filtering

### Query Optimization
- GIN indexes for JSON array fields
- Composite indexes for common query patterns
- Date-based indexes for time-series data

## Testing

Run database tests to verify schema integrity:

```sql
-- Execute tests in Supabase SQL Editor
\i database/tests/social_schema.test.sql
```

The test suite covers:
- Table creation and constraints
- Relationship integrity
- Data validation rules
- Index performance
- View functionality

## Sample Data

The `sample_data/` directory contains realistic test data:

- Sample family plans and members
- Community challenges with participants
- User-generated recipes with reviews
- Health professionals directory
- Social achievements and progress

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check service role key permissions
2. **RLS Errors**: Ensure proper authentication context
3. **View Errors**: Verify all referenced tables exist
4. **Index Errors**: Check for naming conflicts

### Verification Commands

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'family_plans';

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE tablename = 'family_plans';

-- Test view access
SELECT COUNT(*) FROM family_dashboard;
```

## Development Notes

- All timestamps use UTC timezone
- JSON fields use JSONB for performance
- UUIDs used for all primary keys
- Soft deletes via is_active flags where appropriate
- Audit trail via created_at/updated_at timestamps

## Security Considerations

- Service role key required for admin operations
- RLS policies prevent unauthorized data access
- Input validation through database constraints
- Sensitive data stored in separate secured tables
- Regular security audits recommended

---

For questions or issues, refer to the project documentation or contact the development team.