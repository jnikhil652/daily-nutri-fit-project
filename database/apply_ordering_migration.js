require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔧 DailyNutriFit - Basic Ordering Schema Migration Helper');
console.log('=====================================================\n');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check for Supabase configuration
if (!supabaseUrl) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is not configured in .env file');
} else {
  console.log('✅ Supabase URL configured');
}

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is not configured (optional for verification)');
} else {
  console.log('✅ Service role key configured');
}

// Read and display migration
const migrationPath = path.join(__dirname, 'migrations', 'basic_ordering_schema.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
console.log('✅ Migration file loaded successfully\n');

console.log('📋 MANUAL MIGRATION INSTRUCTIONS');
console.log('=================================\n');
console.log('The shopping cart functionality requires the basic ordering schema.');
console.log('Please apply this migration manually through your Supabase dashboard:\n');

console.log('1. Open your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the following SQL:');
console.log('4. Click "RUN" to execute the migration\n');

console.log('--- COPY THE SQL BELOW ---');
console.log(migrationSQL);
console.log('--- END SQL ---\n');

// If service key is available, verify current state
async function verifyCurrentState() {
  if (!supabaseServiceKey) {
    console.log('🔍 Cannot verify current state (no service key provided)');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if tables exist
    const tableNames = ['shopping_carts', 'orders', 'order_items', 'delivery_time_slots'];
    const results = [];
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (error && error.code === 'PGRST116') {
          results.push({ table: tableName, exists: false, error: 'Table not found' });
        } else if (error) {
          results.push({ table: tableName, exists: false, error: error.message });
        } else {
          results.push({ table: tableName, exists: true, error: null });
        }
      } catch (err) {
        results.push({ table: tableName, exists: false, error: err.message });
      }
    }
    
    console.log('🔍 CURRENT DATABASE STATE');
    console.log('========================\n');
    
    let allExist = true;
    results.forEach(result => {
      if (result.exists) {
        console.log(`✅ ${result.table} - EXISTS`);
      } else {
        console.log(`❌ ${result.table} - MISSING (${result.error})`);
        allExist = false;
      }
    });
    
    if (allExist) {
      console.log('\n🎉 All ordering tables exist! Migration has been applied.');
      console.log('   Your cart functionality should work correctly.');
    } else {
      console.log('\n⚠️  Some tables are missing. Please apply the migration above.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying database state:', error.message);
  }
}

async function main() {
  await verifyCurrentState();
  
  console.log('\n📚 AFTER APPLYING MIGRATION');
  console.log('===========================');
  console.log('Once the migration is applied, the following features will work:');
  console.log('• Shopping cart persistence');
  console.log('• Add/remove items from cart');
  console.log('• Real-time cart updates');
  console.log('• Order placement (checkout)');
  console.log('• Order history tracking');
  console.log('• Delivery scheduling');
  console.log('\nRestart your app after applying the migration.');
}

if (require.main === module) {
  main();
}

module.exports = { main };