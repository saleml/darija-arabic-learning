-- Fix permissions for updating language preferences
-- Run this in Supabase SQL Editor

-- 1. Make sure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop and recreate policies with proper permissions
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create a more permissive update policy
CREATE POLICY "Users can update own profile" 
ON user_profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Grant column-level permissions explicitly
GRANT ALL ON user_profiles TO authenticated;

-- 4. Test the update (should work now)
-- This will update your current user's language preferences
UPDATE user_profiles 
SET 
    source_language = 'darija',
    target_language = 'lebanese',
    updated_at = NOW()
WHERE id = auth.uid()
RETURNING id, email, source_language, target_language, updated_at;

-- 5. Check if the update worked
SELECT id, email, source_language, target_language, updated_at 
FROM user_profiles 
WHERE id = auth.uid();