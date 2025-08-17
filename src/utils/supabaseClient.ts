import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔌 Supabase initialization:', {
  url: supabaseUrl || '❌ MISSING URL',
  hasKey: !!supabaseAnonKey,
  keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '❌ MISSING KEY'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('URL:', supabaseUrl);
  console.error('Key exists:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection - just check if we can reach the table
supabase.from('user_progress').select('*', { count: 'exact', head: true }).then(
  (result) => console.log('✅ Supabase connected successfully'),
  (err) => console.warn('⚠️ Supabase connection test failed (this is okay if tables exist):', err.message)
);