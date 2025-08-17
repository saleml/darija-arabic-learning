// Direct Supabase API calls to bypass client library issues

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function directUpdateProfile(
  userId: string,
  updates: Record<string, any>,
  accessToken: string
) {
  console.log('🚀 Using direct API call to update profile');
  
  const url = `${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${userId}`;
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString()
      })
    });

    console.log('📡 Direct API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Direct API error:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Direct API update successful:', data);
    return { data: data[0], error: null };
  } catch (error) {
    console.error('❌ Direct API call failed:', error);
    return { data: null, error };
  }
}