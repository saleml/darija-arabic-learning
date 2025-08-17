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

// Test connection
supabase.from('user_progress').select('count').single().then(
  () => console.log('✅ Supabase connected successfully'),
  (err) => console.error('❌ Supabase connection error:', err.message)
);