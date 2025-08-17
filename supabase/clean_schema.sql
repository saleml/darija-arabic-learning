-- Clean up schema and fix language updates
-- Run this in Supabase SQL Editor

-- 1. First ensure we have the right columns
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS preferred_dialect CASCADE;

-- 2. Make sure RLS is properly configured
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create new comprehensive policies
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Update the trigger function without preferred_dialect
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        email, 
        full_name,
        source_language,
        target_language,
        daily_goal,
        streak_days,
        total_study_time
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'darija',     -- Default source language
        'lebanese',   -- Default target language  
        10,
        0,
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Test that updates work
-- This should return success
UPDATE user_profiles 
SET target_language = 'syrian'
WHERE id = auth.uid()
RETURNING *;