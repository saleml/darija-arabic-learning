-- Check auth and profile setup
-- Run these queries in Supabase SQL Editor to diagnose issues

-- 1. Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- 2. Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- 3. Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users" ON user_profiles;

-- 4. Create simple, working policies
CREATE POLICY "Enable all for authenticated users own profile" 
ON user_profiles
FOR ALL 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Test update (replace with your actual user ID if testing)
UPDATE user_profiles 
SET 
    source_language = 'lebanese',
    target_language = 'darija',
    updated_at = NOW()
WHERE id = auth.uid()
RETURNING *;

-- 6. Create a function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email,
        full_name,
        avatar_url,
        source_language,
        target_language,
        daily_goal,
        streak_days,
        total_study_time,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/adventurer/svg?seed=User'),
        'darija',
        'lebanese',
        10,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Fix any existing users without profiles
INSERT INTO user_profiles (id, email, full_name, avatar_url, source_language, target_language)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', 'User'),
    COALESCE(raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/adventurer/svg?seed=User'),
    'darija',
    'lebanese'
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT DO NOTHING;

-- 9. Verify all users have profiles
SELECT 
    u.id,
    u.email,
    p.id as profile_id,
    p.source_language,
    p.target_language
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id;