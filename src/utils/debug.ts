// Debug utility to check environment variables
export function debugEnvironment() {
  const env = {
    clerkKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  console.log('🔍 Environment Check:');
  console.log('Clerk Key exists:', !!env.clerkKey, env.clerkKey ? `(${env.clerkKey.substring(0, 10)}...)` : '❌ MISSING');
  console.log('Supabase URL:', env.supabaseUrl || '❌ MISSING');
  console.log('Supabase Key exists:', !!env.supabaseKey, env.supabaseKey ? `(${env.supabaseKey.substring(0, 20)}...)` : '❌ MISSING');
  
  if (!env.clerkKey || !env.supabaseUrl || !env.supabaseKey) {
    console.error('⚠️ Missing environment variables! The app will not work properly.');
    console.error('Make sure these are set in Netlify: VITE_CLERK_PUBLISHABLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  }
  
  return env;
}