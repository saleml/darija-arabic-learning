-- Migration to add source_language and target_language fields to user_profiles
-- Run this if your user_profiles table already exists

-- Check if columns already exist and add them if they don't
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