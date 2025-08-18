import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTables() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Check which tables exist
    console.log('📊 Checking existing tables...');
    const checkTables = ['user_progress', 'user_stats', 'user_profiles', 'study_sessions'];
    
    for (const table of checkTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: Does not exist or not accessible`);
        } else {
          console.log(`✅ Table ${table}: Exists (will be removed)`);
        }
      } catch (e) {
        console.log(`❌ Table ${table}: Error checking - ${e.message}`);
      }
    }

    console.log('\n⚠️  WARNING: This will delete the following tables:');
    console.log('  - user_progress');
    console.log('  - user_stats'); 
    console.log('  - user_profiles');
    console.log('  - study_sessions');
    console.log('\n✅ These tables are not used by the application.');
    console.log('   The app uses phrase_progress for tracking instead.\n');

    // Note: We can't actually DROP tables via the Supabase client
    // as it doesn't have DDL permissions. We can only work with data.
    console.log('ℹ️  Note: Table deletion requires admin access.');
    console.log('   Please run the following SQL in your Supabase dashboard:\n');
    console.log('-- Remove unused tables');
    console.log('DROP TABLE IF EXISTS user_progress CASCADE;');
    console.log('DROP TABLE IF EXISTS user_stats CASCADE;');
    console.log('DROP TABLE IF EXISTS user_profiles CASCADE;');
    console.log('DROP TABLE IF EXISTS study_sessions CASCADE;');
    console.log('\n📋 Or use the SQL script at: supabase/cleanup-unused-tables.sql');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupTables();