-- Add avatar_url column to user_profiles if it doesn't exist
-- Run this in Supabase SQL Editor

-- 1. Add avatar_url column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create an array of avatar options
WITH avatar_options AS (
  SELECT unnest(ARRAY[
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Zara',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Kai'
  ]) AS avatar_url
)
-- 3. Update existing users with random avatars
UPDATE user_profiles
SET avatar_url = (
  SELECT avatar_url 
  FROM avatar_options 
  ORDER BY RANDOM() 
  LIMIT 1
)
WHERE avatar_url IS NULL;

-- 4. Update the trigger function to include avatar_url for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  avatar_options TEXT[] := ARRAY[
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Zara',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Kai'
  ];
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
        total_study_time
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(
          NEW.raw_user_meta_data->>'avatar_url',
          avatar_options[1 + floor(random() * array_length(avatar_options, 1))::int]
        ),
        'darija',     -- Default source language
        'lebanese',   -- Default target language  
        10,
        0,
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Verify the changes
SELECT id, email, full_name, avatar_url, source_language, target_language 
FROM user_profiles 
LIMIT 5;