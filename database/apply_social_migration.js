/**
 * Social Features Migration Application Script
 * 
 * This script applies the social features migration to the Supabase database.
 * Run this script after ensuring you have proper database connection.
 * 
 * Usage:
 * 1. Ensure your .env file has correct Supabase credentials
 * 2. Install dependencies: npm install
 * 3. Run: node database/apply_social_migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting Social Features Migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'social_features_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Social features migration completed successfully!');
    console.log('📊 Migration results:', data);
    
    // Apply sample data (optional)
    await applySampleData();
    
    // Run basic verification
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function applySampleData() {
  console.log('📦 Applying sample data...');
  
  try {
    const sampleDataPath = path.join(__dirname, 'sample_data', 'social_sample_data.sql');
    const sampleDataSQL = fs.readFileSync(sampleDataPath, 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: sampleDataSQL });
    
    if (error) {
      console.warn('⚠️ Sample data application failed (this is optional):', error.message);
    } else {
      console.log('✅ Sample data applied successfully');
    }
  } catch (error) {
    console.warn('⚠️ Sample data file not found or failed to load (this is optional)');
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check if key tables exist
    const tables = [
      'family_plans',
      'family_members', 
      'referrals',
      'community_challenges',
      'challenge_participants',
      'user_recipes',
      'health_professionals',
      'social_achievements'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" which is ok
        throw new Error(`Table ${table} verification failed: ${error.message}`);
      }
      
      console.log(`✓ Table ${table} exists and is accessible`);
    }
    
    // Check if views exist
    const { data: viewData, error: viewError } = await supabase
      .from('family_dashboard')
      .select('*')
      .limit(1);
    
    if (viewError && viewError.code !== 'PGRST116') {
      throw new Error(`View verification failed: ${viewError.message}`);
    }
    
    console.log('✓ Database views are accessible');
    console.log('✅ Migration verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
    throw error;
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('🎉 Social features database setup complete!');
    console.log('📋 Next steps:');
    console.log('  1. Update your app code to use the new social features');
    console.log('  2. Test social functionality in development');
    console.log('  3. Deploy updated app with social features');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration setup failed:', error);
    process.exit(1);
  });

module.exports = { runMigration, verifyMigration };