# Migration to Clerk-Only Architecture

## Overview
This application has been migrated to use Clerk as the sole authentication and user profile management system. Supabase is now only used for storing learning progress data.

## What Changed

### 1. Authentication
- **Before**: Dual system with Clerk for auth and Supabase for profile storage
- **After**: Clerk handles ALL authentication and user profile data

### 2. User Profile Data Storage
- **Before**: User profiles (name, avatar, languages) stored in Supabase `user_profiles` table
- **After**: All profile data stored in Clerk's `unsafeMetadata`

### 3. Data Architecture
```
Clerk (Authentication + User Profiles)
├── User ID (e.g., user_31Q1xw2EMmbpQsuqCKQLuIHQpGZ)
├── Email
├── unsafeMetadata
│   ├── fullName
│   ├── avatarUrl
│   ├── sourceLanguage
│   └── targetLanguage
└── Authentication methods (OAuth, email/password)

Supabase (Learning Progress Only)
├── quiz_attempts (user_id references Clerk ID)
├── phrase_progress (user_id references Clerk ID)
└── study_sessions (user_id references Clerk ID)
```

## Migration Steps Completed

### 1. AuthContext Refactoring
- Removed all Supabase user profile syncing code
- Updated to use `unsafeMetadata` for client-side updates
- Profile updates now go directly to Clerk

### 2. Component Updates
- ClerkProfileDropdown now updates Clerk metadata directly
- Removed redundant ProfileDropdown component logic
- Fixed navigation issues in HomePage

### 3. Database Cleanup (TO BE RUN IN SUPABASE)
Run the SQL script `/supabase/cleanup_for_clerk_only.sql` in your Supabase SQL editor to:
- Clear the user_profiles table
- Update learning tables to use VARCHAR(50) for Clerk user IDs
- Remove old RLS policies
- Add indexes for better performance

## How to Complete Migration

### Step 1: Backup Your Data
Before running any SQL commands, export your Supabase data as a backup.

### Step 2: Run the Cleanup Script
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `/supabase/cleanup_for_clerk_only.sql`
4. Review the script carefully
5. Uncomment line 16 (`TRUNCATE auth.users CASCADE;`) if you want to remove Supabase auth users
6. Run the script

### Step 3: Verify Everything Works
1. Test user signup/signin
2. Test profile editing (name, avatar, languages)
3. Verify profile changes persist after logout/login
4. Test quiz functionality (should still track progress)

## Benefits of This Architecture

1. **Simplified**: One source of truth for user data
2. **Faster**: No more sync delays between systems
3. **Reliable**: No more sync failures or data inconsistencies
4. **Maintainable**: Less code to maintain and debug

## Important Notes

- User IDs have changed format from UUID to Clerk's format (user_xxxxx)
- All user profile data is now in Clerk's `unsafeMetadata`
- Supabase is now purely a database for learning progress
- RLS (Row Level Security) is disabled - the app handles access control

## Rollback Plan

If you need to rollback:
1. Restore the original `AuthContext.tsx` from git
2. Restore your Supabase database from backup
3. Re-enable RLS policies if needed

## Future Considerations

- Consider moving to Clerk's `publicMetadata` with server-side updates for better security
- Add server-side API routes for sensitive operations
- Consider adding rate limiting for profile updates