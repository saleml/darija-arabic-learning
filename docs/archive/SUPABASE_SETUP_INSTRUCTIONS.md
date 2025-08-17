# IMPORTANT: Supabase Database Setup Required

## ✅ What's Been Done
1. **Configured Supabase credentials** in all environment files
2. **Updated Netlify configuration** with your Supabase URL and anon key
3. **Updated schema** to include source_language and target_language fields

## 🔴 ACTION REQUIRED: Run Database Migration

You need to update your Supabase database with the new fields. Follow these steps:

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project: https://supabase.com/dashboard/project/xnkokmaccibpwxenxynh
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration
Copy and paste this SQL code into the editor and click "Run":

```sql
-- Migration to add source_language and target_language fields to user_profiles
-- This is safe to run multiple times - it only adds fields if they don't exist

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
```

### Step 3: If Tables Don't Exist Yet
If you get an error saying the table doesn't exist, run the full schema from:
`supabase/schema.sql`

## 🎉 Expected Results After Setup

Once the migration is complete:
1. **Users will appear in Supabase** when they sign up
2. **Language preferences will be saved** properly
3. **Data will persist in the cloud** instead of just localStorage

## 🔍 How to Verify It's Working

1. Sign up with a new account on your deployed site
2. Check Supabase Dashboard > Authentication > Users
3. The new user should appear there
4. Check Table Editor > user_profiles
5. The user should have a profile with source_language and target_language fields

## 📝 Debug Information

The app now includes console logging to help debug:
- Open browser console (F12)
- Sign up with a new account
- Look for messages starting with `[App]` and `[AuthContext]`
- These will show if language setup is being triggered

## ⚠️ Important Notes

- The app will still work with localStorage fallback if Supabase connection fails
- Password manager issues on localhost are a browser limitation
- Language setup screen should now appear for new users after the migration is complete