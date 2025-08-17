-- Safe version that won't error if things already exist
-- Run this in Supabase SQL Editor

-- 1. Check current policies (just for info)
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- 2. Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Only create policy if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles' 
        AND policyname = 'Enable all for authenticated users own profile'
    ) THEN
        CREATE POLICY "Enable all for authenticated users own profile" 
        ON user_profiles
        FOR ALL 
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 4. Test that you can update your own profile
UPDATE user_profiles 
SET 
    updated_at = NOW()
WHERE id = auth.uid()
RETURNING id, email, source_language, target_language;

-- 5. Check if all auth users have profiles
SELECT 
    'Users without profiles:' as info,
    COUNT(*) as count
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = u.id
);

-- 6. Create profiles for users that don't have them
INSERT INTO user_profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    source_language, 
    target_language,
    daily_goal,
    streak_days,
    total_study_time
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(u.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/adventurer/svg?seed=' || u.id),
    'darija',
    'lebanese',
    10,
    0,
    0
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 7. Final check - all users should have profiles now
SELECT 
    u.email,
    p.source_language,
    p.target_language,
    CASE WHEN p.id IS NULL THEN 'NO PROFILE!' ELSE 'OK' END as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;