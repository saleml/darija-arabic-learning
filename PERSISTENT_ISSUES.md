# Persistent Issues - Arabic Dialects Hub

**Date Created:** August 17, 2025 - 10:47 AM  
**Last Updated:** August 17, 2025 - 10:47 AM  
**Status:** UNRESOLVED

## Overview
This document tracks persistent issues that remain after deployment, despite multiple attempts to fix them. These issues affect the user experience and need to be addressed.

## Issue #1: Users Not Appearing in Supabase Authentication

### Description
Newly created users during signup process do not appear in the Supabase Authentication dashboard under Users section.

### Expected Behavior
- When a user completes signup, they should appear in Supabase > Authentication > Users
- User should be able to log in with their credentials after signup

### Current Behavior
- Users can complete signup process
- No user entry appears in Supabase dashboard
- Authentication appears to fall back to localStorage mode

### Impact
- **HIGH** - Core authentication functionality compromised
- Users may lose data if localStorage is cleared
- No centralized user management

### Technical Notes
- App falls back to localStorage authentication when Supabase fails
- `AuthContext.tsx` has fallback mechanisms in place
- Environment variables may not be properly configured for production

---

## Issue #2: Chrome Password Manager Not Proposing to Save Password

### Description
Google Chrome's password manager does not offer to save passwords when users complete the signup process.

### Expected Behavior
- Chrome should detect password input during signup
- Browser should prompt "Save password for this site?"
- Password should be stored for future autofill

### Current Behavior
- No password save prompt appears
- User must manually type password on future logins

### Impact
- **MEDIUM** - User experience degraded
- Users may abandon signup if they can't save passwords
- Increases friction for returning users

### Technical Notes
- Form attributes are set correctly (`method="POST"`, `action="#"`)
- Issue may be related to localhost vs production domains
- Form submission may not trigger browser password detection

---

## Issue #3: Missing Language Selection Welcome Screen

### Description
After successful signup, new users do not see the welcome screen for selecting source and target languages.

### Expected Behavior
- New users should see a welcome screen after signup
- Screen should have nice background and clear UI
- Users should select their preferred source language (From)
- Users should select their preferred target language (To)
- Only shown for first-time users

### Current Behavior
- Users go directly to the main app after signup
- No language selection screen appears
- Default languages are used (Darija → Lebanese)

### Impact
- **HIGH** - Core onboarding flow broken
- Users may not realize they can customize language preferences
- Poor first-time user experience

### Technical Notes
- `LanguageSetup` component exists and works correctly
- Logic in `App.tsx` checks for `languages_setup_${user.id}` flag
- Condition may not be triggering correctly for new users
- May be related to localStorage vs Supabase user creation flow

---

## Root Cause Analysis

### Potential Causes
1. **Environment Variables**: Production environment may not have correct Supabase configuration
2. **Authentication Flow**: App defaulting to localStorage instead of Supabase
3. **State Management**: Race conditions between user creation and UI updates
4. **Browser Compatibility**: Different behavior between localhost and production domain

### Areas to Investigate
- [ ] Verify `.env` variables are set correctly in Netlify
- [ ] Check Supabase project configuration and RLS policies
- [ ] Review authentication flow timing and state updates
- [ ] Test password manager behavior on different browsers/domains
- [ ] Debug language setup condition logic

---

## Previous Attempts

### What Has Been Tried
- ✅ Fixed TypeScript build errors
- ✅ Added proper form attributes for password manager
- ✅ Implemented localStorage fallback for authentication
- ✅ Created `LanguageSetup` component with proper state management
- ✅ Added environment variable placeholders in `netlify.toml`
- ✅ Fixed React Router conflicts and deployment issues

### What Still Needs Investigation
- ❌ Supabase environment configuration in production
- ❌ Password manager detection in production environment
- ❌ Language setup screen triggering logic
- ❌ User creation flow debugging

---

## Next Steps

1. **Immediate Priority (Issues #1 & #3)**
   - Debug Supabase authentication in production
   - Verify environment variables are properly set
   - Test language setup screen triggering

2. **Secondary Priority (Issue #2)**
   - Test password manager on production domain
   - Consider alternative form submission approaches

3. **Testing Checklist**
   - [ ] Create new user account on production
   - [ ] Verify user appears in Supabase dashboard
   - [ ] Test language selection screen flow
   - [ ] Test password manager across different browsers

---

## Contact & Context
- Issues reported by user after deployment
- Application successfully builds and deploys
- Core functionality works but onboarding flow is broken
- Authentication falls back to localStorage (works but not ideal)

**Note:** These issues may be related to production environment configuration rather than code logic, as the components and flows work correctly in development.