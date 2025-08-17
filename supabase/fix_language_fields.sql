-- Fix to ensure source_language and target_language are properly saved
-- Run this in Supabase SQL Editor

-- 1. First ensure the columns exist (safe to run multiple times)
DO $$ 
BEGIN
    -- Add source_language column if it doesn't exist
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_profiles' AND column_name='source_language'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN source_language TEXT DEFAULT 'darija' 
        CHECK (source_language IN ('darija', 'lebanese', 'syrian', 'emirati', 'saudi'));
    END IF;

    -- Add target_language column if it doesn't exist
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_profiles' AND column_name='target_language'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN target_language TEXT DEFAULT 'lebanese' 
        CHECK (target_language IN ('darija', 'lebanese', 'syrian', 'emirati', 'saudi', 'all'));
    END IF;
END $$;

-- 2. Update the trigger function to include source and target languages
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        email, 
        full_name,
        source_language,
        target_language,
        preferred_dialect
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'darija',     -- Default source language
        'lebanese',   -- Default target language  
        'lebanese'    -- Keep for backward compatibility
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update existing profiles that might have NULL values
UPDATE user_profiles 
SET 
    source_language = COALESCE(source_language, 'darija'),
    target_language = COALESCE(target_language, preferred_dialect, 'lebanese')
WHERE source_language IS NULL OR target_language IS NULL;

-- 4. Grant necessary permissions (important!)
GRANT UPDATE (source_language, target_language, preferred_dialect, updated_at) ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;